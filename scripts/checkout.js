const CHECKOUT_CART_KEY = 'europagar_cart';
    const CHECKOUT_LEGACY_CART_KEY = 'cart';
    let selectedPaymentMethod = '';

    function safeJSONParse(raw, fallback) {
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    }

    function normalizeCheckoutItem(it) {
      const qty = Math.max(1, Number(it?.qty ?? 1) || 1);
      const unitPrice = Number(it?.unitPrice ?? it?.price ?? 0) || 0;

      return {
        key: String(it?.key ?? ''),
        productId: String(it?.productId ?? it?.id ?? ''),
        sku: String(it?.sku ?? ''),
        title: String(it?.title ?? 'Toode'),
        packLabel: String(it?.packLabel ?? it?.pack ?? ''),
        unitPrice,
        qty,
        note: String(it?.note ?? '')
      };
    }

    function readCheckoutCartRaw(key) {
      const raw = localStorage.getItem(key);
      const arr = safeJSONParse(raw, []);
      return Array.isArray(arr) ? arr : [];
    }

    function readCheckoutCart() {
      const current = readCheckoutCartRaw(CHECKOUT_CART_KEY);
      if (current.length) return current.map(normalizeCheckoutItem);

      const legacy = readCheckoutCartRaw(CHECKOUT_LEGACY_CART_KEY);
      if (legacy.length) return legacy.map(normalizeCheckoutItem);

      return [];
    }

    function formatEUR(value) {
      return new Intl.NumberFormat('et-EE', {
        style: 'currency',
        currency: 'EUR'
      }).format(Number(value || 0));
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function calcCheckoutTotals(items) {
      let qty = 0;
      let total = 0;

      for (const item of items) {
        const itemQty = Number(item.qty || 0);
        const itemPrice = Number(item.unitPrice || 0);
        qty += itemQty;
        total += itemQty * itemPrice;
      }

      return { qty, total };
    }

    function renderCheckoutSummary() {
      const tbody = document.getElementById('orderRows');
      const totalEl = document.getElementById('orderTotal');
      if (!tbody || !totalEl) return;

      const cart = readCheckoutCart();
      tbody.innerHTML = '';

      if (!cart.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="2" style="padding:14px 0; color:#5f6f86;">
              Ostukorv on tühi.
            </td>
          </tr>
        `;
        totalEl.textContent = formatEUR(0);
        syncPlaceOrderState();
        return;
      }

      cart.forEach((item) => {
        const tr = document.createElement('tr');
        const lineTotal = Number(item.unitPrice || 0) * Number(item.qty || 0);

        tr.innerHTML = `
          <td>
            <div style="font-weight:700;">${escapeHtml(item.title)}</div>
            <div style="font-size:14px;color:#5f6f86;margin-top:4px;">
              ${escapeHtml(item.packLabel || '—')} × ${item.qty}
            </div>
          </td>
          <td style="text-align:right; white-space:nowrap;">
            ${formatEUR(lineTotal)}
          </td>
        `;

        tbody.appendChild(tr);
      });

      const { total } = calcCheckoutTotals(cart);
      totalEl.textContent = formatEUR(total);
      syncPlaceOrderState();
    }

    function buildItemsFromCart() {
      return readCheckoutCart()
        .map(item => ({
          product_id: Number(item.productId || 0) || null,
          sku: String(item.sku || '').trim(),
          pack_label: String(item.packLabel || '').trim(),
          name: item.packLabel ? `${item.title} ${item.packLabel}`.trim() : item.title,
          qty: Number(item.qty || 1),
          price_cents: Math.round(Number(item.unitPrice || 0) * 100)
        }))
        .filter(item => item.name && item.qty > 0 && item.price_cents > 0);
    }

    function getTotalFromCart() {
      const cart = readCheckoutCart();
      const { total } = calcCheckoutTotals(cart);
      return Math.round(total * 100);
    }

    function updateCheckoutBadge() {
      const cart = readCheckoutCart();
      const { qty } = calcCheckoutTotals(cart);
      const badge = document.getElementById('cartBadge');
      if (!badge) return;
      badge.textContent = String(qty);
      badge.style.display = qty > 0 ? 'flex' : 'none';
    }

    async function apiPost(url, data){
      if (window.EuropagarUI?.postJson) {
        return window.EuropagarUI.postJson(url, data);
      }
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });
      const j = await r.json().catch(() => null);
      if (!j || !j.ok) throw new Error((j && j.error) ? j.error : 'API error');
      return j;
    }

    function isValidEmail(email){
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    function showOrderError(msg){
      const box = document.getElementById('formError');
      if (!box) return;
      box.textContent = msg;
      box.style.display = 'block';
    }

    function showLoginError(msg){
      const box = document.getElementById('loginError');
      if (!box) return;
      box.textContent = msg;
      box.style.display = 'block';
    }

    function clearOrderError(){
      const box = document.getElementById('formError');
      if (!box) return;
      box.style.display = 'none';
      box.textContent = '';
    }

    function clearLoginError(){
      const box = document.getElementById('loginError');
      if (!box) return;
      box.style.display = 'none';
      box.textContent = '';
    }

    function clearCartEverywhere(){
      try {
        if (typeof window.clearCart === 'function') {
          window.clearCart();
        }

        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
        localStorage.removeItem('cart_total');
        localStorage.removeItem('europagar_cart');

        const badge = document.getElementById('cartBadge');
        if (badge) {
          badge.textContent = '0';
          badge.style.display = 'none';
        }

        renderCheckoutSummary();
      } catch (e) {}
    }

    function syncPlaceOrderState() {
      const btn = document.getElementById('placeOrder');
      const terms = document.getElementById('terms');
      if (!btn || !terms) return;

      const hasCart = buildItemsFromCart().length > 0;
      const ok = !!selectedPaymentMethod && !!terms.checked && hasCart;

      btn.disabled = !ok;
    }

    function initPaymentButtons() {
      document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.pay-btn').forEach(b => {
            b.classList.remove('is-active');
            b.setAttribute('aria-pressed', 'false');
          });

          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
          selectedPaymentMethod = btn.dataset.pay || '';
          clearOrderError();
          syncPlaceOrderState();
        });
      });
    }

    function initTermsWatcher() {
      const terms = document.getElementById('terms');
      terms?.addEventListener('change', () => {
        clearOrderError();
        syncPlaceOrderState();
      });
    }

    (function initCreateAccountToggle(){
      const cb = document.getElementById('createAccount');
      const row = document.getElementById('passwordRow');
      const pass = document.getElementById('billPassword');

      function sync(){
        const on = !!cb?.checked;
        if (row) row.style.display = on ? 'block' : 'none';
        if (pass && !on) pass.value = '';
      }

      cb?.addEventListener('change', sync);
      sync();
    })();

    document.getElementById('placeOrder')?.addEventListener('click', async (e) => {
      e.preventDefault();
      clearOrderError();

      const first_name = document.getElementById('billFirst')?.value.trim() || '';
      const last_name  = document.getElementById('billLast')?.value.trim() || '';
      const phone      = document.getElementById('billPhone')?.value.trim() || '';
      const email      = document.getElementById('billEmail')?.value.trim() || '';
      const notes      = document.getElementById('billNotes')?.value.trim() || '';
      const termsAccepted = !!document.getElementById('terms')?.checked;

      const items = buildItemsFromCart();
      const total_cents = getTotalFromCart();
      const shipping_text = document.getElementById('shippingText')?.textContent || '';

      const create_account = document.getElementById('createAccount')?.checked || false;
      const password = document.getElementById('billPassword')?.value || '';

      const problems = [];
      if (!first_name) problems.push('Eesnimi');
      if (!last_name) problems.push('Perekonnanimi');
      if (!phone) problems.push('Telefon');
      if (!isValidEmail(email)) problems.push('E-posti aadress');
      if (!selectedPaymentMethod) problems.push('Makseviis');
      if (!termsAccepted) problems.push('Müügitingimused');
      if (!items.length) problems.push('Ostukorv');
      if (total_cents <= 0) problems.push('Summa');
      if (create_account && password.length < 8) problems.push('Parool (min 8)');

      if (problems.length) {
        showOrderError('Palun kontrollige: ' + problems.join(', '));
        syncPlaceOrderState();
        return;
      }

      const btn = document.getElementById('placeOrder');
      if (btn) btn.disabled = true;

      const payload = {
        first_name,
        last_name,
        phone,
        email,
        notes,
        shipping_method: 'pickup',
        shipping_text,
        payment_method: selectedPaymentMethod,
        items,
        total_cents
      };

      if (create_account) {
        payload.create_account = true;
        payload.password = password;
      }

      try {
        const res = await apiPost('/api/order_create.php', payload);

        if (!res.order_id) {
          throw new Error('Order ID puudub.');
        }

        const paymentUrl =
          res.payment_url ||
          `/api/payment_redirect.php?order_id=${encodeURIComponent(res.order_id)}&method=${encodeURIComponent(selectedPaymentMethod)}`;

        window.location.href = paymentUrl;
      } catch (e) {
        showOrderError(e.message || 'Viga tellimuse loomisel.');
        syncPlaceOrderState();
      }
    });

    const loginSection = document.getElementById('loginSectionWrap');
    const resetBox = document.getElementById('resetBox');

    function openLoginSection() {
      clearLoginError();
      if (loginSection) loginSection.style.display = 'block';
    }

    function closeLoginSection() {
      clearLoginError();
      if (loginSection) loginSection.style.display = 'none';
    }

    function syncCheckoutHashState() {
      const hash = (location.hash || '').toLowerCase();

      if (hash === '#login') {
        openLoginSection();
        if (resetBox) resetBox.style.display = 'none';
        return;
      }

      if (hash === '#forgot') {
        openLoginSection();
        if (resetBox) resetBox.style.display = 'block';
        return;
      }

      if (resetBox) resetBox.style.display = 'none';
      closeLoginSection();
    }

    document.addEventListener('click', (e) => {
      const openLoginLink = e.target.closest('#openLogin');
      if (openLoginLink) {
        e.preventDefault();

        if (location.hash !== '#login') {
          location.hash = 'login';
        } else {
          syncCheckoutHashState();
        }
        return;
      }

      const closeLoginBtn = e.target.closest('#closeLogin');
      if (closeLoginBtn) {
        e.preventDefault();
        history.replaceState(null, '', location.pathname + location.search);
        syncCheckoutHashState();
      }
    });

    window.addEventListener('hashchange', syncCheckoutHashState);
    document.addEventListener('cms:page-content-loaded', syncCheckoutHashState);

    async function submitCheckoutLogin(){
      clearLoginError();

      const email = document.getElementById('loginEmail')?.value.trim() || '';
      const password = document.getElementById('loginPassword')?.value || '';
      const remember = document.getElementById('rememberMe')?.checked || false;

      if (!isValidEmail(email) || !password) {
        showLoginError('Palun sisesta e-post ja parool.');
        return;
      }

      try {
        await apiPost('/api/auth_login.php', { email, password, remember });
        window.location.href = 'checkout.html';
      } catch (e) {
        showLoginError(e.message || 'Login error');
      }
    }

    document.getElementById('loginBtn')?.addEventListener('click', submitCheckoutLogin);

    ['loginEmail', 'loginPassword'].forEach((id) => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitCheckoutLogin();
        }
      });
    });

      (function () {

        function updateProfileBtn() {
          const btn = document.getElementById('profileBtn');
          if (!btn) return;

          btn.href = 'checkout.html';

          function sanitizeAvatarUrl(value) {
            const raw = String(value || '').trim();
            if (!raw) return '';
            if (/^(?:javascript|data):/i.test(raw)) return '';
            return raw.replace(/["'<>]/g, '');
          }

          fetch('/api/auth_me.php', {
            credentials: 'include',
            cache: 'no-store'
          })
          .then(r => r.json())
          .then(j => {

            if (!j || !j.ok || !j.user){
              btn.href = 'checkout.html';
              btn.innerHTML = '<i class="fa-solid fa-user"></i>';
              return;
            }

            btn.href = 'account.html#profile';

            const avatarUrl = sanitizeAvatarUrl(j.user.avatar_url || '');
            const isVerified =
              Number(j.user.is_verified || 0) === 1 ||
              String(j.user.is_verified || '') === '1';

            /* если есть аватар */
            if (avatarUrl){

              /* подтвержденный пользователь */
              if (isVerified){

                btn.innerHTML = `
                  <span style="
                    position:relative;
                    width:100%;
                    height:100%;
                    display:block;
                  ">
                    <img src="${avatarUrl}" alt="Profile"
                      style="
                        width:100%;
                        height:100%;
                        border-radius:50%;
                        object-fit:cover;
                        display:block;
                        border:2px solid #c60b13;
                        box-sizing:border-box;
                      ">

                    <span style="
                      position:absolute;
                      right:-3px;
                      bottom:-3px;
                      width:16px;
                      height:16px;
                      border-radius:50%;
                      background:#E10600;
                      border:2px solid #fff;
                      display:flex;
                      align-items:center;
                      justify-content:center;
                      box-sizing:border-box;
                    ">
                      <svg viewBox="0 0 16 16" width="9" height="9">
                        <path d="M6.4 11.2 3.5 8.3l-1 1 3.9 3.9L13.5 6l-1-1z" fill="#fff"/>
                      </svg>
                    </span>
                  </span>
                `;

              } else {

                /* НЕ подтвержденный — просто аватар */
                btn.innerHTML = `
                  <img src="${avatarUrl}" alt="Profile"
                    style="
                      width:100%;
                      height:100%;
                      border-radius:50%;
                      object-fit:cover;
                      display:block;
                    ">
                `;

              }

            } else {

              btn.innerHTML = '<i class="fa-solid fa-user"></i>';

            }

          })
          .catch(() => {
            btn.href = 'checkout.html';
            btn.innerHTML = '<i class="fa-solid fa-user"></i>';
          });
        }

        if (document.readyState === 'loading'){
          document.addEventListener('DOMContentLoaded', updateProfileBtn);
        } else {
          updateProfileBtn();
        }

      })();

    (function initForgotPassword(){
      const resetBox   = document.getElementById('resetBox');
      const openForgot = document.getElementById('openForgot');
      const closeForgot= document.getElementById('closeForgot');
      const cancelBtn  = document.getElementById('resetCancel');
      const submitBtn  = document.getElementById('resetSubmit');

      const emailEl = document.getElementById('resetEmail');
      const errEl = document.getElementById('resetError');
      const okEl  = document.getElementById('resetOk');

      function showErr(msg){
        if (!errEl) return;
        errEl.textContent = msg || 'Palun kontrollige välju.';
        errEl.style.display = 'block';
      }

      function hideErr(){
        if (!errEl) return;
        errEl.style.display = 'none';
        errEl.textContent = '';
      }

      function showOk(msg){
        if (!okEl) return;
        okEl.textContent = msg || 'Kontrolli oma e-posti (ka Spam).';
        okEl.style.display = 'block';
      }

      function hideOk(){
        if (!okEl) return;
        okEl.style.display = 'none';
        okEl.textContent = '';
      }

      function openBox(e){
        e?.preventDefault?.();
        openLoginSection();
        hideErr();
        hideOk();
        if (resetBox) resetBox.style.display = 'block';
        if (emailEl) emailEl.focus();
        if (location.hash !== '#forgot') {
          history.replaceState(null, '', '#forgot');
        }
      }

      function closeBox(){
        hideErr();
        hideOk();
        if (resetBox) resetBox.style.display = 'none';
        if (location.hash === '#forgot') {
          history.replaceState(null, '', '#login');
        }
      }

      openForgot?.addEventListener('click', openBox);
      closeForgot?.addEventListener('click', closeBox);
      cancelBtn?.addEventListener('click', closeBox);

      async function submitResetRequest() {
        hideErr();
        hideOk();

        const email = (emailEl?.value || '').trim();
        if (!isValidEmail(email)) {
          showErr('Sisesta korrektne e-post.');
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
          await apiPost('/api/password_reset_request.php', { email });
          showOk('Link parooli taastamiseks saadeti e-postile. Kontrolli ka Spam kausta.');
        } catch (e) {
          showErr(e.message || 'Viga. Proovi uuesti.');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      }

      submitBtn?.addEventListener('click', submitResetRequest);
      emailEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitResetRequest();
        }
      });
    })();

    syncCheckoutHashState();

    (function hideLoginNoticeIfAuthed(){
      const notice = document.getElementById('loginNotice');
      if (!notice) return;

      fetch('/api/auth_me.php', { credentials:'include', cache:'no-store' })
        .then(r => r.json())
        .then(j => {
          if (j && j.ok && j.user) {
            notice.style.display = 'none';

            const loginSection = document.getElementById('loginSectionWrap');
            if (loginSection) loginSection.style.display = 'none';
          }
        })
        .catch(() => {});
    })();

    (async function checkoutAuthCleanup(){
      const noticeSection = document.getElementById('loginNoticeSection');
      const loginWrap     = document.getElementById('loginSectionWrap');
      const createRow     = document.getElementById('createAccountRow');
      const passRow       = document.getElementById('passwordRow');
      const createCb      = document.getElementById('createAccount');

      try {
        const r = await fetch('/api/auth_me.php', { credentials:'include', cache:'no-store' });
        const j = await r.json().catch(() => null);

        const authed = !!(j && j.ok && j.user);

        if (!authed) return;

        if (noticeSection) noticeSection.style.display = 'none';
        if (loginWrap) loginWrap.style.display = 'none';
        if (createRow) createRow.style.display = 'none';
        if (passRow) passRow.style.display = 'none';
        if (createCb) createCb.checked = false;
      } catch (e) {}
    })();

    document.addEventListener('DOMContentLoaded', () => {
      renderCheckoutSummary();
      updateCheckoutBadge();
      initPaymentButtons();
      initTermsWatcher();
      syncPlaceOrderState();

      window.addEventListener('storage', () => {
        renderCheckoutSummary();
        updateCheckoutBadge();
        syncPlaceOrderState();
      });
    });
