/* ==========================================================================
   WildPointer · 野指针 — main.js  (no dependencies)
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cssVar = (name, el = body) => getComputedStyle(el).getPropertyValue(name).trim();
  const store = (area, k, v) => { try { const s = window[area]; if (v === undefined) return s.getItem(k); if (v === null) s.removeItem(k); else s.setItem(k, v); } catch (_) { return null; } };

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.active = false; });

  /* ---------- Seeded random ---------- */
  const rng = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---------- Toast ---------- */
  const toastEl = $('[data-toast]');
  let toastT;
  const toast = msg => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
  };

  /* ---------- Theme ---------- */
  const themeListeners = [];
  const setTheme = t => {
    root.dataset.theme = t;
    store('localStorage', 'wp-theme', t);
    $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', t === 'dark' ? '#040A2B' : '#F2EFE7'));
    themeListeners.forEach(fn => fn(t));
  };
  $$('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) return setTheme(next);
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => {
      root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' });
    });
  }));

  /* ---------- Generative covers ---------- */
  const PAL = { navy: '#030D42', deep: '#031F64', blue: '#1C1382', violet: '#5F0689', magenta: '#C30D84', orange: '#F74D00', paper: '#F2EFE7' };
  let coverN = 0;
  const plane = (x, y, s, r, extra = '') =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" ${extra}><use href="#i-plane" x="-320" y="-257" width="640" height="515" style="--plane-wing:#F2EFE7;--plane-stroke:#030D42;--plane-fold:#9095B8"/></g>`;

  function coverSVG(spec) {
    const [seedS, type, ...rest] = spec.split(':');
    const R = rng(+seedS * 9973 + 17);
    const id = 'c' + (coverN++);
    const W = 400, H = 300;
    const grad = `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${PAL.deep}"/><stop offset=".45" stop-color="${PAL.blue}"/><stop offset=".75" stop-color="${PAL.violet}"/><stop offset="1" stop-color="${PAL.magenta}"/></linearGradient>
      <radialGradient id="${id}r" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${PAL.orange}"/><stop offset=".5" stop-color="${PAL.magenta}"/><stop offset="1" stop-color="${PAL.violet}" stop-opacity="0"/></radialGradient>`;
    let g = '';
    let bg = PAL.navy;

    if (type === 'orbit') {
      const cx = 140 + R() * 120, cy = 110 + R() * 80;
      g += `<circle cx="${cx}" cy="${cy}" r="${130 + R() * 40}" fill="url(#${id}r)" opacity=".85"/>`;
      for (let i = 1; i < 9; i++) g += `<circle cx="${cx}" cy="${cy}" r="${i * 26}" fill="none" stroke="${PAL.paper}" stroke-opacity="${.22 - i * .018}" stroke-dasharray="${i % 2 ? '2 6' : 'none'}"/>`;
      g += `<circle cx="${cx}" cy="${cy}" r="5" fill="${PAL.paper}"/>`;
      const a = R() * Math.PI * 2, rr = 104;
      g += plane(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, .085, a * 180 / Math.PI + 120);
    } else if (type === 'flow') {
      bg = R() > .5 ? PAL.navy : PAL.blue;
      const n = 26, amp = 18 + R() * 26, f = .01 + R() * .012, ph = R() * 10;
      for (let i = 0; i < n; i++) {
        let d = `M-20 ${i * 13}`;
        for (let x = -20; x <= W + 20; x += 20) d += ` L${x} ${(i * 13 + Math.sin(x * f + i * .35 + ph) * amp + Math.sin(x * f * 2.3 + i) * amp * .3).toFixed(1)}`;
        const c = i % 7 === 3 ? PAL.orange : PAL.paper;
        g += `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${i % 7 === 3 ? 1 : .25 + (i / n) * .35}" stroke-width="${i % 7 === 3 ? 2.4 : 1.1}"/>`;
      }
      g += plane(300 + R() * 50, 70 + R() * 60, .1, -8);
    } else if (type === 'glyph') {
      const ch = rest.join(':') || 'A';
      const flip = R() > .5;
      bg = flip ? PAL.orange : PAL.navy;
      g += `<rect x="0" y="0" width="${W}" height="${H}" fill="url(#${id}g)" opacity="${flip ? 0 : 1}"/>`;
      for (let i = 0; i < 14; i++) g += `<line x1="${i * 32}" y1="0" x2="${i * 32}" y2="${H}" stroke="${flip ? PAL.navy : PAL.paper}" stroke-opacity=".1"/>`;
      g += `<text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle" font-family="Fraunces, 'Noto Serif SC', serif" font-size="${ch.length > 2 ? 150 : 230}" font-style="italic" font-weight="300" style="font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144" fill="${flip ? PAL.navy : PAL.paper}">${ch.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
      g += `<circle cx="${60 + R() * 280}" cy="${40 + R() * 40}" r="7" fill="${flip ? PAL.paper : PAL.orange}"/>`;
    } else if (type === 'grid') {
      const s = 25;
      for (let y = 0; y < H / s; y++) for (let x = 0; x < W / s; x++) {
        const v = R();
        const c = v > .93 ? PAL.orange : v > .8 ? PAL.magenta : v > .6 ? PAL.blue : null;
        if (c) g += `<rect x="${x * s + 2}" y="${y * s + 2}" width="${s - 4}" height="${s - 4}" rx="3" fill="${c}" opacity="${v > .93 ? 1 : .55 + R() * .4}"/>`;
        else g += `<rect x="${x * s + 2}" y="${y * s + 2}" width="${s - 4}" height="${s - 4}" rx="3" fill="none" stroke="${PAL.paper}" stroke-opacity=".08"/>`;
      }
      g += plane(W * (.3 + R() * .4), H * (.3 + R() * .4), .13, -10);
    } else if (type === 'telemetry') {
      for (let i = 0; i < 6; i++) g += `<path d="M0 ${55 + i * 38}H400" stroke="${PAL.paper}" stroke-opacity=".1"/>`;
      const curves = [PAL.blue, PAL.magenta, PAL.orange];
      curves.forEach((c, k) => {
        let d = 'M-10 235';
        for (let x = 0; x <= 420; x += 7) {
          const y = 192 - k * 22 - Math.sin(x * .019 + k) * 35 - Math.exp(-(((x - 250 + k * 45) / 28) ** 2)) * 95;
          d += ` L${x} ${y.toFixed(1)}`;
        }
        g += `<path d="${d}L420 310H-10Z" fill="${c}" fill-opacity=".16"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${k === 2 ? 3 : 2}"/>`;
      });
      g += `<path d="M290 35V265" stroke="${PAL.paper}" stroke-opacity=".35" stroke-dasharray="3 6"/><circle cx="290" cy="110" r="5" fill="${PAL.orange}"/>`;
      g += plane(315, 92, .09, -18);
    } else if (type === 'layers') {
      bg = PAL.blue;
      for (let i = 0; i < 5; i++) {
        const x = 42 + i * 34, y = 202 - i * 31;
        g += `<path d="M${x} ${y}l108 -62 108 62 -108 62Z" fill="${[PAL.navy, PAL.violet, PAL.magenta, PAL.orange, PAL.paper][i]}" fill-opacity="${i === 4 ? .9 : .8}" stroke="${PAL.paper}" stroke-opacity=".25"/>`;
      }
      g += `<path d="M40 65l55 -32M310 230l55 -32" stroke="${PAL.orange}" stroke-width="3"/>`;
      g += plane(248, 105, .1, 8);
    } else if (type === 'mesh') {
      const project = (u, v) => {
        const z = 48 * Math.sin(u * .018) * Math.cos(v * .024);
        return [200 + (u - v) * .66, 153 + (u + v) * .25 - z];
      };
      for (let axis = 0; axis < 2; axis++) for (let t = -150; t <= 150; t += 18) {
        let d = '';
        for (let j = -150; j <= 150; j += 10) {
          const p = project(axis ? j : t, axis ? t : j);
          d += `${j === -150 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
        }
        g += `<path d="${d}" fill="none" stroke="${t === 12 ? PAL.orange : axis ? PAL.magenta : PAL.paper}" stroke-opacity="${t === 12 ? 1 : axis ? .7 : .35}" stroke-width="${t === 12 ? 2.5 : .9}"/>`;
      }
      g += plane(305, 80, .085, -5);
    } else if (type === 'sampling') {
      const points = [];
      for (let x = -10; x <= 410; x += 5) points.push([x, 157 + Math.sin(x * .031) * 48 + Math.sin(x * .13) * 16]);
      g += `<path d="${points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')}" fill="none" stroke="${PAL.paper}" stroke-opacity=".3"/>`;
      const selected = points.filter((_, i) => i % 9 === 0);
      g += `<path d="${selected.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')}" fill="none" stroke="${PAL.orange}" stroke-width="2.5"/>`;
      selected.forEach(([x, y]) => {
        g += `<path d="M${x} ${y + 8}V260" stroke="${PAL.magenta}" stroke-opacity=".4"/><circle cx="${x}" cy="${y}" r="4" fill="${PAL.orange}"/>`;
      });
      g += `<path d="M25 260H375" stroke="${PAL.paper}" stroke-opacity=".2"/>`;
      g += plane(280, 75, .095, -12);
    } else if (type === 'facets') {
      const points = [[200, 38], [78, 112], [106, 225], [232, 270], [335, 185], [308, 82], [200, 152]];
      for (let i = 0; i < 6; i++) {
        const a = points[i], b = points[(i + 1) % 6], c = points[6];
        g += `<path d="M${a}L${b}L${c}Z" fill="${[PAL.orange, PAL.violet, PAL.blue, PAL.magenta, PAL.deep, PAL.paper][i]}" fill-opacity="${i === 5 ? .8 : 1}" stroke="${PAL.navy}" stroke-width="2"/>`;
      }
      g += `<path d="M38 205l40 -23M324 54l37 -21" stroke="${PAL.paper}" stroke-opacity=".4"/>`;
      g += plane(203, 158, .1, 12);
    } else if (type === 'orbital') {
      bg = PAL.violet;
      g += `<circle cx="200" cy="150" r="91" fill="${PAL.navy}"/><circle cx="177" cy="136" r="52" fill="${PAL.blue}"/>`;
      for (let i = 0; i < 6; i++) g += `<ellipse cx="200" cy="150" rx="${148 - i * 10}" ry="${38 + i * 9}" transform="rotate(${i * 29 - 45} 200 150)" fill="none" stroke="${i === 1 ? PAL.orange : PAL.paper}" stroke-width="${i === 1 ? 3 : 1}" stroke-opacity="${i === 1 ? 1 : .32}"/>`;
      g += `<circle cx="80" cy="110" r="8" fill="${PAL.orange}"/>`;
      g += plane(216, 152, .11, -8);
    } else if (type === 'contours') {
      bg = PAL.deep;
      for (let i = 0; i < 22; i++) {
        let d = '';
        for (let j = 0; j <= 80; j++) {
          const a = j / 80 * Math.PI * 2, r = 15 + i * 9 + Math.sin(a * 3 + i * .12) * (8 + i * .8);
          d += `${j ? 'L' : 'M'}${(170 + Math.cos(a) * r * 1.35).toFixed(1)} ${(153 + Math.sin(a) * r * .72).toFixed(1)}`;
        }
        g += `<path d="${d}Z" fill="none" stroke="${i % 6 === 0 ? PAL.orange : PAL.paper}" stroke-opacity="${i % 6 === 0 ? .9 : .25}" stroke-width="${i % 6 === 0 ? 2 : .8}"/>`;
      }
      g += plane(263, 133, .11, 10);
    } else if (type === 'vision') {
      const colors = [PAL.blue, PAL.violet, PAL.magenta, PAL.orange];
      for (let i = 0; i < 100; i++) {
        const x = 40 + R() * 320, y = 36 + R() * 228;
        const r = 2 + Math.max(0, 1 - Math.hypot(x - 200, y - 150) / 160) * 10;
        g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[Math.floor(R() * colors.length)]}" opacity=".8"/>`;
      }
      g += `<path d="M110 95V72H135M265 72H290V95M290 205V228H265M135 228H110V205" fill="none" stroke="${PAL.paper}" stroke-width="2"/><circle cx="200" cy="150" r="60" fill="${PAL.navy}" fill-opacity=".75"/>`;
      g += plane(200, 150, .12, 0);
    } else if (type === 'fracture') {
      bg = PAL.orange;
      const shards = ['M-20 30L182 134 120 16Z', 'M137 -20L200 117 297 -20Z', 'M330 5L220 134 420 84Z', 'M420 105L235 158 405 247Z', 'M397 281L220 182 263 320Z', 'M231 320L187 187 98 307Z', 'M58 300L165 175 -20 218Z', 'M-20 178L168 150 20 68Z'];
      shards.forEach((d, i) => g += `<path d="${d}" fill="${i % 3 === 0 ? PAL.blue : PAL.navy}"/>`);
      g += `<path d="M49 53L146 108M277 215L333 252" stroke="${PAL.paper}" stroke-opacity=".35"/>`;
      g += plane(201, 152, .1, -15);
    } else if (type === 'strata') {
      for (let i = 0; i < 13; i++) {
        const y = 42 + i * 18, offset = Math.sin(i * .6) * 35;
        g += `<path d="M${38 + offset} ${y}l180 -25 140 35 -180 25Z" fill="${i === 6 ? PAL.orange : i % 3 === 0 ? PAL.magenta : PAL.blue}" stroke="${PAL.paper}" stroke-opacity=".22" stroke-width=".8"/>`;
      }
      g += plane(263, 132, .1, 6);
    } else if (type === 'braid') {
      for (let i = 0; i < 18; i++) {
        let d = '';
        for (let x = -20; x <= 420; x += 8) {
          const y = 150 + Math.sin(x * .018 + i * .23) * (48 + i * 3);
          d += `${x === -20 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
        }
        g += `<path d="${d}" fill="none" stroke="${i < 6 ? PAL.orange : i < 12 ? PAL.magenta : PAL.paper}" stroke-opacity="${i < 12 ? .8 : .35}" stroke-width="${i % 6 === 0 ? 2.5 : 1.1}"/>`;
      }
      g += plane(216, 143, .115, -8);
    } else if (type === 'signal') {
      bg = PAL.blue;
      for (let i = 0; i < 55; i++) {
        const x = 12 + i * 7, h = 12 + Math.abs(Math.sin(i * .25) * Math.cos(i * .07)) * 165;
        g += `<path d="M${x} ${150 - h / 2}V${150 + h / 2}" stroke="${i % 9 < 3 ? PAL.orange : PAL.paper}" stroke-opacity="${i % 9 < 3 ? 1 : .4}" stroke-width="3"/>`;
      }
      g += `<circle cx="200" cy="150" r="48" fill="${PAL.navy}"/>`;
      g += plane(200, 150, .1, 5);
    } else if (type === 'stripes') {
      g += `<rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
      const n = 12, ang = -30 + R() * 60;
      g += `<g transform="rotate(${ang} 200 150)">`;
      for (let i = -n; i < n * 2; i++) g += `<rect x="${i * 30}" y="-200" width="${3 + (i % 4 === 0 ? 10 : 0)}" height="700" fill="${i % 4 === 0 ? PAL.orange : PAL.paper}" opacity="${i % 4 === 0 ? .95 : .12}"/>`;
      g += `</g><circle cx="${W / 2}" cy="${H / 2}" r="64" fill="${PAL.navy}"/>`;
      g += plane(W / 2, H / 2, .12, 0);
    } else if (type === 'portrait') {
      g += `<rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
      g += `<clipPath id="${id}h"><circle cx="205" cy="128" r="82"/></clipPath>`;
      g += `<path d="M78 300 C 92 214, 318 214, 332 300 Z" fill="${PAL.navy}"/>`;
      g += `<circle cx="205" cy="128" r="82" fill="${PAL.orange}"/>`;
      g += `<g clip-path="url(#${id}h)" fill="none" stroke="${PAL.navy}" stroke-opacity=".35" stroke-width="1.2">`;
      for (let i = 0; i < 11; i++) g += `<ellipse cx="${236 - i * 2}" cy="${110 + i * 1.5}" rx="${12 + i * 11}" ry="${9 + i * 9.5}"/>`;
      g += `</g>`;
      g += `<path d="M30 240 C 90 200, 120 90, 205 128 S 250 76, 262 66" fill="none" stroke="${PAL.paper}" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/>`;
      g += plane(266, 62, .066, -14);
    }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${grad}</defs><rect width="${W}" height="${H}" fill="${bg}"/>${g}</svg>`;
  }
  const coverObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.innerHTML = coverSVG(entry.target.dataset.cover);
    coverObserver.unobserve(entry.target);
  }), { rootMargin: '500px' });
  $$('.cover[data-cover]').forEach(el => coverObserver.observe(el));

  /* ---------- Split text ---------- */
  const isCJK = ch => /[　-〿㐀-鿿＀-￯]/.test(ch);
  function splitText(el) {
    let n = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const tokens = child.textContent.replace(/\s+/g, ' ').match(/[　-〿㐀-鿿＀-￯][，。、；：！？」』）]?|[^\s　-〿㐀-鿿＀-￯]+|\s/g) || [];
          tokens.forEach(t => {
            if (t === ' ') return frag.appendChild(document.createTextNode(' '));
            const o = document.createElement('span'); o.className = 'sx';
            const i = document.createElement('span'); i.className = 'sxi'; i.textContent = t; i.style.setProperty('--d', (n++) * (isCJK(t) ? 28 : 55));
            o.appendChild(i); frag.appendChild(o);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR' && !child.classList.contains('mono')) walk(child);
        else if (child.nodeType === 1 && child.classList.contains('mono')) {
          child.style.transition = 'opacity 1s var(--ease), transform 1s var(--ease)';
          child.classList.add('sx-block');
        }
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach(splitText);

  /* ---------- Statement (scroll-scrubbed words) ---------- */
  const statement = $('[data-statement]');
  let stWords = [];
  if (statement) {
    const walk = node => [...node.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (c.textContent.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g) || []).forEach(t => {
          if (/^\s+$/.test(t)) return frag.appendChild(document.createTextNode(t));
          const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.appendChild(s);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(statement);
    stWords = $$('.w', statement);
  }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  const heroSplit = $('.hero [data-split]');
  $$('[data-reveal], [data-split], .feature__media').forEach(el => { if (el !== heroSplit) io.observe(el); });

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1800;
    const tick = now => {
      const p = clamp((now - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * k).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(tick);
    };
    reduce ? (el.textContent = to.toLocaleString('en-US')) : requestAnimationFrame(tick);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Loader / ready ---------- */
  const ready = () => {
    root.classList.add('is-ready');
    if (heroSplit) setTimeout(() => heroSplit.classList.add('is-in'), 150);
  };
  const loader = $('.loader');
  const pt = $('.pt');
  const fromTransition = store('sessionStorage', 'wp-pt') === '1';
  store('sessionStorage', 'wp-pt', null);

  if (fromTransition && pt && !reduce) {
    root.classList.remove('is-loading');
    pt.classList.add('is-entering');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pt.classList.add('go');
      setTimeout(ready, 250);
      setTimeout(() => pt.classList.remove('is-entering', 'go'), 1200);
    }));
  } else if (root.classList.contains('is-loading') && loader) {
    const cnt = $('[data-loader-count]', loader);
    const t0 = performance.now(), dur = 1200;
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    let fontsDone = false; fontsReady.then(() => fontsDone = true);
    setTimeout(() => { fontsDone = true; }, dur);
    const step = now => {
      let p = clamp((now - t0) / dur, 0, 1);
      if (!fontsDone) p = Math.min(p, .92);
      const k = 1 - Math.pow(1 - p, 3);
      cnt.textContent = '0x' + Math.floor(k * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      loader.style.setProperty('--p', k);
      $('.loader__bar', loader).style.setProperty('--p', k);
      if (p < 1) return requestAnimationFrame(step);
      loader.classList.add('is-done');
      store('sessionStorage', 'wp-loaded', '1');
      setTimeout(ready, 350);
      setTimeout(() => root.classList.remove('is-loading'), 1200);
    };
    requestAnimationFrame(step);
  } else {
    requestAnimationFrame(ready);
  }
  addEventListener('pageshow', e => { if (e.persisted && pt) pt.className = 'pt'; });

  /* ---------- Page transitions ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-transition]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || reduce || !pt) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin && location.protocol !== 'file:') return;
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    store('sessionStorage', 'wp-pt', '1');
    pt.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, 850);
  });

  /* ---------- Header ---------- */
  const header = $('[data-header]');
  let lastY = scrollY;
  const menuBtn = $('[data-menu-btn]');
  const onHeader = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    if (!body.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > lastY && y > 400);
    lastY = y;
  };

  /* ---------- Mobile menu ---------- */
  const menu = $('[data-menu]');
  const setMenu = open => {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    menu.setAttribute('aria-hidden', !open);
    body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });
  }

  /* ---------- Active nav ---------- */
  const navLinks = $$('.nav__link[href^="#"]');
  if (navLinks.length) {
    const nio = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(l => { const t = $(l.getAttribute('href')); if (t) nio.observe(t); });
  }

  /* ---------- Smooth anchor scrolling ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const t = document.getElementById(decodeURIComponent(id.slice(1)));
    if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + scrollY - (id === '#lab' ? 0 : 70);
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
  $$('[data-totop]').forEach(b => b.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })));

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  if (cursor && finePointer && !reduce) {
    root.classList.add('has-cursor');
    const cp = $('.cursor__plane', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    const c = { x: mouse.x, y: mouse.y, rx: mouse.x, ry: mouse.y, tilt: 0, px: mouse.x };
    const loop = () => {
      c.x = mouse.x; c.y = mouse.y;
      c.rx = lerp(c.rx, mouse.x, .16); c.ry = lerp(c.ry, mouse.y, .16);
      const vx = mouse.x - c.px; c.px = mouse.x;
      c.tilt = lerp(c.tilt, clamp(vx * 1.2, -28, 28), .15);
      cp.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) rotate(${c.tilt}deg)`;
      ring.style.left = c.rx + 'px'; ring.style.top = c.ry + 'px';
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      const l = e.target.closest('a, button, input, label, [role="button"]');
      if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-label'); } else cursor.classList.remove('is-label');
      cursor.classList.toggle('is-link', !!l && !t);
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
  }

  /* ---------- Magnetic + fill origin ---------- */
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.transform = `translate(${(x - r.width / 2) * .22}px, ${(y - r.height / 2) * .3}px)`;
      });
      el.addEventListener('pointerenter', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', e.clientX - r.left + 'px'); el.style.setProperty('--y', e.clientY - r.top + 'px');
        el.style.transition = 'transform .3s var(--ease), color .5s var(--ease), background-color .4s';
      });
      el.addEventListener('pointerleave', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', e.clientX - r.left + 'px'); el.style.setProperty('--y', e.clientY - r.top + 'px');
        el.style.transition = 'transform .9s var(--ease-back), color .5s var(--ease), background-color .4s';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Hero: pointer field + plane ---------- */
  const hero = $('[data-hero]');
  const field = $('[data-field]');
  const heroPlane = $('[data-hero-plane]');
  const addrEl = $('[data-addr]');
  let heroVisible = true;
  if (hero) new IntersectionObserver(([e]) => heroVisible = e.isIntersecting).observe(hero);

  if (field) {
    const ctx = field.getContext('2d');
    let W, H, dpr, pts = [], col = '#030D42', acc = '#F74D00';
    const gap = () => innerWidth < 600 ? 30 : 38;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      field.width = W * dpr; field.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      const g = gap();
      for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) pts.push({ x, y, a: 0, l: 0 });
    };
    const colors = () => { col = cssVar('--ink'); acc = cssVar('--accent'); };
    themeListeners.push(() => setTimeout(colors, 30));
    resize(); colors();
    addEventListener('resize', resize);
    const v = { x: W * .7, y: H * .4 };
    let t = 0;
    const draw = () => {
      requestAnimationFrame(draw);
      if (!heroVisible) return;
      t += .006;
      const r = hero.getBoundingClientRect();
      const tx = mouse.active ? mouse.x - r.left : W * (.55 + Math.cos(t) * .25);
      const ty = mouse.active ? mouse.y - r.top : H * (.45 + Math.sin(t * 1.3) * .2);
      v.x = lerp(v.x, tx, .08); v.y = lerp(v.y, ty, .08);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      const R = Math.min(380, W * .35);
      for (const p of pts) {
        const dx = v.x - p.x, dy = v.y - p.y, d = Math.hypot(dx, dy);
        const k = clamp(1 - d / R, 0, 1);
        const target = Math.atan2(dy, dx);
        let da = target - p.a; da = Math.atan2(Math.sin(da), Math.cos(da));
        p.a += da * (.06 + k * .2);
        p.l = lerp(p.l, k, .12);
        if (p.l < .02) {
          ctx.fillStyle = col; ctx.globalAlpha = .14;
          ctx.fillRect(p.x - .75, p.y - .75, 1.5, 1.5);
          continue;
        }
        const len = 2 + p.l * 13;
        const cx = Math.cos(p.a) * len / 2, cy = Math.sin(p.a) * len / 2;
        ctx.globalAlpha = .12 + p.l * .5;
        ctx.strokeStyle = p.l > .62 ? acc : col;
        ctx.lineWidth = 1.2 + p.l * .8;
        ctx.beginPath(); ctx.moveTo(p.x - cx, p.y - cy); ctx.lineTo(p.x + cx, p.y + cy); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (addrEl) addrEl.textContent = '0x' + (Math.round(v.x) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0') + '·' + (Math.round(v.y) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };
    if (!reduce) draw();
  }

  if (heroPlane && !reduce) {
    const rot = $('.hero__plane-rot', heroPlane);
    let a = 0, tagged = false;
    const BASE = -33.5;
    const loop = () => {
      requestAnimationFrame(loop);
      if (!heroVisible) return;
      const r = heroPlane.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let target = mouse.active ? Math.atan2(mouse.y - cy, mouse.x - cx) * 180 / Math.PI - BASE : Math.sin(performance.now() / 1800) * 8;
      let d = target - a; d = ((d + 540) % 360) - 180;
      a += d * .08;
      rot.style.setProperty('--a', a.toFixed(2) + 'deg');
      if (mouse.active && !tagged) { tagged = true; heroPlane.classList.add('is-tagged'); setTimeout(() => heroPlane.classList.remove('is-tagged'), 2600); }
    };
    loop();
  }

  /* ---------- Marquee (scroll-velocity aware) ---------- */
  const tapes = $$('[data-marquee]').map(el => {
    const track = $('.tape__track', el);
    return { el, track, dir: +el.dataset.marquee, x: 0, w: 0 };
  });
  const measureTapes = () => tapes.forEach(t => t.w = t.track.scrollWidth / 2);
  measureTapes(); addEventListener('resize', measureTapes);
  if (document.fonts) document.fonts.ready.then(measureTapes);

  /* ---------- Parallax ---------- */
  const parallax = $$('[data-parallax]');

  const posts = $$('[data-posts] .post');

  /* ---------- Post hover preview ---------- */
  const preview = $('[data-preview]');
  if (preview && finePointer && !reduce && posts.length) {
    const inner = $('.post-preview__in', preview);
    const cover = document.createElement('div'); cover.className = 'cover'; inner.appendChild(cover);
    const s = { x: 0, y: 0, px: 0, on: false };
    posts.forEach((p, i) => {
      p.addEventListener('pointerenter', () => {
        cover.replaceChildren();
        cover.classList.add('is-cur');
        if (p.dataset.image) {
          const img = document.createElement('img'); img.src = p.dataset.image; img.alt = ''; img.className = 'cover-image'; cover.appendChild(img);
        } else cover.innerHTML = coverSVG(p.dataset.cover);
        if (!s.on) { s.x = mouse.x; s.y = mouse.y; }
        s.on = true; preview.classList.add('is-on');
      });
    });
    $('[data-posts]').addEventListener('pointerleave', () => { s.on = false; preview.classList.remove('is-on'); });
    const loop = () => {
      requestAnimationFrame(loop);
      if (!s.on && !preview.classList.contains('is-on')) return;
      const w = preview.offsetWidth, h = preview.offsetHeight;
      s.x = lerp(s.x, mouse.x, .12); s.y = lerp(s.y, mouse.y, .12);
      const vx = s.x - s.px; s.px = s.x;
      const x = clamp(s.x + 40, 0, innerWidth - w - 16);
      preview.style.transform = `translate3d(${x}px, ${s.y - h / 2}px, 0)`;
      preview.style.setProperty('--r', clamp(vx * .35, -10, 10) + 'deg');
    };
    loop();
  }

  /* ---------- Lab: horizontal pinned scroll ---------- */
  const lab = $('[data-lab]'), labTrack = $('[data-lab-track]'), labBar = $('[data-lab-bar]'), labCount = $('[data-lab-count]');
  let labDist = 0, labTop = 0, labPad = 0;
  const labTotal = labTrack ? labTrack.children.length : 0;
  const labDesktop = () => innerWidth > 900 && !reduce;
  const measureLab = () => {
    if (!lab) return;
    if (!labDesktop()) { lab.style.height = ''; return; }
    labPad = parseFloat(getComputedStyle(lab).paddingTop);
    labDist = Math.max(0, labTrack.scrollWidth - innerWidth);
    lab.style.height = (innerHeight + labDist + labPad) + 'px';
    labTop = lab.getBoundingClientRect().top + scrollY + labPad;
  };
  measureLab();
  addEventListener('resize', measureLab);
  addEventListener('load', measureLab);
  if (lab && !labDesktop()) labTrack.addEventListener('scroll', () => {
    const p = labTrack.scrollLeft / Math.max(1, labTrack.scrollWidth - labTrack.clientWidth);
    labBar.style.setProperty('--p', p);
    labCount.textContent = String(Math.min(labTotal, 1 + Math.round(p * (labTotal - 1)))).padStart(2, '0') + ' / ' + String(labTotal).padStart(2, '0');
  }, { passive: true });

  /* ---------- Master scroll loop ---------- */
  let sy = scrollY, vel = 0, lastScroll = scrollY;
  const frame = () => {
    sy = scrollY;
    const dv = sy - lastScroll; lastScroll = sy;
    vel = lerp(vel, dv, .1);

    tapes.forEach(t => {
      if (!t.w) return;
      t.x -= t.dir * (0.6 + Math.abs(vel) * .25) * (reduce ? 0 : 1);
      if (t.x <= -t.w) t.x += t.w;
      if (t.x > 0) t.x -= t.w;
      t.track.style.transform = `translate3d(${t.x}px,0,0)`;
    });

    if (!reduce) parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2);
      el.style.setProperty('--py', (-p * +el.dataset.parallax).toFixed(1) + 'px');
    });

    if (stWords.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((innerHeight * .82 - r.top) / (r.height + innerHeight * .3), 0, 1);
      const on = Math.round(p * stWords.length);
      stWords.forEach((w, i) => w.classList.toggle('on', i < on));
    }

    if (lab && labDesktop() && labDist) {
      const p = clamp((sy - labTop) / labDist, 0, 1);
      labTrack.style.transform = `translate3d(${-p * labDist}px,0,0)`;
      labBar.style.setProperty('--p', p);
      labCount.textContent = String(Math.min(labTotal, 1 + Math.floor(p * (labTotal - .01)))).padStart(2, '0') + ' / ' + String(labTotal).padStart(2, '0');
    }

    if (header) onHeader();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- Lab experiments ---------- */
  const visible = new WeakMap();
  const vio = new IntersectionObserver(es => es.forEach(e => visible.set(e.target, e.isIntersecting)));
  const setupCanvas = (cv, draw, init) => {
    const ctx = cv.getContext('2d');
    const st = { W: 0, H: 0, mx: -1e4, my: -1e4, in: false, t: 0 };
    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      st.W = cv.clientWidth; st.H = cv.clientHeight;
      cv.width = st.W * dpr; cv.height = st.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init && init(ctx, st);
    };
    size(); addEventListener('resize', size);
    const stage = cv.parentElement;
    vio.observe(stage);
    stage.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); st.mx = e.clientX - r.left; st.my = e.clientY - r.top; st.in = true; });
    stage.addEventListener('pointerleave', () => { st.in = false; });
    const loop = () => { requestAnimationFrame(loop); if (!visible.get(stage)) return; st.t++; draw(ctx, st); };
    if (reduce) { st.t = 200; draw(ctx, st); } else loop();
  };

  // value noise
  const perm = new Uint8Array(512); { const R = rng(7); const p = [...Array(256).keys()].sort(() => R() - .5); for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; }
  const fade = t => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y);
    const h = (i, j) => perm[perm[X + i] + Y + j] / 255;
    const u = fade(xf), v = fade(yf);
    return lerp(lerp(h(0, 0), h(1, 0), u), lerp(h(0, 1), h(1, 1), u), v);
  };

  $$('canvas[data-exp]').forEach(cv => {
    const kind = cv.dataset.exp;
    if (kind === 'flow') {
      let ps = [];
      setupCanvas(cv, (ctx, s) => {
        ctx.fillStyle = 'rgba(3,13,66,.09)'; ctx.fillRect(0, 0, s.W, s.H);
        const z = s.t * .002;
        for (const p of ps) {
          let a = noise(p.x * .006, p.y * .006 + z) * Math.PI * 4;
          if (s.in) { const dx = p.x - s.mx, dy = p.y - s.my, d = Math.hypot(dx, dy); if (d < 120) a = Math.atan2(dy, dx) + Math.PI / 2; }
          const ox = p.x, oy = p.y;
          p.x += Math.cos(a) * 1.3; p.y += Math.sin(a) * 1.3; p.life--;
          if (p.x < 0 || p.x > s.W || p.y < 0 || p.y > s.H || p.life < 0) { p.x = Math.random() * s.W; p.y = Math.random() * s.H; p.life = 100 + Math.random() * 200; continue; }
          ctx.strokeStyle = p.c; ctx.lineWidth = p.w;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
      }, (ctx, s) => {
        ctx.fillStyle = '#030D42'; ctx.fillRect(0, 0, s.W, s.H);
        const cols = ['rgba(242,239,231,.55)', 'rgba(242,239,231,.3)', '#F74D00', '#C30D84', 'rgba(158,168,255,.6)'];
        ps = Array.from({ length: Math.round(s.W * s.H / 90) }, (_, i) => ({ x: Math.random() * s.W, y: Math.random() * s.H, life: Math.random() * 300, c: cols[i % 17 === 0 ? 2 : i % 11 === 0 ? 3 : i % 5 === 0 ? 4 : i % 2], w: i % 17 === 0 ? 1.6 : 1 }));
      });
    }
    if (kind === 'swarm') {
      let ag = [];
      let ink = cssVar('--ink'), acc = cssVar('--accent');
      themeListeners.push(() => setTimeout(() => { ink = cssVar('--ink'); acc = cssVar('--accent'); }, 30));
      setupCanvas(cv, (ctx, s) => {
        ctx.clearRect(0, 0, s.W, s.H);
        const tx = s.in ? s.mx : s.W / 2 + Math.cos(s.t * .02) * s.W * .3;
        const ty = s.in ? s.my : s.H / 2 + Math.sin(s.t * .031) * s.H * .3;
        for (const a of ag) {
          const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
          const ta = Math.atan2(dy, dx);
          let da = ta - a.a; da = Math.atan2(Math.sin(da), Math.cos(da));
          a.a += da * a.k;
          const near = clamp(1 - d / 160, 0, 1);
          ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
          ctx.fillStyle = near > .2 ? acc : ink; ctx.globalAlpha = .35 + near * .65;
          const sz = 5 + near * 4;
          ctx.beginPath(); ctx.moveTo(sz, 0); ctx.lineTo(-sz * .7, -sz * .55); ctx.lineTo(-sz * .3, 0); ctx.lineTo(-sz * .7, sz * .55); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }, (ctx, s) => {
        ag = []; const g = 26;
        for (let y = g / 2; y < s.H; y += g) for (let x = g / 2; x < s.W; x += g) ag.push({ x: x + (Math.random() - .5) * 6, y: y + (Math.random() - .5) * 6, a: Math.random() * 6, k: .05 + Math.random() * .1 });
      });
    }
    if (kind === 'memory') {
      let cells = [], cols, rows, sz = 22;
      setupCanvas(cv, (ctx, s) => {
        ctx.fillStyle = '#030D42'; ctx.fillRect(0, 0, s.W, s.H);
        if (s.t % 3 === 0) for (let i = 0; i < 3; i++) { const c = cells[(Math.random() * cells.length) | 0]; c.v = 1; c.c = Math.random() > .82 ? '#F74D00' : Math.random() > .5 ? '#C30D84' : '#5F6BFF'; }
        const hx = Math.floor(s.mx / sz), hy = Math.floor(s.my / sz);
        cells.forEach((c, i) => {
          const x = (i % cols) * sz, y = Math.floor(i / cols) * sz;
          const hov = s.in && Math.abs(i % cols - hx) <= 1 && Math.abs(Math.floor(i / cols) - hy) <= 1;
          if (hov) { c.v = 1; c.c = '#F74D00'; }
          c.v *= .965;
          ctx.fillStyle = 'rgba(242,239,231,.06)'; ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
          if (c.v > .02) { ctx.globalAlpha = c.v; ctx.fillStyle = c.c; ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4); ctx.globalAlpha = 1; }
        });
        ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(242,239,231,.85)';
        const addr = s.in ? '0x' + ((hy * cols + hx) * 8 + 0x7FF0).toString(16).toUpperCase() : 'heap: ' + (cells.filter(c => c.v > .3).length * 8) + ' B in use';
        ctx.fillStyle = 'rgba(3,13,66,.85)'; ctx.fillRect(10, s.H - 32, ctx.measureText(addr).width + 20, 22);
        ctx.fillStyle = '#F2EFE7'; ctx.fillText(addr, 20, s.H - 17);
      }, (ctx, s) => {
        cols = Math.ceil(s.W / sz); rows = Math.ceil(s.H / sz);
        cells = Array.from({ length: cols * rows }, () => ({ v: Math.random() > .85 ? Math.random() : 0, c: '#5F6BFF' }));
      });
    }
  });

  const typeEl = $('[data-exp="type"]');
  if (typeEl) {
    const stage = typeEl.parentElement;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      typeEl.style.setProperty('--w', Math.round(100 + (e.clientX - r.left) / r.width * 800));
      typeEl.style.setProperty('--s', Math.round((e.clientY - r.top) / r.height * 100));
    });
    stage.addEventListener('pointerleave', () => { typeEl.style.removeProperty('--w'); typeEl.style.removeProperty('--s'); });
  }

  /* ==========================================================================
     Article page
     ========================================================================== */
  const progress = $('[data-progress]');
  const prose = $('[data-prose]');
  if (progress && prose) {
    const tocLinks = $$('.toc a');
    const tocPtr = $('.toc__ptr');
    const heads = tocLinks.map(a => document.getElementById(a.getAttribute('href').slice(1)));
    const upd = () => {
      const r = prose.getBoundingClientRect();
      const p = clamp((-r.top + innerHeight * .3) / (r.height - innerHeight * .4), 0, 1);
      progress.style.setProperty('--p', p);
      let cur = 0;
      heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top < innerHeight * .35) cur = i; });
      tocLinks.forEach((a, i) => a.classList.toggle('is-on', i === cur));
      if (tocPtr && tocLinks[cur]) tocPtr.style.setProperty('--y', (tocLinks[cur].offsetTop + tocLinks[cur].offsetHeight / 2 - 9) + 'px');
      requestAnimationFrame(upd);
    };
    upd();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const input = document.createElement('textarea'); input.value = text;
    input.style.position = 'fixed'; input.style.opacity = '0'; document.body.appendChild(input); input.select();
    const ok = document.execCommand('copy'); input.remove(); if (!ok) throw new Error('Clipboard unavailable');
  }

  $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    const code = btn.closest('.code').querySelector('code').innerText;
    try { await copyText(code); } catch (_) { toast('复制失败，请手动选择代码'); return; }
    btn.textContent = '已复制 ✓'; btn.classList.add('is-done');
    setTimeout(() => { btn.textContent = '复制'; btn.classList.remove('is-done'); }, 1800);
  }));

  $$('[data-share]').forEach(btn => btn.addEventListener('click', async () => {
    try { await copyText(location.href); } catch (_) { toast('复制失败，请复制地址栏链接'); return; }
    toast('链接已复制到剪贴板');
  }));

})();
