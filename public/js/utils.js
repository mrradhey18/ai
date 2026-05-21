/**
 * utils.js
 * --------
 * Shared utility functions for the Review Generation System.
 * Every other JS module depends on this file.
 * Load this FIRST in index.html before any other script.
 *
 * NO external dependencies. Pure vanilla JS.
 */

const Utils = (() => {

  // ─────────────────────────────────────────────
  // 1. RANDOM PICKERS
  // ─────────────────────────────────────────────

  /**
   * Pick one random item from an array.
   * @param {Array} arr
   * @returns {*} one random element
   *
   * Usage: Utils.pick(['a','b','c']) → 'b'
   */
  function pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Pick N unique random items from an array.
   * If N >= arr.length, returns shuffled copy of full array.
   * @param {Array} arr
   * @param {number} n
   * @returns {Array}
   *
   * Usage: Utils.pickN(['a','b','c','d'], 2) → ['c','a']
   */
  function pickN(arr, n) {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
  }

  /**
   * Pick a random integer between min and max (inclusive).
   * @param {number} min
   * @param {number} max
   * @returns {number}
   *
   * Usage: Utils.randInt(2, 5) → 3
   */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Roll a probability check.
   * @param {number} percent  0–100
   * @returns {boolean}       true if roll succeeds
   *
   * Usage: Utils.odds(60) → true (60% of the time)
   */
  function odds(percent) {
    return Math.random() * 100 < percent;
  }

  // ─────────────────────────────────────────────
  // 2. WEIGHTED RANDOM SELECTION
  // ─────────────────────────────────────────────

  /**
   * Select a key from an object of { key: weight } pairs.
   * Weights do NOT need to sum to 100 — they are relative.
   * @param {Object} weightMap  e.g. { english: 25, hinglish: 40, hindi: 25, mixed: 10 }
   * @returns {string}          selected key
   *
   * Usage: Utils.weightedPick({ a: 70, b: 30 }) → 'a' (70% of the time)
   */
  function weightedPick(weightMap) {
    const entries = Object.entries(weightMap);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;

    for (const [key, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return key;
    }

    // Fallback: return last key (handles floating point edge cases)
    return entries[entries.length - 1][0];
  }

  // ─────────────────────────────────────────────
  // 3. PLACEHOLDER REPLACEMENT
  // ─────────────────────────────────────────────

  /**
   * Replace all {{placeholder}} tokens in a string.
   * @param {string} template   e.g. "Came for {{service}} in {{city}}"
   * @param {Object} values     e.g. { service: "Skin Treatment", city: "Lucknow" }
   * @returns {string}          replaced string
   *
   * Usage: Utils.fillTemplate("Came for {{service}}", { service: "Hair Loss" })
   *        → "Came for Hair Loss"
   */
  function fillTemplate(template, values) {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return values.hasOwnProperty(key) ? values[key] : match;
    });
  }

  // ─────────────────────────────────────────────
  // 4. ARRAY UTILITIES
  // ─────────────────────────────────────────────

  /**
   * Shuffle an array in place using Fisher-Yates algorithm.
   * @param {Array} arr
   * @returns {Array} same array, shuffled
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Remove duplicate strings from an array (case-insensitive).
   * Used by antiSpam to detect repeated phrases.
   * @param {Array<string>} arr
   * @returns {Array<string>}
   */
  function dedupeStrings(arr) {
    const seen = new Set();
    return arr.filter(item => {
      const key = item.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ─────────────────────────────────────────────
  // 5. STRING UTILITIES
  // ─────────────────────────────────────────────

  /**
   * Capitalize first letter of a string.
   * Used by humanizer when it lowercases then needs to re-capitalize.
   * @param {string} str
   * @returns {string}
   */
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Trim and clean a string — remove double spaces, leading/trailing whitespace.
   * @param {string} str
   * @returns {string}
   */
  function clean(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Join an array of sentences into a review string.
   * Handles spacing and ensures clean output.
   * @param {Array<string>} sentences
   * @returns {string}
   */
  function joinSentences(sentences) {
    return sentences
      .filter(s => s && s.trim().length > 0)
      .map(s => clean(s))
      .join(' ');
  }

  /**
   * Calculate rough similarity between two strings (0 to 1).
   * Used by antiSpam to detect near-duplicate reviews.
   * Based on word overlap — not edit distance (faster for this use case).
   * @param {string} a
   * @param {string} b
   * @returns {number} 0 = completely different, 1 = identical
   */
  function similarity(a, b) {
    if (!a || !b) return 0;
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  // ─────────────────────────────────────────────
  // 6. JSON LOADER
  // ─────────────────────────────────────────────

  /**
   * Load a JSON file via fetch.
   * All engine modules use this to load phrase banks and client profiles.
   * Returns parsed object or null on failure.
   * @param {string} path  relative path to JSON file
   * @returns {Promise<Object|null>}
   *
   * Usage: const data = await Utils.loadJSON('/data/phrases/english/intros.json');
   */
  async function loadJSON(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
      return await res.json();
    } catch (err) {
      console.error(`[Utils.loadJSON] Failed to load: ${path}`, err);
      return null;
    }
  }

  /**
   * Load multiple JSON files in parallel.
   * More efficient than loading one at a time.
   * @param {Array<string>} paths
   * @returns {Promise<Array<Object|null>>}
   *
   * Usage: const [intros, trust] = await Utils.loadJSONAll([path1, path2]);
   */
  async function loadJSONAll(paths) {
    return Promise.all(paths.map(p => loadJSON(p)));
  }

  // ─────────────────────────────────────────────
  // 7. URL PARAMETER READER
  // ─────────────────────────────────────────────

  /**
   * Read URL query parameters.
   * QR codes pass the client slug via ?clinic=dr-sharma-homeo
   * @param {string} key
   * @returns {string|null}
   *
   * Usage: Utils.getParam('clinic') → 'dr-sharma-homeo'
   */
  function getParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  // ─────────────────────────────────────────────
  // 8. LOCAL STORAGE HELPERS
  // ─────────────────────────────────────────────

  /**
   * Save data to localStorage under a namespaced key.
   * @param {string} key
   * @param {*} value   will be JSON.stringified
   */
  function storeSave(key, value) {
    try {
      localStorage.setItem(`rgs_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('[Utils.storeSave] localStorage write failed:', e);
    }
  }

  /**
   * Load data from localStorage.
   * @param {string} key
   * @returns {*|null}  parsed value or null if not found
   */
  function storeLoad(key) {
    try {
      const raw = localStorage.getItem(`rgs_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Utils.storeLoad] localStorage read failed:', e);
      return null;
    }
  }

  /**
   * Clear a specific localStorage key.
   * @param {string} key
   */
  function storeClear(key) {
    try {
      localStorage.removeItem(`rgs_${key}`);
    } catch (e) {
      console.warn('[Utils.storeClear] localStorage clear failed:', e);
    }
  }

  // ─────────────────────────────────────────────
  // 9. DEBUG LOGGER
  // ─────────────────────────────────────────────

  /**
   * Controlled logger. Set Utils.DEBUG = true to enable verbose logs.
   * Production stays silent. Dev mode shows full generation trace.
   */
  const DEBUG = false;

  function log(...args) {
    if (DEBUG) console.log('[RGS]', ...args);
  }

  function warn(...args) {
    if (DEBUG) console.warn('[RGS]', ...args);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    // Random
    pick,
    pickN,
    randInt,
    odds,
    weightedPick,

    // Template
    fillTemplate,

    // Array
    shuffle,
    dedupeStrings,

    // String
    capitalize,
    clean,
    joinSentences,
    similarity,

    // JSON
    loadJSON,
    loadJSONAll,

    // URL
    getParam,

    // Storage
    storeSave,
    storeLoad,
    storeClear,

    // Debug
    DEBUG,
    log,
    warn,
  };

})();
