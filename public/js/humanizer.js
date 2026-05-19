/**
 * humanizer.js
 * ------------
 * Human-behavior simulation layer.
 *
 * Responsibilities:
 *  1. Apply controlled lowercase randomness
 *  2. Vary punctuation naturally
 *  3. Insert emojis at natural positions
 *  4. Vary sentence length feel
 *  5. Simulate casual writing patterns
 *  6. Apply language-specific humanization rules
 *  7. Occasional intentional grammar imperfections
 *
 * IMPORTANT:
 *  - Every transform is probabilistic — not every review gets every effect
 *  - Effects are calibrated per star rating and language
 *  - The goal is variation, not damage — reviews must still be readable
 *
 * Depends on: utils.js
 * Used by:    reviewEngine.js
 */

const Humanizer = (() => {

  // ─────────────────────────────────────────────
  // BEHAVIOR PROFILES
  // Controls how aggressively each effect fires
  // per star rating.
  // ─────────────────────────────────────────────

  const PROFILES = {
    5: {
      // 5-star: expressive, warm, slightly casual
      lowercaseFirstWord:     20,   // % chance first word is lowercase
      dropFullStop:           30,   // % chance final period is removed
      addExclamation:         25,   // % chance period → exclamation
      doubleExclamation:      15,   // % chance !! instead of !
      casualCommaUsage:       20,   // % chance comma splice (run-on feel)
      contractExpansion:      0,    // % chance "I am" → "I'm" (English only)
      repeatLetterEmphasis:   10,   // % chance "bahut" → "bahuuut" (Hinglish)
      typoSimulation:         8,    // % chance minor intentional typo
      sentenceFragmentDrop:   15,   // % chance drop last word of a sentence
    },
    4: {
      lowercaseFirstWord:     15,
      dropFullStop:           25,
      addExclamation:         10,
      doubleExclamation:      5,
      casualCommaUsage:       15,
      contractExpansion:      0,
      repeatLetterEmphasis:   5,
      typoSimulation:         5,
      sentenceFragmentDrop:   8,
    },
    3: {
      // 3-star: neutral, minimal effects
      lowercaseFirstWord:     10,
      dropFullStop:           20,
      addExclamation:         0,
      doubleExclamation:      0,
      casualCommaUsage:       10,
      contractExpansion:      0,
      repeatLetterEmphasis:   0,
      typoSimulation:         3,
      sentenceFragmentDrop:   5,
    },
  };

  // ─────────────────────────────────────────────
  // LANGUAGE-SPECIFIC RULES
  // Extra behavior per language that doesn't apply
  // to all languages.
  // ─────────────────────────────────────────────

  const LANG_RULES = {
    english: {
      contractions: {
        "I am ":     "I'm ",
        "do not ":   "don't ",
        "did not ":  "didn't ",
        "have not ": "haven't ",
        "it is ":    "it's ",
        "that is ":  "that's ",
        "they are ": "they're ",
      },
      // English reviewers sometimes drop the subject
      subjectDropPatterns: [
        { from: /^I would /i, to: 'Would ' },
        { from: /^I will /i,  to: 'Will ' },
      ],
    },

    hinglish: {
      // Hinglish writers sometimes add "na", "yaar", "bhai" casually
      casualFillers: {
        enabled: true,
        probability: 12,
        words: ['na.', 'yaar.', '— bilkul.', ', seriously.'],
      },
      // Elongated words for emphasis
      elongations: [
        { from: 'bahut', to: 'bahuuut',   probability: 15 },
        { from: 'accha', to: 'acchaaa',   probability: 10 },
        { from: 'sach',  to: 'sachchi',   probability: 8  },
      ],
    },

    hindi: {
      // Hindi writers use — (em dash) more naturally
      dashProbability: 15,
      // Drop the period in favor of nothing (Hindi punctuation is loose online)
      noPeriodProbability: 35,
    },

    mixed: {
      // Mixed writers switch even mid-punctuation sometimes
      casualFillers: {
        enabled: true,
        probability: 10,
        words: ['honestly.', '— for real.', ', no kidding.'],
      },
    },
  };

  // ─────────────────────────────────────────────
  // INTENTIONAL TYPO BANK
  // Common harmless typos real people make.
  // Only applied at low probability.
  // ─────────────────────────────────────────────

  const TYPOS = {
    english: [
      { from: /\btheir\b/,   to: 'thier'   },
      { from: /\breceive\b/, to: 'recieve'  },
      { from: /\bdefinitely\b/, to: 'definately' },
      { from: /\bseparate\b/,   to: 'seperate'  },
      { from: /\bexperience\b/, to: 'experiance' },
    ],
    hinglish: [
      { from: /bahut/,   to: 'bhaut'   },
      { from: /doctor/,  to: 'docter'  },
      { from: /clinic/,  to: 'clenic'  },
      { from: /results/, to: 'rezults' },
    ],
    hindi: [
      // Hindi typos are rare and risky — keeping this empty
      // to avoid accidentally changing meaning
    ],
    mixed: [
      { from: /\bexperience\b/, to: 'experiance' },
      { from: /bahut/,          to: 'bhaut'       },
    ],
  };

  // ─────────────────────────────────────────────
  // 1. CORE SENTENCE TRANSFORMS
  // ─────────────────────────────────────────────

  /**
   * Apply lowercase to first letter of a sentence.
   * Real people often don't capitalize.
   * @param {string} sentence
   * @param {number} stars
   * @returns {string}
   */
  function _maybeDropCapital(sentence, stars) {
    const profile = PROFILES[stars] || PROFILES[3];
    if (!Utils.odds(profile.lowercaseFirstWord)) return sentence;
    if (!sentence) return sentence;
    return sentence.charAt(0).toLowerCase() + sentence.slice(1);
  }

  /**
   * Vary the end punctuation of a sentence.
   * @param {string} sentence
   * @param {number} stars
   * @returns {string}
   */
  function _varyEndPunctuation(sentence, stars) {
    const profile = PROFILES[stars] || PROFILES[3];
    if (!sentence) return sentence;

    const trimmed = sentence.trimEnd();
    const lastChar = trimmed.slice(-1);

    // If ends with period
    if (lastChar === '.') {
      if (Utils.odds(profile.dropFullStop)) {
        // Remove the period entirely
        return trimmed.slice(0, -1);
      }
      if (Utils.odds(profile.addExclamation)) {
        // Replace with exclamation
        const base = trimmed.slice(0, -1);
        return Utils.odds(profile.doubleExclamation) ? base + '!!' : base + '!';
      }
    }

    return sentence;
  }

  /**
   * Apply language-specific contractions (English only).
   * "I am" → "I'm" etc.
   * @param {string} sentence
   * @param {string} language
   * @returns {string}
   */
  function _applyContractions(sentence, language) {
    if (language !== 'english') return sentence;
    const rules = LANG_RULES.english.contractions;
    let result = sentence;
    for (const [from, to] of Object.entries(rules)) {
      if (Utils.odds(50)) { // 50% chance each contraction fires
        result = result.replace(new RegExp(from, 'g'), to);
      }
    }
    return result;
  }

  /**
   * Apply subject drops for English (casual writing).
   * "I would recommend" → "Would recommend"
   * @param {string} sentence
   * @param {string} language
   * @param {number} stars
   * @returns {string}
   */
  function _maybeDropSubject(sentence, language, stars) {
    if (language !== 'english') return sentence;
    if (!Utils.odds(12)) return sentence; // 12% chance overall

    const patterns = LANG_RULES.english.subjectDropPatterns;
    for (const { from, to } of patterns) {
      if (from.test(sentence)) {
        return sentence.replace(from, to);
      }
    }
    return sentence;
  }

  /**
   * Apply Hinglish elongations for emphasis.
   * "bahut" → "bahuuut"
   * @param {string} sentence
   * @param {string} language
   * @returns {string}
   */
  function _applyElongations(sentence, language) {
    if (language !== 'hinglish') return sentence;
    const elongations = LANG_RULES.hinglish.elongations;
    let result = sentence;
    for (const { from, to, probability } of elongations) {
      if (Utils.odds(probability)) {
        result = result.replace(new RegExp(from, 'g'), to);
      }
    }
    return result;
  }

  /**
   * Apply a single intentional typo to a sentence.
   * Only fires at low probability.
   * @param {string} sentence
   * @param {string} language
   * @param {number} stars
   * @returns {string}
   */
  function _maybeApplyTypo(sentence, language, stars) {
    const profile = PROFILES[stars] || PROFILES[3];
    if (!Utils.odds(profile.typoSimulation)) return sentence;

    const typoList = TYPOS[language] || TYPOS.english;
    if (typoList.length === 0) return sentence;

    const typo = Utils.pick(typoList);
    return sentence.replace(typo.from, typo.to);
  }

  // ─────────────────────────────────────────────
  // 2. EMOJI PLACEMENT
  // ─────────────────────────────────────────────

  /**
   * Add emojis to a review at natural positions.
   * Positions: end of review, or after a specific sentence.
   *
   * @param {string} reviewText    full assembled review
   * @param {Object} emojiData     from phrases.emojis
   * @param {number} stars
   * @param {Object} clientProfile
   * @returns {string}             review with emojis added (or unchanged)
   */
  function _applyEmojis(reviewText, emojiData, stars, clientProfile) {
    // Check if emojis are enabled for this client
    const emojiConfig = clientProfile?.emoji;
    if (!emojiConfig?.enabled) return reviewText;

    // Base probability from client profile
    let probability = emojiConfig.probability || 60;

    // Boost for 5-star if client profile says so
    const ratingConfig = clientProfile?.rating?.[String(stars)];
    if (ratingConfig?.emojiBoost) probability = Math.min(probability + 20, 95);

    if (!Utils.odds(probability)) return reviewText;

    // Pick emoji set
    const starKey = stars >= 5 ? '5star' : stars === 4 ? '4star' : '3star';
    const combinations = emojiData?.combinations?.[starKey];
    const singles = emojiData?.[starKey];

    let chosen = [];

    if (combinations && combinations.length > 0 && Utils.odds(60)) {
      // 60% chance: use a pre-set combination (looks more natural)
      chosen = Utils.pick(combinations);
    } else if (singles && singles.length > 0) {
      // 40% chance: pick 1-2 individual emojis
      const count = Utils.odds(30) ? 2 : 1;
      chosen = Utils.pickN(singles, count);
    }

    if (chosen.length === 0) return reviewText;

    const emojiStr = chosen.join('');

    // Placement: end of review (most natural)
    // Occasionally insert after first sentence instead
    if (Utils.odds(20) && reviewText.includes('.')) {
      // After first sentence
      const firstDot = reviewText.indexOf('.');
      return reviewText.slice(0, firstDot + 1)
        + ' ' + emojiStr
        + reviewText.slice(firstDot + 1);
    }

    // Default: append to end
    return reviewText.trimEnd() + ' ' + emojiStr;
  }

  // ─────────────────────────────────────────────
  // 3. REVIEW-LEVEL TRANSFORMS
  // Applied to the full assembled review string.
  // ─────────────────────────────────────────────

  /**
   * Randomly vary spacing around punctuation.
   * Some people write "great,very good" (no space after comma).
   * @param {string} text
   * @returns {string}
   */
  function _varyCasualSpacing(text) {
    if (!Utils.odds(15)) return text;
    // Occasionally remove space after comma
    return text.replace(/, ([a-z])/g, (match, next) => {
      return Utils.odds(20) ? `,${next}` : match;
    });
  }

  /**
   * Hindi-specific: sometimes remove final punctuation entirely.
   * Hindi writers online often skip periods.
   * @param {string} text
   * @param {string} language
   * @returns {string}
   */
  function _hindiNoPeriod(text, language) {
    if (language !== 'hindi') return text;
    const prob = LANG_RULES.hindi.noPeriodProbability;
    if (!Utils.odds(prob)) return text;
    return text.trimEnd().replace(/\.$/, '');
  }

  /**
   * Add a casual filler word to end of Hinglish/Mixed review.
   * "...bahut accha" → "...bahut accha, yaar."
   * @param {string} text
   * @param {string} language
   * @returns {string}
   */
  function _addCasualFiller(text, language) {
    const rules = LANG_RULES[language];
    if (!rules?.casualFillers?.enabled) return text;
    if (!Utils.odds(rules.casualFillers.probability)) return text;

    const filler = Utils.pick(rules.casualFillers.words);
    return text.trimEnd() + ' ' + filler;
  }

  // ─────────────────────────────────────────────
  // 4. MAIN HUMANIZATION PIPELINE
  // ─────────────────────────────────────────────

  /**
   * Humanize a single sentence.
   * Called by reviewEngine per sentence before assembly.
   *
   * @param {string} sentence
   * @param {string} language
   * @param {number} stars
   * @returns {string}
   */
  function humanizeSentence(sentence, language, stars) {
    if (!sentence) return sentence;

    let s = sentence;

    // Order matters — apply transforms in this sequence
    s = _applyContractions(s, language);
    s = _applyElongations(s, language);
    s = _maybeDropSubject(s, language, stars);
    s = _varyEndPunctuation(s, stars);
    s = _maybeDropCapital(s, stars);
    s = _maybeApplyTypo(s, language, stars);

    return s;
  }

  /**
   * Humanize the fully assembled review text.
   * Called by reviewEngine after all sentences are joined.
   *
   * @param {string} reviewText      full assembled review
   * @param {Object} phraseData      phrases object (for emojis)
   * @param {string} language
   * @param {number} stars
   * @param {Object} clientProfile
   * @returns {string}               humanized review
   */
  function humanizeReview(reviewText, phraseData, language, stars, clientProfile) {
    if (!reviewText) return reviewText;

    let text = reviewText;

    // Review-level transforms
    text = _varyCasualSpacing(text);
    text = _hindiNoPeriod(text, language);
    text = _addCasualFiller(text, language);

    // Emoji placement (last — so emojis go at natural end position)
    if (phraseData?.emojis) {
      text = _applyEmojis(text, phraseData.emojis, stars, clientProfile);
    }

    // Final clean — no double spaces
    text = Utils.clean(text);

    return text;
  }

  // ─────────────────────────────────────────────
  // 5. PROFILE INSPECTOR (admin/debug)
  // ─────────────────────────────────────────────

  /**
   * Get the behavior profile for a star rating.
   * Admin panel uses this to show what effects are active.
   * @param {number} stars
   * @returns {Object}
   */
  function getProfile(stars) {
    return { ...(PROFILES[stars] || PROFILES[3]) };
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    humanizeSentence,  // Per-sentence transform (called by reviewEngine per phrase)
    humanizeReview,    // Full review transform (called after assembly)
    getProfile,        // Admin: inspect behavior profile for a star rating
    PROFILES,          // Admin: direct access to profile config
    LANG_RULES,        // Admin: direct access to language rules
  };

})();
