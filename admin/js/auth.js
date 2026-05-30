/**
 * auth.js
 * -------
 * Frontend-only clinic login system for Review System Admin.
 * No backend needed. Credentials stored here. Session in sessionStorage.
 *
 * ROLES:
 *   superadmin → sees all clinics, can switch between them
 *   clinic     → sees only their own clinic, no switcher
 *
 * TO ADD A NEW CLINIC USER:
 *   1. Add entry to USERS below
 *   2. Set slug to match their folder name in data/clients/
 *   3. Share username + password with the clinic
 *
 * TO CHANGE A PASSWORD:
 *   Just edit the password value below and redeploy.
 */

const Auth = (() => {

  // ─────────────────────────────────────────────
  // USER CONFIG — edit this to add/remove users
  // ─────────────────────────────────────────────

  const USERS = {

    // ── SUPER ADMIN ──────────────────────────────
    // Can see all clinics. Can switch between them.
    'nexaflow': {
      password:  'nexaflow@2026',
      role:      'superadmin',
      name:      'NexaFlow Admin',
      slug:      null,
    },

    // ── CLINIC USERS ─────────────────────────────
    // Each clinic can only see their own data.
    // slug must match the folder name in data/clients/

    'drverma': {
      name:      "Dr. Verma's Multispeciality Homeopathy",
      slug:      'dr-verma-homeo',
    },

    'saluja': {
      name:      "Saluja Dento Max Fac Centre",
      slug:      'saluja-dento-max',
    },

    'drsharma': {
      name:      'Dr. Sharma Homeopathic Clinic',
      slug:      'dr-sharma-homeo',
    },

    'greenwellness': {
      name:      'Green Wellness Clinic',
      slug:      'green-wellness-clinic',
    },

    // ── ADD MORE CLINICS BELOW ───────────────────
    // Copy this block and fill in the details:
    //
    // 'username': {
    //   password: 'their-password',
    //   role:     'clinic',
    //   name:     'Clinic Display Name',
    //   slug:     'their-folder-slug',
    // },

  };

  // ─────────────────────────────────────────────
  // SESSION KEY
  // ─────────────────────────────────────────────

  const SESSION_KEY = 'review_admin_session';

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  /**
   * Called by the login button in index.html.
   * Reads username + password from the login overlay inputs.
   * On success: saves session, hides overlay, shows logged-in user.
   * On failure: shows error message.
   */
const SUPABASE_URL = 'https://xpebzkecofenaygukhsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWJ6a2Vjb2ZlbmF5Z3VraHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTE2MDMsImV4cCI6MjA5NDg2NzYwM30.r-GSpPhRrIUTosBRZ0gQF0TtYPl5Uu93A7QPogiQbEA';

async function _fetchGithubToken() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clinic_config?slug=eq._global&select=github_token`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    const data = await res.json();
    return data?.[0]?.github_token || null;
  } catch (e) {
    return null;
  }
}

async function attemptLogin() {
  const username = document.getElementById('login-user')?.value?.trim().toLowerCase();
  const password = document.getElementById('login-pass')?.value;

  if (!username || !password) {
    _showLoginError('Please enter username and password.');
    return;
  }

  const btnEl = document.querySelector('#login-overlay button');
  if (btnEl) btnEl.textContent = 'Signing in...';

  // Fetch user from Supabase
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/clinic_users?username=eq.${username}&password=eq.${encodeURIComponent(password)}&select=*`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  const data = await res.json();
  const user = data?.[0];

  if (!user) {
    _showLoginError('Incorrect username or password.');
    const passEl = document.getElementById('login-pass');
    if (passEl) passEl.value = '';
    if (btnEl) btnEl.textContent = 'Sign In →';
    return;
  }

  // Fetch token from Supabase
  const githubToken = await _fetchGithubToken();

  // Save session
  const session = {
    username:    user.username,
    role:        user.role,
    name:        user.name,
    slug:        user.slug,
    githubToken: githubToken,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // Hide login overlay
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';

  // Show logged-in user name in top bar
  const userLabel = document.getElementById('logged-in-user');
  if (userLabel) {
    userLabel.textContent = `👤 ${user.name}${user.role === 'superadmin' ? '  ·  Super Admin' : ''}`;
  }

  // Boot the admin panel
  Admin.init();
}

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  /**
   * Called by the Logout button in the top bar.
   * Clears session and reloads the page (shows login overlay again).
   */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  }

  // ─────────────────────────────────────────────
  // GUARD — call this at the start of Admin.init()
  // ─────────────────────────────────────────────

  /**
   * Checks if a valid session exists.
   * If NOT logged in: shows the login overlay, stops page load.
   * If logged in: updates top bar with user name, returns true.
   *
   * Usage in admin.js:
   *   async function init() {
   *     if (!Auth.guard()) return;
   *     ... rest of init ...
   *   }
   */
  function guard() {
    const session = _getSession();

    if (!session) {
      // Not logged in — show login overlay
      const overlay = document.getElementById('login-overlay');
      if (overlay) overlay.style.display = 'flex';
      // Listen for Enter key on login form
      _bindLoginEnterKey();
      return false; // stop admin from booting
    }

    // Logged in — update top bar label
    const userLabel = document.getElementById('logged-in-user');
    if (userLabel) {
      userLabel.textContent = `👤 ${session.name}${session.role === 'superadmin' ? '  ·  Super Admin' : ''}`;
    }

    return true; // allow admin to boot
  }

  // ─────────────────────────────────────────────
  // GET SESSION — use this in admin.js to filter
  // ─────────────────────────────────────────────

  /**
   * Returns the current session object or null.
   * Shape: { username, role, name, slug }
   *
   * Usage in admin.js:
   *   const session = Auth.getSession();
   *   if (session.role === 'clinic') {
   *     state.knownClients = state.knownClients.filter(c => c.slug === session.slug);
   *   }
   */
  function getSession() {
    return _getSession();
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────

  function _getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function _showLoginError(msg) {
    const errorEl = document.getElementById('login-error');
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  function _bindLoginEnterKey() {
    // Allow pressing Enter in password field to submit
    const passEl = document.getElementById('login-pass');
    if (passEl) {
      passEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptLogin();
      });
    }
    const userEl = document.getElementById('login-user');
    if (userEl) {
      userEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('login-pass')?.focus();
        }
      });
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    guard,
    getSession,
    attemptLogin,
    logout,
  };

})();
