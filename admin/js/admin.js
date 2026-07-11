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
const SUPABASE_URL = 'https://xpebzkecofenaygukhsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWJ6a2Vjb2ZlbmF5Z3VraHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTE2MDMsImV4cCI6MjA5NDg2NzYwM30.r-GSpPhRrIUTosBRZ0gQF0TtYPl5Uu93A7QPogiQbEA';

const Admin = (() => {

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────

  const state = {
    currentProfile:  null,
    currentSlug:     null,
    previewReviews:  [],
    knownClients: [
      { slug: 'saluja-dento-max', name: 'Saluja Dento Max Fac Centre' },
      { slug: 'dr-sharma-homeo', name: 'Dr. Sharma Homeopathic Clinic' },
      { slug: 'green-wellness-clinic', name: 'Green Wellness Clinic' },
      { slug: 'dr-verma-homeo', name: 'Dr. Verma Multispeciality Homeopathy' },
      { slug: '32-pearls-dental-world', name: '32 Pearls Dental World Clinic and Facial Aesthetic Center' },
      { slug: 'brite-smile-dental-care', name: 'Brite Smile Dental Care' },
      // Add new clients here when you create their profile.json
    ],
  };

  // ─────────────────────────────────────────────
  // 1. BOOTSTRAP
  // ─────────────────────────────────────────────

async function init() {
  if (!Auth.guard()) return;

  console.log('[Admin] Initialising...');

  const session = Auth.getSession();

  // Restrict clinic users to their own clinic only
  if (session && session.role === 'clinic') {
    state.knownClients = state.knownClients.filter(c => c.slug === session.slug);
  }

  _renderClientSwitcher();

  // Show/hide nav items based on role
  if (session?.role === 'superadmin') {
    document.querySelectorAll('.superadmin-only').forEach(el => {
      el.style.display = '';
    });
  }

  // Show correct guide based on role
  const guideDesc = document.getElementById('guide-desc');
  const guideClinic = document.getElementById('guide-clinic');
  const guideSuperadmin = document.getElementById('guide-superadmin');
  if (session?.role === 'superadmin') {
    if (guideDesc) guideDesc.textContent = 'Full agency operator reference.';
    if (guideSuperadmin) guideSuperadmin.style.display = 'block';
  } else {
    if (guideDesc) guideDesc.textContent = 'Everything you need to manage your clinic reviews.';
    if (guideClinic) guideClinic.style.display = 'block';
  }

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
    checkFeedbackBadge();

    // Update account section
    const logoEl = document.getElementById('account-logo');
    const nameEl = document.getElementById('account-clinic-name');
    const slugEl = document.getElementById('account-clinic-slug');
    if (logoEl) logoEl.src = profile.business.logoUrl || '';
    if (nameEl) nameEl.textContent = profile.business.name || '';
    if (slugEl) slugEl.textContent = profile.business.slug || '';

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

  function render() {
    const services = state.currentProfile.services || [];
    el.innerHTML = services.map((s, i) => `
      <div class="service-row" id="svc-row-${i}">
        <div class="service-row-top">
          <input
            class="admin-input svc-id-input"
            value="${_escHtml(s.id)}"
            placeholder="service-id"
            data-index="${i}"
            data-field="id"
            style="width:120px; font-family:'JetBrains Mono',monospace; font-size:12px;"
          />
          <input
            class="admin-input svc-label-input"
            value="${_escHtml(s.label)}"
            placeholder="Service Name"
            data-index="${i}"
            data-field="label"
            style="flex:1;"
          />
          <button class="admin-btn-red" onclick="Admin.deleteService(${i})" style="padding:5px 10px; font-size:12px;">✕</button>
        </div>
        <div style="margin-top:8px;">
          <div style="font-size:11px; font-weight:700; color:#7a9a87; margin-bottom:5px; text-transform:uppercase; letter-spacing:0.05em;">Keywords</div>
          <div class="kw-edit-list" id="kw-list-${i}">
            ${(s.keywords || []).map((k, ki) => `
              <div class="kw-edit-row" style="display:flex; gap:6px; margin-bottom:6px;">
                <input
                  class="admin-input kw-input"
                  value="${_escHtml(k)}"
                  data-svc="${i}"
                  data-kw="${ki}"
                  style="flex:1; font-size:12px;"
                />
                <button class="admin-btn-red" onclick="Admin.deleteKeyword(${i},${ki})" style="padding:4px 8px; font-size:11px;">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="admin-btn-outline" onclick="Admin.addKeyword(${i})" style="font-size:11px; padding:4px 12px; margin-top:4px;">+ Add Keyword</button>
        </div>
      </div>
    `).join('');

    // Bind input changes live into state
    el.querySelectorAll('.svc-id-input, .svc-label-input').forEach(input => {
      input.addEventListener('input', () => {
        const idx   = parseInt(input.dataset.index);
        const field = input.dataset.field;
        state.currentProfile.services[idx][field] = input.value;
      });
    });

    el.querySelectorAll('.kw-input').forEach(input => {
      input.addEventListener('input', () => {
        const si = parseInt(input.dataset.svc);
        const ki = parseInt(input.dataset.kw);
        state.currentProfile.services[si].keywords[ki] = input.value;
      });
    });
  }

  render();
  // Store render fn so add/delete can call it
  el._rerender = render;
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

  async function saveLanguageProbabilities() {
  const sliders = _getLangProbabilitiesFromSliders();
  const total   = Object.values(sliders).reduce((a, b) => a + b, 0);

  if (total !== 100) {
    _setStatus('❌ Total must equal 100% before saving.', true);
    return;
  }

  const session = Auth.getSession();
  if (!session?.githubToken) {
    _setStatus('❌ No GitHub token found. Contact admin.', true);
    return;
  }

  const slug   = state.currentSlug;
  const repo   = 'mrradhey18/Smart-Review-System';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/public/data/clients/${slug}/profile.json`;

  const btn = document.querySelector('[onclick="Admin.saveLanguageProbabilities()"]');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Saving...'; }

  try {
    const getRes = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${session.githubToken}`, 'Accept': 'application/vnd.github+json' }
    });

    let sha = null;
    let profileToSave = state.currentProfile;

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      profileToSave = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/[\r\n]/g, '')))));
    } else if (getRes.status !== 404) {
      throw new Error(`Fetch failed: ${getRes.status}`);
    }

    // Apply slider changes
    if (!profileToSave.language) profileToSave.language = {};
    profileToSave.language.probabilities = sliders;

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(profileToSave, null, 2))));

    const body = { message: `Update language for ${slug}`, content: encoded };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }

    // Update in-memory profile too
    if (!state.currentProfile.language) state.currentProfile.language = {};
    state.currentProfile.language.probabilities = sliders;
    LanguageEngine.clearCache();

    if (btn) btn.innerHTML = '✅ Saved!';
    setTimeout(() => { if (btn) { btn.innerHTML = originalText; btn.disabled = false; } }, 2000);

  } catch (err) {
    console.error('[Admin] Save failed:', err);
    if (btn) btn.innerHTML = '❌ Failed';
    setTimeout(() => { if (btn) { btn.innerHTML = originalText; btn.disabled = false; } }, 2000);
  }
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

  function addService() {
  state.currentProfile.services.push({
    id: 'new-service',
    label: 'New Service',
    keywords: []
  });
  document.getElementById('services-list')._rerender();
}

function deleteService(index) {
  state.currentProfile.services.splice(index, 1);
  document.getElementById('services-list')._rerender();
}

function addKeyword(serviceIndex) {
  state.currentProfile.services[serviceIndex].keywords.push('');
  document.getElementById('services-list')._rerender();
}

function deleteKeyword(serviceIndex, kwIndex) {
  state.currentProfile.services[serviceIndex].keywords.splice(kwIndex, 1);
  document.getElementById('services-list')._rerender();
}

async function saveServices() {
  const btn = document.querySelector('[onclick="Admin.saveServices()"]');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Saving...'; }

  const session = Auth.getSession();
  if (!session?.githubToken) {
    if (btn) { btn.innerHTML = '❌ No Token'; btn.disabled = false; }
    return;
  }

  const slug   = state.currentSlug;
  const repo   = 'mrradhey18/Smart-Review-System';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/public/data/clients/${slug}/profile.json`;

  try {
    const getRes = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${session.githubToken}`, 'Accept': 'application/vnd.github+json' }
    });

    let sha = null;
    let profileToSave = JSON.parse(JSON.stringify(state.currentProfile));

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const githubProfile = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/[\r\n]/g, '')))));
      // Apply local services on top of GitHub version
      githubProfile.services = state.currentProfile.services;
      profileToSave = githubProfile;
    } else if (getRes.status !== 404) {
      throw new Error(`Fetch failed: ${getRes.status}`);
    }

    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(profileToSave, null, 2))));
    const body = { message: `Update services for ${slug}`, content: encoded };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }

    if (btn) btn.innerHTML = '✅ Saved!';
    setTimeout(() => { if (btn) { btn.innerHTML = originalText; btn.disabled = false; } }, 2000);

  } catch (err) {
    console.error('[Admin] Save services failed:', err);
    if (btn) btn.innerHTML = '❌ Failed';
    setTimeout(() => { if (btn) { btn.innerHTML = originalText; btn.disabled = false; } }, 2000);
  }
}

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

async function changeCredentials() {
  const session = Auth.getSession();
  const currentPass = document.getElementById('current-password')?.value;
  const newPass = document.getElementById('new-password')?.value;
  const confirmPass = document.getElementById('confirm-password')?.value;
  const msg = document.getElementById('account-msg');

  if (!currentPass || !newPass || !confirmPass) {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  if (newPass !== confirmPass) {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = 'New passwords do not match.';
    return;
  }

  if (newPass.length < 6) {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = 'Password must be at least 6 characters.';
    return;
  }

  // Verify current password
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clinic_users?username=eq.${session.username}&password=eq.${encodeURIComponent(currentPass)}&select=username`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const verifyData = await verifyRes.json();
  if (!verifyData?.[0]) {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = 'Current password is incorrect.';
    return;
  }

  // Update password
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clinic_users?username=eq.${session.username}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ password: newPass })
    }
  );

  if (updateRes.ok) {
    msg.style.display = 'block';
    msg.style.color = '#6366f1';
    msg.textContent = '✅ Password updated! Logging out...';
    setTimeout(() => Auth.logout(), 2000);
  } else {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = '❌ Update failed. Try again.';
  }
}

function openAccountSettings() {
  const session = Auth.getSession();
  const newUsernameEl = document.getElementById('new-username');
  if (newUsernameEl && session?.username) {
    newUsernameEl.value = session.username;
  }
  showSection('account');
}

async function loadFeedback() {
  const slug = state.currentSlug;
  const el = document.getElementById('feedback-list');
  if (!el) return;

  el.innerHTML = '<p style="color:#7a9a87;">Loading...</p>';

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/feedback?clinic_slug=eq.${slug}&order=created_at.desc`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );

    const data = await res.json();

    if (!data.length) {
      el.innerHTML = '<p style="color:#7a9a87; text-align:center; padding:24px;">No feedback yet.</p>';
      return;
    }

    el.innerHTML = data.map(f => `
      <div id="fb-${f.id}" style="
        padding: 16px;
        margin-bottom: 12px;
        background: ${f.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.08)'};
        border: 1px solid ${f.is_read ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.3)'};
        border-radius: 12px;
        transition: all 0.3s;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            ${!f.is_read ? '<span style="width:8px;height:8px;border-radius:50%;background:#6366f1;display:inline-block;flex-shrink:0;"></span>' : ''}
            <span style="font-size:11px; color:rgba(255,255,255,0.4);">${new Date(f.created_at).toLocaleString()}</span>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            ${!f.is_read ? `
              <button onclick="Admin.markFeedbackRead('${f.id}')" style="
                background:rgba(99,102,241,0.15); color:#818cf8;
                border:1px solid rgba(99,102,241,0.3); border-radius:8px;
                padding:4px 10px; font-size:11px; font-weight:700;
                cursor:pointer; font-family:'Sora',sans-serif;
              ">Mark Read</button>
            ` : '<span style="font-size:11px;color:rgba(255,255,255,0.25);font-weight:600;">Read</span>'}
            <button onclick="Admin.deleteFeedback('${f.id}')" style="
              background:rgba(239,68,68,0.1); color:#ef4444;
              border:1px solid rgba(239,68,68,0.2); border-radius:8px;
              padding:4px 10px; font-size:11px; font-weight:700;
              cursor:pointer; font-family:'Sora',sans-serif;
            ">Delete</button>
          </div>
        </div>
        <p style="font-size:14px; color:${f.is_read ? 'rgba(255,255,255,0.6)' : '#fff'}; margin:0; line-height:1.6;">${f.feedback}</p>
      </div>
    `).join('');

    // Clear badge
    const badge = document.getElementById('feedback-badge');
    if (badge) badge.style.display = 'none';
    localStorage.setItem(`feedback_seen_${slug}`, new Date().toISOString());

  } catch (err) {
    el.innerHTML = '<p style="color:#ef4444;">Failed to load feedback.</p>';
  }
}

async function markFeedbackRead(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ is_read: true })
  });
  loadFeedback();
}

async function deleteFeedback(id) {
  if (!confirm('Delete this feedback?')) return;
  await fetch(`${SUPABASE_URL}/rest/v1/feedback?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const el = document.getElementById(`fb-${id}`);
  if (el) el.remove();
}

async function checkFeedbackBadge() {
  const slug = state.currentSlug;
  if (!slug) return;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/feedback?clinic_slug=eq.${slug}&is_read=eq.false&select=id`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    const badge = document.getElementById('feedback-badge');
    if (badge) {
      if (data.length > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = data.length > 9 ? '9+' : data.length;
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.warn('Badge check failed:', err);
  }
}

return {
  init,
  loadClient,
  state,
  generatePreview,
  copyPreview,
  cycleReview,
  generateQrUrl,
  loadPhraseBank,
  saveLanguageProbabilities,
  saveServices,        // ← add
  addService,          // ← add
  deleteService,       // ← add
  addKeyword,          // ← add
  deleteKeyword,       // ← add
  changeCredentials,
  openAccountSettings,
  loadFeedback,
  checkFeedbackBadge,
  markFeedbackRead,
deleteFeedback
};

})();

// Boot
document.addEventListener('DOMContentLoaded', () => Admin.init());
