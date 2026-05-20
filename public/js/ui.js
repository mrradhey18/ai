/**
 * ui.js
 * -----
 * Handles all screen rendering and DOM interactions.
 * Pure presentation layer — no business logic here.
 *
 * Screens:
 *  Screen 1: Service selection
 *  Screen 2: Star rating
 *  Screen 3: Review options (copy + redirect)
 *
 * Depends on: utils.js
 * Used by:    app.js
 */

const UI = (() => {

  // ─────────────────────────────────────────────
  // DOM REFERENCES
  // ─────────────────────────────────────────────

  const $ = id => document.getElementById(id);

  // ─────────────────────────────────────────────
  // 1. SCREEN MANAGER
  // ─────────────────────────────────────────────

  /**
   * Show a screen by ID, hide all others.
   * @param {string} screenId
   */
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('screen-active');
    });
    const target = $(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('screen-active');
      // Scroll to top on screen change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ─────────────────────────────────────────────
  // 2. CLINIC HEADER
  // Renders clinic name + tagline at top
  // ─────────────────────────────────────────────

  /**
   * Render clinic identity into all header slots.
   * @param {Object} profile  client profile.json
   */
function renderClinicHeader(profile) {
  const name     = profile?.business?.name     || 'Our Clinic';
  const tagline  = profile?.business?.tagline  || 'Thank you for visiting';
  const area     = profile?.business?.area     || '';
  const city     = profile?.business?.city     || '';
  const location = [area, city].filter(Boolean).join(', ');
  const logoUrl  = profile?.business?.logoUrl  || '';

  document.querySelectorAll('.clinic-name').forEach(el => { el.textContent = name; });
  document.querySelectorAll('.clinic-tagline').forEach(el => { el.textContent = tagline; });
  document.querySelectorAll('.clinic-location').forEach(el => { el.textContent = location; });

  const leafEl = document.querySelector('.header-leaf');
  if (leafEl) {
    if (logoUrl) {
      leafEl.innerHTML = `<img src="${logoUrl}" alt="logo" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.4);">`;
    } else {
      leafEl.textContent = '🌿';
    }
  }

  document.title = `Review ${name}`;
}

  // ─────────────────────────────────────────────
  // 3. SCREEN 1 — SERVICE SELECTION
  // ─────────────────────────────────────────────

  /**
   * Render service selection buttons.
   * @param {Array}    services    from profile.services
   * @param {Function} onSelect    callback(serviceId)
   */
function renderServiceScreen(services, onSelect) {
    const grid = $('service-grid');
    if (!grid) return;

    grid.innerHTML = '';

    services.forEach(service => {
      const btn = document.createElement('button');
      btn.className = 'service-btn';
      btn.dataset.id = service.id;
      btn.innerHTML = `<span class="service-label">${service.label}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.service-btn').forEach(b =>
          b.classList.remove('selected')
        );
        btn.classList.add('selected');
        setTimeout(() => onSelect(service.id), 180);
      });
      grid.appendChild(btn);
    });

    // Custom service input row
    const customRow = document.createElement('div');
    customRow.className = 'custom-service-row';
    customRow.innerHTML = `
      <input
        type="text"
        id="custom-service-input"
        class="custom-service-input"
        placeholder="Other — type your treatment..."
        maxlength="60"
      />
      <button class="custom-service-btn" id="custom-service-submit">→</button>
    `;
    grid.appendChild(customRow);

    // Wire custom service submit
    const submitCustom = () => {
      const val = document.getElementById('custom-service-input')?.value?.trim();
      if (!val) return;
      // Deselect all service buttons
      document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('selected'));
      onSelect('custom_' + val);
    };

    document.getElementById('custom-service-submit')
      ?.addEventListener('click', submitCustom);

    document.getElementById('custom-service-input')
      ?.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitCustom();
      });
  }

  /**
   * Map service IDs to emoji icons.
   * @param {string} id
   * @returns {string} emoji
   */
  function _getServiceIcon(id) {
    const icons = {
      skin:     '✨',
      hair:     '💆',
      general:  '🩺',
      child:    '👶',
      chronic:  '🌿',
      stress:   '🧘',
      weight:   '⚖️',
      diabetes: '💉',
      joint:    '🦴',
      default:  '🏥',
    };
    return icons[id] || icons.default;
  }

  // ─────────────────────────────────────────────
  // 4. SCREEN 2 — STAR RATING
  // ─────────────────────────────────────────────

  /**
   * Render star rating screen.
   * @param {string}   serviceName  displayed in subtitle
   * @param {Function} onRate       callback(stars: number)
   */
  function renderStarScreen(serviceName, onRate) {
    // Update service label in subtitle
    const sub = $('star-service-label');
    if (sub) sub.textContent = serviceName;

    // Wire up star buttons
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
      // Remove old listeners by cloning
      const newStar = star.cloneNode(true);
      star.parentNode.replaceChild(newStar, star);
    });

    // Re-query after clone
    const freshStars = document.querySelectorAll('.star-btn');
    freshStars.forEach(star => {
      star.addEventListener('mouseenter', () => _highlightStars(star.dataset.value));
      star.addEventListener('mouseleave', () => _clearStarHighlight());
      star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
        _highlightStars(value, true);
  const toast = document.getElementById('sorry-toast');
        if (toast) toast.remove();
        if (value <= 2) {
          setTimeout(() => _showSorryToast(), 250);
        } else {
          setTimeout(() => onRate(value), 250);
        }
      });
    });
  }

  /**
   * Highlight stars up to a given value.
   * @param {number|string} value
   * @param {boolean} lock  if true, add 'selected' class
   */
  function _highlightStars(value, lock = false) {
    const stars = document.querySelectorAll('.star-btn');
    stars.forEach(star => {
      const v = parseInt(star.dataset.value);
      if (v <= parseInt(value)) {
        star.classList.add('hovered');
        if (lock) star.classList.add('selected');
      } else {
        star.classList.remove('hovered');
        if (lock) star.classList.remove('selected');
      }
    });
  }

  function _clearStarHighlight() {
    document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('hovered'));
  }

  // ─────────────────────────────────────────────
  // 5. SCREEN 3 — REVIEW OPTIONS
  // ─────────────────────────────────────────────

  /**
   * Render the loading state while reviews generate.
   */
  function showReviewLoading() {
    const list = $('review-list');
    if (!list) return;
    list.innerHTML = `
      <div class="loading-state">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
        <p class="loading-text">Preparing your reviews...</p>
      </div>
    `;
  }

  /**
   * Render generated review options.
   * @param {Array<string>} reviews       review text array
   * @param {string}        googleUrl     client's Google review URL
   * @param {Function}      onRegenerate  callback(index) for single refresh
   */
  function renderReviewOptions(reviews, googleUrl, onRegenerate) {
    const list = $('review-list');
    if (!list) return;

    list.innerHTML = '';
  list.dataset.googleUrl = googleUrl;

    reviews.forEach((text, index) => {
      const card = _buildReviewCard(text, index, googleUrl, onRegenerate);
      list.appendChild(card);

      // Stagger animation
      setTimeout(() => card.classList.add('card-visible'), index * 80);
    });

    // Wire up main CTA button
    const cta = $('google-cta-btn');
    if (cta) {
      const newCta = cta.cloneNode(true);
      cta.parentNode.replaceChild(newCta, cta);
      $('google-cta-btn').addEventListener('click', () => {
        window.open(googleUrl, '_blank');
      });
    }
  }

  /**
   * Build a single review card element.
   * @param {string}   text
   * @param {number}   index
   * @param {string}   googleUrl
   * @param {Function} onRegenerate
   * @returns {HTMLElement}
   */
  function _buildReviewCard(text, index, googleUrl, onRegenerate) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.dataset.index = index;

    card.innerHTML = `
      <div class="review-number">Option ${index + 1}</div>
      <p class="review-text">${_escapeHtml(text)}</p>
      <div class="review-actions">
        <button class="copy-btn" data-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        </button>
        <button class="refresh-btn" data-index="${index}" title="Get different review">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>
      <div class="copy-confirm hidden">✓ Copied!</div>
    `;

  // Tap anywhere on card OR copy button
    card.addEventListener('click', () => {
      _copyText(text, card, googleUrl);
    });

    // Refresh button
    card.querySelector('.refresh-btn').addEventListener('click', () => {
      if (onRegenerate) onRegenerate(index, card);
    });

    return card;
  }

  /**
   * Copy text to clipboard and show confirmation.
   * @param {string}      text
   * @param {HTMLElement} card
   */
  async function _copyText(text, card, googleUrl) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    // Visual confirm
 // Visual confirm
    const confirm = card.querySelector('.copy-confirm');
    const copyBtn = card.querySelector('.copy-btn');

    card.classList.add('copied');
    if (confirm) confirm.classList.remove('hidden');
    if (copyBtn) copyBtn.textContent = '✓ Copied';

    setTimeout(() => {
      window.open(googleUrl || card.closest('#review-list').dataset.googleUrl, '_blank');
    }, 600);

    setTimeout(() => {
      card.classList.remove('copied');
      if (confirm) confirm.classList.add('hidden');
      if (copyBtn) {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy`;
      }
    }, 2000);
  }

  /**
   * Replace a single review card with a loading state,
   * then swap in new content.
   * @param {HTMLElement} card
   * @param {string}      newText
   */
  function replaceReviewCard(card, newText) {
    card.classList.add('refreshing');
    setTimeout(() => {
      const textEl = card.querySelector('.review-text');
      if (textEl) textEl.textContent = newText;
      card.classList.remove('refreshing');
      card.classList.add('card-refreshed');
      setTimeout(() => card.classList.remove('card-refreshed'), 600);
    }, 400);
  }

  // ─────────────────────────────────────────────
  // 6. ERROR STATE
  // ─────────────────────────────────────────────

  /**
   * Show an error message on screen.
   * @param {string} message
   */
  function showError(message) {
    const list = $('review-list');
    if (!list) return;
    list.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">${message || 'Something went wrong. Please try again.'}</p>
        <button class="retry-btn" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  /**
   * Show clinic not found error.
   */
  function showClinicNotFound() {
    document.body.innerHTML = `
      <div class="not-found-screen">
        <div class="not-found-content">
          <div class="not-found-icon">🏥</div>
          <h1>Clinic not found</h1>
          <p>This review link may be invalid or expired.</p>
          <p class="not-found-sub">Please contact the clinic for the correct link.</p>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // 7. NAVIGATION HELPERS
  // ─────────────────────────────────────────────

  /**
   * Wire up back button on star screen to go back to service selection.
   * @param {Function} onBack
   */
  function wireBackButtons(onBack) {
    document.querySelectorAll('.back-btn').forEach(btn => {
      btn.addEventListener('click', onBack);
    });
  }

  // ─────────────────────────────────────────────
  // 8. UTILITIES
  // ─────────────────────────────────────────────

  function _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────
function _showPrivateFeedback() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  
  let feedbackScreen = document.getElementById('screen-feedback');
  if (!feedbackScreen) {
    feedbackScreen = document.createElement('section');
    feedbackScreen.id = 'screen-feedback';
    feedbackScreen.className = 'screen';
    feedbackScreen.innerHTML = `
      <h2 class="section-title">We're sorry to hear that 😔</h2>
      <p class="section-sub">Your feedback helps us improve. Please share what went wrong — we'll look into it personally.</p>
      <textarea id="private-feedback-text" placeholder="Tell us what could have been better..." style="
        width:100%; min-height:140px; padding:14px;
        background:#1e293b; color:#f1f5f9;
        border:2px solid #334155; border-radius:14px;
        font-size:14px; font-family:'Nunito',sans-serif;
        outline:none; resize:none; line-height:1.6;
      "></textarea>
      <button id="send-feedback-btn" style="
        margin-top:16px; width:100%; padding:14px;
        background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:#fff; border:none; border-radius:12px;
        font-size:15px; font-weight:700;
        font-family:'Sora',sans-serif; cursor:pointer;
      ">Send Private Feedback</button>
      <p id="feedback-sent-msg" style="
        display:none; text-align:center; margin-top:16px;
        color:#6366f1; font-weight:700; font-size:15px;
      ">✓ Thank you! We'll work on it.</p>
    `;
    document.querySelector('.app-shell').appendChild(feedbackScreen);

    document.getElementById('send-feedback-btn').addEventListener('click', () => {
      const txt = document.getElementById('private-feedback-text').value.trim();
      if (!txt) return;
      document.getElementById('send-feedback-btn').style.display = 'none';
      document.getElementById('feedback-sent-msg').style.display = 'block';
    });
  }

  feedbackScreen.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _showSorryToast() {
  // Remove existing toast if any
  const existing = document.getElementById('sorry-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'sorry-toast';
  toast.innerHTML = `
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#f1f5f9;line-height:1.5;">
      😔 We're sorry our services didn't meet your expectations.
    </p>
    <button id="share-private-btn" style="
      width:100%;padding:13px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6);
      color:#fff;border:none;border-radius:12px;
      font-size:14px;font-weight:700;
      font-family:'Sora',sans-serif;cursor:pointer;
    ">Share Privately</button>
  `;
  toast.style.cssText = `
    position:fixed;bottom:0;left:50%;
    transform:translateX(-50%) translateY(100%);
    width:100%;max-width:480px;
    background:#1e293b;
    border-top:2px solid #6366f1;
    border-radius:20px 20px 0 0;
    padding:20px 20px 32px;
    box-shadow:0 -8px 32px rgba(99,102,241,0.25);
    z-index:999;
    transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  `;

  document.body.appendChild(toast);

  // Slide up
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  document.getElementById('share-private-btn').addEventListener('click', () => {
    toast.remove();
    _showPrivateFeedback();
  });
}

  return {
    showScreen,
    renderClinicHeader,
    renderServiceScreen,
    renderStarScreen,
    showReviewLoading,
    renderReviewOptions,
    replaceReviewCard,
    showError,
    showClinicNotFound,
    wireBackButtons,
    _showPrivateFeedback,
    _showSorryToast,
  };

})();


