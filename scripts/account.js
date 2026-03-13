document.addEventListener('DOMContentLoaded', () => {
  window.EuropagarUI?.updateProfileBtn({ buttonId:'profileBtn', authUrl:'/api/auth_me.php', accountHref:'account.html#profile', loginHref:'checkout.html' });
  window.EuropagarUI?.toggleAdminButton({ buttonId:'adminBtn', adminUrl:'/api/admin_me.php' });
});

async function apiGet(url){
  const r = await fetch(url, { credentials: 'same-origin' });
  const j = await r.json().catch(() => null);
  if(!j || !j.ok) throw new Error((j && j.error) ? j.error : 'API error');
  return j;
}

async function apiPost(url, data){
  if (window.EuropagarUI?.postJson) { return window.EuropagarUI.postJson(url, data); }
  const r = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    credentials:'same-origin',
    body: JSON.stringify(data)
  });
  const j = await r.json().catch(() => null);
  if(!j || !j.ok) throw new Error((j && j.error) ? j.error : 'API error');
  return j;
}

function showError(msg){
  const box = document.getElementById('globalError');
  if(!box) return;
  box.textContent = msg;
  box.style.display = 'block';
}

function clearError(){
  const box = document.getElementById('globalError');
  if(!box) return;
  box.style.display = 'none';
  box.textContent = '';
}

function centsToEur(c){
  const n = Number(c || 0);
  return (n/100).toFixed(2).replace('.', ',') + ' €';
}

function setActiveTab(tab){
  document.querySelectorAll('.tab').forEach(t => t.style.display = 'none');
  const cur = document.getElementById('tab-' + tab);
  if (cur) cur.style.display = 'block';

  document.querySelectorAll('.side-link[data-tab]').forEach(b => b.classList.remove('is-active'));
  document.querySelector('.side-link[data-tab="'+tab+'"]')?.classList.add('is-active');
}

function setVerification(isVerified){
  const wrap = document.getElementById('avatarWrap');
  if (!wrap) return;
  wrap.setAttribute('data-verified', isVerified ? '1' : '0');
}

function openTabFromHash(){
  const h = (location.hash || '').replace('#','').trim();
  if (!h) return;

  if (document.getElementById('tab-' + h)){
    setActiveTab(h);
  }
}

window.addEventListener('hashchange', openTabFromHash);
openTabFromHash();

async function loadMe(){
  const me = await apiGet('/api/auth_me.php');
  return me.user || null;
}

async function loadOrders(updateStats = true){
  const res = await apiGet('/api/orders_my.php');
  const list = document.getElementById('ordersList');
  if (!list) return;

  list.innerHTML = '';

  if(!res.orders || !res.orders.length){
    list.innerHTML = '<div class="hint">Tellimusi ei leitud.</div>';
    if (updateStats) {
      document.getElementById('statOrders') && (document.getElementById('statOrders').textContent = '0');
      document.getElementById('statLastOrder') && (document.getElementById('statLastOrder').textContent = '—');
    }
    return;
  }

  if (updateStats) {
    const latest = res.orders[0];
    document.getElementById('statOrders') && (document.getElementById('statOrders').textContent = String(res.orders.length));
    document.getElementById('statLastOrder') && (document.getElementById('statLastOrder').textContent = latest && latest.created_at ? new Date(latest.created_at).toLocaleDateString() : '—');
  }

  for(const o of res.orders){
    const el = document.createElement('div');
    el.className = 'order';

    const dt = new Date(o.created_at);
    const dateStr = isNaN(dt.getTime()) ? (o.created_at || '') : dt.toLocaleString();

    el.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-id">Tellimus #${o.id}</div>
          <div class="hint">${dateStr}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span class="badge">${o.payment_method || ''}</span>
          <span class="badge">${o.shipping_method || ''}</span>
          <span class="badge">${centsToEur(o.total_cents)} ${o.currency || ''}</span>
          <span class="badge">${o.status || 'new'}</span>
        </div>
      </div>

      <div class="order-items">
        ${(o.items||[]).map(it => `
          <div class="item-row">
            <div><strong>${it.product_name}</strong> <small>× ${it.qty}</small></div>
            <div>${centsToEur(it.line_total_cents)}</div>
          </div>
        `).join('')}
      </div>
    `;

    list.appendChild(el);
  }
}

async function uploadAvatar(file){
  const fd = new FormData();
  fd.append('avatar', file);

  if (window.EuropagarUI?.postForm) { const j = await window.EuropagarUI.postForm('/api/user_avatar_upload.php', fd); return j.avatar_url; }

  const r = await fetch('/api/user_avatar_upload.php', {
    method:'POST',
    credentials:'same-origin',
    body: fd
  });

  const j = await r.json().catch(() => null);
  if(!j || !j.ok) throw new Error((j && j.error) ? j.error : 'Upload failed');
  return j.avatar_url;
}

(async function init(){
    
  document.querySelectorAll('.side-link[data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tab = btn.dataset.tab;
      setActiveTab(tab);

      if (tab === 'orders') {
        try { clearError(); await loadOrders(false); }
        catch(e){ showError(e.message); }
      }
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try{
      await apiPost('/api/auth_logout.php', {});
      window.location.href = 'checkout.html#login';
    }catch(e){
      showError(e.message);
    }
  });

  try{
    clearError();

    const user = await loadMe();
      
      setVerification(!!user.is_verified);

    if(!user){
      window.location.href = 'checkout.html#login';
      return;
    }

    document.getElementById('helloText').textContent =
      (`Tere, ${user.first_name || ''} ${user.last_name || ''}`).trim();
    document.getElementById('statEmail') && (document.getElementById('statEmail').textContent = user.email || '—');
    document.getElementById('statVerified') && (document.getElementById('statVerified').textContent = Number(user.is_verified || 0) ? 'Kinnitatud' : 'Kinnitamata');

    document.getElementById('firstName').value = user.first_name || '';
    document.getElementById('lastName').value  = user.last_name || '';
    document.getElementById('email').value     = user.email || '';
    document.getElementById('phone').value     = user.phone || '';

    const avatarImg = document.getElementById('avatarImg');
    if (avatarImg) {
      if (user.avatar_url) {
        avatarImg.src = user.avatar_url;
        avatarImg.setAttribute('data-url', user.avatar_url);
      }
    }

    setActiveTab('profile');

    await loadOrders(true);

    document.getElementById('saveProfile')?.addEventListener('click', async () => {
      try{
        clearError();

        const first_name = document.getElementById('firstName').value.trim();
        const last_name  = document.getElementById('lastName').value.trim();
        const phone      = document.getElementById('phone').value.trim();
        const avatar_url = avatarImg?.getAttribute('data-url') || '';

        if (!first_name || !last_name) {
          showError('Eesnimi ja perekonnanimi on kohustuslikud.');
          return;
        }

        await apiPost('/api/user_profile_update.php', { first_name, last_name, phone, avatar_url });

        const ok = document.getElementById('profileOk');
        if (ok) {
          ok.style.display = 'inline-flex';
          setTimeout(()=> ok.style.display='none', 1600);
        }
      }catch(e){
        showError(e.message);
      }
    });

    document.getElementById('avatarFile')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if(!file) return;

      try{
        clearError();
        const url = await uploadAvatar(file);
        if (avatarImg) {
          avatarImg.src = url;
          avatarImg.setAttribute('data-url', url);
        }
      }catch(err){
        showError(err.message);
      }finally{
        e.target.value = '';
      }
    });

    document.getElementById('changePassword')?.addEventListener('click', async () => {
      try{
        clearError();
        const current_password = document.getElementById('curPass').value;
        const new_password = document.getElementById('newPass1').value;
        const new_password2 = document.getElementById('newPass2').value;

        if (!current_password || !new_password || !new_password2) {
          showError('Palun täitke kõik parooli väljad.');
          return;
        }

        await apiPost('/api/user_change_password.php', { current_password, new_password, new_password2 });

        document.getElementById('curPass').value = '';
        document.getElementById('newPass1').value = '';
        document.getElementById('newPass2').value = '';

        const ok = document.getElementById('passOk');
        if (ok) {
          ok.style.display = 'inline-flex';
          setTimeout(()=> ok.style.display='none', 1600);
        }
      }catch(e){
        showError(e.message);
      }
    });

  }catch(e){
    showError(e.message);
  }
})();
