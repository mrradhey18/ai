/**
 * antiSpam.js
 * -----------
 * Duplicate and pattern protection system.
 *
 * Responsibilities:
 *  1. Track all reviews generated in the current session
 *  2. Detect if a new review is too similar to a previous one
 *  3. Detect repeated phrase usage across reviews
 *  4. Force reviewEngine to regenerate if similarity is too high
 *  5. Manage session history in localStorage for cross-page persistence
 *
 * Depends on: utils.js
 * Used by:    reviewEngine.js
 */

const AntiSpam = (() => {

  // ─────────────────────────────────────────────
  // CONFIGURATION
  // Tune these thresholds to control sensitivity.
  // ─────────────────────────────────────────────

  const CONFIG = {
    // Jaccard similarity threshold (0–1).
    // Reviews above this score are considered too similar → regenerate.
    // 0.65 = reviews sharing 65%+ of their words are rejected.
    similarityThreshold: 0.65,

    // Max number of recent reviews to compare against.
    // Comparing against last 10 is enough — beyond that, similarity is low anyway.
    historyLimit: 10,

    // Max times the engine will retry before accepting an imperfect result.
    // Prevents infinite loop if phrase banks are very small.
    maxRetries: 5,

    // localStorage key suffix for session history.
    storageKey: 'session_reviews',

    // How long (ms) before session history expires.
    // 4 hours — enough for a clinic day session.
    sessionTTL: 4 * 60 * 60 * 1000,
  };

  // ─────────────────────────────────────────────
  // SESSION STATE
  // In-memory store for the current page session.
  // ─────────────────────────────────────────────

  let _sessionReviews = []; // Array of { text, timestamp, language, stars }
  let _sessionLoaded = false;

  // ─────────────────────────────────────────────
  // 1. SESSION MANAGEMENT
  // ─────────────────────────────────────────────

  /**
   * Load session history from localStorage on first call.
   * Prunes entries older than sessionTTL automatically.
   */
  function _loadSession() {
    if (_sessionLoaded) return;

    const stored = Utils.storeLoad(CONFIG.storageKey);

    if (stored && Array.isArray(stored)) {
      const now = Date.now();
      // Filter out expired entries
      _sessionReviews = stored.filter(entry => {
        return (now - entry.timestamp) < CONFIG.sessionTTL;
      });
      Utils.log(`AntiSpam: loaded ${_sessionReviews.length} reviews from session`);
    } else {
      _sessionReviews = [];
    }

    _sessionLoaded = true;
  }

  /**
   * Save current session history to localStorage.
   * Called after every new review is registered.
   */
  function _saveSession() {
    // Only keep the most recent N reviews in storage
    const toSave = _sessionReviews.slice(-CONFIG.historyLimit);
    Utils.storeSave(CONFIG.storageKey, toSave);
  }

  // ─────────────────────────────────────────────
  // 2. SIMILARITY CHECKING
  // ─────────────────────────────────────────────

  /**
   * Check if a candidate review is too similar to any in session history.
   *
   * @param {string} candidate  the new review text to check
   * @returns {{ isDuplicate: boolean, score: number, matchedWith: string|null }}
   *
   * Example:
   *   checkSimilarity("Great clinic, very helpful doctor")
   *   → { isDuplicate: true, score: 0.72, matchedWith: "Great clinic, helpful doctor very good" }
   */
  function checkSimilarity(candidate) {
    _loadSession();

    if (_sessionReviews.length === 0) {
      return { isDuplicate: false, score: 0, matchedWith: null };
    }

    // Compare against recent history only
    const recent = _sessionReviews.slice(-CONFIG.historyLimit);
    let highestScore = 0;
    let matchedWith = null;

    for (const entry of recent) {
      const score = Utils.similarity(candidate, entry.text);
      Utils.log(`AntiSpam: similarity check → ${score.toFixed(2)} vs "${entry.text.slice(0, 40)}..."`);

      if (score > highestScore) {
        highestScore = score;
        matchedWith = entry.text;
      }
    }

    const isDuplicate = highestScore >= CONFIG.similarityThreshold;

    if (isDuplicate) {
      Utils.warn(`AntiSpam: REJECTED review (score: ${highestScore.toFixed(2)})`);
    }

    return {
      isDuplicate,
      score: highestScore,
      matchedWith,
    };
  }

  // ─────────────────────────────────────────────
  // 3. PHRASE-LEVEL TRACKING
  // Detects reuse of identical opening/closing sentences
  // across multiple generated reviews in same batch.
  // ─────────────────────────────────────────────

  /**
   * In-memory set of phrases used in the CURRENT generation batch.
   * Cleared between different patient interactions (new service selection).
   * Tracks individual sentences, not full reviews.
   */
  let _usedPhrases = new Set();

  /**
   * Check if a specific phrase has already been used in this batch.
   * @param {string} phrase
   * @returns {boolean}
   */
  function isPhraseUsed(phrase) {
    const key = phrase.trim().toLowerCase();
    return _usedPhrases.has(key);
  }

  /**
   * Mark a phrase as used in this batch.
   * @param {string} phrase
   */
  function markPhraseUsed(phrase) {
    const key = phrase.trim().toLowerCase();
    _usedPhrases.add(key);
  }

  /**
   * Clear phrase-level tracking.
   * Call this when patient starts a new service selection.
   */
  function clearBatchPhrases() {
    _usedPhrases.clear();
    Utils.log('AntiSpam: batch phrase tracker cleared');
  }

  // ─────────────────────────────────────────────
  // 4. REVIEW REGISTRATION
  // ─────────────────────────────────────────────

  /**
   * Register a successfully generated review into session history.
   * Call this AFTER the review passes similarity check.
   *
   * @param {string} text      the final review text
   * @param {Object} meta      { language, stars, service }
   */
  function register(text, meta = {}) {
    _loadSession();

    const entry = {
      text,
      timestamp: Date.now(),
      language: meta.language || 'unknown',
      stars: meta.stars || 5,
      service: meta.service || 'unknown',
    };

    _sessionReviews.push(entry);

    // Trim to limit
    if (_sessionReviews.length > CONFIG.historyLimit) {
      _sessionReviews = _sessionReviews.slice(-CONFIG.historyLimit);
    }

    _saveSession();
    Utils.log(`AntiSpam: registered review (total in session: ${_sessionReviews.length})`);
  }

  // ─────────────────────────────────────────────
  // 5. MAIN VALIDATION GATE
  // ─────────────────────────────────────────────

  /**
   * The primary function called by reviewEngine.
   * Validates a candidate review against all spam rules.
   *
   * @param {string} candidate  generated review text
   * @returns {{ pass: boolean, reason: string|null }}
   *
   * Usage in reviewEngine:
   *   const result = AntiSpam.validate(reviewText);
   *   if (!result.pass) { regenerate... }
   */
  function validate(candidate) {
    // Rule 1: Must have minimum length
    if (!candidate || candidate.trim().length < 30) {
      return { pass: false, reason: 'too_short' };
    }

    // Rule 2: Must not be too similar to recent reviews
    const { isDuplicate, score } = checkSimilarity(candidate);
    if (isDuplicate) {
      return { pass: false, reason: `too_similar (score: ${score.toFixed(2)})` };
    }

    // Rule 3: Must not be identical to any recent review (exact match)
    _loadSession();
    const isExact = _sessionReviews.some(
      entry => entry.text.trim().toLowerCase() === candidate.trim().toLowerCase()
    );
    if (isExact) {
      return { pass: false, reason: 'exact_duplicate' };
    }

    return { pass: true, reason: null };
  }

  // ─────────────────────────────────────────────
  // 6. BATCH VALIDATION (for 3-5 review options)
  // ─────────────────────────────────────────────

  /**
   * Validate a batch of reviews against EACH OTHER.
   * When generating 3–5 options, they must also be different from each other,
   * not just different from session history.
   *
   * @param {Array<string>} reviews  array of generated review texts
   * @returns {Array<string>}        deduplicated, valid reviews
   */
  function validateBatch(reviews) {
    const accepted = [];

    for (const review of reviews) {
      // Check against session history
      const { pass } = validate(review);
      if (!pass) {
        Utils.warn(`AntiSpam: batch review rejected by session history`);
        continue;
      }

      // Check against already accepted reviews in this batch
      let tooSimilarToBatch = false;
      for (const accepted_review of accepted) {
        const score = Utils.similarity(review, accepted_review);
        if (score >= CONFIG.similarityThreshold) {
          Utils.warn(`AntiSpam: batch review too similar to another in batch (${score.toFixed(2)})`);
          tooSimilarToBatch = true;
          break;
        }
      }

      if (!tooSimilarToBatch) {
        accepted.push(review);
      }
    }

    Utils.log(`AntiSpam: batch validation → ${accepted.length}/${reviews.length} accepted`);
    return accepted;
  }

  // ─────────────────────────────────────────────
  // 7. STATS & DEBUGGING
  // ─────────────────────────────────────────────

  /**
   * Get current session stats.
   * Used by admin panel to inspect session state.
   * @returns {Object}
   */
  function getStats() {
    _loadSession();
    return {
      sessionCount: _sessionReviews.length,
      batchPhrasesTracked: _usedPhrases.size,
      historyLimit: CONFIG.historyLimit,
      similarityThreshold: CONFIG.similarityThreshold,
      oldestEntry: _sessionReviews.length > 0
        ? new Date(_sessionReviews[0].timestamp).toLocaleTimeString()
        : null,
    };
  }

  /**
   * Clear full session history.
   * Use with caution — admin tool only.
   */
  function clearSession() {
    _sessionReviews = [];
    _sessionLoaded = false;
    Utils.storeClear(CONFIG.storageKey);
    Utils.log('AntiSpam: session cleared');
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    // Main gates
    validate,           // Validate single review against session history
    validateBatch,      // Validate a batch against each other + history

    // Registration
    register,           // Register a passed review into session history

    // Phrase-level tracking
    isPhraseUsed,       // Check if a phrase was used in current batch
    markPhraseUsed,     // Mark phrase as used
    clearBatchPhrases,  // Reset phrase tracker for new batch

    // Session
    clearSession,       // Wipe session history (admin)

    // Inspection
    getStats,           // Get session stats (admin/debug)

    // Config access
    CONFIG,
  };

})();
