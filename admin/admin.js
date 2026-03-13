(function () {
  "use strict";

  // =============================
  // DOM helpers
  // =============================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function pick(...selectors) {
    for (const sel of selectors) {
      const el = $(sel);
      if (el) return el;
    }
    return null;
  }

  function on(el, ev, fn, opts) {
    if (!el) return false;
    el.addEventListener(ev, fn, opts);
    return true;
  }

  // =============================
  // API
  // =============================
  const API = {
    me: "../api/admin_me.php",
    stats: "../api/admin_stats.php",

    ordersList: "../api/admin_orders_list.php",
    orderGet: "../api/admin_order_get.php",
    orderStatus: "../api/admin_order_update_status.php",

    usersList: "../api/admin_users_list.php",
    userToggleVerify: "../api/admin_user_toggle_verify.php",

    uploadsList: "../api/admin_uploads_list.php",
    uploadsDelete: "../api/admin_uploads_delete.php",

      shopInstall: "../api/admin_shop_install.php",

      catsList: "../api/admin_shop_categories_list.php",
      catCreate: "../api/admin_shop_category_create.php",
      catUpdate: "../api/admin_shop_category_update.php",
      catDelete: "../api/admin_shop_category_delete.php",
      catReorder: "../api/admin_shop_categories_reorder.php",

      prodsList: "../api/admin_shop_products_list.php",
      prodCreate: "../api/admin_shop_product_create.php",
      prodUpdate: "../api/admin_shop_product_update.php",
      prodDelete: "../api/admin_shop_product_delete.php",

      uploadImage: "../api/admin_upload_image.php",
      importProducts: "../api/admin_shop_import.php",
      siteList: "../api/admin_site_content_list.php",
      siteSave: "../api/admin_site_content_save.php",
      siteDelete: "../api/admin_site_content_delete.php",
      siteReorder: "../api/admin_site_content_reorder.php",
      siteMediaList: "../api/admin_site_media_list.php",
  };

  // =============================
  // State
  // =============================
  const state = {
    user: null,
    view: "dashboard",
    orders: { page: 1, limit: 20, q: "", status: "" },
    users: { page: 1, limit: 20, q: "" },
      shop: {
        catId: null,
        cats: [],
        products: [],
        productsReqSeq: 0,
        dragCatId: null,
      },
      site: { pageKey: 'home', items: [], media: [], dragId: null },
  };

  // =============================
  // Utils
  // =============================
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function euro(cents) {
    const v = Number(cents || 0) / 100;
    return v.toLocaleString("et-EE", { style: "currency", currency: "EUR" });
  }

  function dt(ts) {
    try {
      const d = new Date(String(ts || "").replace(" ", "T") + "Z");
      return d.toLocaleString("et-EE");
    } catch {
      return String(ts || "");
    }
  }

  function pill(status) {
    const s = (status || "").toLowerCase();
    const cls = s ? `pill is-${s}` : "pill";
    return `<span class="${cls}">${escapeHtml(status || "")}</span>`;
  }

  function showError(msg) {
    const box = pick("#globalError", "#shopError");
    if (!box) return;
    box.textContent = msg || "";
    box.style.display = msg ? "" : "none";
  }

    function slugifyCategory(input, maxLen = 80) {
      let s = String(input || "").trim().toLowerCase();

      s = s
        .replaceAll("ä", "a")
        .replaceAll("ö", "o")
        .replaceAll("õ", "o")
        .replaceAll("ü", "u")
        .replaceAll("š", "s")
        .replaceAll("ž", "z");

      s = s
        .replace(/[^a-z0-9 _-]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_]+|[-_]+$/g, "");

      if (maxLen > 0) s = s.slice(0, maxLen);
      return s;
    }

  function linesFromValue(val) {
    if (Array.isArray(val)) {
      return val.map((x) => String(x ?? "").trim()).filter(Boolean);
    }
    if (typeof val === "string") {
      return val
        .split(/\r\n|\r|\n/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return [];
  }

  function textFromLines(val) {
    return linesFromValue(val).join("\n");
  }

  function parseLinesTextarea(selector) {
    const el = document.querySelector(selector);
    const raw = (el?.value || "").trim();
    if (!raw) return [];
    return raw
      .split(/\r\n|\r|\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // =============================
  // API wrapper
  // =============================
    async function api(path, opts = {}) {
      const headers = { ...(opts.headers || {}) };
      if (!(opts.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        headers["Accept"] = headers["Accept"] || "application/json";
      }
      const requester = window.EuropagarUI?.requestWithCsrf;
      const res = requester
        ? await requester(path, { credentials: "include", ...opts, headers })
        : await fetch(path, { credentials: "include", ...opts, headers });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      if (data && typeof data === "object" && "ok" in data && !data.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }
      showError("");
      return data ?? { ok: true };
    }

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    const requester = window.EuropagarUI?.postForm;
    if (requester) return requester(API.uploadImage, fd);
    const res = await fetch(API.uploadImage, { method: "POST", credentials: "include", body: fd });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
    return data;
  }

  function extractUploadedUrl(resp) {
    return (
      resp?.url ||
      resp?.image_url ||
      resp?.path ||
      resp?.file ||
      resp?.location ||
      resp?.data?.url ||
      resp?.data?.image_url ||
      resp?.result?.url ||
      resp?.result?.image_url ||
      ""
    );
  }

  // =============================
  // Modal
  // =============================
  function openModal(title, bodyHtml, footHtml) {
    const titleEl = $("#modalTitle");
    const bodyEl = $("#modalBody");
    const footEl = $("#modalFoot");
    const m = $("#modal");
    if (!titleEl || !bodyEl || !footEl || !m) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footEl.innerHTML = footHtml || "";

    document.body.classList.add("modal-open");
    m.style.display = "";
    m.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const m = $("#modal");
    if (!m) return;

    document.body.classList.remove("modal-open");
    m.style.display = "none";
    m.setAttribute("aria-hidden", "true");
  }

  // =============================
  // Views
  // =============================
  function setView(view) {
    state.view = view;
    showError("");

    $$(".navbtn[data-view]").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.view === view)
    );
    $$(".view").forEach((v) => (v.style.display = "none"));

    const box = $(`#view-${view}`);
    if (box) box.style.display = "";

    const titleMap = {
      dashboard: { icon: "fa-gauge", text: "Ülevaade" },
      orders: { icon: "fa-clipboard-list", text: "Tellimused" },
      users: { icon: "fa-users", text: "Kasutajad" },
      uploads: { icon: "fa-folder-open", text: "Failid" },
      shop: { icon: "fa-store", text: "E-Pood" },
      site: { icon: "fa-panorama", text: "Avaleht / CMS" },
    };

    const t = titleMap[view] || titleMap.dashboard;
    const pageTitle = $("#pageTitle");
    if (pageTitle) {
      pageTitle.innerHTML = `<i class="fa-solid ${t.icon}"></i> ${t.text}`;
    }

    refreshCurrent().catch((err) => showError(err.message));
  }

  async function refreshCurrent() {
    if (!state.user) return;
    if (state.view === "dashboard") return loadDashboard();
    if (state.view === "orders") return loadOrders();
    if (state.view === "users") return loadUsers();
    if (state.view === "uploads") return loadFiles();
    if (state.view === "shop") return loadShop();
    if (state.view === "site") return loadSiteContent();
  }


  // =============================
  // SITE CONTENT / CMS
  // =============================
  function mediaPreviewHtml(url, type, alt = '') {
    const safeUrl = escapeHtml(url || '');
    const safeAlt = escapeHtml(alt || 'Media');
    if (!safeUrl) return '<span class="hint">—</span>';
    if (String(type || '').toLowerCase() === 'video' || /\.mp4(\?|$)/i.test(safeUrl)) {
      return `<video src="${safeUrl}" style="width:84px;height:54px;object-fit:cover;border-radius:10px;" muted playsinline preload="metadata"></video>`;
    }
    return `<img src="${safeUrl}" alt="${safeAlt}" style="width:84px;height:54px;object-fit:cover;border-radius:10px;">`;
  }

  async function loadSiteContent() {
    const data = await api(`${API.siteList}?page_key=${encodeURIComponent(state.site.pageKey)}`);
    const slides = Array.isArray(data.slides) ? data.slides : [];
    const blocks = Array.isArray(data.blocks) ? data.blocks : [];
    state.site.items = [...slides, ...blocks];
    const slidesTb = $("#siteSlidesTable tbody");
    const blocksTb = $("#siteBlocksTable tbody");
    if (slidesTb) slidesTb.innerHTML = "";
    if (blocksTb) blocksTb.innerHTML = "";
    slides.forEach((it) => {
      const tr = document.createElement("tr");
      tr.draggable = true;
      tr.dataset.id = String(it.id);
      tr.innerHTML = `<td><i class="fa-solid fa-grip-vertical"></i></td><td>${it.id}</td><td><b>${escapeHtml(it.block_key || "")}</b></td><td>${mediaPreviewHtml(it.media_url, it.media_type, it.image_alt || it.title)}</td><td>${escapeHtml(it.sort ?? 0)}</td><td>${Number(it.is_active) ? 'yes' : 'no'}</td><td class="right"><button class="btn btn-ghost" data-act="siteEdit" data-id="${it.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-ghost" data-act="siteDelete" data-id="${it.id}"><i class="fa-solid fa-trash"></i></button></td>`;
      if (slidesTb) slidesTb.appendChild(tr);
    });
    blocks.forEach((it) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${it.id}</td><td><b>${escapeHtml(it.block_key || "")}</b><div class="hint">${escapeHtml(it.page_key || '')}</div></td><td>${escapeHtml(it.title || "")}</td><td>${escapeHtml(it.sort ?? 0)}</td><td>${Number(it.is_active) ? 'yes' : 'no'}</td><td class="right"><button class="btn btn-ghost" data-act="siteEdit" data-id="${it.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-ghost" data-act="siteDelete" data-id="${it.id}"><i class="fa-solid fa-trash"></i></button></td>`;
      if (blocksTb) blocksTb.appendChild(tr);
    });
    bindSlidesDragAndDrop();
  }

  function bindSlidesDragAndDrop() {
    const rows = $$("#siteSlidesTable tbody tr");
    rows.forEach((row) => {
      row.addEventListener('dragstart', () => { state.site.dragId = Number(row.dataset.id || 0); row.classList.add('is-dragging'); });
      row.addEventListener('dragend', () => { row.classList.remove('is-dragging'); state.site.dragId = null; });
      row.addEventListener('dragover', (e) => { e.preventDefault(); });
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        const fromId = Number(state.site.dragId || 0);
        const toId = Number(row.dataset.id || 0);
        if (!fromId || !toId || fromId === toId) return;
        const tb = $("#siteSlidesTable tbody");
        const fromRow = tb && tb.querySelector(`tr[data-id="${fromId}"]`);
        const toRow = tb && tb.querySelector(`tr[data-id="${toId}"]`);
        if (!tb || !fromRow || !toRow) return;
        tb.insertBefore(fromRow, toRow);
        const items = Array.from(tb.querySelectorAll('tr')).map((tr, idx) => ({ id: Number(tr.dataset.id || 0), sort: idx + 1 }));
        await api(API.siteReorder, { method:'POST', body: JSON.stringify({ items }) });
        await loadSiteContent();
      });
    });
  }

  async function openMediaManagerModal(onPick) {
    const data = await api(API.siteMediaList);
    state.site.media = Array.isArray(data.items) ? data.items : [];
    const body = `<div class="grid">${state.site.media.map((m, i) => `<button type="button" class="media-card" data-media-pick="${i}" style="border:1px solid #dfe4ea;background:#fff;border-radius:16px;padding:10px;text-align:left;cursor:pointer;">${mediaPreviewHtml(m.url, m.media_type, m.name)}<div style="margin-top:8px;font-size:12px;word-break:break-all;">${escapeHtml(m.name)}</div><div class="hint">${escapeHtml(m.media_type)}</div></button>`).join('')}</div>`;
    openModal('Media manager', body, `<button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>`);
    $$("[data-media-pick]").forEach((btn) => on(btn, 'click', () => { const item = state.site.media[Number(btn.dataset.mediaPick || 0)]; if (item && onPick) onPick(item); closeModal(); }));
  }

  function openSiteContentModal(item = null, type = 'section') {
    const it = item || { id:0, page_key: state.site.pageKey, block_key:'', block_type:type, name:'', eyebrow:'', title:'', content_html:'', media_url:'', media_type: type === 'hero_slide' ? 'image' : 'image', image_alt:'', button_primary_label:'', button_primary_url:'', button_secondary_label:'', button_secondary_url:'', sort:0, is_active:1 };
    const body = `<div class="grid">
      <div class="field"><label>Page</label><select class="input" id="sitePageKey"><option value="home">home</option><option value="checkout">checkout</option><option value="cart">cart</option><option value="privacy">privacy</option><option value="kuidas_tellida">kuidas_tellida</option><option value="notfound">notfound</option><option value="reset_password">reset_password</option><option value="shop_category">shop_category</option></select></div>
      <div class="field"><label>Key</label><input class="input" id="siteBlockKey" value="${escapeHtml(it.block_key || '')}" placeholder="hero-slide-5"></div>
      <div class="field"><label>Tüüp</label><select class="input" id="siteBlockType"><option value="section" ${it.block_type === 'section' ? 'selected' : ''}>section</option><option value="hero_slide" ${it.block_type === 'hero_slide' ? 'selected' : ''}>hero_slide</option></select></div>
      <div class="field"><label>Meedia tüüp</label><select class="input" id="siteMediaType"><option value="image" ${it.media_type === 'image' ? 'selected' : ''}>image</option><option value="video" ${it.media_type === 'video' ? 'selected' : ''}>video</option></select></div>
      <div class="field"><label>Sisemine nimi</label><input class="input" id="siteName" value="${escapeHtml(it.name || '')}"></div>
      <div class="field"><label>Eyebrow</label><input class="input" id="siteEyebrow" value="${escapeHtml(it.eyebrow || '')}"></div>
      <div class="field"><label>Pealkiri</label><input class="input" id="siteTitle" value="${escapeHtml(it.title || '')}"></div>
      <div class="field"><label>Sort</label><input class="input" id="siteSort" type="number" value="${escapeHtml(it.sort ?? 0)}"></div>
      <div class="field"><label>Aktiivne</label><select class="input" id="siteActive"><option value="1" ${Number(it.is_active) ? 'selected' : ''}>yes</option><option value="0" ${Number(it.is_active) ? '' : 'selected'}>no</option></select></div>
      <div class="field" style="grid-column:1/-1;"><label>Meedia URL</label><div style="display:flex;gap:8px;"><input class="input" id="siteMediaUrl" value="${escapeHtml(it.media_url || '')}" placeholder="/images/uploads/site-media/example.mp4"><button type="button" class="btn btn-ghost" id="siteChooseMedia"><i class="fa-solid fa-photo-film"></i> Media manager</button></div><div id="siteMediaPreview" style="margin-top:8px;">${mediaPreviewHtml(it.media_url, it.media_type, it.image_alt || it.title)}</div></div>
      <div class="field" style="grid-column:1/-1;"><label>Laadi fail üles</label><input class="input" id="siteMediaFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"><div id="siteMediaUploadStatus" class="hint"></div></div>
      <div class="field" style="grid-column:1/-1;"><label>Alt tekst</label><input class="input" id="siteAlt" value="${escapeHtml(it.image_alt || '')}"></div>
      <div class="field" style="grid-column:1/-1;"><label>Sisu (HTML lubatud)</label><textarea class="input" id="siteContentHtml" rows="10">${escapeHtml(it.content_html || '')}</textarea></div>
      <div class="field"><label>Primary nupp</label><input class="input" id="siteBtn1Label" value="${escapeHtml(it.button_primary_label || '')}"></div>
      <div class="field"><label>Primary URL</label><input class="input" id="siteBtn1Url" value="${escapeHtml(it.button_primary_url || '')}"></div>
      <div class="field"><label>Secondary nupp</label><input class="input" id="siteBtn2Label" value="${escapeHtml(it.button_secondary_label || '')}"></div>
      <div class="field"><label>Secondary URL</label><input class="input" id="siteBtn2Url" value="${escapeHtml(it.button_secondary_url || '')}"></div>
    </div>`;
    const foot = `<button class="btn" id="siteSave"><i class="fa-solid fa-floppy-disk"></i> Salvesta</button><button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>`;
    openModal(it.id ? `Muuda plokki #${it.id}` : 'Uus CMS plokk', body, foot);
    $("#sitePageKey").value = it.page_key || state.site.pageKey || 'home';
    on($("#siteChooseMedia"), 'click', () => openMediaManagerModal((item) => { $("#siteMediaUrl").value = item.url || ''; $("#siteMediaType").value = item.media_type || 'image'; const prev = $("#siteMediaPreview"); if (prev) prev.innerHTML = mediaPreviewHtml(item.url, item.media_type, item.name); }).catch((err)=>showError(err.message)));
    on($("#siteMediaFile"), "change", async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return; const statusEl = $("#siteMediaUploadStatus"); if (statusEl) statusEl.textContent = 'Laadin faili üles...';
      try { const resp = await uploadImage(file); const url = extractUploadedUrl(resp); if (!url) throw new Error('Upload succeeded but URL missing'); $("#siteMediaUrl").value = url; if (resp.media_type && $("#siteMediaType")) $("#siteMediaType").value = resp.media_type; if (statusEl) statusEl.textContent = 'Fail üles laaditud.'; const prev = $("#siteMediaPreview"); if (prev) prev.innerHTML = mediaPreviewHtml(url, resp.media_type, file.name); } catch (err) { if (statusEl) statusEl.textContent = ''; showError(err.message || 'Upload failed'); }
    });
    on($("#siteSave"), "click", async () => {
      try {
        await api(API.siteSave, { method: 'POST', body: JSON.stringify({ id:Number(it.id || 0), page_key: $("#sitePageKey")?.value || state.site.pageKey || 'home', block_key: $("#siteBlockKey")?.value?.trim() || '', block_type: $("#siteBlockType")?.value || 'section', name: $("#siteName")?.value?.trim() || '', eyebrow: $("#siteEyebrow")?.value?.trim() || '', title: $("#siteTitle")?.value?.trim() || '', media_type: $("#siteMediaType")?.value || 'image', media_url: $("#siteMediaUrl")?.value?.trim() || '', image_alt: $("#siteAlt")?.value?.trim() || '', content_html: $("#siteContentHtml")?.value || '', button_primary_label: $("#siteBtn1Label")?.value?.trim() || '', button_primary_url: $("#siteBtn1Url")?.value?.trim() || '', button_secondary_label: $("#siteBtn2Label")?.value?.trim() || '', button_secondary_url: $("#siteBtn2Url")?.value?.trim() || '', sort: Number($("#siteSort")?.value || 0), is_active: Number($("#siteActive")?.value || 1) })});
        closeModal(); await loadSiteContent();
      } catch (err) { showError(err.message || 'Save failed'); }
    }, { once: true });
  }

  // =============================
  // Boot
  // =============================
  async function boot() {
    on($("#sitePageFilter"), 'change', (e) => { state.site.pageKey = e.target.value || 'home'; if (state.view === 'site') loadSiteContent().catch((err)=>showError(err.message)); });
    try {
      const me = await api(API.me);
      state.user = me.user || me;

      const whoBox = $("#whoBox");
      if (whoBox) whoBox.style.display = "";

      const fn = state.user.first_name || "";
      const ln = state.user.last_name || "";
      const whoName = $("#whoName");
      const whoEmail = $("#whoEmail");

      if (whoName) whoName.textContent = (fn || ln) ? `${fn} ${ln}`.trim() : "Admin";
      if (whoEmail) whoEmail.textContent = state.user.email || "";

      setView("dashboard");
    } catch (err) {
      showError("Ligipääs puudub. Logi sisse admin kasutajaga.");
      openModal(
        "Ligipääs puudub",
        `<div class="alert">${escapeHtml(err.message)}</div>
         <div class="hint">Admin kasutab sama kontosüsteemi. Logi sisse ja tule siia tagasi.</div>`,
        `<a class="btn" href="../account.html"><i class="fa-solid fa-right-to-bracket"></i> Konto / Login</a>
         <button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>`
      );
    }
  }

  // =============================
  // Dashboard
  // =============================
  async function loadDashboard() {
    const data = await api(API.stats);
    showError("");

    const statNew = $("#statNew");
    const statToday = $("#statToday");
    const statUsers = $("#statUsers");
    const statFiles = $("#statFiles");

    if (statNew) statNew.textContent = String(data.stats?.new_orders ?? 0);
    if (statToday) statToday.textContent = euro(data.stats?.today_total_cents ?? 0);
    if (statUsers) statUsers.textContent = String(data.stats?.users ?? 0);
    if (statFiles) statFiles.textContent = String(data.stats?.upload_files ?? 0);

    const tb = $("#dashOrders tbody");
    if (!tb) return;
    tb.innerHTML = "";

    (data.latest_orders || []).forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>#${o.id}</b></td>
        <td>${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)}</td>
        <td>${euro(o.total_cents)}</td>
        <td>${pill(o.status)}</td>
        <td>${dt(o.created_at)}</td>
      `;
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => openOrder(o.id));
      tb.appendChild(tr);
    });
  }

  // =============================
  // Orders
  // =============================
  async function loadOrders() {
    const qs = new URLSearchParams({
      page: String(state.orders.page),
      limit: String(state.orders.limit),
      q: state.orders.q || "",
      status: state.orders.status || "",
    });

    const data = await api(`${API.ordersList}?${qs.toString()}`);
    showError("");

    const ordersPage = $("#ordersPage");
    const ordersPrev = $("#ordersPrev");
    const ordersNext = $("#ordersNext");

    if (ordersPage) {
      ordersPage.textContent = `Leht ${data.page} / ${data.pages} (kokku ${data.total})`;
    }
    if (ordersPrev) ordersPrev.disabled = data.page <= 1;
    if (ordersNext) ordersNext.disabled = data.page >= data.pages;

    const tb = $("#ordersTable tbody");
    if (!tb) return;
    tb.innerHTML = "";

    (data.orders || []).forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>#${o.id}</b></td>
        <td>${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)}</td>
        <td>
          <div>${escapeHtml(o.email)}</div>
          <div class="hint">${escapeHtml(o.phone || "")}</div>
        </td>
        <td>
          <div><b>${escapeHtml(o.shipping_method)}</b></div>
          <div class="hint">${escapeHtml(o.shipping_text || "")}</div>
        </td>
        <td>${escapeHtml(o.payment_method)}</td>
        <td><b>${euro(o.total_cents)}</b></td>
        <td>${pill(o.status)}</td>
        <td>${dt(o.created_at)}</td>
        <td><button class="btn btn-ghost" data-open="${o.id}"><i class="fa-solid fa-eye"></i></button></td>
      `;
      tb.appendChild(tr);
    });
  }

  async function openOrder(id) {
    const data = await api(`${API.orderGet}?id=${encodeURIComponent(String(id))}`);
    const o = data.order;
    const items = data.items || [];

    const body = `
      <div class="kv"><div class="k">Tellimus</div><div class="v"><b>#${o.id}</b> ${pill(o.status)}</div></div>
      <div class="kv"><div class="k">Aeg</div><div class="v">${dt(o.created_at)}</div></div>
      <div class="kv"><div class="k">Klient</div><div class="v">${escapeHtml(o.first_name)} ${escapeHtml(o.last_name)} — <code>${escapeHtml(o.email)}</code></div></div>
      <div class="kv"><div class="k">Telefon</div><div class="v">${escapeHtml(o.phone || "")}</div></div>
      <div class="kv"><div class="k">Tarne</div><div class="v"><b>${escapeHtml(o.shipping_method)}</b> ${escapeHtml(o.shipping_text || "")}</div></div>
      <div class="kv"><div class="k">Makse</div><div class="v">${escapeHtml(o.payment_method)}</div></div>
      <div class="kv"><div class="k">Märkused</div><div class="v">${escapeHtml(o.notes || "")}</div></div>
      <div class="kv"><div class="k">Kokku</div><div class="v"><b>${euro(o.total_cents)}</b></div></div>

      <div class="items">
        <div class="row head">
          <div>Toode</div>
          <div class="right">Kogus</div>
          <div class="right">Hind</div>
          <div class="right">Rida</div>
        </div>
        ${items.map((it) => `
          <div class="row">
            <div>
              <div><b>${escapeHtml(it.product_name)}</b></div>
              <div class="hint">${escapeHtml(it.product_id || "")}</div>
            </div>
            <div class="right">${it.qty}</div>
            <div class="right">${euro(it.price_cents)}</div>
            <div class="right"><b>${euro(it.line_total_cents)}</b></div>
          </div>
        `).join("")}
      </div>
    `;

    const foot = `
      <select class="input" id="orderStatus" style="max-width:220px;">
        ${["new", "processing", "done", "cancelled"]
          .map((s) => `<option value="${s}" ${String(o.status) === s ? "selected" : ""}>${s}</option>`)
          .join("")}
      </select>
      <button class="btn" id="saveOrder"><i class="fa-solid fa-floppy-disk"></i> Salvesta</button>
      <button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>
    `;

    openModal(`Tellimus #${o.id}`, body, foot);

    on($("#saveOrder"), "click", async () => {
      const status = $("#orderStatus")?.value || "";
      try {
        await api(API.orderStatus, {
          method: "POST",
          body: JSON.stringify({ id: o.id, status }),
        });
        showError("");
        closeModal();
        await refreshCurrent();
      } catch (err) {
        showError(err.message);
      }
    }, { once: true });
  }

  // =============================
  // Users
  // =============================
  async function loadUsers() {
    const qs = new URLSearchParams({
      page: String(state.users.page),
      limit: String(state.users.limit),
      q: state.users.q || "",
    });

    const data = await api(`${API.usersList}?${qs.toString()}`);
    showError("");

    const usersPage = $("#usersPage");
    const usersPrev = $("#usersPrev");
    const usersNext = $("#usersNext");

    if (usersPage) {
      usersPage.textContent = `Leht ${data.page} / ${data.pages} (kokku ${data.total})`;
    }
    if (usersPrev) usersPrev.disabled = data.page <= 1;
    if (usersNext) usersNext.disabled = data.page >= data.pages;

    const tb = $("#usersTable tbody");
    if (!tb) return;
    tb.innerHTML = "";

    (data.users || []).forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>#${u.id}</b></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml((u.first_name || "") + " " + (u.last_name || ""))}</td>
        <td>${escapeHtml(u.phone || "")}</td>
        <td>${u.is_verified ? '<span class="pill is-done">yes</span>' : '<span class="pill">no</span>'}</td>
        <td>${dt(u.created_at)}</td>
        <td>
          <button class="btn btn-ghost" data-act="toggleVerify" data-u="${u.id}">
            <i class="fa-solid fa-check"></i>
          </button>
        </td>
      `;
      tb.appendChild(tr);
    });
  }

  // =============================
  // Files
  // =============================
  async function loadFiles() {
    const data = await api(API.uploadsList);
    showError("");

    const tb = $("#filesTable tbody");
    if (!tb) return;
    tb.innerHTML = "";

    (data.files || []).forEach((f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div><b>${escapeHtml(f.name)}</b></div>
          <div class="hint">${escapeHtml(f.rel)}</div>
        </td>
        <td>${escapeHtml(f.size_h)}</td>
        <td>${escapeHtml(f.mtime_h)}</td>
        <td><button class="btn btn-danger" data-del="${escapeHtml(f.rel)}"><i class="fa-solid fa-trash"></i></button></td>
      `;
      tb.appendChild(tr);
    });
  }

  // =============================
  // SHOP
  // =============================
  function getShopSelect() {
    return pick("#shopCategorySelect", "#catSelect");
  }

  function getCatsTableBody() {
    return pick("#shopCategoriesTable tbody", "#catsTable tbody");
  }

  function getProdsTableBody() {
    return pick("#shopProductsTable tbody", "#prodsTable tbody");
  }

  function clearProductsTable() {
    const prodsTb = getProdsTableBody();
    if (prodsTb) prodsTb.innerHTML = "";
  }

  async function loadShop() {
    showError("");
    await loadCats();
  }

    async function loadCats() {
      const data = await api(API.catsList);
      const cats = data.categories || [];
      state.shop.cats = cats;

      const sel = getShopSelect();
      if (sel) {
        const prevValue = sel.value ? Number(sel.value) : null;

        sel.innerHTML =
          `<option value="">—</option>` +
          cats.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

        let nextCatId = null;

        if (state.shop.catId && cats.some((c) => Number(c.id) === Number(state.shop.catId))) {
          nextCatId = Number(state.shop.catId);
        } else if (prevValue && cats.some((c) => Number(c.id) === prevValue)) {
          nextCatId = prevValue;
        } else if (cats.length) {
          nextCatId = Number(cats[0].id);
        }

        state.shop.catId = nextCatId;
        sel.value = nextCatId ? String(nextCatId) : "";
      }

      const catsTb = getCatsTableBody();
      if (catsTb) {
        catsTb.innerHTML = "";

        cats.forEach((c) => {
          const tr = document.createElement("tr");
          tr.draggable = true;
          tr.dataset.catId = String(c.id);

          tr.innerHTML = `
            <td style="cursor:grab;">↕</td>
            <td>${c.id}</td>
            <td><b>${escapeHtml(c.name)}</b></td>
            <td>${escapeHtml(c.slug || "")}</td>
            <td>${escapeHtml(c.sort ?? c.sort_order ?? 0)}</td>
            <td>${Number(c.is_active) ? "yes" : "no"}</td>
            <td class="right">
              <button class="btn btn-ghost" data-act="catEdit" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-ghost" data-act="catDel" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
          `;

          tr.addEventListener("dragstart", () => {
            state.shop.dragCatId = Number(c.id);
            tr.classList.add("is-dragging");
          });

          tr.addEventListener("dragend", () => {
            state.shop.dragCatId = null;
            tr.classList.remove("is-dragging");
          });

          tr.addEventListener("dragover", (ev) => {
            ev.preventDefault();
          });

          tr.addEventListener("drop", async (ev) => {
            ev.preventDefault();

            const fromId = Number(state.shop.dragCatId || 0);
            const toId = Number(c.id);

            if (!fromId || !toId || fromId === toId) return;

            const orderedIds = Array.from(catsTb.querySelectorAll("tr"))
              .map((row) => Number(row.dataset.catId || 0))
              .filter(Boolean);

            const fromIndex = orderedIds.indexOf(fromId);
            const toIndex = orderedIds.indexOf(toId);

            if (fromIndex < 0 || toIndex < 0) return;

            orderedIds.splice(fromIndex, 1);
            orderedIds.splice(toIndex, 0, fromId);

            try {
              await api(API.catReorder, {
                method: "POST",
                body: JSON.stringify({ ordered_ids: orderedIds }),
              });
              await loadCats();
            } catch (err) {
              showError(err.message || "Category reorder failed");
            }
          });

          catsTb.appendChild(tr);
        });
      }

      if (state.shop.catId) {
        await loadProducts(state.shop.catId);
      } else {
        const prodsTb = getProdsTableBody();
        if (prodsTb) prodsTb.innerHTML = "";
        state.shop.products = [];
        showError("");
      }
    }

    async function loadProducts(categoryId) {

      const reqId = ++state.shop.productsReqSeq;
      const prodsTb = getProdsTableBody();
      const idNum = Number(categoryId);

      // очистить старую ошибку
      showError("");

      if (!Number.isInteger(idNum) || idNum <= 0) {
        state.shop.products = [];
        if (prodsTb) prodsTb.innerHTML = "";
        return;
      }

      const data = await api(`${API.prodsList}?category_id=${encodeURIComponent(idNum)}`);

      if (reqId !== state.shop.productsReqSeq) return;

      const prods = data.products || [];
      state.shop.products = prods;

      if (!prodsTb) return;

      prodsTb.innerHTML = "";

      prods.forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${p.id}</td>
          <td><b>${escapeHtml(p.name || p.title || "")}</b></td>
          <td>${euro(p.price_cents ?? 0)}</td>
          <td>${escapeHtml(p.sku || "")}</td>
          <td>${escapeHtml(p.sort ?? p.sort_order ?? 0)}</td>
          <td class="right">
            <button class="btn btn-ghost" data-act="prodEdit" data-id="${p.id}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-ghost" data-act="prodDel" data-id="${p.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        prodsTb.appendChild(tr);
      });
    }

    function openCatModal(cat = null) {
      const c = cat || {
        id: 0,
        name: "",
        slug: "",
        page_url: "",
        image_url: "",
        sort: 0,
        is_active: 1,
      };

      const body = `
        <div class="grid">
          <div class="field">
            <label>Nimi</label>
            <input class="input" id="catName" value="${escapeHtml(c.name || "")}" placeholder="Näiteks: Koogid">
          </div>

          <div class="field">
            <label>Slug (kohustuslik)</label>
            <input class="input" id="catSlug" value="${escapeHtml(c.slug || "")}" placeholder="koogid">
            <div class="hint">Slug tekib automaatselt nimest, aga seda saab muuta.</div>
          </div>

          <div class="field" style="grid-column:1/-1;">
            <label>Page URL</label>
            <input class="input" id="catPageUrl" value="${escapeHtml(c.page_url || "")}" placeholder="/shop_category.html?slug=koogid">
          </div>

          <div class="field">
            <label>Sort</label>
            <input class="input" id="catSort" type="number" value="${escapeHtml(c.sort ?? c.sort_order ?? 0)}">
          </div>

          <div class="field">
            <label>Aktiivne</label>
            <select class="input" id="catActive">
              <option value="1" ${(Number(c.is_active ?? 1) ? "selected" : "")}>yes</option>
              <option value="0" ${(Number(c.is_active ?? 1) ? "" : "selected")}>no</option>
            </select>
          </div>

          <div class="field" style="grid-column:1/-1;">
            <label>Pildi URL (valikuline)</label>
            <input class="input" id="catImg" value="${escapeHtml(c.image_url || "")}" placeholder="/images/uploads/shop/example.webp">
          </div>

          <div class="field" style="grid-column:1/-1;">
            <label>Laadi pilt üles</label>
            <input class="input" id="catImgFile" type="file" accept="image/*">
            <div class="hint">Pärast üleslaadimist täidetakse URL automaatselt.</div>
            <div id="catImgUploadStatus" class="hint"></div>
          </div>
        </div>
      `;

      const foot = `
        <button class="btn" id="catSave"><i class="fa-solid fa-floppy-disk"></i> Salvesta</button>
        <button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>
      `;

      openModal(c.id ? `Muuda kategooriat #${c.id}` : "Uus kategooria", body, foot);

      let slugTouched = !!(c.slug || "").trim();

      on($("#catSlug"), "input", () => {
        slugTouched = true;
      });

      on($("#catName"), "input", () => {
        const nameVal = $("#catName")?.value || "";
        const slugEl = $("#catSlug");
        const pageUrlEl = $("#catPageUrl");

        const generatedSlug = slugifyCategory(nameVal, 80);

        if (slugEl && (!slugTouched || !slugEl.value.trim())) {
          slugEl.value = generatedSlug;
        }

        if (pageUrlEl && !pageUrlEl.value.trim() && generatedSlug) {
          pageUrlEl.value = `/shop_category.html?slug=${generatedSlug}`;
        }
      });

      on($("#catSlug"), "input", () => {
        const slugVal = ($("#catSlug")?.value || "").trim();
        const pageUrlEl = $("#catPageUrl");
        if (pageUrlEl && !pageUrlEl.value.trim() && slugVal) {
          pageUrlEl.value = `/shop_category.html?slug=${slugVal}`;
        }
      });

      on($("#catImgFile"), "change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const statusEl = $("#catImgUploadStatus");
        if (statusEl) statusEl.textContent = "Laadin pilti üles...";

        try {
          const resp = await uploadImage(file);
          const url = extractUploadedUrl(resp);

          if (!url) {
            throw new Error("Upload succeeded but no file URL returned");
          }

          const imgEl = $("#catImg");
          if (imgEl) imgEl.value = url;

          if (statusEl) statusEl.textContent = "Pilt üles laaditud.";
          showError("");
        } catch (err) {
          if (statusEl) statusEl.textContent = "";
          showError(err.message || "Image upload failed");
        }
      });

      on($("#catSave"), "click", async () => {
        const name = ($("#catName")?.value || "").trim();
        let slug = ($("#catSlug")?.value || "").trim();
        if (!slug) slug = slugifyCategory(name, 80);

        let page_url = ($("#catPageUrl")?.value || "").trim();
        if (!page_url && slug) {
          page_url = `/shop_category.html?slug=${slug}`;
        }

        const payload = {
          id: c.id ? Number(c.id) : 0,
          name,
          slug,
          page_url,
          image_url: ($("#catImg")?.value || "").trim(),
          sort: Number($("#catSort")?.value || 0),
          is_active: Number($("#catActive")?.value || 1),
        };

        if (!payload.name) return showError("Name is required");
        if (!payload.slug) return showError("Slug is required");
        if (!/^[a-z0-9_-]{1,80}$/.test(payload.slug)) {
          return showError("Category slug may contain only a-z, 0-9, _ and -");
        }

        try {
          const url = c.id ? API.catUpdate : API.catCreate;

          const resp = await api(url, {
            method: "POST",
            body: JSON.stringify(payload),
          });

          if (resp && resp.id) {
            state.shop.catId = Number(resp.id);
          } else if (c.id) {
            state.shop.catId = Number(c.id);
          }

          closeModal();
          await loadCats();
        } catch (err) {
          showError(err.message || "Category save failed");
        }
      }, { once: true });
    }

  function normalizeVariants(val) {
    let src = val;

    if (typeof src === "string") {
      try {
        src = JSON.parse(src);
      } catch {
        src = [];
      }
    }

    if (!Array.isArray(src)) return [];

    return src.map((v, i) => ({
      id: String(v?.id || `variant-${i + 1}`),
      sku: String(v?.sku || ""),
      price: Number(v?.price || 0),
      pack: {
        grams: Number(v?.pack?.grams || 0),
        pieces: Number(v?.pack?.pieces || 0),
        label: String(v?.pack?.label || ""),
      },
    }));
  }

  function renderVariantEditor(list, variants) {
    if (!list) return;
    list.innerHTML = "";

    variants.forEach((v, index) => {
      const row = document.createElement("div");
      row.className = "variant-editor";
      row.style.marginBottom = "10px";

      row.innerHTML = `
        <div class="grid" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr auto;gap:8px;align-items:end;">
          <div class="field">
            <label>Nimi / ID</label>
            <input class="input variant-id" value="${escapeHtml(v.id)}" placeholder="small">
          </div>
          <div class="field">
            <label>SKU</label>
            <input class="input variant-sku" value="${escapeHtml(v.sku)}" placeholder="4740...">
          </div>
          <div class="field">
            <label>Hind</label>
            <input class="input variant-price" type="number" step="0.01" value="${escapeHtml(v.price)}">
          </div>
          <div class="field">
            <label>Kogus tk</label>
            <input class="input variant-pieces" type="number" value="${escapeHtml(v.pack.pieces)}">
          </div>
          <div class="field">
            <label>Kaal g</label>
            <input class="input variant-grams" type="number" value="${escapeHtml(v.pack.grams)}">
          </div>
          <div class="field">
            <button type="button" class="btn btn-danger variant-remove" data-index="${index}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div class="field" style="grid-column:1/-1;">
            <label>Näidatav tekst</label>
            <input class="input variant-label" value="${escapeHtml(v.pack.label)}" placeholder="130g (3tk karbis, väike)">
          </div>
        </div>
      `;

      list.appendChild(row);
    });
  }

  function readVariantEditor(list) {
    if (!list) return [];
    const rows = Array.from(list.querySelectorAll(".variant-editor"));

    return rows
      .map((row, index) => ({
        id: row.querySelector(".variant-id")?.value?.trim() || `variant-${index + 1}`,
        sku: row.querySelector(".variant-sku")?.value?.trim() || "",
        price: Number(row.querySelector(".variant-price")?.value || 0),
        pack: {
          pieces: Number(row.querySelector(".variant-pieces")?.value || 0),
          grams: Number(row.querySelector(".variant-grams")?.value || 0),
          label: row.querySelector(".variant-label")?.value?.trim() || "",
        },
      }))
      .filter((v) => v.pack.label || v.price > 0 || v.sku);
  }

  function openProductModal(prod = null) {
    if (!state.shop.catId) {
      showError("Vali kategooria enne, kui lisad uue toote.");
      return;
    }

    const p = prod || {
      id: 0,
      category_id: state.shop.catId,
      name: "",
      sku: "",
      price_cents: 0,
      pack_label: "",
      image_url: "",
      description: "",
      shelf_life_days: 0,
      storage_temp: "",
      ingredients: [],
      nutrition_per_100g: [],
      variants: [],
      sort: 0,
      is_active: 1,
    };

    const body = `
      <div class="grid">
        <div class="field" style="grid-column:1/-1;">
          <label>Nimetus</label>
          <input class="input" id="prodName" value="${escapeHtml(p.name || "")}">
        </div>

        <div class="field">
          <label>SKU</label>
          <input class="input" id="prodSku" value="${escapeHtml(p.sku || "")}">
        </div>

        <div class="field">
          <label>Hind (EUR)</label>
          <input class="input" id="prodPrice" type="number" step="0.01" value="${escapeHtml(((Number(p.price_cents) || 0) / 100).toFixed(2))}">
        </div>

        <div class="field">
          <label>Pakend</label>
          <input class="input" id="prodPackLabel" value="${escapeHtml(p.pack_label || "")}" placeholder="16 tk, 90g">
        </div>

        <div class="field">
          <label>Sort</label>
          <input class="input" id="prodSort" type="number" value="${escapeHtml(p.sort ?? 0)}">
        </div>

        <div class="field">
          <label>Säilivusaeg (päeva)</label>
          <input class="input" id="prodShelfLife" type="number" value="${escapeHtml(p.shelf_life_days ?? 0)}">
        </div>

        <div class="field">
          <label>Säilitustemperatuur</label>
          <input class="input" id="prodStorageTemp" value="${escapeHtml(p.storage_temp || "")}" placeholder="+2...+6°C või toatemperatuur">
        </div>

        <div class="field">
          <label>Aktiivne</label>
          <select class="input" id="prodActive">
            <option value="1" ${(Number(p.is_active ?? 1) ? "selected" : "")}>yes</option>
            <option value="0" ${(Number(p.is_active ?? 1) ? "" : "selected")}>no</option>
          </select>
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Pildi URL</label>
          <input class="input" id="prodImg" value="${escapeHtml(p.image_url || "")}" placeholder="/images/uploads/shop/example.webp">
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Laadi pilt üles</label>
          <input class="input" id="prodImgFile" type="file" accept="image/*">
          <div class="hint">Pärast üleslaadimist täidetakse Pildi URL automaatselt.</div>
          <div id="prodImgUploadStatus" class="hint"></div>
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Variandid</label>
          <div id="variantList"></div>
          <div style="margin-top:8px;">
            <button type="button" class="btn btn-ghost" id="addVariantBtn">
              <i class="fa-solid fa-plus"></i> Lisa variant
            </button>
          </div>
          <div class="hint">Näiteks eri kaalud, karbid või pakendid ühe toote jaoks.</div>
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Lühikirjeldus / kirjeldus</label>
          <textarea class="input" id="prodDesc" rows="4">${escapeHtml(p.description || "")}</textarea>
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Koostisosad (1 rida = 1 punkt)</label>
          <textarea class="input" id="prodIngredients" rows="8">${escapeHtml(textFromLines(p.ingredients))}</textarea>
        </div>

        <div class="field" style="grid-column:1/-1;">
          <label>Toiteväärtus 100g kohta (1 rida = 1 punkt)</label>
          <textarea class="input" id="prodNutrition" rows="8">${escapeHtml(textFromLines(p.nutrition_per_100g))}</textarea>
        </div>
      </div>
    `;

    const foot = `
      <button class="btn" id="prodSave"><i class="fa-solid fa-floppy-disk"></i> Salvesta</button>
      <button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>
    `;

    openModal(p.id ? `Muuda toodet #${p.id}` : "Uus toode", body, foot);

    let variantsState = normalizeVariants(p.variants);
    const variantList = $("#variantList");
    renderVariantEditor(variantList, variantsState);

    on($("#addVariantBtn"), "click", () => {
      variantsState = readVariantEditor(variantList);

      variantsState.push({
        id: `variant-${variantsState.length + 1}`,
        sku: "",
        price: 0,
        pack: { grams: 0, pieces: 0, label: "" },
      });

      renderVariantEditor(variantList, variantsState);
    });

    on(variantList, "click", (e) => {
      const btn = e.target.closest(".variant-remove");
      if (!btn) return;

      variantsState = readVariantEditor(variantList);

      const idx = Number(btn.dataset.index);
      if (idx >= 0 && idx < variantsState.length) {
        variantsState.splice(idx, 1);
      }

      renderVariantEditor(variantList, variantsState);
    });

    on($("#prodImgFile"), "change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const statusEl = $("#prodImgUploadStatus");
      if (statusEl) statusEl.textContent = "Laadin pilti üles...";

      try {
        const resp = await uploadImage(file);
        const url = extractUploadedUrl(resp);

        if (!url) {
          console.error("Upload response:", resp);
          throw new Error("Upload succeeded but no file URL returned");
        }

        const imgEl = $("#prodImg");
        if (imgEl) imgEl.value = url;

        if (statusEl) statusEl.textContent = "Pilt üles laaditud.";
        showError("");
      } catch (err) {
        if (statusEl) statusEl.textContent = "";
        showError(err.message || "Image upload failed");
      }
    });

    on($("#prodSave"), "click", async () => {
      const name = ($("#prodName")?.value || "").trim();
      const priceEur = Number($("#prodPrice")?.value || 0);
      const variants = readVariantEditor(variantList);

      const payload = {
        id: p.id ? Number(p.id) : 0,
        category_id: Number(state.shop.catId),
        name,
        sku: ($("#prodSku")?.value || "").trim(),
        price_cents: Math.round(priceEur * 100),
        pack_label: ($("#prodPackLabel")?.value || "").trim(),
        image_url: ($("#prodImg")?.value || "").trim(),
        description: ($("#prodDesc")?.value || "").trim(),
        shelf_life_days: Number($("#prodShelfLife")?.value || 0),
        storage_temp: ($("#prodStorageTemp")?.value || "").trim(),
        ingredients: parseLinesTextarea("#prodIngredients"),
        nutrition_per_100g: parseLinesTextarea("#prodNutrition"),
        variants,
        sort: Number($("#prodSort")?.value || 0),
        is_active: Number($("#prodActive")?.value || 1),
      };

      if (!payload.name) return showError("Name is required");
      if (payload.price_cents <= 0 && variants.length === 0) {
        return showError("Price is required");
      }

      try {
        const url = p.id ? API.prodUpdate : API.prodCreate;
        await api(url, { method: "POST", body: JSON.stringify(payload) });

        showError("");
        closeModal();

        if (state.shop.catId) {
          await loadProducts(state.shop.catId);
        } else {
          await loadCats();
        }
      } catch (err) {
        showError(err.message || "Product save failed");
      }
    }, { once: true });
  }

    function openImportModal() {
      const body = `
        <div class="grid">
          <div class="field" style="grid-column:1/-1;">
            <label>Bulk import JSON fail</label>
            <input class="input" id="shopImportFile" type="file" accept=".json,application/json">
            <div class="hint">Toetatud struktuur: { "categories":[...], "products":[...] }</div>
          </div>

          <div class="field" style="grid-column:1/-1;">
            <label>Või kleebi JSON siia</label>
            <textarea class="input" id="shopImportText" rows="18" placeholder='{"categories":[...],"products":[...]}'></textarea>
          </div>
        </div>
      `;

      const foot = `
        <button class="btn" id="shopImportRun"><i class="fa-solid fa-file-import"></i> Impordi</button>
        <button class="btn btn-ghost" data-close="1"><i class="fa-solid fa-xmark"></i> Sulge</button>
      `;

      openModal("Bulk import", body, foot);

      on($("#shopImportRun"), "click", async () => {
        try {
          const file = $("#shopImportFile")?.files?.[0];
          let raw = ($("#shopImportText")?.value || "").trim();

          if (file && !raw) {
            raw = await file.text();
          }

          if (!raw) {
            return showError("Choose file or paste JSON");
          }

          let payload;
          try {
            payload = JSON.parse(raw);
          } catch {
            return showError("Invalid JSON");
          }

          await api(API.importProducts, {
            method: "POST",
            body: JSON.stringify(payload),
          });

          closeModal();
          await loadShop();
        } catch (err) {
          showError(err.message || "Import failed");
        }
      }, { once: true });
    }

  // =============================
  // Global click delegation
  // =============================
  document.addEventListener("click", async (e) => {
    const closeBtn = e.target.closest('[data-close="1"]');
    if (closeBtn) {
      e.preventDefault();
      closeModal();
      return;
    }

    const nav = e.target.closest(".navbtn[data-view]");
    if (nav) {
      e.preventDefault();
      setView(nav.dataset.view);
      return;
    }

    const jump = e.target.closest("[data-jump]");
    if (jump) {
      e.preventDefault();
      setView(jump.dataset.jump);
      return;
    }

    const openEye = e.target.closest("button[data-open]");
    if (openEye) {
      e.preventDefault();
      const id = Number(openEye.dataset.open);
      if (id) openOrder(id).catch((err) => showError(err.message));
      return;
    }

    const tgl = e.target.closest('button[data-act="toggleVerify"]');
    if (tgl) {
      e.preventDefault();
      const uid = Number(tgl.dataset.u);
      try {
        await api(API.userToggleVerify, {
          method: "POST",
          body: JSON.stringify({ id: uid }),
        });
        showError("");
        await loadUsers();
      } catch (err) {
        showError(err.message);
      }
      return;
    }

    const delFile = e.target.closest("button[data-del]");
    if (delFile) {
      e.preventDefault();
      const rel = delFile.dataset.del;
      if (!confirm(`Kustutada fail?\n${rel}`)) return;
      try {
        await api(API.uploadsDelete, {
          method: "POST",
          body: JSON.stringify({ rel }),
        });
        showError("");
        await loadFiles();
      } catch (err) {
        showError(err.message);
      }
      return;
    }

    const btnInstall = e.target.closest("#shopInstall, #btnInstall");
    if (btnInstall) {
      e.preventDefault();
      try {
        await api(API.shopInstall, { method: "POST", body: "{}" });
        showError("");
        await loadShop();
      } catch (err) {
        showError(err.message);
      }
      return;
    }

    const btnCatNew = e.target.closest("#shopNewCategory, #btnCatNew");
    if (btnCatNew) {
      e.preventDefault();
      openCatModal(null);
      return;
    }

    const btnProdNew = e.target.closest("#shopNewProduct, #btnProdNew");
    if (btnProdNew) {
      e.preventDefault();
      openProductModal(null);
      return;
    }

    const btnImport = e.target.closest("#shopImport, #btnImport");
    const btnSiteNewBlock = e.target.closest('#siteNewBlock');
    if (btnSiteNewBlock) { openSiteContentModal(null, 'section'); return; }
    const btnSiteNewSlide = e.target.closest('#siteNewSlide');
    if (btnSiteNewSlide) { openSiteContentModal(null, 'hero_slide'); return; }
    const siteEdit = e.target.closest('[data-act="siteEdit"]');
    if (siteEdit) { const id = Number(siteEdit.dataset.id); const item = state.site.items.find((x) => Number(x.id) === id); if (item) openSiteContentModal(item, item.block_type || 'section'); return; }
    const siteDelete = e.target.closest('[data-act="siteDelete"]');
    if (siteDelete) { const id = Number(siteDelete.dataset.id); if (!confirm('Kustutada CMS element?')) return; api(API.siteDelete, { method:'POST', body: JSON.stringify({ id }) }).then(loadSiteContent).catch((err)=>showError(err.message)); return; }
    if (btnImport) {
      e.preventDefault();
      openImportModal();
      return;
    }

    const catEdit = e.target.closest('[data-act="catEdit"]');
    if (catEdit) {
      e.preventDefault();
      const id = Number(catEdit.dataset.id);
      const cat = state.shop.cats.find((c) => Number(c.id) === id);
      if (cat) openCatModal(cat);
      return;
    }

    const catDel = e.target.closest('[data-act="catDel"]');
    if (catDel) {
      e.preventDefault();
      const id = Number(catDel.dataset.id);
      const cat = state.shop.cats.find((c) => Number(c.id) === id);
      if (!confirm(`Kustutada kategooria?\n${cat ? cat.name : "#" + id}`)) return;

      try {
        await api(API.catDelete, {
          method: "POST",
          body: JSON.stringify({ id }),
        });

        if (Number(state.shop.catId) === id) {
          state.shop.catId = null;
          state.shop.products = [];
          clearProductsTable();
        }

        showError("");
        await loadCats();
      } catch (err) {
        showError(err.message);
      }
      return;
    }

    const prodEdit = e.target.closest('[data-act="prodEdit"]');
    if (prodEdit) {
      e.preventDefault();
      const id = Number(prodEdit.dataset.id);
      const prod = state.shop.products.find((p) => Number(p.id) === id);
      if (prod) openProductModal(prod);
      return;
    }

    const prodDel = e.target.closest('[data-act="prodDel"]');
    if (prodDel) {
      e.preventDefault();
      const id = Number(prodDel.dataset.id);
      const prod = state.shop.products.find((p) => Number(p.id) === id);
      if (!confirm(`Kustutada toode?\n${prod ? (prod.name || prod.title) : "#" + id}`)) return;

      try {
        await api(API.prodDelete, {
          method: "POST",
          body: JSON.stringify({ id }),
        });

        showError("");

        if (state.shop.catId) {
          await loadProducts(state.shop.catId);
        } else {
          await loadCats();
        }
      } catch (err) {
        showError(err.message);
      }
      return;
    }
  });

  // =============================
  // Single elements
  // =============================
  on($("#refreshBtn"), "click", () => {
    refreshCurrent().catch((err) => showError(err.message));
  });

  on($("#logoutBtn"), "click", async () => {
    try {
      await api("../api/auth_logout.php", { method: "POST", body: "{}" });
    } catch {}
    location.href = "../checkout.html";
  });

  on($("#ordersSearch"), "click", () => {
    state.orders.q = ($("#ordersQ")?.value || "").trim();
    state.orders.status = $("#ordersStatus")?.value || "";
    state.orders.page = 1;
    loadOrders().catch((err) => showError(err.message));
  });

  on($("#ordersPrev"), "click", () => {
    state.orders.page = Math.max(1, state.orders.page - 1);
    loadOrders().catch((err) => showError(err.message));
  });

  on($("#ordersNext"), "click", () => {
    state.orders.page += 1;
    loadOrders().catch((err) => showError(err.message));
  });

  on($("#usersSearch"), "click", () => {
    state.users.q = ($("#usersQ")?.value || "").trim();
    state.users.page = 1;
    loadUsers().catch((err) => showError(err.message));
  });

  on($("#usersPrev"), "click", () => {
    state.users.page = Math.max(1, state.users.page - 1);
    loadUsers().catch((err) => showError(err.message));
  });

  on($("#usersNext"), "click", () => {
    state.users.page += 1;
    loadUsers().catch((err) => showError(err.message));
  });

  on(getShopSelect(), "change", (e) => {
    const v = e.target.value || "";
    state.shop.catId = v ? Number(v) : null;

    if (state.shop.catId) {
      loadProducts(state.shop.catId).catch((err) => showError(err.message));
    } else {
      state.shop.products = [];
      clearProductsTable();
      showError("");
    }
  });

  // =============================
  // Error capture
  // =============================
  window.addEventListener("error", (ev) => {
    if (ev?.message) showError(ev.message);
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const msg = ev?.reason?.message || String(ev?.reason || "Unhandled promise rejection");
    showError(msg);
  });

  // =============================
  // Start
  // =============================
  boot();
})();
