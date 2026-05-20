/**
 * admin.js
 * --------
 * Agency admin panel logic.
 *
 * Features:
 *  1. Client switcher — load any client profile
 *  2. Live review preview — generate sample reviews
 *  3. Language probability editor — sliders with live total
 *  4. Service manager — view services per client
 *  5. SEO keyword viewer
 *  6. Session stats from antiSpam
 *  7. Phrase bank browser — view phrases per language/type
 *  8. Copy-to-clipboard helpers
 *
 * NOTE: Admin reads data via fetch() — must run on a server.
 * Access via: /admin/index.html (not linked from patient pages)
 *
 * Depends on: ../public/js/utils.js and all engine files
 */

const Admin = (() => {

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────

  const state = {
    currentProfile:  null,
    currentSlug:     null,
    previewReviews:  [],
    knownClients: [
      { slug: 'dr-sharma-homeo',       name: 'Dr. Sharma Homeopathic Clinic' },
      { slug: 'green-wellness-clinic', name: 'Green Wellness Clinic' },
      { slug: 'dr-verma-homeo', name: 'Dr. Verma Homeopathic Clinic' }
      // Add new clients here when you create their profile.json
    ],
  };

  // ─────────────────────────────────────────────
  // 1. BOOTSTRAP
  // ─────────────────────────────────────────────

  async function init() {
  if (!Auth.guard()) return;

  console.log('[Admin] Initialising...');

  // Restrict clinic users to their own clinic only
  const session = Auth.getSession();
  if (session && session.role === 'clinic') {
    state.knownClients = state.knownClients.filter(c => c.slug === session.slug);
  }

  _renderClientSwitcher();
    _bindGlobalEvents();

    // Auto-load first client
    if (state.knownClients.length > 0) {
      await loadClient(state.knownClients[0].slug);
    }
  }

  // ─────────────────────────────────────────────
  // 2. CLIENT SWITCHER
  // ─────────────────────────────────────────────

 function _renderClientSwitcher() {
    const sel = document.getElementById('client-select');
    if (!sel) return;

    // Clinic users only have one clinic — hide the switcher
    if (state.knownClients.length === 1) {
      sel.closest('.client-select-wrap').style.display = 'none';
    }

    sel.innerHTML = state.knownClients.map(c =>
      `<option value="${c.slug}">${c.name}</option>`
    ).join('');

    sel.addEventListener('change', () => loadClient(sel.value));
  }

  async function loadClient(slug) {
    _setStatus('Loading client profile...');

    const profile = await Utils.loadJSON(`../public/data/clients/${slug}/profile.json`);
    if (!profile) {
      _setStatus('❌ Failed to load profile. Check slug and file path.', true);
      return;
    }

    state.currentProfile = profile;
    state.currentSlug    = slug;

    _renderProfileOverview(profile);
    _renderServices(profile);
    _renderPreviewServiceDropdown(profile); 
    _renderLanguageSliders(profile);
    _renderSeoKeywords(profile);
    _renderRatingConfig(profile);
    _updateStats();
    _setStatus(`✅ Loaded: ${profile.business.name}`);

    console.log('[Admin] Profile loaded:', profile);
  }

  // ─────────────────────────────────────────────
  // 3. PROFILE OVERVIEW PANEL
  // ─────────────────────────────────────────────

  function _renderProfileOverview(profile) {
    const b = profile.business;
    const el = document.getElementById('profile-overview');
    if (!el) return;

    el.innerHTML = `
      <div class="info-row"><span class="info-label">Business</span><span class="info-val">${b.name}</span></div>
      <div class="info-row"><span class="info-label">Slug</span><code class="code-tag">${b.slug}</code></div>
      <div class="info-row"><span class="info-label">Location</span><span class="info-val">${b.area}, ${b.city}</span></div>
      <div class="info-row"><span class="info-label">Google URL</span>
        <a href="${b.googleReviewUrl}" target="_blank" class="link-tag">${b.googleReviewUrl.slice(0,40)}...</a>
      </div>
      <div class="info-row"><span class="info-label">Tone</span><span class="info-val">${profile.tone?.formality} · warmth: ${profile.tone?.warmth}</span></div>
      <div class="info-row"><span class="info-label">Emoji %</span><span class="info-val">${profile.emoji?.enabled ? profile.emoji.probability + '%' : 'Disabled'}</span></div>
      <div class="info-row"><span class="info-label">Review length</span><span class="info-val">${profile.reviewStyle?.minSentences}–${profile.reviewStyle?.maxSentences} sentences</span></div>
    `;
  }

  // ─────────────────────────────────────────────
  // 4. SERVICE PANEL
  // ─────────────────────────────────────────────

  function _renderServices(profile) {
    const el = document.getElementById('services-list');
    if (!el) return;

    el.innerHTML = (profile.services || []).map(s => `
      <div class="service-row">
        <div class="service-row-top">
          <span class="service-id-tag">${s.id}</span>
          <span class="service-name">${s.label}</span>
        </div>
        <div class="service-keywords">
          ${(s.keywords || []).map(k => `<span class="kw-tag">${k}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

function _renderPreviewServiceDropdown(profile) {
  const sel = document.getElementById('preview-service');
  if (!sel) return;

  sel.innerHTML = (profile.services || []).map(s =>
    `<option value="${s.id}">${s.label}</option>`
  ).join('');
}

  // ─────────────────────────────────────────────
  // 5. LANGUAGE PROBABILITY PANEL
  // ─────────────────────────────────────────────

  function _renderLanguageSliders(profile) {
    const container = document.getElementById('lang-sliders');
    if (!container) return;

    const probs = profile.language?.probabilities || {
      english: 25, hinglish: 40, hindi: 25, mixed: 10
    };

    const languages = ['english', 'hinglish', 'hindi', 'mixed'];
    const colors    = {
      english: '#2d9b6f', hinglish: '#e8a030',
      hindi: '#c0392b', mixed: '#8e44ad'
    };

    container.innerHTML = languages.map(lang => `
      <div class="slider-row">
        <div class="slider-header">
          <span class="slider-label" style="color:${colors[lang]}">${lang.charAt(0).toUpperCase() + lang.slice(1)}</span>
          <span class="slider-val" id="val-${lang}">${probs[lang] || 0}%</span>
        </div>
        <input
          type="range"
          min="0" max="100"
          value="${probs[lang] || 0}"
          class="lang-slider"
          data-lang="${lang}"
          style="accent-color:${colors[lang]}"
        />
      </div>
    `).join('');

    // Total indicator
    container.innerHTML += `
      <div class="total-row" id="lang-total-row">
        <span>Total:</span>
        <span id="lang-total" class="total-val">100%</span>
        <span id="lang-total-warn" class="total-warn hidden">⚠ Should equal 100</span>
      </div>
    `;

    // Bind sliders
    container.querySelectorAll('.lang-slider').forEach(slider => {
      slider.addEventListener('input', () => {
        const lang = slider.dataset.lang;
        const val  = parseInt(slider.value);
        const display = document.getElementById(`val-${lang}`);
        if (display) display.textContent = val + '%';
        _updateLangTotal();
      });
    });

    _updateLangTotal();
  }

  function _updateLangTotal() {
    const sliders = document.querySelectorAll('.lang-slider');
    let total = 0;
    sliders.forEach(s => total += parseInt(s.value));

    const totalEl = document.getElementById('lang-total');
    const warnEl  = document.getElementById('lang-total-warn');
    if (totalEl) totalEl.textContent = total + '%';
    if (warnEl)  warnEl.classList.toggle('hidden', total === 100);
    if (totalEl) totalEl.style.color = total === 100 ? '#2d9b6f' : '#e74c3c';
  }

  function _getLangProbabilitiesFromSliders() {
    const result = {};
    document.querySelectorAll('.lang-slider').forEach(s => {
      result[s.dataset.lang] = parseInt(s.value);
    });
    return result;
  }

  // ─────────────────────────────────────────────
  // 6. SEO KEYWORDS PANEL
  // ─────────────────────────────────────────────

  function _renderSeoKeywords(profile) {
    const el = document.getElementById('seo-panel');
    if (!el) return;

    const seo = profile.seo || {};

    el.innerHTML = `
      <div class="seo-group">
        <div class="seo-group-title">Local Keywords</div>
        <div class="kw-cloud">
          ${(seo.localKeywords || []).map(k => `<span class="kw-tag kw-local">${k}</span>`).join('')}
        </div>
      </div>
      <div class="seo-group">
        <div class="seo-group-title">Trust Keywords</div>
        <div class="kw-cloud">
          ${(seo.trustKeywords || []).map(k => `<span class="kw-tag kw-trust">${k}</span>`).join('')}
        </div>
      </div>
      <div class="seo-note">Max keywords per review: <strong>${seo.maxKeywordsPerReview || 2}</strong></div>
    `;
  }

  // ─────────────────────────────────────────────
  // 7. RATING CONFIG PANEL
  // ─────────────────────────────────────────────

  function _renderRatingConfig(profile) {
    const el = document.getElementById('rating-panel');
    if (!el) return;

    const rating = profile.rating || {};
    const stars  = ['5', '4', '3'];

    el.innerHTML = stars.map(s => `
      <div class="rating-row">
        <span class="star-badge">${'⭐'.repeat(parseInt(s))}</span>
        <div class="rating-details">
          <span class="rating-tone">${rating[s]?.tone || 'N/A'}</span>
          <span class="rating-meta">
            ${rating[s]?.emojiBoost ? '✨ Emoji boost' : ''}
            · ${rating[s]?.sentenceLengthBias || 'medium'} length
          </span>
        </div>
      </div>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // 8. PHRASE BANK BROWSER
  // ─────────────────────────────────────────────

  async function loadPhraseBank() {
    const lang = document.getElementById('phrase-lang-select')?.value;
    const type = document.getElementById('phrase-type-select')?.value;
    if (!lang || !type) return;

    const el = document.getElementById('phrase-browser-content');
    if (el) el.innerHTML = '<p class="loading-phrase">Loading...</p>';

    const data = await Utils.loadJSON(`../public/data/phrases/${lang}/${type}.json`);
    if (!data) {
      if (el) el.innerHTML = '<p class="error-phrase">Failed to load phrase file.</p>';
      return;
    }

    // Render phrase pools
    const starKeys = ['5star', '4star', '3star'];
    const otherKeys = Object.keys(data).filter(k =>
      !starKeys.includes(k) && k !== '_meta' && k !== 'combinations'
    );

    let html = '';

    // _meta note
    if (data._meta?.purpose) {
      html += `<div class="phrase-meta">${data._meta.purpose}</div>`;
    }

    // Star-rated pools
    starKeys.forEach(key => {
      if (!data[key]) return;
      html += `
        <div class="phrase-pool">
          <div class="pool-header">${key} <span class="pool-count">${data[key].length} phrases</span></div>
          <div class="pool-phrases">
            ${data[key].map((p, i) =>
              `<div class="phrase-item">
                <span class="phrase-num">${i+1}</span>
                <span class="phrase-text">${_escHtml(p)}</span>
              </div>`
            ).join('')}
          </div>
        </div>
      `;
    });

    // Other keys (location, credibility, etc.)
    otherKeys.forEach(key => {
      if (!Array.isArray(data[key])) return;
      html += `
        <div class="phrase-pool">
          <div class="pool-header">${key} <span class="pool-count">${data[key].length} phrases</span></div>
          <div class="pool-phrases">
            ${data[key].map((p, i) =>
              `<div class="phrase-item">
                <span class="phrase-num">${i+1}</span>
                <span class="phrase-text">${_escHtml(typeof p === 'string' ? p : JSON.stringify(p))}</span>
              </div>`
            ).join('')}
          </div>
        </div>
      `;
    });

    if (el) el.innerHTML = html || '<p class="empty-phrase">No phrase data found.</p>';
  }

  // ─────────────────────────────────────────────
  // 9. LIVE PREVIEW
  // ─────────────────────────────────────────────

  async function generatePreview() {
    if (!state.currentProfile) {
      _setStatus('Load a client first.', true);
      return;
    }

    const serviceId = document.getElementById('preview-service')?.value;
    const stars     = parseInt(document.getElementById('preview-stars')?.value);
    const el        = document.getElementById('preview-output');

    if (el) {
      el.innerHTML = `
        <div class="preview-loading">
          <div class="loading-dots"><span></span><span></span><span></span></div>
          <p>Generating preview...</p>
        </div>
      `;
    }

    // Apply slider probabilities temporarily
    const sliderProbs = _getLangProbabilitiesFromSliders();
    const totalProb = Object.values(sliderProbs).reduce((a, b) => a + b, 0);

    // Clone profile and inject slider values
    const tempProfile = JSON.parse(JSON.stringify(state.currentProfile));
    if (totalProb === 100) {
      tempProfile.language.probabilities = sliderProbs;
    }

    try {
      // Clear antiSpam session for clean preview
      AntiSpam.clearSession();
      LanguageEngine.clearCache();

      const result = await ReviewEngine.generate({
        clientProfile: tempProfile,
        serviceId:     serviceId || tempProfile.services[0]?.id,
        stars:         stars || 5,
      });

      state.previewReviews = result.reviews;

    state.previewReviews = result.reviews;
_previewIndex = 0;

const metaBar = document.getElementById('preview-meta-bar');
if (metaBar) {
  metaBar.style.display = 'block';
  metaBar.innerHTML = `Language: <strong>${result.language}</strong> · Stars: <strong>${result.stars}⭐</strong> · Service: <strong>${result.service?.label}</strong>`;
}

const nav = document.getElementById('review-nav');
if (nav) nav.style.display = 'flex';

_showReviewAtIndex(0);

      _setStatus(`✅ Generated ${result.reviews.length} preview reviews in ${result.language}`);

    } catch (err) {
      console.error('[Admin] Preview error:', err);
      if (el) el.innerHTML = '<p class="error-phrase">Generation failed. Check console.</p>';
      _setStatus('❌ Preview generation failed', true);
    }
  }

let _previewIndex = 0;

function cycleReview(dir) {
  const reviews = state.previewReviews;
  if (!reviews.length) return;
  _previewIndex = (_previewIndex + dir + reviews.length) % reviews.length;
  _showReviewAtIndex(_previewIndex);
}

function _showReviewAtIndex(i) {
  const reviews = state.previewReviews;
  const el = document.getElementById('preview-output');
  const counter = document.getElementById('review-counter');
  if (counter) counter.textContent = `${i + 1} / ${reviews.length}`;
  if (el) el.innerHTML = `
    <div class="preview-card">
      <div class="preview-num">Review ${i + 1}</div>
      <p class="preview-text">${_escHtml(reviews[i])}</p>
      <button class="copy-preview-btn" onclick="Admin.copyPreview(${i})">Copy</button>
    </div>
  `;
}

  function copyPreview(index) {
    const text = state.previewReviews[index];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      _setStatus(`✅ Review ${index + 1} copied to clipboard`);
    });
  }

  // ─────────────────────────────────────────────
  // 10. STATS PANEL
  // ─────────────────────────────────────────────

  function _updateStats() {
    const el = document.getElementById('stats-panel');
    if (!el) return;

    const stats = AntiSpam.getStats();
    const seoStats = SeoInjector.getStats();

    el.innerHTML = `
      <div class="info-row"><span class="info-label">Session reviews</span><span class="info-val">${stats.sessionCount}</span></div>
      <div class="info-row"><span class="info-label">Phrase tracker</span><span class="info-val">${stats.batchPhrasesTracked} phrases tracked</span></div>
      <div class="info-row"><span class="info-label">Similarity threshold</span><span class="info-val">${stats.similarityThreshold}</span></div>
      <div class="info-row"><span class="info-label">SEO phrases used</span><span class="info-val">${seoStats.recentPhrasesTracked}</span></div>
      <div class="info-row"><span class="info-label">Oldest session entry</span><span class="info-val">${stats.oldestEntry || 'None'}</span></div>
    `;
  }

  // ─────────────────────────────────────────────
  // 11. QR URL GENERATOR
  // ─────────────────────────────────────────────

  function generateQrUrl() {
    const baseUrl = document.getElementById('qr-base-url')?.value?.trim();
    const slug    = state.currentSlug;

    if (!baseUrl || !slug) {
      _setStatus('Enter base URL and load a client first.', true);
      return;
    }

    const fullUrl = `${baseUrl.replace(/\/$/, '')}/index.html?clinic=${slug}`;
    const out = document.getElementById('qr-url-output');
    if (out) {
      out.value = fullUrl;
      out.classList.remove('hidden');
    }

    // QR code via free API
    const qrImg = document.getElementById('qr-preview-img');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`;
      qrImg.classList.remove('hidden');
    }

    _setStatus(`✅ QR URL generated for ${slug}`);
  }

  // ─────────────────────────────────────────────
  // 12. GLOBAL EVENT BINDINGS
  // ─────────────────────────────────────────────

  function _bindGlobalEvents() {
    // Phrase browser
    document.getElementById('load-phrases-btn')
      ?.addEventListener('click', loadPhraseBank);

    // Preview
    document.getElementById('generate-preview-btn')
      ?.addEventListener('click', generatePreview);

    // QR generator
    document.getElementById('generate-qr-btn')
      ?.addEventListener('click', generateQrUrl);

    // Copy QR URL
    document.getElementById('copy-qr-url-btn')
      ?.addEventListener('click', () => {
        const url = document.getElementById('qr-url-output')?.value;
        if (url) navigator.clipboard.writeText(url)
          .then(() => _setStatus('✅ URL copied'));
      });

    // Clear session
    document.getElementById('clear-session-btn')
      ?.addEventListener('click', () => {
        AntiSpam.clearSession();
        SeoInjector.clearHistory();
        LanguageEngine.clearCache();
        _updateStats();
        _setStatus('✅ Session cleared');
      });

    // Reload stats
    document.getElementById('refresh-stats-btn')
      ?.addEventListener('click', () => {
        _updateStats();
        _setStatus('Stats refreshed');
      });
  }

  // ─────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────

  function _setStatus(msg, isError = false) {
    const el = document.getElementById('status-bar');
    if (!el) return;
    el.textContent = msg;
    el.style.background = isError ? '#fdecea' : '#eafaf1';
    el.style.color      = isError ? '#c0392b' : '#1a6b4a';
    el.style.borderColor = isError ? '#f5c6cb' : '#a9dfbf';
  }

  function _escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

return {
  init,
  loadClient,
  generatePreview,
  copyPreview,
  cycleReview,   
  generateQrUrl,
  loadPhraseBank,
};

})();

// Boot
document.addEventListener('DOMContentLoaded', () => Admin.init());
