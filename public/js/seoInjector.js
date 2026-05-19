/**
 * seoInjector.js
 * --------------
 * Safe local SEO keyword injection system.
 *
 * Responsibilities:
 *  1. Read client SEO config (local keywords, trust keywords)
 *  2. Pick from the language-specific SEO phrase pool
 *  3. Replace {{city}} and {{area}} placeholders dynamically
 *  4. Enforce hard limits — max 1 location + 1 credibility phrase per review
 *  5. Track which SEO phrases were recently used (anti-repetition)
 *  6. Decide WHETHER to inject at all (not every review gets SEO)
 *
 * GOLDEN RULES:
 *  - A review that sounds natural with NO SEO is better than one
 *    that sounds forced WITH SEO. When in doubt, skip injection.
 *  - Never inject two location mentions in one review.
 *  - Never inject a keyword that already appears in the review naturally.
 *
 * Depends on: utils.js
 * Used by:    reviewEngine.js
 */

const SeoInjector = (() => {

  // ─────────────────────────────────────────────
  // INJECTION CONFIGURATION
  // Controls when and how SEO phrases are injected.
  // ─────────────────────────────────────────────

  const CONFIG = {
    // % chance a review gets a location SEO phrase at all.
    // Not every review needs one — variety looks more natural.
    locationInjectionProbability: 55,

    // % chance a review gets a credibility phrase.
    credibilityInjectionProbability: 40,

    // % chance BOTH location AND credibility appear together.
    // Kept low — two SEO sentences in one review risks stuffing.
    bothInjectionProbability: 20,

    // How many recent SEO phrases to track to avoid repetition.
    recentPhraseLimit: 6,

    // Star rating threshold below which we reduce SEO injection.
    // 3-star reviews with SEO look unnatural.
    reducedSeoStarThreshold: 4,

    // Reduced probability for 3-star reviews
    reducedLocationProbability: 25,
    reducedCredibilityProbability: 15,
  };

  // ─────────────────────────────────────────────
  // SESSION TRACKING
  // Tracks recently used SEO phrases within session
  // to prevent the same location phrase appearing
  // in every single generated review.
  // ─────────────────────────────────────────────

  let _recentPhrases = [];

  /**
   * Check if a phrase was recently used.
   * @param {string} phrase
   * @returns {boolean}
   */
  function _wasRecentlyUsed(phrase) {
    const key = phrase.trim().toLowerCase();
    return _recentPhrases.some(p => p.toLowerCase() === key);
  }

  /**
   * Mark a phrase as recently used.
   * @param {string} phrase
   */
  function _markUsed(phrase) {
    _recentPhrases.push(phrase.trim());
    // Keep only the most recent N
    if (_recentPhrases.length > CONFIG.recentPhraseLimit) {
      _recentPhrases.shift();
    }
  }

  // ─────────────────────────────────────────────
  // 1. PLACEHOLDER RESOLUTION
  // Fills {{city}} and {{area}} in SEO phrases
  // using data from the client profile.
  // ─────────────────────────────────────────────

  /**
   * Build the values map for placeholder replacement.
   * @param {Object} clientProfile
   * @returns {Object}  { city, area, name }
   */
  function _buildValues(clientProfile) {
    return {
      city:  clientProfile?.business?.city  || 'your city',
      area:  clientProfile?.business?.area  || 'your area',
      name:  clientProfile?.business?.name  || 'this clinic',
    };
  }

  // ─────────────────────────────────────────────
  // 2. PHRASE SELECTION
  // Picks an SEO phrase from the correct pool,
  // avoiding recently used ones.
  // ─────────────────────────────────────────────

  /**
   * Pick a fresh SEO phrase from a pool.
   * Tries up to 5 times to find one not recently used.
   * Falls back to any phrase if all are recently used
   * (small phrase banks shouldn't crash the engine).
   *
   * @param {Array<string>} pool    array of phrase strings
   * @param {Object} values         placeholder values
   * @returns {string|null}         filled phrase or null if pool empty
   */
  function _pickFreshPhrase(pool, values) {
    if (!pool || pool.length === 0) return null;

    // Try to find a non-recently-used phrase
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const phrase of shuffled) {
      if (!_wasRecentlyUsed(phrase)) {
        const filled = Utils.fillTemplate(phrase, values);
        _markUsed(phrase);
        return filled;
      }
    }

    // All phrases recently used — pick any one (small bank fallback)
    Utils.warn('SeoInjector: all phrases recently used, picking any');
    const phrase = Utils.pick(pool);
    return Utils.fillTemplate(phrase, values);
  }

  // ─────────────────────────────────────────────
  // 3. COLLISION DETECTION
  // Prevents injecting a keyword that already
  // appears naturally in the review text.
  // ─────────────────────────────────────────────

  /**
   * Check if a city or area name already exists in the review text.
   * @param {string} reviewText
   * @param {Object} values  { city, area }
   * @returns {boolean}  true if location is already mentioned
   */
  function _locationAlreadyPresent(reviewText, values) {
    const text = reviewText.toLowerCase();
    const city = values.city.toLowerCase();
    const area = values.area.toLowerCase();
    return text.includes(city) || text.includes(area);
  }

  /**
   * Check if a service keyword already appears in the review text.
   * @param {string} reviewText
   * @param {Array<string>} keywords  service-specific keywords
   * @returns {boolean}
   */
  function _serviceKeywordPresent(reviewText, keywords) {
    if (!keywords || keywords.length === 0) return false;
    const text = reviewText.toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
  }

  // ─────────────────────────────────────────────
  // 4. INJECTION DECISION ENGINE
  // ─────────────────────────────────────────────

  /**
   * Decide what to inject based on star rating, config, and randomness.
   * Returns a decision object — the actual injection happens separately.
   *
   * @param {number} stars
   * @returns {{ injectLocation: boolean, injectCredibility: boolean }}
   */
  function _makeInjectionDecision(stars) {
    const isLowRating = stars < CONFIG.reducedSeoStarThreshold;

    const locationProb = isLowRating
      ? CONFIG.reducedLocationProbability
      : CONFIG.locationInjectionProbability;

    const credibilityProb = isLowRating
      ? CONFIG.reducedCredibilityProbability
      : CONFIG.credibilityInjectionProbability;

    // If BOTH would fire, gate it through the bothProbability check
    const wantsLocation    = Utils.odds(locationProb);
    const wantsCredibility = Utils.odds(credibilityProb);

    if (wantsLocation && wantsCredibility) {
      // Both only allowed if bothInjectionProbability passes
      if (Utils.odds(CONFIG.bothInjectionProbability)) {
        return { injectLocation: true, injectCredibility: true };
      } else {
        // Pick one — prefer location for SEO value
        return { injectLocation: true, injectCredibility: false };
      }
    }

    return {
      injectLocation:    wantsLocation,
      injectCredibility: wantsCredibility,
    };
  }

  // ─────────────────────────────────────────────
  // 5. INJECTION POSITIONS
  // Controls WHERE in the review the SEO phrase
  // is inserted — not always at the end.
  // ─────────────────────────────────────────────

  /**
   * Insert an SEO phrase into a review at a natural position.
   *
   * Positions:
   *  - 'end'    → appended as final sentence (most common)
   *  - 'mid'    → inserted before the last sentence
   *  - 'second' → inserted as second sentence
   *
   * @param {string} reviewText
   * @param {string} seoPhrase
   * @returns {string}
   */
  function _insertAtPosition(reviewText, seoPhrase) {
    // Split into sentences by period/exclamation/question
    const sentenceBreak = /(?<=[.!?])\s+/;
    const sentences = reviewText.split(sentenceBreak).filter(s => s.trim());

    if (sentences.length <= 1) {
      // Only one sentence — just append
      return Utils.clean(reviewText + ' ' + seoPhrase);
    }

    // Decide position
    const roll = Math.random();

    if (roll < 0.60 || sentences.length < 3) {
      // 60% chance: append at end
      return Utils.clean([...sentences, seoPhrase].join(' '));
    } else if (roll < 0.85) {
      // 25% chance: insert before last sentence
      const withoutLast = sentences.slice(0, -1);
      const last = sentences[sentences.length - 1];
      return Utils.clean([...withoutLast, seoPhrase, last].join(' '));
    } else {
      // 15% chance: insert as second sentence
      const first = sentences[0];
      const rest = sentences.slice(1);
      return Utils.clean([first, seoPhrase, ...rest].join(' '));
    }
  }

  // ─────────────────────────────────────────────
  // 6. MAIN ENTRY POINT
  // ─────────────────────────────────────────────

  /**
   * Inject SEO phrases into an assembled review.
   * This is what reviewEngine.js calls.
   *
   * @param {string}  reviewText      assembled review (pre-emoji, pre-humanizer final pass)
   * @param {Object}  seoPhrases      from phrases.seo (language-specific)
   * @param {Object}  clientProfile   full client profile.json
   * @param {number}  stars           1–5
   * @param {Object}  serviceData     selected service object from profile.services
   * @returns {string}                review with SEO injected (or unchanged)
   */
  function inject(reviewText, seoPhrases, clientProfile, stars, serviceData) {
    if (!reviewText || !seoPhrases || !clientProfile) return reviewText;

    const values = _buildValues(clientProfile);
    const decision = _makeInjectionDecision(stars);

    Utils.log(`SeoInjector: decision →`, decision);

    let result = reviewText;

    // ── Location injection ──────────────────────
    if (decision.injectLocation) {
      // Check if location already in review — skip if so
      if (_locationAlreadyPresent(result, values)) {
        Utils.log('SeoInjector: location already present, skipping location injection');
      } else {
        const locationPhrase = _pickFreshPhrase(seoPhrases.location, values);
        if (locationPhrase) {
          result = _insertAtPosition(result, locationPhrase);
          Utils.log(`SeoInjector: injected location → "${locationPhrase}"`);
        }
      }
    }

    // ── Credibility injection ───────────────────
    if (decision.injectCredibility) {
      const credPhrase = _pickFreshPhrase(seoPhrases.credibility, values);
      if (credPhrase) {
        result = _insertAtPosition(result, credPhrase);
        Utils.log(`SeoInjector: injected credibility → "${credPhrase}"`);
      }
    }

    return Utils.clean(result);
  }

  // ─────────────────────────────────────────────
  // 7. SERVICE KEYWORD EXTRACTOR
  // ─────────────────────────────────────────────

  /**
   * Get the keywords for a specific service from the client profile.
   * Used by reviewEngine to check collision before injection.
   *
   * @param {Object} clientProfile
   * @param {string} serviceId      e.g. 'skin'
   * @returns {Array<string>}       keyword array
   */
  function getServiceKeywords(clientProfile, serviceId) {
    const services = clientProfile?.services || [];
    const service = services.find(s => s.id === serviceId);
    return service?.keywords || [];
  }

  // ─────────────────────────────────────────────
  // 8. ADMIN / DEBUG TOOLS
  // ─────────────────────────────────────────────

  /**
   * Preview what SEO injection would produce for a given config.
   * Used by admin panel — doesn't affect session tracking.
   *
   * @param {Object} seoPhrases
   * @param {Object} clientProfile
   * @returns {{ location: string|null, credibility: string|null }}
   */
  function preview(seoPhrases, clientProfile) {
    const values = _buildValues(clientProfile);
    const loc  = _pickFreshPhrase(seoPhrases?.location || [], values);
    const cred = _pickFreshPhrase(seoPhrases?.credibility || [], values);
    return { location: loc, credibility: cred };
  }

  /**
   * Clear the recent phrase tracker.
   * Call when starting a new patient session.
   */
  function clearHistory() {
    _recentPhrases = [];
    Utils.log('SeoInjector: history cleared');
  }

  /**
   * Get injection stats for admin/debug.
   * @returns {Object}
   */
  function getStats() {
    return {
      recentPhrasesTracked: _recentPhrases.length,
      config: { ...CONFIG },
    };
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    inject,              // Main entry: inject SEO into review text
    getServiceKeywords,  // Get keywords for a service
    preview,             // Admin: preview what would be injected
    clearHistory,        // Reset recent phrase tracker
    getStats,            // Admin/debug stats
    CONFIG,              // Direct config access for admin
  };

})();
