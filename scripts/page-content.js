(function(){
  "use strict";

  function resolveApiUrl(pageKey) {
    return `api/site_content.php?page_key=${encodeURIComponent(pageKey)}`;
  }

  function applyValue(el, value, attr) {
    if (!el) return;
    const mode = attr || el.dataset.attr || '';
    if (mode === 'html' || (!mode && (el.dataset.field || '').endsWith('_html'))) {
      el.innerHTML = value || '';
      return;
    }
    if (mode === 'placeholder') {
      el.setAttribute('placeholder', value || '');
      return;
    }
    if (mode === 'href') {
      el.setAttribute('href', value || '#');
      return;
    }
    if (mode === 'aria-label') {
      el.setAttribute('aria-label', value || '');
      return;
    }
    el.textContent = value || '';
  }

  function fieldNodesForScope(scope) {
    return Array.from(scope.querySelectorAll('[data-field], [data-href-field], [data-aria-field]')).filter((el) => {
      const owner = el.closest('[data-block-key]');
      return owner === scope;
    });
  }

  function applyBlock(scope, item) {
    fieldNodesForScope(scope).forEach((el) => {
      const field = el.dataset.field || '';
      if (field) applyValue(el, item[field] ?? '', el.dataset.attr || '');
      const hrefField = el.dataset.hrefField || '';
      if (hrefField) applyValue(el, item[hrefField] ?? '', 'href');
      const ariaField = el.dataset.ariaField || '';
      if (ariaField) applyValue(el, item[ariaField] ?? '', 'aria-label');
    });
  }

  async function initPageContent(pageKey) {
    const key = pageKey || document.body?.dataset.pageKey || document.documentElement?.dataset.pageKey;
    if (!key) return null;
    try {
      const res = await fetch(resolveApiUrl(key), { credentials: 'include', cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!data || !data.ok || !Array.isArray(data.blocks)) return data;
      data.blocks.forEach((item) => {
        const scope = document.querySelector(`[data-block-key="${CSS.escape(item.block_key)}"]`);
        if (scope) applyBlock(scope, item);
      });
      document.dispatchEvent(new CustomEvent('cms:page-content-loaded', { detail: data }));
      return data;
    } catch (_) {
      return null;
    }
  }

  window.EuropagarPageContent = { initPageContent };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body?.dataset.pageKey && document.body.dataset.pageKey !== 'home') {
      initPageContent(document.body.dataset.pageKey).catch(() => {});
    }
  });
})();
