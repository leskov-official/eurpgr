const CART_KEY = "europagar_cart";
const LEGACY_CART_KEY = "cart";

function safeJSONParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readCartRaw(keyName) {
  const raw = localStorage.getItem(keyName);
  const data = safeJSONParse(raw, []);
  return Array.isArray(data) ? data : [];
}

function normalizeCartItem(it) {
  const qty = Math.max(1, Number(it?.qty ?? 1) || 1);
  const unitPrice = Number(it?.unitPrice ?? it?.price ?? 0) || 0;

  const sku = (it?.sku ?? "").toString();
  const productId = (it?.productId ?? it?.id ?? "").toString();
  const packLabel = (it?.packLabel ?? it?.pack ?? "").toString();

  const key =
    (it?.key && String(it.key)) ||
    ((sku || productId || "item") + ":" + (packLabel || ""));

  return {
    key,
    productId,
    sku,
    title: (it?.title ?? "Toode").toString(),
    packLabel,
    unitPrice,
    qty,
    note: (it?.note ?? "").toString(),
  };
}

function writeCart(items) {
  const norm = (Array.isArray(items) ? items : []).map(normalizeCartItem);
  localStorage.setItem(CART_KEY, JSON.stringify(norm));
}

function readCart() {
  const fresh = readCartRaw(CART_KEY);
  if (fresh.length) return fresh.map(normalizeCartItem);

  const legacy = readCartRaw(LEGACY_CART_KEY);
  if (legacy.length) {
    const migrated = legacy.map(normalizeCartItem);
    writeCart(migrated);
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {}
    return migrated;
  }

  return [];
}

function formatEUR(n) {
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n || 0));
}

function calcTotals(items) {
  let qty = 0;
  let total = 0;

  for (const it of items) {
    const q = Number(it.qty || 0);
    const p = Number(it.unitPrice || 0);
    qty += q;
    total += p * q;
  }

  return { qty, total };
}

function updateCartBadgeEverywhere() {
  const cart = readCart();
  const { qty } = calcTotals(cart);

  document.querySelectorAll("#cartBadge").forEach((badge) => {
    badge.textContent = String(qty);
    badge.style.display = qty > 0 ? "flex" : "none";
  });
}

function dispatchCartUpdated() {
  updateCartBadgeEverywhere();
  window.dispatchEvent(new Event("europagar-cart-updated"));
}

function addToCart(item) {
  const cart = readCart();
  const qty = Math.max(1, Number(item.qty) || 1);
  const unitPrice = Number(item.unitPrice) || 0;

  const sku = (item.sku || "").toString();
  const productId = (item.productId || "").toString();
  const packLabel = (item.packLabel || "").toString();

  const key = (sku || productId || "item") + ":" + packLabel;
  const existing = cart.find((i) => i.key === key);

  if (existing) {
    existing.qty = Math.max(1, Number(existing.qty || 0) + qty);
    existing.unitPrice = unitPrice || existing.unitPrice;
    existing.title = item.title || existing.title;
    existing.sku = sku || existing.sku;
    existing.packLabel = packLabel || existing.packLabel;
    existing.productId = productId || existing.productId;
  } else {
    cart.push(normalizeCartItem({
      key,
      productId,
      sku,
      title: item.title || "",
      packLabel,
      unitPrice,
      qty,
    }));
  }

  writeCart(cart);
  dispatchCartUpdated();
}

function productsStore() {
  if (typeof window.PRODUCTS === "undefined" || !window.PRODUCTS) {
    window.PRODUCTS = {};
  }
  return window.PRODUCTS;
}

function normalizeFrontendVariants(src) {
  if (typeof src === "string") {
    try {
      src = JSON.parse(src);
    } catch {
      src = [];
    }
  }

  if (!Array.isArray(src)) return [];

  return src
    .map((v, i) => {
      const pack = v && typeof v.pack === "object" && v.pack ? v.pack : {};

      const grams = Number(pack.grams ?? v.grams ?? v.weight_g ?? 0) || 0;
      const pieces = Number(pack.pieces ?? v.pieces ?? v.qty ?? 0) || 0;

      let label = String(
        pack.label ?? v.pack_label ?? v.label ?? v.name ?? ""
      ).trim();

      let price = Number(v?.price ?? v?.price_eur ?? 0) || 0;
      if (!(price > 0) && Number(v?.price_cents || 0) > 0) {
        price = Number(v.price_cents) / 100;
      }

      const sku = String(v?.sku || "").trim();
      const id = String(v?.id || `variant-${i + 1}`);

      if (!label) {
        const parts = [];
        if (pieces > 0) parts.push(`${pieces}tk`);
        if (grams > 0) parts.push(`${grams}g`);
        if (parts.length) {
          label = `(${parts.join(", ")})`;
        }
      }

      return {
        id,
        sku,
        price,
        pack: {
          grams,
          pieces,
          label,
        },
      };
    })
    .filter((v) => v.pack.label || v.pack.grams > 0 || v.pack.pieces > 0 || v.sku || v.price > 0);
}

function initCartPageIfPresent() {
  const cartList = document.getElementById("cartList");
  const cartBody = document.getElementById("cartBody");
  const cartTotal = document.getElementById("cartTotal");
  const btnClear = document.getElementById("btnClear");
  const btnBack = document.getElementById("btnBack");
  const btnCheckout = document.getElementById("btnCheckout");

  if (!cartTotal || (!cartList && !cartBody)) return;

  function removeItemByIndex(idx) {
    const current = readCart();
    if (idx < 0 || idx >= current.length) return;
    current.splice(idx, 1);
    writeCart(current);
    dispatchCartUpdated();
    renderCart();
  }

  function setItemQty(idx, nextQty) {
    const current = readCart();
    if (idx < 0 || idx >= current.length) return;

    const qty = Math.max(1, Number(nextQty) || 1);
    current[idx].qty = qty;

    writeCart(current);
    dispatchCartUpdated();
    renderCart();
  }

  function renderCardLayout(cart) {
    if (!cartList) return;

    cartList.innerHTML = "";

    if (!cart.length) {
      cartList.innerHTML = `<div class="cart-empty">Ostukorv on tühi.</div>`;
      cartTotal.textContent = "Kokku: 0 €";
      return;
    }

    cart.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      row.innerHTML = `
        <div class="ci-main">
          <h2 class="ci-title">${escapeHtml(item.title)}</h2>
          <div class="ci-sub">${escapeHtml(item.packLabel || "—")}</div>
          <div class="ci-sku">Tootekood: ${escapeHtml(item.sku || "—")}</div>
        </div>

        <div class="ci-side">
          <div class="ci-price">${formatEUR(item.unitPrice * item.qty)}</div>

          <div class="ci-qty">
            <button type="button" data-dec="${idx}" aria-label="Vähenda kogust">−</button>
            <input type="number" min="1" step="1" value="${item.qty}" data-qty="${idx}" aria-label="Kogus">
            <button type="button" data-inc="${idx}" aria-label="Suurenda kogust">+</button>
          </div>

          <button type="button" class="ci-remove" data-remove="${idx}" aria-label="Kustutada">
            <i class="fa fa-trash"></i> Kustutada
          </button>
        </div>
      `;

      cartList.appendChild(row);
    });

    const { total } = calcTotals(cart);
    cartTotal.textContent = `Kokku: ${formatEUR(total)}`;

    cartList.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeItemByIndex(Number(btn.getAttribute("data-remove")));
      });
    });

    cartList.querySelectorAll("[data-dec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-dec"));
        const current = readCart();
        const item = current[idx];
        if (!item) return;
        setItemQty(idx, Math.max(1, Number(item.qty || 1) - 1));
      });
    });

    cartList.querySelectorAll("[data-inc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-inc"));
        const current = readCart();
        const item = current[idx];
        if (!item) return;
        setItemQty(idx, Number(item.qty || 1) + 1);
      });
    });

    cartList.querySelectorAll("[data-qty]").forEach((input) => {
      input.addEventListener("change", () => {
        const idx = Number(input.getAttribute("data-qty"));
        setItemQty(idx, input.value);
      });

      input.addEventListener("input", () => {
        const clean = Math.max(1, Number(input.value || 1));
        if (!Number.isFinite(clean)) input.value = "1";
      });
    });
  }

  function renderTableLayout(cart) {
    if (!cartBody) return;

    cartBody.innerHTML = "";

    if (!cart.length) {
      cartBody.innerHTML = `<tr><td colspan="5">Ostukorv on tühi.</td></tr>`;
      cartTotal.textContent = formatEUR(0);
      return;
    }

    cart.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.packLabel || "—")}</td>
        <td>${formatEUR(item.unitPrice)}</td>
        <td>${item.qty}</td>
        <td>
          <button type="button" data-remove="${idx}" aria-label="Eemalda">✕</button>
        </td>
      `;
      cartBody.appendChild(tr);
    });

    const { total } = calcTotals(cart);
    cartTotal.textContent = formatEUR(total);

    cartBody.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeItemByIndex(Number(btn.getAttribute("data-remove")));
      });
    });
  }

  function renderCart() {
    const cart = readCart();

    if (cartList) {
      renderCardLayout(cart);
      return;
    }

    if (cartBody) {
      renderTableLayout(cart);
    }
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      writeCart([]);
      dispatchCartUpdated();
      renderCart();
    });
  }

  if (btnBack) {
    btnBack.addEventListener("click", () => history.back());
  }

  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      window.location.href = "checkout.html";
    });
  }

  window.addEventListener("europagar-cart-updated", renderCart);
  renderCart();
}

function initProductModalIfPresent() {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  const modalImg =
    document.getElementById("modalImage") ||
    document.getElementById("modalImg");

  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalIngredients = document.getElementById("modalIngredients");
  const modalNutrition = document.getElementById("modalNutrition");
  const modalPrice = document.getElementById("modalPrice");
  const modalNote = document.getElementById("modalNote");
  const modalVariantWrap = document.getElementById("modalVariantWrap");
  const modalVariantSelect = document.getElementById("modalVariantSelect");

  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const qtyInput = document.getElementById("qtyInput");

  const btnAdd =
    document.getElementById("addToCartBtn") ||
    document.getElementById("btnAdd");

  let activeProduct = null;
  let activeVariant = null;

  function hasVariants(product) {
    return !!(product && Array.isArray(product.variants) && product.variants.length > 0);
  }

  function getInitialVariant(product) {
    if (!hasVariants(product)) return null;
    return product.variants[0] || null;
  }

  function getEffectiveData(product) {
    if (hasVariants(product)) {
      const v = activeVariant || getInitialVariant(product);
      return {
        price: Number(v?.price || 0),
        sku: v?.sku || "",
        packLabel: v?.pack?.label || "",
      };
    }

    return {
      price: Number(product?.price || 0),
      sku: product?.sku || "",
      packLabel: product?.pack?.label || "",
    };
  }

  function getVariantLabel(v, index) {
    return (
      v?.pack?.label ||
      v?.label ||
      v?.name ||
      `Variant ${index + 1}`
    );
  }

  function renderVariantPicker(product) {
    if (!modalVariantWrap || !modalVariantSelect) return;

    const variants = Array.isArray(product?.variants) ? product.variants : [];

    if (variants.length <= 1) {
      modalVariantWrap.style.display = "none";
      modalVariantSelect.innerHTML = "";
      return;
    }

    modalVariantWrap.style.display = "";
    modalVariantSelect.innerHTML = variants
      .map((v, i) => {
        const selected =
          activeVariant && String(activeVariant.id) === String(v.id) ? "selected" : "";
        return `<option value="${i}" ${selected}>${escapeHtml(getVariantLabel(v, i))}</option>`;
      })
      .join("");
  }

  function renderMeta(product) {
    const eff = getEffectiveData(product);

    if (modalTitle) {
      modalTitle.textContent =
        `${product.title || ""}${eff.packLabel ? " " + eff.packLabel : ""}`.trim();
    }

    if (modalMeta) {
      const shelf = product.shelf_life_days ? `${product.shelf_life_days} päeva` : "—";
      const temp = product.storage_temp || "—";
      const sku = eff.sku || "—";

      modalMeta.innerHTML = `
        <div class="modal__infogrid">
          <div class="infoitem"><div class="k">Hind</div><div class="v">${eff.price > 0 ? formatEUR(eff.price) : "—"}</div></div>
          <div class="infoitem"><div class="k">Pakend</div><div class="v">${escapeHtml(eff.packLabel || "—")}</div></div>
          <div class="infoitem"><div class="k">Säilivusaeg</div><div class="v">${escapeHtml(shelf)}</div></div>
          <div class="infoitem"><div class="k">Säilitustemperatuur</div><div class="v">${escapeHtml(temp)}</div></div>
          <div class="infoitem"><div class="k">SKU</div><div class="v">${escapeHtml(sku)}</div></div>
        </div>
      `;
    }
  }

  function updatePrice() {
    if (!activeProduct || !qtyInput || !modalPrice) return;

    const qty = Math.max(1, Number(qtyInput.value || 1));
    const eff = getEffectiveData(activeProduct);

    modalPrice.textContent = eff.price > 0
      ? `Kokku: ${formatEUR(eff.price * qty)} (× ${qty})`
      : "";
  }

  function openModal(product) {
    activeProduct = product;
    activeVariant = hasVariants(product) ? getInitialVariant(product) : null;

    if (modalImg) {
      modalImg.src = product.image || "";
      modalImg.alt = product.title || "";
    }

    renderVariantPicker(product);
    renderMeta(product);

    if (modalIngredients) {
      const desc = product.description
        ? `<p class="block__p">${escapeHtml(product.description)}</p>`
        : "";

      const ing = Array.isArray(product.ingredients) && product.ingredients.length
        ? `<ul class="list">${product.ingredients.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
        : "";

      modalIngredients.innerHTML = `
        <div class="modal__block">
          ${desc}
          ${ing ? `<h3 class="block__title">Koostisosad</h3>${ing}` : ""}
        </div>
      `;
    }

    if (modalNutrition) {
      const nut = Array.isArray(product.nutrition_per_100g) && product.nutrition_per_100g.length
        ? `<div class="modal__block">
             <h3 class="block__title">100g toodet sisaldab keskmiselt</h3>
             <ul class="list">${product.nutrition_per_100g.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
           </div>`
        : "";
      modalNutrition.innerHTML = nut;
    }

    if (qtyInput) qtyInput.value = "1";
    if (modalNote) modalNote.textContent = "";
    updatePrice();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeProduct = null;
    activeVariant = null;
  }

  function bindProductButtons(root) {
    (root || document).querySelectorAll(".product[data-product-id]").forEach((btn) => {
      if (btn.dataset.boundModal === "1") return;
      btn.dataset.boundModal = "1";

      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-product-id");
        const store = productsStore();
        const product = store[id];
        if (!product) return;
        openModal(product);
      });
    });
  }

  function getProductsGrid() {
    return document.getElementById("productGrid") ||
      document.querySelector(".grid[aria-label='Tooted']");
  }

  function renderDbProducts() {
    const grid = getProductsGrid();
    if (!grid) return;

    const page = (location.pathname.split("/").pop() || "").trim();
    const qs = new URLSearchParams(location.search || "");
    const bodySlug = document.body?.dataset?.categorySlug || "";
    const categorySlug = (qs.get("slug") || qs.get("category") || qs.get("cat") || bodySlug || "").trim();
    const categoryId = (qs.get("category_id") || "").trim();

    const apiUrl = categoryId
      ? `api/shop_products.php?category_id=${encodeURIComponent(categoryId)}`
      : categorySlug
        ? `api/shop_products.php?category=${encodeURIComponent(categorySlug)}`
        : `api/shop_products.php?page_url=${encodeURIComponent(page)}`;

    fetch(apiUrl, {
      cache: "no-store",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json",
      },
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((j) => {
        if (!j || !j.ok || !Array.isArray(j.products)) {
          throw new Error(j?.error || "Viga toodete laadimisel.");
        }

        const store = productsStore();
        Object.keys(store).forEach((k) => delete store[k]);

        grid.innerHTML = "";

        const titleEl = document.getElementById("categoryTitle");
        const subEl = document.getElementById("categorySub");

        if (j.category && titleEl) {
          titleEl.textContent = j.category.name || "E-Pood";
        }
        if (j.category && subEl) {
          subEl.textContent = j.category.name || "";
        }

        if (!j.products.length) {
          const empty = document.createElement("div");
          empty.className = "shop-empty";
          empty.style.padding = "14px";
          empty.style.color = "#122E4E";
          empty.textContent = "Tooted puuduvad.";
          grid.appendChild(empty);
          return;
        }

        j.products.forEach((p) => {
          const pid = `sp-${p.id}`;

          const normalizedVariants = normalizeFrontendVariants(p.variants);

          const base = {
            id: pid,
            dbId: Number(p.id || 0) || 0,
            title: p.name || "",
            image: p.image_url || "",
            price: Number(p.price_cents || 0) / 100,
            sku: p.sku || "",
            pack: p.pack_label ? { label: p.pack_label } : null,
            shelf_life_days: Number(p.shelf_life_days || 0) || null,
            storage_temp: p.storage_temp || "",
            description: p.description || "",
            ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
            nutrition_per_100g: Array.isArray(p.nutrition_per_100g) ? p.nutrition_per_100g : [],
            variants: normalizedVariants,
          };

          store[pid] = base;

          const btn = document.createElement("button");
          btn.className = "product";
          btn.type = "button";
          btn.setAttribute("data-product-id", pid);
          btn.setAttribute("aria-label", base.title || "Toode");

          btn.innerHTML = `
            <div class="product-media">
              <img src="${escapeHtml(base.image)}" alt="${escapeHtml(base.title)}" loading="lazy">
            </div>
            <div class="product-body">
              <h2 class="product-title">${escapeHtml(base.title)}</h2>
            </div>
          `;

          grid.appendChild(btn);
        });

        bindProductButtons(grid);
      })
      .catch((err) => {
        grid.innerHTML = "";
        const empty = document.createElement("div");
        empty.className = "shop-empty";
        empty.style.padding = "14px";
        empty.style.color = "#122E4E";
        empty.textContent = err?.message || "Viga toodete laadimisel.";
        grid.appendChild(empty);
      });
  }

  modal.addEventListener("click", (e) => {
    const closeTrigger = e.target.closest(
      "[data-close], [data-modal-close], .modal-close, .modal__close"
    );

    if (closeTrigger && modal.contains(closeTrigger)) {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return;
    }

    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  if (qtyMinus) {
    qtyMinus.addEventListener("click", () => {
      qtyInput.value = String(Math.max(1, Number(qtyInput.value || 1) - 1));
      updatePrice();
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener("click", () => {
      qtyInput.value = String(Math.max(1, Number(qtyInput.value || 1) + 1));
      updatePrice();
    });
  }

  if (qtyInput) {
    qtyInput.addEventListener("input", updatePrice);
    qtyInput.addEventListener("change", () => {
      qtyInput.value = String(Math.max(1, Number(qtyInput.value || 1)));
      updatePrice();
    });
  }

  if (modalVariantSelect) {
    modalVariantSelect.addEventListener("change", () => {
      if (!activeProduct || !Array.isArray(activeProduct.variants)) return;
      const idx = Number(modalVariantSelect.value || 0);
      activeVariant = activeProduct.variants[idx] || activeProduct.variants[0] || null;
      renderMeta(activeProduct);
      updatePrice();
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      if (!activeProduct) return;

      const qty = Math.max(1, Number(qtyInput?.value || 1));
      const eff = getEffectiveData(activeProduct);

      if (!(eff.price > 0)) {
        if (modalNote) modalNote.textContent = "Hind puudub";
        return;
      }

      addToCart({
        productId: activeProduct.dbId || 0,
        sku: eff.sku || "",
        title: activeProduct.title || "",
        packLabel: eff.packLabel || "",
        unitPrice: eff.price,
        qty,
      });

      if (modalNote) modalNote.textContent = "Lisatud ostukorvi";
      updateCartBadgeEverywhere();
    });
  }

  renderDbProducts();
}

function initCartButtonOpen() {
  document.querySelectorAll("a.cart-btn, .cart-btn").forEach((btn) => {
    if (btn.dataset.boundCartOpen === "1") return;
    btn.dataset.boundCartOpen = "1";

    btn.addEventListener("click", (e) => {
      const href = btn.getAttribute("href") || "";
      if (href === "#" || href === "" || href === "#!") {
        e.preventDefault();
        window.location.href = "cart.html";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadgeEverywhere();
  initCartButtonOpen();
  initProductModalIfPresent();
  initCartPageIfPresent();
});
