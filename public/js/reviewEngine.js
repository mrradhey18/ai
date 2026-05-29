/**
 * reviewEngine.js
 * ---------------
 * Core review generation engine.
 *
 * Responsibilities:
 *  1. Orchestrate all engine modules in correct sequence
 *  2. Build review sentence structure from phrase pools
 *  3. Apply variable length and optional sentence skipping
 *  4. Use multiple structural templates for variety
 *  5. Run humanizer per sentence and per review
 *  6. Inject SEO phrases at the right moment
 *  7. Run anti-spam validation and retry if needed
 *  8. Return 3–5 unique, ready-to-copy review strings
 *
 * Depends on:
 *  utils.js, languageEngine.js, humanizer.js,
 *  seoInjector.js, antiSpam.js
 *
 * Used by: app.js
 */

const ReviewEngine = (() => {

  // ─────────────────────────────────────────────
  // REVIEW STRUCTURE TEMPLATES
  //
  // Each template defines which phrase types appear
  // and in what order. The engine picks a template
  // randomly per review so structure varies.
  //
  // Keys match phrase file names:
  //   intro, trust, service, emotional, seo, outro
  //
  // 'optional' means the engine may skip this slot.
  // 'required' means it always appears.
  // ─────────────────────────────────────────────

  const TEMPLATES = [
    // Template A: Classic full review
    [
      { type: 'intros',     required: true  },
      { type: 'service',   required: true  },
      { type: 'trust',     required: false },
      { type: 'emotional', required: false },
      { type: 'outros',     required: true  },
    ],

    // Template B: Trust-forward
    [
      { type: 'intros',     required: true  },
      { type: 'trust',     required: true  },
      { type: 'service',   required: false },
      { type: 'emotional', required: false },
      { type: 'outros',     required: true  },
    ],

    // Template C: Short and punchy (2–3 sentences)
    [
      { type: 'intros',     required: true  },
      { type: 'service',   required: true  },
      { type: 'outros',     required: true  },
    ],

    // Template D: Emotional journey
    [
      { type: 'intros',     required: true  },
      { type: 'emotional', required: true  },
      { type: 'trust',     required: false },
      { type: 'service',   required: false },
      { type: 'outros',     required: true  },
    ],

    // Template E: Trust + outro only (very short)
    [
      { type: 'intros',     required: true  },
      { type: 'trust',     required: true  },
      { type: 'outros',     required: true  },
    ],

    // Template F: Service-focused
    [
      { type: 'service',   required: true  },
      { type: 'trust',     required: false },
      { type: 'emotional', required: false },
      { type: 'outros',     required: true  },
    ],
  ];

  // ─────────────────────────────────────────────
  // TEMPLATE WEIGHTS PER STAR RATING
  // Controls which templates are more likely
  // for each star level.
  //
  // Index maps to TEMPLATES array above (A=0, B=1...)
  // ─────────────────────────────────────────────

  const TEMPLATE_WEIGHTS = {
    5: [25, 20, 15, 20, 10, 10], // All templates used, emotional ones boosted
    4: [30, 25, 20, 10, 10,  5], // Classic and trust-forward dominate
    3: [20, 20, 40,  5, 10,  5], // Short template (C) dominates for 3-star
  };

  // ─────────────────────────────────────────────
  // SKIP PROBABILITIES
  // How often optional slots are skipped
  // per star rating.
  // ─────────────────────────────────────────────

  const SKIP_ODDS = {
    5: { trust: 20, emotional: 30, service: 10 }, // Rarely skip on 5-star
    4: { trust: 30, emotional: 50, service: 20 },
    3: { trust: 40, emotional: 80, service: 30 }, // Skip a lot on 3-star
  };

  // ─────────────────────────────────────────────
  // 1. TEMPLATE SELECTION
  // ─────────────────────────────────────────────

  /**
   * Pick a review structure template based on star rating.
   * @param {number} stars
   * @returns {Array}  template definition array
   */
  function _pickTemplate(stars) {
    const weights = TEMPLATE_WEIGHTS[stars] || TEMPLATE_WEIGHTS[3];

    // Build weighted map: { 0: 25, 1: 20, 2: 15, ... }
    const weightMap = {};
    weights.forEach((w, i) => { weightMap[i] = w; });

    const index = parseInt(Utils.weightedPick(weightMap));
    Utils.log(`ReviewEngine: using template ${['A','B','C','D','E','F'][index]}`);
    return TEMPLATES[index];
  }

  // ─────────────────────────────────────────────
  // 2. SINGLE PHRASE BUILDER
  // Picks a phrase from the right pool, applies
  // placeholder replacement and humanization.
  // ─────────────────────────────────────────────

  /**
   * Build one sentence for a given slot type.
   *
   * @param {string} type          slot type: 'intro','trust','service', etc.
   * @param {Object} phrases       full phrase bank for selected language
   * @param {number} stars         star rating
   * @param {string} language      selected language
   * @param {Object} templateValues  { service, city, area }
   * @returns {string|null}        humanized, filled sentence or null
   */
  function _buildPhrase(type, phrases, stars, language, templateValues) {
    const phraseCategory = phrases[type];
    if (!phraseCategory) {
      Utils.warn(`ReviewEngine: phrase type "${type}" not found in bank`);
      return null;
    }

    // Get the right star pool
    const pool = LanguageEngine.getPool(phraseCategory, stars);
    if (!pool || pool.length === 0) {
      Utils.warn(`ReviewEngine: empty pool for type "${type}", stars ${stars}`);
      return null;
    }

    // Try to pick a phrase not used in this batch
    let phrase = null;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const candidate of shuffled) {
      if (!AntiSpam.isPhraseUsed(candidate)) {
        phrase = candidate;
        break;
      }
    }

    // All phrases used — pick any (small bank fallback)
    if (!phrase) phrase = Utils.pick(pool);
    if (!phrase) return null;

    // Mark as used in this batch
    AntiSpam.markPhraseUsed(phrase);

    // Fill placeholders: {{service}}, {{city}}, {{area}}
    const filled = Utils.fillTemplate(phrase, templateValues);

    // Humanize at sentence level
    const humanized = Humanizer.humanizeSentence(filled, language, stars);

    return humanized;
  }

  // ─────────────────────────────────────────────
  // 3. SINGLE REVIEW BUILDER
  // Assembles one complete review from a template.
  // ─────────────────────────────────────────────

  /**
   * Build one complete review string.
   *
   * @param {Object} params
   * @param {Object} params.phrases         full phrase bank
   * @param {string} params.language        selected language
   * @param {number} params.stars           star rating
   * @param {Object} params.clientProfile   client profile.json
   * @param {Object} params.serviceData     selected service object
   * @returns {string}  complete review text
   */
  function _buildOneReview({ phrases, language, stars, clientProfile, serviceData }) {
    // Template values for placeholder replacement
    const templateValues = {
      service: serviceData?.label || 'treatment',
      city:    clientProfile?.business?.city || 'your city',
      area:    clientProfile?.business?.area || 'your area',
    };

    // Pick a structure template
    const template = _pickTemplate(stars);
    const skipOdds = SKIP_ODDS[stars] || SKIP_ODDS[3];

    // Build sentences from template slots
    const sentences = [];

    for (const slot of template) {
      // Decide whether to skip optional slots
      if (!slot.required) {
        const skipChance = skipOdds[slot.type] || 40;
        if (Utils.odds(skipChance)) {
          Utils.log(`ReviewEngine: skipping optional slot "${slot.type}"`);
          continue;
        }
      }

      const sentence = _buildPhrase(
        slot.type,
        phrases,
        stars,
        language,
        templateValues
      );

      if (sentence) sentences.push(sentence);
    }

    // Ensure minimum length — add outro if too short
    if (sentences.length < 2) {
      const outro = _buildPhrase('outros', phrases, stars, language, templateValues);
      if (outro && !sentences.includes(outro)) sentences.push(outro);
    }

    // Join sentences into full review
    let reviewText = Utils.joinSentences(sentences);

    // ── SEO injection ───────────────────────────
    // Inject BEFORE final humanization pass
    // so humanizer can naturally clean up spacing
    reviewText = SeoInjector.inject(
      reviewText,
      phrases.seo,
      clientProfile,
      stars,
      serviceData
    );

    // ── Final humanization pass ─────────────────
    // Review-level transforms: spacing, emoji, fillers
    reviewText = Humanizer.humanizeReview(
      reviewText,
      phrases,
      language,
      stars,
      clientProfile
    );

    return Utils.clean(reviewText);
  }

  // ─────────────────────────────────────────────
  // 4. BATCH GENERATOR
  // Generates multiple unique reviews with
  // anti-spam retry logic.
  // ─────────────────────────────────────────────

  /**
   * Generate a batch of unique reviews.
   * Retries failed/duplicate reviews up to maxRetries.
   *
   * @param {Object} params
   * @param {Object} params.phrases         phrase bank
   * @param {string} params.language        selected language
   * @param {number} params.stars           star rating
   * @param {Object} params.clientProfile   client profile
   * @param {Object} params.serviceData     service object
   * @param {number} params.count           how many reviews to generate (3–5)
   * @returns {Array<string>}               array of unique review strings
   */
async function _generateBatch({ stars, clientProfile, serviceData, count }) {
    const generated = [];
    const generatedLanguages = [];
    AntiSpam.clearBatchPhrases();

    // Guaranteed language order — one of each, always
    // If count is 5: english, hinglish, hindi, mixed, hinglish (hinglish twice as most common)
    // If count is 4: english, hinglish, hindi, mixed
    // If count is 3: hinglish, hindi, english
    const languageSlots = {
      5: ['english', 'hinglish', 'hindi', 'mixed', 'hinglish'],
      4: ['english', 'hinglish', 'hindi', 'mixed'],
      3: ['hinglish', 'hindi', 'english'],
    };

    const slots = languageSlots[count] || languageSlots[5];
    const maxRetries = AntiSpam.CONFIG.maxRetries;

    for (const language of slots) {
  const slug = clientProfile?.business?.slug;  // ← add this
  const phrases = await LanguageEngine.loadPhraseBank(language, slug);

      let accepted = false;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const candidate = _buildOneReview({
          phrases, language, stars, clientProfile, serviceData
        });

        const sessionCheck = AntiSpam.validate(candidate);
        if (!sessionCheck.pass) continue;

        const batchTooSimilar = generated.some(existing =>
          Utils.similarity(candidate, existing) >= AntiSpam.CONFIG.similarityThreshold
        );
        if (batchTooSimilar) continue;

        generated.push(candidate);
        generatedLanguages.push(language);
        accepted = true;
        Utils.log(`ReviewEngine: ${language} review accepted (${generated.length}/${count})`);
        break;
      }

      if (!accepted) {
        Utils.warn(`ReviewEngine: could not generate unique ${language} review after ${maxRetries} attempts`);
      }
    }

    // Register all into session history
    generated.forEach((text, i) => {
      AntiSpam.register(text, {
        language: generatedLanguages[i],
        stars,
        service: serviceData?.id || 'unknown',
      });
    });

    Utils.log(`ReviewEngine: batch complete — ${generated.length} reviews in languages: ${generatedLanguages.join(', ')}`);
    return generated;
  }

  // ─────────────────────────────────────────────
  // 5. HOW MANY REVIEWS TO GENERATE
  // ─────────────────────────────────────────────

  /**
   * Decide how many review options to show the patient.
   * 5-star: show 5 options (more to pick from feels rewarding)
   * 4-star: show 4 options
   * 3-star: show 3 options (patient is neutral, keep it simple)
   *
   * @param {number} stars
   * @param {Object} clientProfile
   * @returns {number}
   */
  function _getReviewCount(stars, clientProfile) {
    // Client can override via profile if needed
    const override = clientProfile?.reviewStyle;
    if (override?.reviewCount) return override.reviewCount;

    if (stars >= 5) return 5;
    if (stars === 4) return 4;
    return 3;
  }

  // ─────────────────────────────────────────────
  // 6. MAIN PUBLIC ENTRY POINT
  // ─────────────────────────────────────────────

  /**
   * Generate review options for a patient.
   * This is the ONLY function app.js calls.
   *
   * @param {Object} params
   * @param {Object} params.clientProfile   full parsed profile.json
   * @param {string} params.serviceId       e.g. 'skin'
   * @param {number} params.stars           1–5 from UI
   * @returns {Promise<{
   *   reviews:  Array<string>,
   *   language: string,
   *   stars:    number,
   *   service:  Object
   * }>}
   *
   * Usage in app.js:
   *   const result = await ReviewEngine.generate({
   *     clientProfile,
   *     serviceId: 'skin',
   *     stars: 5
   *   });
   *   // result.reviews = ['Review 1...', 'Review 2...', ...]
   */
 async function generate({ clientProfile, serviceId, stars, customServiceName }) {
    Utils.log(`ReviewEngine: generating reviews — service: ${serviceId}, stars: ${stars}`);

    // ── Find service data ───────────────────────
    const services = clientProfile?.services || [];
    const serviceData = services.find(s => s.id === serviceId) || {
      id: serviceId,
      label: customServiceName || serviceId,
      keywords: [],
    };

    // ── Select language + load phrase bank ──────
const count = _getReviewCount(stars, clientProfile);
const reviews = await _generateBatch({
  stars,
  clientProfile,
  serviceData,
  count,
});

// ── Fallback: if generation produced nothing ─
if (reviews.length === 0) {
  Utils.warn('ReviewEngine: generation produced 0 reviews — using emergency fallback');
  reviews.push(_getFallbackReview(stars, 'english'));
}

return {
  reviews,
  language: 'multi',
  stars,
  service: serviceData,
};
  }

  // ─────────────────────────────────────────────
  // 7. EMERGENCY FALLBACK
  // If everything fails (empty phrase banks, etc.)
  // return a hardcoded minimal review so the UI
  // never breaks.
  // ─────────────────────────────────────────────

  /**
   * Emergency fallback review when generation fails completely.
   * @param {number} stars
   * @param {string} language
   * @returns {string}
   */
  function _getFallbackReview(stars, language) {
    const fallbacks = {
      5: {
        english:  'Very good experience at this clinic. Highly recommend.',
        hinglish: 'Bahut accha experience raha. Recommend karunga.',
        hindi:    'बहुत अच्छा अनुभव रहा। सिफारिश करूँगा।',
        mixed:    'Bahut अच्छा experience. Highly recommend.',
      },
      4: {
        english:  'Good experience overall. Would visit again.',
        hinglish: 'Accha experience raha overall. Wapas aaunga.',
        hindi:    'कुल मिलाकर अच्छा अनुभव रहा।',
        mixed:    'Overall अच्छा experience रहा।',
      },
      3: {
        english:  'Visited the clinic. Treatment is ongoing.',
        hinglish: 'Clinic visit ki. Treatment chal raha hai.',
        hindi:    'क्लिनिक में गया था। इलाज चल रहा है।',
        mixed:    'Clinic visit की। Treatment chal raha hai.',
      },
    };

    const starKey = stars >= 5 ? 5 : stars === 4 ? 4 : 3;
    return fallbacks[starKey][language] || fallbacks[starKey].english;
  }

  // ─────────────────────────────────────────────
  // 8. REGENERATE ONE
  // Lets the patient regenerate a single review
  // without affecting others in the batch.
   // ─────────────────────────────────────────────

  /**
   * Regenerate a single review to replace one the patient didn't like.
   * @param {Object} params  same as generate()
   * @returns {Promise<string>}  one new review string
   */
  async function regenerateOne({ clientProfile, serviceId, stars }) {
    const services = clientProfile?.services || [];
    const serviceData = services.find(s => s.id === serviceId) || {
      id: serviceId, label: serviceId, keywords: []
    };

    const { language, phrases } = await LanguageEngine.resolve(clientProfile);

    const maxAttempts = AntiSpam.CONFIG.maxRetries;
    for (let i = 0; i < maxAttempts; i++) {
      const candidate = _buildOneReview({
        phrases, language, stars, clientProfile, serviceData
      });
      const { pass } = AntiSpam.validate(candidate);
      if (pass) {
        AntiSpam.register(candidate, { language, stars, service: serviceData.id });
        return candidate;
      }
    }

    // Fallback
    return _getFallbackReview(stars, language);
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    generate,       // Main entry: generate review batch
    regenerateOne,  // Regenerate a single review
    TEMPLATES,      // Admin: view available templates
    TEMPLATE_WEIGHTS, // Admin: view template probability weights
    SKIP_ODDS,      // Admin: view skip probabilities
  };

})();
