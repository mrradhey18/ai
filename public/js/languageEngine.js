/**
 * languageEngine.js
 * -----------------
 * Handles all language-related logic for the review system.
 *
 * Responsibilities:
 *  1. Read language probability weights from client profile
 *  2. Randomly select a language (patient never chooses this)
 *  3. Load the correct phrase bank set for that language
 *  4. Return a clean { language, phrases } object to reviewEngine
 *
 * Depends on: utils.js (must be loaded first)
 * Used by:    reviewEngine.js
 */

const LanguageEngine = (() => {

  // ─────────────────────────────────────────────
  // SUPPORTED LANGUAGES
  // Matches folder names under /data/phrases/
  // ─────────────────────────────────────────────

  const LANGUAGES = ['english', 'hinglish', 'hindi', 'mixed'];

  // ─────────────────────────────────────────────
  // PHRASE FILE NAMES
  // Same 7 files exist in every language folder.
  // If you add a new phrase type, add it here.
  // ─────────────────────────────────────────────

  const PHRASE_FILES = [
    'intros',
    'trust',
    'service',
    'emotional',
    'seo',
    'outros',
    'emojis',
  ];

  // ─────────────────────────────────────────────
  // CACHE
  // Once a language's phrase bank is loaded,
  // cache it so repeat rolls don't re-fetch.
  // ─────────────────────────────────────────────

  const _cache = {};

  // ─────────────────────────────────────────────
  // 1. LANGUAGE SELECTION
  // ─────────────────────────────────────────────

  /**
   * Select a language based on client probability weights.
   * Patient never sees or chooses this — it happens silently.
   *
   * @param {Object} probabilities  from profile.language.probabilities
   *   e.g. { english: 25, hinglish: 40, hindi: 25, mixed: 10 }
   * @returns {string}  selected language key
   *
   * Example output: 'hinglish'
   */
  function selectLanguage(probabilities) {
    // Validate — fall back to equal distribution if config is broken
    if (!probabilities || typeof probabilities !== 'object') {
      Utils.warn('LanguageEngine: invalid probabilities, using equal weights');
      const fallback = {};
      LANGUAGES.forEach(l => fallback[l] = 25);
      return Utils.weightedPick(fallback);
    }

    // Only pass keys that are valid language names
    const valid = {};
    for (const lang of LANGUAGES) {
      if (typeof probabilities[lang] === 'number' && probabilities[lang] > 0) {
        valid[lang] = probabilities[lang];
      }
    }

    if (Object.keys(valid).length === 0) {
      Utils.warn('LanguageEngine: no valid language weights found, defaulting to hinglish');
      return 'hinglish';
    }

    const selected = Utils.weightedPick(valid);
    Utils.log(`LanguageEngine: selected language → ${selected}`);
    return selected;
  }

  // ─────────────────────────────────────────────
  // 2. PHRASE BANK LOADER
  // ─────────────────────────────────────────────

  /**
   * Build the file paths for a given language.
   * @param {string} language
   * @returns {Array<{type: string, path: string}>}
   */
function _buildPaths(language) {
    const isAdmin = window.location.pathname.includes('/admin/');
    const base = isAdmin ? '../public/data/phrases' : 'data/phrases';
    return PHRASE_FILES.map(file => ({
      type: file,
      path: `${base}/${language}/${file}.json`,
    }));
  }

  /**
   * Load all phrase files for a language in parallel.
   * Returns a map: { intros: {...}, trust: {...}, ... }
   *
   * @param {string} language
   * @returns {Promise<Object>}  phrase bank map
   */
  async function loadPhraseBank(language) {
    // Return from cache if already loaded
    if (_cache[language]) {
      Utils.log(`LanguageEngine: cache hit for "${language}"`);
      return _cache[language];
    }

    const fileDefs = _buildPaths(language);
    const paths = fileDefs.map(f => f.path);

    Utils.log(`LanguageEngine: loading ${paths.length} files for "${language}"...`);

    const results = await Utils.loadJSONAll(paths);

    // Build map: { intros: data, trust: data, ... }
    const bank = {};
    fileDefs.forEach(({ type }, i) => {
      if (results[i]) {
        bank[type] = results[i];
      } else {
        Utils.warn(`LanguageEngine: failed to load "${type}" for language "${language}"`);
        bank[type] = {}; // Empty fallback — won't crash engine
      }
    });

    // Store in cache
    _cache[language] = bank;
    Utils.log(`LanguageEngine: phrase bank for "${language}" ready and cached`);

    return bank;
  }

  // ─────────────────────────────────────────────
  // 3. MAIN ENTRY POINT
  // ─────────────────────────────────────────────

  /**
   * Select language and load its phrase bank in one call.
   * This is what reviewEngine.js calls.
   *
   * @param {Object} clientProfile  full parsed profile.json
   * @returns {Promise<{language: string, phrases: Object}>}
   *
   * Example return:
   * {
   *   language: 'hinglish',
   *   phrases: {
   *     intros:    { 5star: [...], 4star: [...], 3star: [...] },
   *     trust:     { 5star: [...], ... },
   *     service:   { 5star: [...], ... },
   *     emotional: { 5star: [...], ... },
   *     seo:       { location: [...], credibility: [...] },
   *     outros:    { 5star: [...], ... },
   *     emojis:    { 5star: [...], combinations: { ... } }
   *   }
   * }
   */
  async function resolve(clientProfile) {
    const probabilities = clientProfile?.language?.probabilities;
    const language = selectLanguage(probabilities);
    const phrases = await loadPhraseBank(language);

    return { language, phrases };
  }

  // ─────────────────────────────────────────────
  // 4. UTILITIES FOR OTHER MODULES
  // ─────────────────────────────────────────────

  /**
   * Get the correct star-rated phrase pool from a phrase category.
   * Handles the star key mapping cleanly.
   *
   * @param {Object} phraseCategory  e.g. phrases.intros
   * @param {number} stars           1–5
   * @returns {Array}                matching phrase array
   *
   * Star mapping:
   *   5       → '5star'
   *   4       → '4star'
   *   3 or below → '3star'
   */
  function getPool(phraseCategory, stars) {
    if (!phraseCategory) return [];

    const key = stars >= 5 ? '5star'
              : stars === 4 ? '4star'
              : '3star';

    return phraseCategory[key] || phraseCategory['3star'] || [];
  }

  /**
   * Pre-warm the cache for all languages.
   * Call this on app init (optional) to avoid loading delay on first generation.
   * @returns {Promise<void>}
   */
  async function preloadAll() {
    Utils.log('LanguageEngine: preloading all language banks...');
    await Promise.all(LANGUAGES.map(lang => loadPhraseBank(lang)));
    Utils.log('LanguageEngine: all language banks loaded');
  }

  /**
   * Clear the phrase bank cache.
   * Useful after admin edits phrase files.
   */
  function clearCache() {
    for (const key of Object.keys(_cache)) {
      delete _cache[key];
    }
    Utils.log('LanguageEngine: cache cleared');
  }

  /**
   * Get list of supported languages.
   * @returns {Array<string>}
   */
  function getSupportedLanguages() {
    return [...LANGUAGES];
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    resolve,          // Main entry: select language + load phrases
    selectLanguage,   // Just selection (used in admin preview)
    loadPhraseBank,   // Just loading (used in admin panel)
    getPool,          // Star-key helper (used by reviewEngine)
    preloadAll,       // Pre-warm cache on init
    clearCache,       // Clear after admin edits
    getSupportedLanguages,
  };

})();
