/* Search, pagination and reading tools work on file:// as well as HTTP. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const posts = $$('[data-posts] .post');
  const search = $('[data-search]');
  const more = $('[data-load-more]');
  const status = $('[data-filter-status]');
  let filter = 'all', limit = 20;
  const update = () => {
    const terms = (search?.value || '').normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches = posts.filter(p => (filter === 'all' || p.dataset.cat === filter) && terms.every(t => (p.dataset.searchText + ' ' + p.dataset.cat).normalize('NFKC').toLowerCase().includes(t)));
    const visible = new Set(matches.slice(0, limit));
    posts.forEach(p => { p.hidden = !visible.has(p); p.classList.toggle('is-hidden', !visible.has(p)); p.removeAttribute('data-staged'); });
    if (more) more.hidden = matches.length <= limit;
    if (status) status.textContent = `找到 ${matches.length} 篇文章，显示 ${Math.min(limit, matches.length)} 篇${filter === 'all' ? '' : ' / ' + filter}`;
    const empty = $('[data-search-empty]');
    if (empty) empty.hidden = !!matches.length;
  };
  $$('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    filter = btn.dataset.filter; limit = 20;
    $$('[data-filter]').forEach(b => { b.classList.toggle('is-on', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    update();
  }));
  search?.addEventListener('input', () => { limit = 20; update(); });
  $('[data-search-clear]')?.addEventListener('click', () => { search.value = ''; limit = 20; update(); search.focus(); });
  more?.addEventListener('click', () => { limit += 20; update(); });
  if (posts.length) update();

  const images = $$('[data-lightbox]');
  if (images.length) {
    const dialog = document.createElement('dialog'); dialog.className = 'lightbox'; dialog.setAttribute('aria-label', '图片预览');
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '关闭 ×';
    const img = document.createElement('img'); dialog.append(close); document.body.append(dialog);
    const show = source => { img.src = source.src; img.alt = source.alt; dialog.append(img); dialog.showModal(); };
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    images.forEach(source => {
      source.addEventListener('click', () => show(source));
      source.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(source); } });
    });
  }

  const like = $('[data-react]'), count = $('[data-react-n]');
  if (like && count) {
    const key = 'wp-like-' + like.dataset.reactKey;
    const base = Number(count.textContent);
    let on = false;
    try { on = localStorage.getItem(key) === '1'; } catch (_) {}
    const render = () => { count.textContent = base + Number(on); like.classList.toggle('is-on', on); like.setAttribute('aria-pressed', String(on)); };
    render();
    like.addEventListener('click', () => { on = !on; try { localStorage.setItem(key, on ? '1' : '0'); } catch (_) {} render(); });
  }
})();
