document.addEventListener('DOMContentLoaded', () => {
  window.EuropagarUI?.updateProfileBtn({
    buttonId: 'profileBtn',
    authUrl: '/api/auth_me.php',
    accountHref: 'account.html#profile',
    loginHref: 'checkout.html'
  }).catch(() => {});

  const submitBtn = document.getElementById('submitBtn');
  const errBox = document.getElementById('errBox');
  const okBox = document.getElementById('okBox');
  const tokenBox = document.getElementById('tokenBox');
  const p1 = document.getElementById('p1');
  const p2 = document.getElementById('p2');
  const token = new URLSearchParams(window.location.search).get('token') || '';

  function showErr(msg) {
    if (okBox) {
      okBox.style.display = 'none';
      okBox.textContent = '';
    }
    if (errBox) {
      errBox.textContent = msg || 'Viga';
      errBox.style.display = 'block';
    }
  }

  function showOk(msg) {
    if (errBox) {
      errBox.style.display = 'none';
      errBox.textContent = '';
    }
    if (okBox) {
      okBox.textContent = msg || 'Valmis';
      okBox.style.display = 'block';
    }
  }

  async function apiPost(url, data) {
    if (window.EuropagarUI?.postJson) {
      return window.EuropagarUI.postJson(url, data);
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data || {})
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok === false) {
      throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}`);
    }
    return json;
  }

  async function submitResetConfirm() {
    const password = String(p1?.value || '');
    const password2 = String(p2?.value || '');

    if (!token) {
      showErr('Vigane link: token puudub.');
      return;
    }
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      showErr('Vigane link: token on katkine.');
      return;
    }
    if (password.length < 8) {
      showErr('Parool peab olema vähemalt 8 tähemärki.');
      return;
    }
    if (password !== password2) {
      showErr('Paroolid ei ühti.');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    try {
      await apiPost('/api/password_reset_confirm.php', { token, password });
      showOk('Parool on uuendatud. Nüüd saad sisse logida.');
      if (p1) p1.value = '';
      if (p2) p2.value = '';
    } catch (error) {
      showErr(error.message || 'Viga. Proovi uuesti.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  if (!token) {
    if (submitBtn) submitBtn.disabled = true;
    showErr('Vigane link: token puudub.');
  } else if (!/^[a-f0-9]{64}$/i.test(token)) {
    if (submitBtn) submitBtn.disabled = true;
    showErr('Vigane link: token on katkine.');
  }

  if (tokenBox) {
    tokenBox.style.display = 'none';
    tokenBox.textContent = '';
  }

  submitBtn?.addEventListener('click', submitResetConfirm);
  [p1, p2].forEach((input) => {
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitResetConfirm();
      }
    });
  });
});
