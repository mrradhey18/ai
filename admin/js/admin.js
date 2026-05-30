<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Review System — Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
 :root {
  --green-deep:   #0a0e1a;
  --green-mid:    #6366f1;
  --green-light:  rgba(99,102,241,0.15);
  --green-pale:   rgba(99,102,241,0.08);
  --gold:         #f59e0b;
  --sidebar-w:    270px;
  --header-h:     64px;
  --glass:        rgba(255,255,255,0.04);
  --glass-border: rgba(99,102,241,0.20);
  --text-primary: #f1f5f9;
  --text-muted:   rgba(255,255,255,0.55);
}

    * { box-sizing: border-box; }

body {
  font-family: 'Sora', sans-serif;
  background: #0a0e1a;
  color: var(--text-primary);
  margin: 0;
  min-height: 100vh;
  background-image:
    radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.08) 0%, transparent 60%);
}

  h1,h2,h3,h4 { font-family: 'Sora', sans-serif; font-weight: 700; }
code, .code-tag { font-family: 'JetBrains Mono', monospace; }

    /* ── TOP BAR ─────────────────────────────── */
 .top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--header-h);
  background: rgba(10,14,26,0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 100;
}

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

   .top-bar-title {
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 18px;
  color: #fff;
  letter-spacing: -0.02em;
}

   .top-bar-badge {
  background: linear-gradient(135deg, var(--green-mid), #0d5c3a);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.1em;
}

    /* Client switcher in top bar */
    .client-select-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .client-select-wrap label {
      color: rgba(255,255,255,0.9);
      font-size: 13px;
    }

   #client-select {
  background: var(--glass);
  color: #fff;
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 13px;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  min-width: 220px;
  backdrop-filter: blur(10px);
}
#client-select option { background: #0a0e1a; color: #fff; }


    /* ── STATUS BAR ──────────────────────────── */
   #status-bar {
  position: fixed;
  top: var(--header-h);
  left: var(--sidebar-w);
  left: 0; right: 0;
  background: rgba(26,122,80,0.12);
  
  border-bottom: 1px solid rgba(26,122,80,0.2);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 28px;
  z-index: 99;
  backdrop-filter: blur(10px);
  letter-spacing: 0.01em;
}

    /* ── SIDEBAR ─────────────────────────────── */
.sidebar {
  position: fixed;
  top: var(--header-h);
  left: 0;
  width: var(--sidebar-w);
  bottom: 0;
  background: rgba(10,14,26,0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid var(--glass-border);
  padding: 2px 0;
  overflow-y: auto;
}

    .nav-section-title {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  padding: 10px 20px 7px;
}

   .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 22px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  text-decoration: none;
  border-radius: 0 10px 10px 0;
  margin-right: 12px;
}
.nav-item:hover, .nav-item.active {
  background: var(--green-light);
  color: #818cf8;
  border-left-color: var(--green-mid);
}

    .nav-icon { font-size: 16px; width: 20px; text-align: center; }

    /* ── MAIN CONTENT ────────────────────────── */
    .main-content {
      margin-left: var(--sidebar-w);
      margin-top: calc(var(--header-h) + 34px);
      padding: 2px 32px;
      min-height: 100vh;
    }

    /* ── SECTIONS ────────────────────────────── */
    .admin-section {
      display: none;
    }

    .admin-section.active {
      display: block;
    }

    .section-heading {
  font-family: 'Sora', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #818cf8;
  margin: 0 0 6px;
  letter-spacing: -0.03em;
  text-shadow: 0 0 40px rgba(110,231,160,0.3);
}

    .section-desc {
      font-size: 14px;
      color: #ced2f9;
      margin: 0 0 24px;
    }

    /* ── CARDS ───────────────────────────────── */
  .admin-card {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 24px 26px;
  margin-bottom: 20px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow:
    0 4px 24px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.06);
  transition: box-shadow 0.2s;
}
.admin-card:hover {
  box-shadow:
    0 8px 40px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.08);
}

   .card-title {
  font-family: 'Sora', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #818cf8;
  margin: 0 0 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.01em;
}

    /* ── INFO ROWS ───────────────────────────── */
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 7px 0;
      border-bottom: 1px solid #f0f4f2;
      font-size: 13px;
    }

    .info-row:last-child { border-bottom: none; }

    .info-label {
      color: var(--text-muted);
      font-weight: 600;
      min-width: 130px;
      flex-shrink: 0;
    }

    .info-val { color:#f6db9e; font-weight: 700; font-size: 14px; }

    .code-tag {
  background: rgba(26,122,80,0.2);
  color: #818cf8;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid rgba(26,122,80,0.3);
}

   .link-tag {
  color: #5bc8f5;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  word-break: break-all;
}

    /* ── SERVICE ROWS ────────────────────────── */
   .service-row {
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

    .service-row:last-child { border-bottom: none; }

    .service-row-top {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .service-id-tag {
      background: #57abeb;
      color: var(--green-deep);
      font-size: 11px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 8px;
      border-radius: 5px;
    }

    .service-name {
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
}

    .service-keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* ── KEYWORD TAGS ────────────────────────── */
 .kw-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
  border: 1px solid var(--glass-border);
}
.kw-local { background: rgba(26,122,80,0.2); color: #f0b429; border-color: rgba(26,122,80,0.3); }
.kw-trust { background: rgba(240,180,41,0.15); color: #f0b429; border-color: rgba(240,180,41,0.3); }

    .kw-cloud { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 8px; }

    .seo-group { margin-bottom: 14px; }
    .seo-group-title { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; }
    .seo-note { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

    /* ── LANGUAGE SLIDERS ────────────────────── */
    .slider-row { margin-bottom: 14px; }

    .slider-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

  .slider-label { font-size: 14px; font-weight: 800; color: #e0f2e9; }
.slider-val   { font-size: 14px; font-weight: 800; color: #818cf8; }

    .lang-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      cursor: pointer;
      outline: none;
    }

    .total-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 10px;
      border-top: 1px solid #f0f4f2;
      font-size: 13px;
      font-weight: 600;
      color: #818cf8;
    }

    .total-val { font-size: 16px; font-weight: 700; }
    .total-warn { color: #e74c3c; font-size: 12px; }
    .hidden { display: none !important; }

    /* ── RATING PANEL ────────────────────────── */
    .rating-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f4f2;
    }

    .rating-row:last-child { border-bottom: none; }
    .star-badge { font-size: 16px; min-width: 90px; }
    .rating-tone { font-size: 13px; font-weight: 700; color: #818cf8; }
    .rating-meta { font-size: 12px; color: var(--text-muted); display: block; margin-top: 2px; }

    /* ── PHRASE BROWSER ──────────────────────── */
    .phrase-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .admin-select {
      background: #f4fbf7;
      border: 1px solid #c5dfd0;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      font-family: 'Nunito', sans-serif;
      color: #1a2e24;
      outline: none;
      cursor: pointer;
    }

    .admin-btn {
  padding: 10px 22px;
  background: linear-gradient(135deg, var(--green-mid), #0d5c3a);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(26,122,80,0.3);
  letter-spacing: -0.01em;
}
.admin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(26,122,80,0.4);
}

    .admin-btn-outline {
  padding: 10px 22px;
  background: transparent;
  color: #818cf8;
  border: 1.5px solid rgba(26,122,80,0.4);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.admin-btn-outline:hover {
  background: var(--green-light);
  border-color: var(--green-mid);
  transform: translateY(-1px);
}


    .admin-btn-red {
      padding: 8px 18px;
      background: #fdecea;
      color: #c0392b;
      border: 1.5px solid #f5c6cb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Nunito', sans-serif;
      cursor: pointer;
    }

    .phrase-pool { margin-bottom: 18px; }

    .pool-header {
  font-size: 13px;
  font-weight: 800;
  color: #818cf8;
  background: rgba(26,122,80,0.15);
  padding: 8px 14px;
  border-radius: 8px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(26,122,80,0.2);
}

    .pool-count {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .phrase-item {
      display: flex;
      gap: 10px;
      padding: 6px 4px;
      border-bottom: 1px solid #f0f4f2;
      font-size: 13px;
    }

    .phrase-num {
      color: #b0c8b8;
      font-size: 11px;
      font-weight: 700;
      min-width: 22px;
      padding-top: 1px;
    }

    .phrase-text { color: #E8DCC2; line-height: 1.5; }

    .phrase-meta {
      background: #fff8ee;
      border-left: 3px solid var(--gold);
      padding: 8px 12px;
      font-size: 12px;
      color: #7a6020;
      border-radius: 0 6px 6px 0;
      margin-bottom: 14px;
    }

    .loading-phrase, .error-phrase, .empty-phrase {
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .error-phrase { color: #c0392b; }

    /* ── PREVIEW PANEL ───────────────────────── */
    .preview-controls {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      align-items: center;
    }

    .preview-meta {
      font-size: 12px;
      color: var(--text-muted);
      background: #1a1e5b;
      padding: 6px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .preview-card {
  background: rgba(53, 72, 220, 0.08);
  border: 1px solid rgba(26,122,80,0.2);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
  transition: all 0.2s;
}
.preview-card:hover {
  background: rgba(26,122,80,0.12);
  transform: translateX(4px);
}

    .preview-num {
      font-size: 11px;
      font-weight: 700;
      color: var(--green-mid);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .preview-text {
      font-size: 14px;
      line-height: 1.65;
      color: #ccdbe8;
      margin: 0 0 10px;
    }

    .copy-preview-btn {
      padding: 5px 14px;
      background: var(--green-deep);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
    }

    .preview-loading {
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
    }

    .loading-dots {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 12px;
    }

    .loading-dots span {
      width: 10px; height: 10px;
      background: var(--green-mid);
      border-radius: 50%;
      animation: dotBounce 1.2s infinite ease-in-out;
    }

    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dotBounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%            { transform: scale(1.1); opacity: 1; }
    }

    /* ── QR PANEL ────────────────────────────── */
    .qr-input-row {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .admin-input {
      flex: 1;
      min-width: 260px;
      background: #f4fbf7;
      border: 1px solid #c5dfd0;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 13px;
      font-family: 'Nunito', sans-serif;
      color: #1a2e24;
      outline: none;
    }

    #qr-url-output {
      width: 100%;
      background: #f0f4f2;
      border: 1px solid #c5dfd0;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--green-deep);
      margin-bottom: 14px;
    }

    #qr-preview-img {
      display: block;
      border: 4px solid #fff;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      margin-top: 4px;
    }

    /* ── GRID LAYOUTS ────────────────────────── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

    /* ── INSTRUCTIONS CARD ───────────────────── */
    .instruction-step {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f0f4f2;
      font-size: 13px;
    }

    .step-num {
      width: 24px; height: 24px;
      background: var(--green-deep);
      color: #fff;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-text { color: #f0b638; line-height: 1.5; }
    .step-text strong { color: #f0b638; }
/* ── MOBILE NAV TOGGLE ───────────────────── */
.mobile-menu-btn {
  display: none;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 20px;
  width: 36px; height: 36px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 149;
}

@media (max-width: 768px) {
  :root { --sidebar-w: 0px; }

  .mobile-menu-btn { display: flex; }

  .client-select-wrap label { display: none; }
  #client-select { min-width: 100px; max-width: 140px; font-size: 11px; padding: 4px 6px; }

  #logged-in-user { display: none; }

.service-row-top {
  flex-wrap: wrap;
}
.svc-id-input {
  width: 100% !important;
}

.top-bar { padding: 0 8px; gap: 4px; flex-wrap: nowrap; }
.top-bar-badge { display: none; }
.top-bar-title { font-size: 14px; }
  #status-bar { font-size: 12px; padding: 6px 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: 260px;
    z-index: 150;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    padding-top: var(--header-h);
  }

  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay.open { display: block; }

.main-content {
  margin-left: 0;
  margin-top: calc(var(--header-h) + 34px);
  padding: 32px 36px;
  min-height: 100vh;
}

 .section-heading {
  font-family: 'Sora', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #818cf8;
  margin: 0 0 6px;
  letter-spacing: -0.03em;
  text-shadow: 0 0 40px rgba(110,231,160,0.3);
}
 
.section-desc {
  font-size: 14px;
  font-weight: 600;
  color: #818cf8;
  margin: 0 0 28px;
}

  .admin-card { padding: 14px 14px; border-radius: 10px; }

  .info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-size: 13px;
}
  .info-label {
  color: rgba(255,255,255,0.4);
  font-weight: 700;
  font-size: 13px;
  min-width: 130px;
  flex-shrink: 0;
}

  .preview-controls { flex-direction: column; }
  .preview-controls .admin-select,
  .preview-controls .admin-btn { width: 100%; }

  .admin-select, .admin-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  color: #fff;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.admin-select:focus, .admin-input:focus {
  border-color: var(--green-mid);
}

  .phrase-controls { flex-direction: column; }
  .phrase-controls .admin-select,
  .phrase-controls .admin-btn { width: 100%; }

  .qr-input-row { flex-direction: column; }

  #review-nav { flex-wrap: wrap; gap: 6px; }

  .card-title { font-size: 13px; flex-wrap: wrap; }

  .rating-row { flex-wrap: wrap; gap: 6px; }
  .star-badge { min-width: unset; }

  #qr-preview-img { width: 160px; height: 160px; }

  .login-box { width: calc(100% - 32px) !important; padding: 28px 20px !important; }
}
.superadmin-only { display: none; }
  </style>
</head>

<body>

  <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>

  <!-- ── TOP BAR ── -->
  <div class="top-bar">
  <div class="top-bar-left">
  <button class="mobile-menu-btn" onclick="toggleSidebar()" aria-label="Menu">☰</button>
  <img src="logo_main.png" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
  <span class="top-bar-title">Review System</span>
  <span class="top-bar-badge">ADMIN</span>
</div>
    <div class="client-select-wrap">
      <label>Active client:</label>
      <select id="client-select"></select>
    </div>
    <div style="display:flex; align-items:center; gap:12px;">
      <span id="logged-in-user" style="color:rgba(255,255,255,0.7); font-size:13px;"></span>
      <button
        onclick="Auth.logout()"
        style="background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3); border-radius:8px; padding:5px 14px; font-size:13px; font-family:'Nunito',sans-serif; font-weight:600; cursor:pointer;"
      >Logout</button>
    </div>
  </div>
  
<nav class="sidebar">
    <div class="nav-section-title">Overview</div>
    <a class="nav-item active" onclick="showSection('overview')">
      <span class="nav-icon">📋</span> Client Profile
    </a>
    <a class="nav-item" onclick="showSection('services')">
      <span class="nav-icon">🏥</span> Services
    </a>
    <a class="nav-item" data-role-hide onclick="showSection('seo')">
      <span class="nav-icon">🔍</span> SEO Keywords
    </a>

    <div class="nav-section-title" data-role-hide>Configuration</div>
    <a class="nav-item" data-role-hide onclick="showSection('language')">
      <span class="nav-icon">🌐</span> Language Settings
    </a>
    <a class="nav-item" data-role-hide onclick="showSection('rating')">
      <span class="nav-icon">⭐</span> Rating Behavior
    </a>

    <div class="nav-section-title" data-role-hide>Tools</div>
    <a class="nav-item" data-role-hide onclick="showSection('preview')">
      <span class="nav-icon">👁️</span> Live Preview
    </a>
    <a class="nav-item" data-role-hide onclick="showSection('phrases')">
      <span class="nav-icon">📝</span> Phrase Browser
    </a>
    <a class="nav-item" onclick="showSection('qr')">
      <span class="nav-icon">📱</span> QR Generator
    </a>

    <div class="nav-section-title" data-role-hide>System</div>
    <a class="nav-item" data-role-hide onclick="showSection('stats')">
      <span class="nav-icon">📊</span> Session Stats
    </a>
    <a class="nav-item" onclick="showSection('guide')">
      <span class="nav-icon">📖</span> How to Use
    </a>

<div class="admin-card" style="max-width: 380px;">
  <div class="card-title">🏥 Clinic Identity</div>
  <div style="display:flex; align-items:center; gap:16px; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid var(--glass-border);">
    <img id="account-logo" src="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--glass-border);background:#1e293b;" />
    <div>
      <div id="account-clinic-name" style="font-size:13px;font-weight:700;color:var(--text-primary);"></div>
      <button onclick="Admin.openAccountSettings()" style="
    background: var(--glass);
    border: 1px solid var(--glass-border);
    border-radius: 10px;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 20px;
    transition: background 0.2s;
  " title="Account Settings">⚙️</button>
    </div>
  </div>
  </nav>


  <!-- ── MAIN CONTENT ── -->
  <main class="main-content">

    <!-- ══════════════════════════════════════
         SECTION: Client Profile Overview
    ══════════════════════════════════════ -->
    <section class="admin-section active" id="section-overview">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
  <h1 class="section-heading" style="margin:0;">Client Profile</h1>
</div>
      <p class="section-desc">Core settings for the currently loaded client.</p>
      <div class="admin-card">
        <div class="card-title">📋 Business Information</div>
        <div id="profile-overview">Loading...</div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Services
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-services">
      <h1 class="section-heading">Services</h1>
      <p class="section-desc">Services listed in the client profile. Patients select from these on Screen 1.</p>
      <div class="admin-card">
        <div class="card-title">🏥 Service List</div>
        <div id="services-list">Loading...</div>
      </div>
    <div class="admin-card" style="display:flex; gap:10px; flex-wrap:wrap;">
  <button class="admin-btn" onclick="Admin.addService()">+ Add Service</button>
  <button class="admin-btn" onclick="Admin.saveServices()" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">💾 Save Services</button>
</div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: SEO Keywords
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-seo">
      <h1 class="section-heading">SEO Keywords</h1>
      <p class="section-desc">Keywords injected into reviews for local SEO. Max 2 per review.</p>
      <div class="admin-card">
        <div class="card-title">🔍 Active Keyword Pools</div>
        <div id="seo-panel">Loading...</div>
      </div>
      <div class="admin-card" style="background:#fff8ee; border-color:#f0d090;">
        <div class="card-title" style="color:#c07020;">📌 How to edit keywords</div>
        <p style="font-size:13px; color:#7a6020; margin:0;">
          Connect to <a href="https://nexaflow.bar" target="_blank" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; text-decoration: none;">Nexaflow</a>
        </p>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Language Settings
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-language">
      <h1 class="section-heading">Language Settings</h1>
      <p class="section-desc">Control how often each language appears in generated reviews. Must total 100.</p>
      <div class="two-col">
        <div class="admin-card">
          <div class="card-title">🌐 Probability Sliders</div>
          <div id="lang-sliders">Loading...</div>
        <button
            onclick="Admin.saveLanguageProbabilities()"
            class="admin-btn"
            style="margin-top:14px; width:100%;"
          >💾 Save Permanently</button>
          <p style="font-size:12px; color:#7a9a87; margin-top:10px;">
            ⚠ Total must equal 100% before saving.
          </p>
        </div>
        <div class="admin-card">
          <div class="card-title">💡 Language Guide</div>
          <div class="info-row"><span class="info-label" style="color:#2d9b6f">English</span><span class="info-val">Formal / semi-formal reviews. Best for educated patients.</span></div>
          <div class="info-row"><span class="info-label" style="color:#e8a030">Hinglish</span><span class="info-val">Most natural for Indian patients. Roman script Hindi-English mix.</span></div>
          <div class="info-row"><span class="info-label" style="color:#c0392b">Hindi</span><span class="info-val">Pure Devanagari. Great for traditional patient demographics.</span></div>
          <div class="info-row"><span class="info-label" style="color:#8e44ad">Mixed</span><span class="info-val">Mid-sentence language switching. Educated urban patients.</span></div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Rating Behavior
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-rating">
      <h1 class="section-heading">Rating Behavior</h1>
      <p class="section-desc">How review tone, length, and emoji change per star rating.</p>
      <div class="admin-card">
        <div class="card-title">⭐ Rating Configuration</div>
        <div id="rating-panel">Loading...</div>
      </div>
      <div class="admin-card">
        <div class="card-title">📊 Humanizer Profiles</div>
        <div style="font-size:13px; color:#818cf8; line-height:1.8;">
          <div style="margin-bottom:8px;"><strong>5⭐ Profile:</strong> 20% lowercase start · 25% exclamation · 15% double !! · 10% elongation · 8% typo</div>
          <div style="margin-bottom:8px;"><strong>4⭐ Profile:</strong> 15% lowercase · 10% exclamation · 5% elongation · 5% typo</div>
          <div><strong>3⭐ Profile:</strong> 10% lowercase · 0% exclamation · 0% elongation · 3% typo</div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Live Preview
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-preview">
      <h1 class="section-heading">Live Preview</h1>
      <p class="section-desc">Generate sample reviews exactly as patients would see them. Uses current slider settings.</p>

      <div class="admin-card">
        <div class="card-title">⚙️ Preview Settings</div>
        <div class="preview-controls">
          <select class="admin-select" id="preview-service">
            <option value="">Loading services...</option>
          </select>
          <select class="admin-select" id="preview-stars">
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="3">⭐⭐⭐ 3 Stars</option>
          </select>
          <button class="admin-btn" id="generate-preview-btn">Generate Reviews</button>
        </div>
      </div>

   <div class="admin-card">
  <div class="card-title" style="justify-content:space-between;">
    <span>👁️ Generated Output</span>
    <div id="review-nav" style="display:none; align-items:center; gap:10px;">
      <span id="review-counter" style="font-size:12px; color:#7a9a87; font-weight:600;"></span>
      <button class="admin-btn-outline" onclick="Admin.cycleReview(-1)" style="padding:4px 12px; font-size:12px;">← Prev</button>
      <button class="admin-btn-outline" onclick="Admin.cycleReview(1)"  style="padding:4px 12px; font-size:12px;">Next →</button>
    </div>
  </div>
  <div id="preview-meta-bar" style="display:none;" class="preview-meta"></div>
  <div id="preview-output" style="max-height:420px; overflow-y:auto;">
    <p style="color:#7a9a87; font-size:14px; text-align:center; padding:24px 0;">
      Select a service and stars, then click Generate.
    </p>
  </div>
</div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Phrase Browser
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-phrases">
      <h1 class="section-heading">Phrase Browser</h1>
      <p class="section-desc">View all phrases in any language/category. Edit the JSON files directly to add or change phrases.</p>

      <div class="admin-card">
        <div class="card-title">🔎 Browse Phrases</div>
        <div class="phrase-controls">
          <select class="admin-select" id="phrase-lang-select">
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
            <option value="hindi">Hindi</option>
            <option value="mixed">Mixed</option>
          </select>
          <select class="admin-select" id="phrase-type-select">
            <option value="intros">Intros</option>
            <option value="trust">Trust</option>
            <option value="service">Service</option>
            <option value="emotional">Emotional</option>
            <option value="seo">SEO</option>
            <option value="outros">Outros</option>
            <option value="emojis">Emojis</option>
          </select>
          <button class="admin-btn" id="load-phrases-btn">Load Phrases</button>
        </div>
        <div id="phrase-browser-content">
          <p style="color:#7a9a87; font-size:14px; text-align:center; padding:24px 0;">
            Select language and type, then click Load.
          </p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: QR Generator
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-qr">
      <h1 class="section-heading">QR Generator</h1>
      <p class="section-desc">Generate the patient QR code URL for the currently loaded client.</p>

      <div class="two-col">
        <div class="admin-card">
          <div class="card-title">🔗 Generate URL</div>
          <div class="qr-input-row">
            <input
              type="text"
              class="admin-input"
              id="qr-base-url"
              placeholder="https://yourdomain.com/review-system/public"
            />
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="admin-btn" id="generate-qr-btn">Generate QR</button>
            <button class="admin-btn-outline" id="copy-qr-url-btn">Copy URL</button>
          </div>
          <div style="margin-top:14px;">
            <input type="text" id="qr-url-output" class="hidden" readonly />
          </div>
        </div>
        <div class="admin-card" style="text-align:center;">
          <div class="card-title" style="justify-content:center;">📱 QR Preview</div>
          <img id="qr-preview-img" class="hidden" width="200" height="200" alt="QR Code" style="margin:0 auto;" />
          <p style="font-size:12px; color:#7a9a87; margin-top:12px;">
            Download and print this QR code to place in the clinic.
          </p>
        </div>
      </div>

      <div class="admin-card" style="background:#fff8ee; border-color:#f0d090;">
        <div class="card-title" style="color:#c07020;">📌 QR Deployment Notes</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Each clinic gets its own QR code. The <code>?clinic=</code> param identifies which profile to load.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">Enter your <strong>public base URL</strong> above (e.g. <code>https://ai.nexaflow.bar/public</code>).</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">Click Generate — QR code is created via <strong>NEXAFLOW</strong> QR API. Download and print.</div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════
         SECTION: Session Stats
    ══════════════════════════════════════ -->
    <section class="admin-section" id="section-stats">
      <h1 class="section-heading">Session Stats</h1>
      <p class="section-desc">Anti-spam and SEO tracker status for the current browser session.</p>
      <div class="two-col">
        <div class="admin-card">
          <div class="card-title">📊 Current Stats</div>
          <div id="stats-panel">Loading...</div>
          <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
            <button class="admin-btn-outline" id="refresh-stats-btn">Refresh Stats</button>
            <button class="admin-btn-red" id="clear-session-btn">Clear Session</button>
          </div>
        </div>
        <div class="admin-card">
          <div class="card-title">💡 What these mean</div>
          <div class="info-row"><span class="info-label">Session reviews</span><span class="info-val">Reviews generated this browser session. Anti-spam compares new reviews against these.</span></div>
          <div class="info-row"><span class="info-label">Phrase tracker</span><span class="info-val">Phrases marked as used in the current generation batch. Resets between batches.</span></div>
          <div class="info-row"><span class="info-label">Similarity threshold</span><span class="info-val">Reviews more similar than this value (0–1) are rejected and regenerated.</span></div>
          <div class="info-row"><span class="info-label">SEO phrases</span><span class="info-val">Recently injected SEO phrases. Tracked to avoid repeating same location sentence.</span></div>
        </div>
      </div>
    </section>

 <!-- ══════════════════════════════════════
       SECTION: How to Use Guide
  ══════════════════════════════════════ -->
  <section class="admin-section" id="section-guide">
    <h1 class="section-heading">How to Use</h1>
    <p class="section-desc" id="guide-desc">Loading guide...</p>

    <!-- CLINIC USER GUIDE -->
    <div id="guide-clinic" style="display:none;">

      <div class="admin-card">
        <div class="card-title">📱 How Patients Use This Tool</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Patient scans the QR code at your clinic reception.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">They select the service they visited for.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">They rate their experience (1–5 stars).</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">4</div>
          <div class="step-text">They pick a review, copy it, and post it on Google. Done!</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">🏥 Adding a New Service</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Click <strong>Services</strong> in the left menu.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">Click <strong>+ Add Service</strong> button — a new empty row appears.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">Fill in the service name (e.g. "Kidney Stone Treatment").</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">4</div>
          <div class="step-text">Click <strong>💾 Save Services</strong> — changes go live in 5–10 minutes.</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">📱 Getting Your QR Code</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Click <strong>QR Generator</strong> in the left menu.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">Enter your clinic's website URL and click Generate.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">Download and print the QR code — place it at reception desk.</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">⏱️ How Long Do Changes Take?</div>
        <div class="instruction-step">
          <div class="step-num">~</div>
          <div class="step-text"><strong>Adding a service:</strong> 5–10 minutes to go live after saving.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">~</div>
          <div class="step-text"><strong>QR code:</strong> Works immediately after generating.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">~</div>
          <div class="step-text">If changes don't show, do a hard refresh: <strong>Ctrl+Shift+R</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac).</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">📞 Need Help?</div>
        <div class="instruction-step">
          <div class="step-num">✓</div>
          <div class="step-text">Contact NexaFlow support at <a href="https://nexaflow.bar" target="_blank" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-weight: 700; text-decoration: none;">nexaflow.bar</a></div>
        </div>
      </div>

    </div>

    <!-- SUPERADMIN GUIDE -->
    <div id="guide-superadmin" style="display:none;">

      <div class="admin-card">
        <div class="card-title">🚀 Adding a New Client</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Duplicate folder <code>data/clients/dr-sharma-homeo/</code> → rename to new slug (e.g. <code>city-homeo-clinic</code>).</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">Edit <code>profile.json</code> → update name, slug, googleReviewUrl, city, area, services.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">Add slug + name to <code>knownClients</code> array in <code>admin/js/admin.js</code>.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">4</div>
          <div class="step-text">Add clinic login to <code>auth.js</code> USERS object with role: 'clinic'.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">5</div>
          <div class="step-text">Use QR Generator to create patient URL and print QR code.</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">✏️ Editing Phrases</div>
        <div class="instruction-step">
          <div class="step-num">1</div>
          <div class="step-text">Open <code>data/phrases/[language]/[type].json</code> in text editor.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">2</div>
          <div class="step-text">Add to correct star pool (<code>5star</code>, <code>4star</code>, <code>3star</code>). Keep JSON valid.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">3</div>
          <div class="step-text">Use <code>{{service}}</code>, <code>{{city}}</code>, <code>{{area}}</code> as placeholders.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">4</div>
          <div class="step-text">For client-specific phrases: add to <code>data/clients/[slug]/phrases/[language]/[type].json</code>.</div>
        </div>
      </div>

      <div class="admin-card">
        <div class="card-title">🌐 Deployment Checklist</div>
        <div class="instruction-step">
          <div class="step-num">✓</div>
          <div class="step-text">Deploy via GitHub Pages — push to repo, changes live in 5–10 min.</div>
        </div>
        <div class="instruction-step">
          <div class="step-num">✓</div>
          <div class="step-text">Patient URL: <code>https://yourdomain.com/public/index.html?clinic=SLUG</code></div>
        </div>
        <div class="instruction-step">
          <div class="step-num">✓</div>
          <div class="step-text">Admin URL: <code>https://yourdomain.com/admin/index.html</code> — keep private.</div>
        </div>
      </div>

    </div>

  </section>

<section class="admin-section" id="section-account">
  <h1 class="section-heading">My Account</h1>
  <p class="section-desc">Change your login credentials.</p>

  <div class="admin-card" style="max-width: 480px;">
    <div class="card-title">🔐 Change Password</div>
    <div style="margin-bottom: 12px;">
  <label style="font-size:12px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:5px;">Username</label>
  <input type="text" id="new-username" class="admin-input" style="width:100%; opacity:0.6; cursor:not-allowed;" readonly placeholder="Username" />
</div>
    <div style="margin-bottom: 12px;">
      <label style="font-size:12px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:5px;">Current Password</label>
      <input type="password" id="current-password" class="admin-input" style="width:100%;" placeholder="Enter current password" />
    </div>
    <div style="margin-bottom: 16px;">
      <label style="font-size:12px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:5px;">New Password</label>
      <input type="password" id="new-password" class="admin-input" style="width:100%;" placeholder="Enter new password" />
    </div>
    <div style="margin-bottom: 16px;">
  <label style="font-size:12px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:5px;">Confirm New Password</label>
  <input type="password" id="confirm-password" class="admin-input" style="width:100%;" placeholder="Confirm new password" />
</div>
<button class="admin-btn" onclick="Admin.changeCredentials()" style="width:100%;">Update Password</button>
    <p id="account-msg" style="display:none; margin-top:12px; font-size:13px; font-weight:700; text-align:center;"></p>
  </div>
</section>

  </main><!-- /.main-content -->

  <!-- ── LOGIN OVERLAY ── -->
  <div id="login-overlay" style="display:none; position:fixed; inset:0; background:#f0f4f2; z-index:9999; align-items:center; justify-content:center;">
    <div class="login-box" style="background:#fff; border-radius:16px; padding:40px 36px; width:360px; box-shadow:0 8px 40px rgba(0,0,0,0.13); border:1px solid #e0ede6;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
        <span style="font-size:26px;">🌿</span>
        <h2 style="font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#1a6b4a; margin:0;">Review System</h2>
      </div>
      <p style="color:#7a9a87; font-size:13px; margin:0 0 24px; padding-left:36px;">Clinic Admin Panel</p>
      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:12px; font-weight:700; color:#7a9a87; margin-bottom:5px; letter-spacing:0.05em; text-transform:uppercase;">Username</label>
        <input
          id="login-user"
          type="text"
          placeholder="Enter username"
          autocomplete="username"
          style="width:100%; padding:10px 14px; border:1.5px solid #e0ede6; border-radius:8px; font-size:14px; font-family:'Nunito',sans-serif; color:#1a2e24; outline:none; box-sizing:border-box;"
        />
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:12px; font-weight:700; color:#7a9a87; margin-bottom:5px; letter-spacing:0.05em; text-transform:uppercase;">Password</label>
        <input
          id="login-pass"
          type="password"
          placeholder="Enter password"
          autocomplete="current-password"
          style="width:100%; padding:10px 14px; border:1.5px solid #e0ede6; border-radius:8px; font-size:14px; font-family:'Nunito',sans-serif; color:#1a2e24; outline:none; box-sizing:border-box;"
        />
      </div>
      <div id="login-error" style="display:none; color:#c0392b; font-size:13px; font-weight:600; margin-bottom:12px; padding:8px 12px; background:#fdecea; border-radius:7px;"></div>
      <button
        onclick="Auth.attemptLogin()"
        style="width:100%; background:#1a6b4a; color:#fff; border:none; border-radius:8px; padding:12px; font-size:15px; font-weight:700; font-family:'Sora',sans-serif; cursor:pointer; letter-spacing:0.02em;"
      >Sign In →</button>
      <p style="text-align:center; font-size:11px; color:#b0c8b8; margin:18px 0 0;">NexaFlow AI · nexaflow.bar</p>
    </div>
  </div>
  
  <!-- ── SECTION NAVIGATION ── -->
  <script>
   function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // Close mobile sidebar on nav
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');

      const section = document.getElementById('section-' + id);
      if (section) section.classList.add('active');

      // Highlight nav item
      document.querySelectorAll('.nav-item').forEach(n => {
        if (n.getAttribute('onclick')?.includes(`'${id}'`)) {
          n.classList.add('active');
        }
      });

      // Populate preview service dropdown when preview opens
      if (id === 'preview' && Admin?.state?.currentProfile) {
        const sel = document.getElementById('preview-service');
        if (sel && Admin.state.currentProfile.services) {
          sel.innerHTML = Admin.state.currentProfile.services.map(s =>
            `<option value="${s.id}">${s.label}</option>`
          ).join('');
        }
      }
    }

    function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
  </script>

  <!-- ── ENGINE SCRIPTS (same as patient, different relative path) ── -->
  <script src="../public/js/utils.js"></script>
  <script src="../public/js/languageEngine.js"></script>
  <script src="../public/js/antiSpam.js"></script>
  <script src="../public/js/humanizer.js"></script>
  <script src="../public/js/seoInjector.js"></script>
  <script src="../public/js/reviewEngine.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/admin.js"></script>

</body>
</html>
