/**
 * app.js
 * ------
 * Main application entry point.
 *
 * Responsibilities:
 *  1. Read clinic slug from QR URL parameter
 *  2. Load client profile JSON
 *  3. Orchestrate screen flow (service → stars → reviews)
 *  4. Connect UI layer with engine layer
 *  5. Handle single review regeneration
 *
 * Depends on: utils.js, ui.js, reviewEngine.js,
 *             languageEngine.js, antiSpam.js,
 *             humanizer.js, seoInjector.js
 *
 * Load order in index.html:
 *   utils.js → languageEngine.js → antiSpam.js →
 *   humanizer.js → seoInjector.js → reviewEngine.js →
 *   ui.js → app.js  (always last)
 */

const App = (() => {

  // ─────────────────────────────────────────────
  // APP STATE
  // Minimal state — only what needs to persist
  // across screen transitions.
  // ─────────────────────────────────────────────

  const state = {
    profile:      null,   // Loaded client profile.json
    serviceId:    null,   // Selected service ID
    serviceName:  null,   // Selected service label
    stars:        null,   // Selected star rating
    reviews:      [],     // Generated review strings
    language:     null,   // Selected language (set by engine)
    googleUrl:    null,   // Client's Google review URL
  };

  // ─────────────────────────────────────────────
  // 1. BOOTSTRAP
  // ─────────────────────────────────────────────

  /**
   * App entry point. Called on DOMContentLoaded.
   * Reads QR param, loads profile, starts UI.
   */
  async function init() {
    Utils.log('App: initialising...');

    // Read clinic slug from URL: ?clinic=dr-sharma-homeo
    const slug = Utils.getParam('clinic');

    if (!slug) {
      Utils.warn('App: no clinic param in URL');
      UI.showClinicNotFound();
      return;
    }

    // Load client profile
    const profile = await Utils.loadJSON(`../public/data/clients/${slug}/profile.json?v=${Date.now()}`);

    if (!profile) {
      Utils.warn(`App: profile not found for slug "${slug}"`);
      UI.showClinicNotFound();
      return;
    }

    // Store in state
    state.profile   = profile;
    state.googleUrl = profile.business.googleReviewUrl;

    // Render clinic identity across all screens
    UI.renderClinicHeader(profile);

    // Wire back button
    UI.wireBackButtons(() => {
      // Back from star screen → go back to service screen
      UI.showScreen('screen-service');
    });

    // Pre-warm language phrase cache in background
    // (patient is reading service buttons while this loads)
    LanguageEngine.preloadAll().catch(() => {
      Utils.warn('App: preload failed — will load on demand');
    });

    // Render service selection
    _startServiceScreen();

    Utils.log('App: ready');
  }

  // ─────────────────────────────────────────────
  // 2. SCREEN 1 — SERVICE SELECTION
  // ─────────────────────────────────────────────

  function _startServiceScreen() {
    UI.renderServiceScreen(
      state.profile.services,
      (serviceId) => _onServiceSelected(serviceId)
    );
    UI.showScreen('screen-service');
  }

  /**
   * Called when patient taps a service button.
   * @param {string} serviceId
   */
function _onServiceSelected(serviceId) {
    let serviceName;

    if (serviceId.startsWith('custom_')) {
      // Custom typed service
      serviceName = serviceId.replace('custom_', '');
      state.serviceId = 'general'; // fallback to general for phrase matching
      state.serviceName = serviceName;
    } else {
      const service = state.profile.services.find(s => s.id === serviceId);
      state.serviceId   = serviceId;
      state.serviceName = service?.label || serviceId;
      serviceName = state.serviceName;
    }

    Utils.log(`App: service selected → ${state.serviceId} (${state.serviceName})`);
    UI.renderStarScreen(state.serviceName, (stars) => _onStarsSelected(stars));
    UI.showScreen('screen-stars');
  }

  // ─────────────────────────────────────────────
  // 3. SCREEN 2 — STAR RATING
  // ─────────────────────────────────────────────

  /**
   * Called when patient taps a star.
   * @param {number} stars  1–5
   */
  async function _onStarsSelected(stars) {
    state.stars = stars;
    Utils.log(`App: stars selected → ${stars}`);

    // Move to review screen immediately
    UI.showScreen('screen-reviews');
    UI.showReviewLoading();

    // Generate reviews
    await _generateAndRenderReviews();
  }

  // ─────────────────────────────────────────────
  // 4. SCREEN 3 — REVIEW OPTIONS
  // ─────────────────────────────────────────────

  /**
   * Generate reviews and render them.
   */
  async function _generateAndRenderReviews() {
    try {
      const result = await ReviewEngine.generate({
        clientProfile: state.profile,
        serviceId:     state.serviceId,
        stars:         state.stars,
      });

      state.reviews  = result.reviews;
      state.language = result.language;

      Utils.log(`App: ${result.reviews.length} reviews generated in ${result.language}`);

      UI.renderReviewOptions(
        result.reviews,
        state.googleUrl,
        (index, card) => _onRegenerate(index, card)
      );

    } catch (err) {
      Utils.warn('App: review generation failed', err);
      UI.showError('Could not generate reviews. Please try again.');
    }
  }

  // ─────────────────────────────────────────────
  // 5. SINGLE REVIEW REGENERATION
  // ─────────────────────────────────────────────

  /**
   * Regenerate one review card without touching the others.
   * Called when patient taps the refresh icon on a card.
   *
   * @param {number}      index  card index in the list
   * @param {HTMLElement} card   the card DOM element to update
   */
  async function _onRegenerate(index, card) {
    Utils.log(`App: regenerating review at index ${index}`);

    // Show loading on just this card
    const textEl = card.querySelector('.review-text');
    if (textEl) {
      textEl.style.opacity = '0.4';
      textEl.textContent = 'Generating...';
    }

    try {
      const newReview = await ReviewEngine.regenerateOne({
        clientProfile: state.profile,
        serviceId:     state.serviceId,
        stars:         state.stars,
      });

      // Update state
      state.reviews[index] = newReview;

      // Update card
      UI.replaceReviewCard(card, newReview);

      if (textEl) textEl.style.opacity = '1';

    } catch (err) {
      Utils.warn('App: single regeneration failed', err);
      if (textEl) {
        textEl.style.opacity = '1';
        textEl.textContent = state.reviews[index]; // Restore original
      }
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    init,
    state, // Exposed for admin/debug access
  };

})();

// ─────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
