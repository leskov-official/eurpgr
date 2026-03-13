(function(){
  "use strict";

  const esc = (s) => String(s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');

  function toMediaType(item) {
    const t = String(item.media_type || '').toLowerCase();
    if (t) return t;
    const u = String(item.media_url || '').toLowerCase();
    if (u.endsWith('.mp4') || u.includes('.mp4?')) return 'video';
    return 'image';
  }

  function renderSlideMedia(item, eager = false) {
    const url = esc(item.media_url || 'images/image1.webp');
    const alt = esc(item.image_alt || item.title || 'Slaid');
    const type = toMediaType(item);
    if (type === 'video') {
      return `<video src="${url}" class="hero-media" muted autoplay loop playsinline preload="metadata" aria-label="${alt}"></video>`;
    }
    return `<img src="${url}" alt="${alt}" class="hero-media" loading="${eager ? 'eager' : 'lazy'}">`;
  }

  function renderSlider(slides) {
    const track = document.getElementById('mediaTrack');
    const dotsWrap = document.getElementById('mediaDots');
    if (!track || !dotsWrap || !slides.length) return;

    track.innerHTML = slides.map((s, i) => renderSlideMedia(s, i === 0)).join('');
    const mediaEls = Array.from(track.children);
    let index = 0;
    let timer = null;

    dotsWrap.innerHTML = slides.map((_, i) => `<button class="media-dot" type="button" aria-label="Slaid ${i+1}" data-i="${i}"></button>`).join('');
    const dots = Array.from(dotsWrap.querySelectorAll('.media-dot'));

    function syncVideoPlayback() {
      mediaEls.forEach((el, i) => {
        if (el.tagName === 'VIDEO') {
          if (i === index) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        }
      });
    }

    function goTo(i){
      index = (i + mediaEls.length) % mediaEls.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
      syncVideoPlayback();
    }
    function next(){ goTo(index + 1); }
    function start(){ stop(); if (mediaEls.length > 1) timer = setInterval(next, 5000); }
    function stop(){ if (timer) clearInterval(timer); timer = null; }

    dotsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.media-dot');
      if (!btn) return;
      goTo(parseInt(btn.dataset.i, 10) || 0);
      start();
    });

    const media = track.closest('.card-media');
    if (media) {
      media.addEventListener('mouseenter', stop);
      media.addEventListener('mouseleave', start);
    }

    goTo(0);
    start();
  }

  function setHtmlOrText(el, value) {
    if (!el) return;
    el.innerHTML = value || '';
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value || '';
  }

  function setMedia(mediaWrap, item) {
    if (!mediaWrap || !item) return;
    const type = toMediaType(item);
    const url = esc(item.media_url || '');
    const alt = esc(item.image_alt || item.title || 'Media');
    if (!url) return;
    mediaWrap.innerHTML = type === 'video'
      ? `<video src="${url}" class="section-media" muted autoplay loop playsinline preload="metadata" aria-label="${alt}"></video>`
      : `<img src="${url}" alt="${alt}" class="section-media" loading="lazy">`;
  }

  function setButtons(container, item) {
    if (!container) return;
    const buttons = [];
    if (item.button_primary_label && item.button_primary_url) {
      buttons.push(`<a class="btn btn-primary" href="${esc(item.button_primary_url)}">${esc(item.button_primary_label)}</a>`);
    }
    if (item.button_secondary_label && item.button_secondary_url) {
      buttons.push(`<a class="btn" href="${esc(item.button_secondary_url)}">${esc(item.button_secondary_label)}</a>`);
    }
    if (buttons.length) container.innerHTML = buttons.join('');
  }

  function applyBlock(item) {
    const scope = document.querySelector(`[data-block-key="${CSS.escape(item.block_key)}"]`);
    if (!scope) return;
    setText(scope.querySelector('[data-field="eyebrow"]'), item.eyebrow || '');
    setText(scope.querySelector('[data-field="title"]'), item.title || '');
    setHtmlOrText(scope.querySelector('[data-field="body"]'), item.content_html || '');
    setMedia(scope.querySelector('[data-field="media"]'), item);
    setButtons(scope.querySelector('[data-field="buttons"]'), item);
  }

  async function loadHomepageContent() {
    try {
      const res = await fetch('/api/site_content.php', { credentials:'include', cache:'no-store' });
      const data = await res.json();
      if (!data || !data.ok) return;

      const slides = (data.slides || []).filter(s => Number(s.is_active) === 1);
      if (slides.length) renderSlider(slides);
      (data.blocks || []).filter(b => Number(b.is_active) === 1).forEach(applyBlock);
    } catch (_) {}
  }

  async function loadCategories() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    try {
      const r = await fetch('/api/shop_categories.php', { credentials:'include', cache:'no-store' });
      const j = await r.json();
      if (!j || !j.ok || !Array.isArray(j.categories) || !j.categories.length) return;
      grid.innerHTML = '';
      j.categories.forEach(c => {
        const a = document.createElement('a');
        a.className = 'product';
        const href = (c.page_url && String(c.page_url).trim()) ? String(c.page_url).trim() : ('shop_category.html?slug=' + encodeURIComponent(String(c.slug||'')));
        a.href = href.startsWith('http') ? href : href.replace(/^\/+/, '');
        const img = (c.image_url && String(c.image_url).trim()) ? String(c.image_url).trim() : 'images/image1.webp';
        a.innerHTML = '<div class="product-media"><img src="' + esc(img) + '" alt="' + esc(c.name) + '" loading="lazy"></div><div class="product-body"><h2 class="product-title">' + esc(c.name) + '</h2></div>';
        grid.appendChild(a);
      });
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadHomepageContent();
    loadCategories();
  });
})();
