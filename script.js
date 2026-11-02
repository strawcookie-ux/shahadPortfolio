(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 70}ms`; revealIO.observe(el); });

  /* ---------- header: active link, theme, mobile menu ---------- */
  const header = $('#header');
  const links = $$('[data-target]', header);
  const sections = ['about', 'projects', 'experience', 'beyond-study', 'contact'].map((id) => document.getElementById(id));
  const lightSections = [$('#experience')];

  function onScroll() {
    const probe = innerHeight * 0.35;
    let current = null;
    sections.forEach((s) => { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) current = s.id; });
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.target === current));
    const hy = header.offsetTop + header.offsetHeight / 2;
    const overLight = lightSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= hy && r.bottom >= hy; });
    header.classList.toggle('header--light', overLight);
    header.classList.toggle('header--dark', !overLight);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  $('#menu').addEventListener('click', (e) => {
    const open = header.classList.toggle('is-open');
    e.currentTarget.classList.toggle('is-active', open);
  });
  $$('#nav a, .header__contact').forEach((a) => a.addEventListener('click', () => {
    header.classList.remove('is-open'); $('#menu').classList.remove('is-active');
  }));
  /* ---------- i18n: all text comes from content.js ---------- */
  const T = window.CONTENT;
  let lang = 'en';
  const t = (k) => (T[lang] && T[lang][k]) ?? T.en[k] ?? k;

  let marqueeRun = 0;
  function buildMarquee() {
    const run = ++marqueeRun;
    $$('.marquee__track').forEach((track) => {
      const items = t(track.dataset.list).split('|');
      const colors = track.dataset.colors.split('|');
      track.style.transform = '';
      const group = () => items.map((txt, i) =>
        `<div class="mitem"><span class="pill pill--${colors[i % colors.length]}">${txt}</span><span class="star">✦</span></div>`).join('');
      track.innerHTML = `<div class="mgroup" style="display:flex">${group()}</div>`;
      const first = track.firstElementChild;
      while (track.scrollWidth < innerWidth * 2 + first.offsetWidth) track.appendChild(first.cloneNode(true));
      const dir = +track.parentElement.dataset.dir, speed = +track.parentElement.dataset.speed;
      const w = first.offsetWidth;
      let x = dir < 0 ? -w : 0, last = performance.now();
      if (reduced) return;
      (function tick(now) {
        if (run !== marqueeRun) return;
        x += dir * speed * ((now - last) / 1000); last = now;
        if (x >= 0 && dir > 0) x -= w;
        if (x <= -w && dir < 0) x += w;
        track.style.transform = `translate3d(${x}px,0,0)`;
        requestAnimationFrame(tick);
      })(last);
    });
  }

  function applyLang(l) {
    lang = l;
    const rtl = l === 'ar';
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    document.title = t('meta.title');
    $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
    $$('[data-list]:not(.marquee__track)').forEach((el) => {
      el.innerHTML = '';
      t(el.dataset.list).split('|').forEach((x) => { const s = document.createElement('span'); s.textContent = x; el.appendChild(s); });
    });
    $('#lang').textContent = rtl ? 'EN' : 'AR';
    buildMarquee();
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  $('#lang').addEventListener('click', () => applyLang(lang === 'ar' ? 'en' : 'ar'));

  /* ---------- picture slots: images/<code>.svg|png|webp|jpg|jpeg replaces the placeholder ---------- */
  const EXTS = ['svg', 'png', 'webp', 'jpg', 'jpeg'];
  const slotCache = {};
  function findImage(code) {
    return slotCache[code] || (slotCache[code] = new Promise((resolve) => {
      let i = 0;
      (function next() {
        if (i >= EXTS.length) return resolve(null);
        const src = `images/${code}.${EXTS[i++]}`, img = new Image();
        img.onload = () => resolve(src); img.onerror = next; img.src = src;
      })();
    }));
  }
  const showSlots = !/[?&]clean/.test(location.search); // placeholders visible by default; add ?clean to hide empty ones
  $$('[data-img]').forEach((el) => {
    const code = el.dataset.img;
    if (!showSlots) el.classList.add('slot--pending'); else { el.textContent = code; el.title = code; }
    findImage(code).then((src) => {
      el.classList.remove('slot--pending');
      if (!src) {
        if (showSlots) return;
        if (el.dataset.fallback) { el.textContent = el.dataset.fallback; el.classList.add('slot--text'); } else el.classList.add('slot--empty');
        return;
      }
      el.textContent = ''; el.classList.add('has-img');
      const img = document.createElement('img'); img.src = src; img.alt = ''; img.draggable = false; el.appendChild(img);
    });
  });
  // CV buttons only appear once files/cv.pdf exists
  fetch('files/cv.pdf', { method: 'HEAD' }).then((r) => { if (r.ok) $$('#cvBtn, #cvIcon').forEach((el) => (el.hidden = false)); }).catch(() => {});
  $('#volCount').textContent = String($$('.bcard').length).padStart(2, '0');

  /* ---------- hero: stretching words ---------- */
  $$('.word').forEach((w) => {
    w.addEventListener('pointerenter', () => w.classList.add('is-active'));
    w.addEventListener('pointerleave', () => w.classList.remove('is-active'));
    w.addEventListener('click', () => w.classList.toggle('is-active'));
  });


  /* ---------- hero: subtle aurora parallax ---------- */
  const aurora = $('.hero__aurora');
  addEventListener('scroll', () => {
    const y = Math.min(scrollY, innerHeight);
    aurora.style.transform = `translate3d(0,${y * 0.18}px,0) scale(${1 + y / innerHeight * 0.08})`;
    aurora.style.opacity = String(1 - y / innerHeight * 0.7);
  }, { passive: true });

  /* ---------- tech stack: falling, draggable tags ---------- */
  const stage = $('#stage');
  const tags = $$('.tag', stage);
  // physics runs even with reduced-motion on (it only moves when the section is visible); small screens get a static pile
  if (matchMedia('(max-width: 480px)').matches) {
    stage.classList.add('is-static');
  } else {
    const bodies = [];
    let started = false, W = 0, H = 0, drag = null;
    const G = 1800, BOUNCE = 0.38, FRICTION = 0.985;

    function measure() { W = stage.clientWidth; H = stage.clientHeight; }
    function start() {
      measure();
      tags.forEach((el, i) => {
        const w = el.offsetWidth, h = el.offsetHeight;
        bodies.push({ el, w, h, x: Math.random() * (W - w), y: -h - i * 90 - Math.random() * 120, vx: (Math.random() - .5) * 220, vy: 0, rot: (Math.random() - .5) * 8 });
      });
      last = performance.now(); requestAnimationFrame(step);
    }
    let last = 0;
    function step(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      for (const b of bodies) {
        if (b === drag?.body) continue;
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        b.vx *= FRICTION;
        if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * BOUNCE; }
        if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * BOUNCE; }
        if (b.y + b.h > H) { b.y = H - b.h; b.vy = -Math.abs(b.vy) * BOUNCE; if (Math.abs(b.vy) < 40) b.vy = 0; b.vx *= 0.9; }
      }
      // simple AABB resolution so pills stack on each other
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox <= 0 || oy <= 0) continue;
        const ad = a === drag?.body, bd = b === drag?.body;
        if (oy < ox) { // resolve vertically
          const aAbove = a.y + a.h / 2 < b.y + b.h / 2;
          const top = aAbove ? a : b, bot = aAbove ? b : a;
          if (!(top === drag?.body)) top.y -= bot === drag?.body ? oy : oy / 2;
          if (!(bot === drag?.body)) bot.y += top === drag?.body ? oy : oy / 2;
          if (top.vy > 0) top.vy *= -BOUNCE * .5; if (Math.abs(top.vy) < 30) top.vy = 0;
        } else {
          const aLeft = a.x < b.x, dir = aLeft ? -1 : 1;
          if (!ad) a.x += dir * (bd ? ox : ox / 2); if (!bd) b.x -= dir * (ad ? ox : ox / 2);
          a.vx = dir * Math.abs(a.vx) * .5 + dir * 20; b.vx = -dir * Math.abs(b.vx) * .5 - dir * 20;
        }
      }
      for (const b of bodies) {
        b.rot += ((b === drag?.body ? 0 : 0) - b.rot) * 0.08;
        b.el.style.transform = `translate3d(${b.x}px,${b.y}px,0) rotate(${b.rot}deg)`;
      }
      requestAnimationFrame(step);
    }

    stage.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.tag'); if (!el) return;
      const body = bodies.find((b) => b.el === el), r = stage.getBoundingClientRect();
      drag = { body, dx: e.clientX - r.left - body.x, dy: e.clientY - r.top - body.y, px: body.x, py: body.y, t: performance.now() };
      el.classList.add('is-drag'); el.setPointerCapture(e.pointerId); e.preventDefault();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = stage.getBoundingClientRect(), b = drag.body, now = performance.now(), dt = Math.max((now - drag.t) / 1000, 0.001);
      const nx = Math.max(0, Math.min(W - b.w, e.clientX - r.left - drag.dx)), ny = Math.max(0, Math.min(H - b.h, e.clientY - r.top - drag.dy));
      b.vx = (nx - drag.px) / dt * .6; b.vy = (ny - drag.py) / dt * .6;
      b.x = nx; b.y = ny; drag.px = nx; drag.py = ny; drag.t = now;
    });
    const release = () => { if (!drag) return; drag.body.el.classList.remove('is-drag'); drag = null; };
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    addEventListener('resize', measure);

    new IntersectionObserver((es, io) => { if (es[0].isIntersecting && !started) { started = true; start(); io.disconnect(); } }, { threshold: 0.3 }).observe(stage);
  }

  /* ---------- projects: stacked cards that shrink as the next one covers them ---------- */
  const cards = $('.project');
  const markTall = () => cards.forEach((c) => c.classList.toggle('is-tall', c.offsetHeight > innerHeight - 140));
  function stackCards() {
    markTall();
    if (innerWidth <= 960) { cards.forEach((c) => (c.style.transform = '')); return; }
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const nr = next.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const p = Math.min(Math.max(1 - (nr.top - cr.top) / cr.height, 0), 1);
      card.style.transform = `scale(${1 - p * 0.06}) translateY(${-p * 12}px)`;
      card.style.filter = `brightness(${1 - p * 0.45})`;
    });
  }
  addEventListener('scroll', stackCards, { passive: true });
  addEventListener('resize', stackCards);

  /* ---------- experience: timeline fills while scrolling ---------- */
  const tl = $('.xtrans__stage'), tline = $('#tline'), tnode = $('#tnode');
  function timeline() {
    const r = tl.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.2), 0), 1);
    tline.style.height = `${p * 100}%`;
    tnode.style.top = `${p * 100}%`;
  }
  addEventListener('scroll', timeline, { passive: true });
  addEventListener('resize', timeline);

  /* ---------- contact form (front-end only) ---------- */
  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.currentTarget, s = $('#status');
    if (!f.checkValidity()) { s.textContent = t('form.invalid'); s.classList.remove('is-ok'); return; }
    const d = new FormData(f);
    location.href = 'mailto:shahad.ashammari67@gmail.com?subject=' + encodeURIComponent('Portfolio message from ' + d.get('name')) +
      '&body=' + encodeURIComponent(d.get('message') + '\n\n' + d.get('name') + ' (' + d.get('email') + ')');
    s.textContent = t('form.thanks'); s.classList.add('is-ok'); f.reset();
  });

  let saved = 'en'; try { saved = localStorage.getItem('lang') || 'en'; } catch (e) {}
  applyLang(saved === 'ar' ? 'ar' : 'en');
  onScroll(); stackCards(); timeline();
})();
