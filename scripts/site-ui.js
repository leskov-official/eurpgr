(function () {
  "use strict";
  let csrfTokenPromise = null;
  function sanitizeAvatarUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(?:javascript|data):/i.test(raw)) return '';
    return raw.replace(/["'<>]/g, '');
  }
  async function fetchJson(url) {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    return res.json().catch(() => null);
  }
  async function getCsrfToken(force = false) {
    if (!csrfTokenPromise || force) {
      csrfTokenPromise = fetchJson('/api/csrf.php').then((data) => {
        if (!data || !data.ok || !data.csrf_token) throw new Error('Failed to get CSRF token');
        return data.csrf_token;
      });
    }
    return csrfTokenPromise;
  }
  async function requestWithCsrf(url, options = {}, retry = true) {
    const opts = { credentials: 'include', ...options };
    const headers = new Headers(opts.headers || {});
    const method = String(opts.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') headers.set('X-CSRF-Token', await getCsrfToken());
    opts.headers = headers;
    const res = await fetch(url, opts);
    if (res.status === 419 && retry) {
      await getCsrfToken(true);
      return requestWithCsrf(url, options, false);
    }
    return res;
  }
  async function postJson(url, data) {
    const res = await requestWithCsrf(url, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(data||{}) });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok === false) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}`);
    return json;
  }
  async function postForm(url, formData) {
    const res = await requestWithCsrf(url, { method:'POST', body:formData });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok === false) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}`);
    return json;
  }
  function renderProfileButton(btn, user, opts = {}) {
    if (!btn) return;
    const accountHref = opts.accountHref || 'account.html#profile';
    const loginHref = opts.loginHref || 'checkout.html';
    if (!user) { btn.href = loginHref; btn.innerHTML = '<i class="fa-solid fa-user"></i>'; return; }
    btn.href = accountHref;
    const avatarUrl = sanitizeAvatarUrl(user.avatar_url || '');
    const isVerified = Number(user.is_verified || 0) === 1 || String(user.is_verified || '') === '1';
    if (!avatarUrl) { btn.innerHTML = '<i class="fa-solid fa-user"></i>'; return; }
    if (isVerified) {
      btn.innerHTML = `<span style="position:relative;width:100%;height:100%;display:block;"><img src="${avatarUrl}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;border:2px solid #c60b13;box-sizing:border-box;"><span style="position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;background:#E10600;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-sizing:border-box;"><svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true"><path d="M6.4 11.2 3.5 8.3l-1 1 3.9 3.9L13.5 6l-1-1z" fill="#fff"></path></svg></span></span>`;
    } else {
      btn.innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`;
    }
  }
  async function updateProfileBtn(options = {}) {
    const id = options.buttonId || 'profileBtn';
    const btn = document.getElementById(id) || document.getElementById(id === 'profileBtn' ? 'accountBtn' : 'profileBtn');
    if (!btn) return null;
    const data = await fetchJson(options.authUrl || '/api/auth_me.php').catch(() => null);
    renderProfileButton(btn, data && data.ok ? data.user : null, options);
    return data && data.ok ? data.user : null;
  }
  async function toggleAdminButton(options = {}) {
    const btn = document.getElementById(options.buttonId || 'adminBtn');
    if (!btn) return;
    const data = await fetchJson(options.adminUrl || '/api/admin_me.php').catch(() => null);
    if (data && data.ok) btn.style.display = 'block';
  }
  document.addEventListener('DOMContentLoaded', () => {
    const autoBtn = document.getElementById('profileBtn') ? 'profileBtn' : (document.getElementById('accountBtn') ? 'accountBtn' : '');
    if (autoBtn) {
      const isAdminPage = location.pathname.includes('/admin/');
      updateProfileBtn({ buttonId:autoBtn, authUrl:isAdminPage ? '../api/auth_me.php' : '/api/auth_me.php', accountHref:isAdminPage ? '../account.html#profile' : 'account.html#profile', loginHref:isAdminPage ? '../checkout.html' : 'checkout.html' }).catch(() => {});
    }
  });
  window.EuropagarUI = { sanitizeAvatarUrl, fetchJson, getCsrfToken, requestWithCsrf, postJson, postForm, updateProfileBtn, toggleAdminButton, renderProfileButton };
})();
