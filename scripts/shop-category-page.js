(function () {
      const qs = new URLSearchParams(window.location.search || "");
      const slug = (qs.get("slug") || qs.get("category") || qs.get("cat") || "").trim();

      const body = document.body;
      const titleEl = document.getElementById("categoryTitle");
      const subEl = document.getElementById("categorySub");

      if (body) {
        body.dataset.categorySlug = slug;
      }

      if (!slug) {
        if (titleEl) titleEl.textContent = "E-Pood";
        if (subEl) subEl.textContent = "";
        return;
      }

      fetch(`api/shop_products.php?category=${encodeURIComponent(slug)}`, {
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          const category = data?.category || null;
          const categoryName = category?.name || slug;

          if (titleEl) titleEl.textContent = categoryName;
          if (subEl) subEl.textContent = categoryName;
        })
        .catch(() => {
          if (titleEl) titleEl.textContent = "E-Pood";
          if (subEl) subEl.textContent = slug;
        });
    })();

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
