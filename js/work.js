/* Full Stop · work pages (round 5; round 6: the filled gradient and the live content): behaviour for work.html?p=<slug>
 * The page is already written before the first paint (js/work-data.js WORK.render). This brings it to life at FS boot,
 * in the homepage's language: focus (blur → sharp) and irises (circle clips opening from a stop or a disc). It stands
 * in for js/home.js and js/motion.js, which are homepage-only (they assume the portrait hero); the pieces lifted from
 * them say so.
 *
 *   hero      the device on the filled light, the headline fit to its column, the intro: the light comes up out of
 *             the night, then the device, copy and meta focus in
 *   light     the one aurora field, clipped to the hero, the Next band and the footer's iris (whichever are in view)
 *   brief     the statement (and the live sections' quotes) focus word by word as they pass the reading line
 *   irises    every ice section opens from the last stop or index disc above it, the footer from the Next arrow
 *   reveals   heads, rows, plates and captions focus in as they enter; paragraphs line by line
 *   rack      the Decisions and Final designs plates, the hero and the Next device rack focus with the scroll
 *   live      the process discs light in turn, the bullets' stops light in turn, the atomic stages' rail follows the
 *             stage in view, the stepped sequences and the ideation track ride the scroll on wide screens
 *   stats     the outcome's discs light from their centres and count up
 *   next      the Next band: the name fitted to the width, hover racks the device into focus
 *   footer, menu, header, readout, scroller, links: as on the homepage (lifted from home.js / motion.js)
 *
 * Hooks (see also js/handoff.js):
 *   WORK.hero.intro() / .focusIn()        the default intro (the light's rise, then the focus-in) / the focus-in alone,
 *                                         for the arrival: with html.is-arriving set before boot, work.js skips the
 *                                         intro and the arrival calls WORK.hero.focusIn() as its cover dissolves
 *   WORK.ready (Promise), FS 'work:ready' the hero is laid out (headline fit) and the fonts gate has passed;
 *                                         html.work-ready. 'work:layout' follows every relayout.
 *   WORK.light.hold() / .release()        js/handoff.js takes the field over for the Next band's leave, and gives it back
 *   WORK.light.ready()                    a Promise: the field (or its still) has drawn its first frame
 *   WORK.next.el/.link/.href/.slug        the Next band and its target
 *   FS 'work:boot' {FS, WORK, F, live}    once everything here is wired: illustration behaviour hooks in
 */
(function () {
  'use strict';
  const FS = window.FS, WORK = window.WORK;
  if (!FS || !WORK) return;
  const F = FS.flags, html = document.documentElement, E = FS.ease;
  const { clamp, lerp } = FS.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const mobile = () => FS.util.mq('(max-width: 767px)');
  /* the sticky stages (sequences, the ideation track) run where there is room for them: css/work.css §14 */
  const wide = () => FS.util.mq('(min-width: 1024px) and (min-height: 620px)');
  const G = () => window.gsap, ST = () => window.ScrollTrigger;
  const live = !F.static && !F.reduced && !!window.gsap && !!window.ScrollTrigger;
  if (live) window.gsap.registerPlugin(window.ScrollTrigger);
  const px = (n) => n.toFixed(2) + 'px';
  const cssPx = (name, el) => parseFloat(getComputedStyle(el || html).getPropertyValue(name)) || 0;
  const pad2 = WORK.util.pad2;
  const hero = $('#top'), p = WORK.p;
  /* the readout's stops follow the page's own sections (js/work-data.js render): the roll direction needs their order */
  if (WORK.stops) FS.STOPS = WORK.stops;
  let refreshing = false;
  /* the scroll's own frame: Lenis emits its scroll inside the tick that moved the page (window scroll fires a frame
     later), so what must stay glued to a band (the light's clip, the sticky stages) listens to both */
  const onScroll = (fn) => { addEventListener('scroll', fn, { passive: true }); scrollers.push(fn); };
  const scrollers = [];

  /* ── 1 · hero: the headline fit ─────────────────────────────────────────────────────────────────────────────
     The device's stage is css/work.css's (the hero's right-hand side, a size container, the device fitted in it). The
     headline's column runs from the margin to a gap short of the device itself: its fitted content box, not its stage
     (a square MacBook leaves the stage's left side to the light, and the headline takes it). Within the column the size
     is as large as the stack allows, bottom-anchored, while the stack's top stays 40px under the header, 52–120px. Few
     long lines read better than a tower of two-word ones, so at most 4 lines, or 5 where the fifth buys 15% more size.
     text-wrap balance keeps the lines even. Stacked: the css clamp. */
  const H = (WORK.hero = { el: hero, stage: hero && $('.wh-stage', hero), done: false });
  const stacked = () => !!hero && getComputedStyle(hero).getPropertyValue('--stacked').trim() === '1';
  function deviceLeft() {
    const s = H.stage, d = s && $('.st-dev', s);
    if (!d) return s ? s.getBoundingClientRect().left : 0;
    const b = s.getBoundingClientRect(), bar = parseFloat(d.style.getPropertyValue('--bar')) || 1;
    return b.left + (b.width - Math.min(b.width, b.height * bar)) / 2;
  }
  function fitTitle() {
    const t = $('.wh-title', hero), stack = $('.wh-stack', hero);
    hero.style.removeProperty('--wt');
    if (!t || !stack) return;
    if (stacked()) { hero.style.removeProperty('--stack-w'); H.title = { size: parseFloat(getComputedStyle(t).fontSize), width: stack.offsetWidth }; return; }
    const w = html.clientWidth, m = cssPx('--margin') || 48, hh = cssPx('--header-h') || 88, gap = clamp(w * .028, 32, 56);
    const sw = Math.max(300, deviceLeft() - hero.getBoundingClientRect().left - gap - m);
    hero.style.setProperty('--stack-w', sw.toFixed(1) + 'px');
    const hb = hero.getBoundingClientRect().top;
    const set = (s) => hero.style.setProperty('--wt', s.toFixed(2) + 'px');
    const lines = (s) => Math.round(t.getBoundingClientRect().height / (s * .94));
    /* every word fits the column on one line. Balance wraps between words only, so a word wider than the column
       ("Decarbonisation", "ClimatePartner" at 1440) overflowed into the device, and the lit stop (an inline-block, a
       break opportunity) dropped to a line of its own under it. A word is an inline-block: too wide, it is wider
       than the column's content box, or two lines tall when its stop wrapped inside it. */
    const ws = $$('.w', t);
    const fits = (s) => {
      const cw = t.clientWidth - (parseFloat(getComputedStyle(t).paddingRight) || 0) + .5;
      return ws.every((el) => { const r = el.getBoundingClientRect(); return r.width <= cw && r.height < s * 1.5; });
    };
    const ok = (s, Lc) => { set(s); return stack.getBoundingClientRect().top - hb >= hh + 40 && lines(s) <= Lc && fits(s); };
    const sizeFor = (Lc) => {
      if (ok(120, Lc)) return 120;
      if (!ok(52, Lc)) return 0;
      let lo = 52, hi = 120;
      for (let i = 0; i < 13; i++) { const mid = (lo + hi) / 2; if (ok(mid, Lc)) lo = mid; else hi = mid; }
      return lo;
    };
    const s4 = sizeFor(4), s5 = sizeFor(5);
    /* near the floor the 15% rule parked the commonest laptops at their smallest: under 60 the fifth line is taken
       for any gain */
    let s = !s4 ? (s5 || 52) : s4 < 60 ? Math.max(s4, s5) : s5 > s4 * 1.15 ? s5 : s4;
    /* nothing from 52 up fits (narrow landscapes): the words still fit, down to 40, before the line count counts */
    if (!s4 && !s5) {
      let lo = 40, hi = 52;
      if (!(set(lo), fits(lo))) s = 40;
      else { for (let i = 0; i < 8; i++) { const mid = (lo + hi) / 2; set(mid); if (fits(mid)) lo = mid; else hi = mid; } s = lo; }
    }
    set(s);
    H.title = { size: s, width: sw, lines: lines(s) };
  }
  function layout() {
    if (!hero || !p) return;
    const meta = $('.wh-meta', hero);
    if (meta && !stacked()) hero.style.setProperty('--meta-h', meta.offsetHeight + 'px'); else hero.style.removeProperty('--meta-h');
    fitTitle();
    if (H.exit) H.exit(true);                          /* the exit's rests move with the fit: re-measured, re-applied */
    FS.emit('work:layout');
    light.update();
  }
  H.layout = layout;

  /* ── 2 · the light: one aurora field for the hero, the Next band and the footer ────────────────────────────────
     The field is one fixed canvas (FS.field, the footer's mode) under every section; the sections are opaque, except
     the hero and the Next band (transparent, .w-lit: filled with it) and the footer (transparent inside its iris). So
     the field is clipped to exactly what should show it: the hero's rect and the band's rect while they are in view,
     the footer's iris circle (its whole rect once open), one path, their union. An ice section still opening (its own
     iris) leaves its unopened part to the night under it, never to the light. The clip is written in the scroll's own
     frame, so the light never lags its band. Parked (clip 0, paused, once its first frame has landed) when none of the
     three is in view. The intro brings it up out of the night (its opacity, heroIn): no circle, so the light never
     stands as a disc before the device comes. js/handoff.js holds it while the Next band's light grows to the viewport. */
  const HERO_DIM = .12;                                /* css/work.css .w-sky's --sky-dim, the still's own dim */
  const light = (WORK.light = (() => {
    const nextEl = $('#next'), ftEl = $('#footer');
    let on = { hero: false, next: false, foot: false }, held = false, intro = null, foot = null, last = null, wait = false, raf = 0;   /* intro: the light's opacity while it comes up */
    const box = (el) => { const b = el && el.getBoundingClientRect(); return b && b.bottom > 0 && b.top < innerHeight ? b : null; };
    const f1 = (n) => n.toFixed(1);
    const rect = (b) => `M0 ${f1(b.top)}H${f1(html.clientWidth)}V${f1(b.bottom)}H0Z`;
    const circ = (c) => `M${f1(c.x - c.r)} ${f1(c.y)}a${f1(c.r)} ${f1(c.r)} 0 1 1 ${f1(2 * c.r)} 0a${f1(c.r)} ${f1(c.r)} 0 1 1 ${f1(-2 * c.r)} 0Z`;
    function clip() {
      const parts = [];
      if (on.hero) { const b = box(hero); if (b) parts.push(rect(b)); }
      if (on.next) { const b = box(nextEl); if (b) parts.push(rect(b)); }
      if (on.foot && foot) { if (foot === 'open') { const b = box(ftEl); if (b) parts.push(rect(b)); } else if (foot.r > .5) parts.push(circ(foot)); }
      return parts.length ? `path('${parts.join('')}')` : null;
    }
    function park() {
      if (FS.field.mode !== 'aperture' || last !== 'park') { FS.field.setMode('aperture', { x: 0, y: 0, r: 0 }); last = 'park'; }
      /* parked, but only once its first frame has landed (clipped to r 0, it shows nothing): paused before it, the
         core's 1.5s watchdog took the silence for a dead context and swapped the canvas for the still */
      if (FS.field.ready || !FS.field.ok) FS.field.pause();
      else if (!wait) { wait = true; FS.on('field:ready', () => { if (last === 'park' && !FS.menu.busy) FS.field.pause(); }); }
    }
    function update() {
      raf = 0;
      if (held || !FS.field.el || FS.menu.busy) return;
      const c = clip();
      if (!c) { park(); return; }
      if (FS.field.mode !== 'full') FS.field.setMode('full');
      /* the hero is the brighter light (the device sits on it; the veil holds the words); the Next band and the footer
         share the footer's dim, since they meet as one light and the footer's giant type is set on it */
      FS.field.dim = on.next || on.foot ? .26 : HERO_DIM;
      if (c !== last) { last = c; FS.field.setClip(c); }
      /* the intro's light coming up (null once it is up, or when the hero is not the band in view) */
      const op = intro !== null && on.hero && !on.next && !on.foot ? intro.toFixed(3) : '';
      if (FS.field.el.style.opacity !== op) FS.field.el.style.opacity = op;
      FS.field.play();
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
    const watch = (el, k) => {
      if (!el) return;
      if (!('IntersectionObserver' in window)) { on[k] = true; return; }
      new IntersectionObserver(([e]) => { on[k] = e.isIntersecting; update(); }, { rootMargin: '1px' }).observe(el);
    };
    return {
      init() {
        watch(hero && hero.classList.contains('w-lit') ? hero : null, 'hero'); watch(nextEl, 'next'); watch(ftEl, 'foot');
        /* the hero waits for its intro in the night (an arrival's cover already holds the light) */
        if (html.classList.contains('hero-pre') && !html.classList.contains('is-arriving')) intro = 0;
        onScroll(update);
        addEventListener('resize', kick);
        FS.on('menu:close', update);
        update();
      },
      update, kick,
      intro(o) { intro = o == null ? null : o; update(); },
      footer(v) { foot = v; update(); },
      hold() { held = true; },
      release() { held = false; last = null; update(); },
      /* the field (or its still) has drawn: the arrival's cover waits for it before it dissolves (600ms at most) */
      ready() {
        if (FS.field.ready || !FS.field.ok) return Promise.resolve();
        return new Promise((r) => { FS.on('field:ready', r); setTimeout(r, 600); });
      },
    };
  })());

  /* the intro. Without a handoff: the light comes up out of the night, edge to edge (640ms, the focus curve; the
     arrival's own move, a dissolve, so the two entries read as one: a circle opening here stood as a disc of light for
     its first frames, the shape Werner took out), the device focuses in (from its scheme-tinted soft layer to true
     colour) as it comes, then the name, the headline word by word, the tags and the meta, and the headline's stop lights
     last. With a handoff (html.is-arriving) the arrival's cover dissolves into the light, which is already there, and
     calls focusIn(): the same, minus the light's own rise. Every tween clears its props. */
  let heroTl = null;
  const clearFx = { clearProps: 'opacity,filter' };
  /* the device's focus-in: out of blur, and from its scheme-tinted soft layer to true colour */
  function deviceIn(tl, dev, at) {
    const s = { v: 1 };
    return tl.to(dev, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .72, ease: E.focus }, clearFx), at)
      .to(s, { v: 0, duration: .64, ease: E.focus, onUpdate: () => dev.style.setProperty('--soft', s.v.toFixed(3)), onComplete: () => dev.style.removeProperty('--soft') }, at + .12);
  }
  function heroIn(o) {
    if (!hero || H.done) return null;
    const gsap = G();
    if (!live || !gsap) { html.classList.remove('hero-pre'); light.intro(null); H.done = true; return null; }
    if (heroTl) return heroTl;
    const dev = $('.wh-stage .st-dev', hero), stop = $('.wh-title .stop', hero);
    const chrome = [$('.wh-back', hero), $('.wh-label', hero), $('.wh-name', hero)].filter(Boolean);
    const words = $$('.wh-title .w', hero), tags = $$('.wh-tags .tag', hero), cells = $$('.wm', hero);
    /* the hidden state moves inline before hero-pre lifts, so nothing flashes between the class and the tweens. Empty
       groups are skipped (the not-found hero has no words, tags or meta: GSAP warned about each) */
    const hide = [...chrome, ...words, ...tags, ...cells];
    if (hide.length) gsap.set(hide, { opacity: 0, filter: 'blur(12px)' });
    if (dev) { gsap.set(dev, { opacity: 0, filter: 'blur(16px)' }); dev.style.setProperty('--soft', '1'); }
    if (stop) stop.style.setProperty('--sr', '0%');
    html.classList.remove('hero-pre');
    const t0 = o.iris ? .3 : 0;
    const tl = (heroTl = gsap.timeline({ onComplete: () => { H.done = true; heroTl = null; FS.emit('work:hero-in'); } }));
    if (o.iris) {
      const up = { o: 0 };
      light.intro(0);
      tl.to(up, { o: 1, duration: .64, ease: E.focus, onUpdate: () => light.intro(up.o), onComplete: () => light.intro(null) }, 0);
    } else light.intro(null);
    /* the device comes with its light, a beat behind it, so its blurred first frames sit on the light, not the night */
    if (dev) deviceIn(tl, dev, o.iris ? .16 : t0 + .08);
    if (chrome.length) tl.to(chrome, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .5, ease: E.focus, stagger: .06 }, clearFx), t0 + .22);
    words.forEach((w, i) => tl.to(w, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus }, clearFx), t0 + .34 + i * .055));
    const tw = t0 + .34 + words.length * .055;
    if (tags.length) tl.to(tags, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .48, ease: E.focus, stagger: .04 }, clearFx), tw - .1);
    if (cells.length) tl.to(cells, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .48, ease: E.focus, stagger: .06 }, clearFx), tw);
    if (stop) tl.to(stop, { '--sr': '50%', duration: .24, ease: E.glass, onComplete: () => stop.style.removeProperty('--sr') }, tw + .2)
      .call(() => FS.ping(stop), null, tw + .3);
    return tl;
  }
  H.intro = () => heroIn({ iris: true });              /* iris: the light's own rise (the name kept from round 5) */
  H.focusIn = () => heroIn({ iris: false });

  /* leaving the hero: its pieces pull out of focus before they reach the header (motion.js heroExit, per element as
     there): the back pill, the label, the name, each line of the headline, the tags, the meta strip. Each is measured
     from its own rest (its top at scrollY 0): it exits as its top travels from there, or from hh + 190 if it rests
     lower, up to hh − 16, so at rest everything is sharp. layout() re-measures (H.exit(true)); the intro's tweens own
     the pieces until 'work:hero-in', then the exit syncs. */
  function heroExit() {
    if (!live || !hero) return;
    let outs = [], raf = 0;
    const measure = () => {
      outs.forEach((o) => { if (o.f || o.op) o.els.forEach((el) => { el.style.filter = ''; el.style.opacity = ''; }); });
      const groups = [$('.wh-back', hero), $('.wh-label', hero), $('.wh-name', hero)].filter(Boolean).map((el) => [el]);
      lineGroups($$('.wh-title .w', hero)).forEach((g) => groups.push(g));
      [$('.wh-tags', hero), $('.wh-meta', hero)].filter(Boolean).forEach((el) => groups.push([el]));
      const sy = scrollY;
      outs = groups.map((els) => ({ els, rest: els[0].getBoundingClientRect().top + sy, f: '', op: '' }));
    };
    const exit = () => {
      raf = 0;
      const hh = cssPx('--header-h') || 88, a = hh - 16, sy = scrollY;
      outs.forEach((o) => {
        const b = Math.max(a + 24, Math.min(hh + 190, o.rest)), e = 1 - E.smoothstep(a, b, o.rest - sy);
        const f = e < .002 ? '' : `blur(${(10 * e).toFixed(2)}px)`, op = e < .002 ? '' : (1 - e).toFixed(3);
        if (o.f === f && o.op === op) return; o.f = f; o.op = op;
        if (window.gsap) G().killTweensOf(o.els);
        o.els.forEach((el) => { el.style.filter = f; el.style.opacity = op; });
      });
    };
    H.exit = (again) => { if (again && H.done) measure(); if (H.done) exit(); };
    FS.on('work:hero-in', () => {
      measure(); outs.forEach((o) => { o.f = o.op = null; }); exit();
      /* polish review: scrolled during the intro, the pieces were sharp and then dropped to their exit state in one
         frame; now they ease there (240ms), and the next scroll frame takes over from wherever they are */
      if (scrollY < 1 || !window.gsap) return;
      outs.forEach((o) => o.op && G().fromTo(o.els, { opacity: 1, filter: 'blur(0px)' }, { opacity: +o.op, filter: o.f, duration: .24, ease: E.focus, overwrite: true }));
    });
    if (H.done) { measure(); exit(); }
    addEventListener('scroll', () => { if (!raf && H.done) raf = requestAnimationFrame(exit); }, { passive: true });
  }

  /* ── 3 · the reading line: the Brief's statement and the live sections' quotes pull focus word by word as they pass
     it. Each word's focus runs over 1.7 lines of scroll around the reading line (66% of the viewport, 72% on phones),
     and within a line from left to right, so a line reads into focus the way it is read. The stop lights (and pings)
     when the last word is sharp, and goes out again if you scroll back (motion.js S.manifesto, without the pin). */
  function readLine(box) {
    if (!live || !box) return;
    const ws = $$('.w', box), stop = $('.stop', box), cur = ws.map(() => ({ b: -1, o: -1 }));
    let geo = [], lh = 60, raf = 0, lit = false;
    if (stop) stop.style.setProperty('--sr', '0%');
    const measure = () => {
      const bb = box.getBoundingClientRect(), sy = scrollY;
      lh = parseFloat(getComputedStyle(box).fontSize) * 1.08;
      geo = ws.map((w) => { const r = w.getBoundingClientRect(); return { y: r.top + r.height / 2 + sy, x: clamp((r.left + r.width / 2 - bb.left) / Math.max(1, bb.width), 0, 1) }; });
    };
    function frame() {
      raf = 0;
      if (!geo.length) measure();
      const line = innerHeight * (mobile() ? .72 : .66), band = lh * 1.7, sy = scrollY;
      ws.forEach((w, i) => {
        const g = geo[i], e = clamp((line - (g.y - sy)) / band + .5 - (g.x - .5) * .9, 0, 1);
        const b = 12 * (1 - E.focus(e)), o = .14 + .86 * (1 - b / 12), c = cur[i];
        if (Math.abs(c.b - b) > .04) { c.b = b; w.style.filter = b < .05 ? '' : `blur(${b.toFixed(2)}px)`; }
        if (Math.abs(c.o - o) > .004) { c.o = o; w.style.opacity = o >= .999 ? '' : o.toFixed(3); }
      });
      const last = cur[cur.length - 1];
      if (stop && last) {
        if (!lit && last.b < .5) { lit = true; stop.style.setProperty('--sr', '50%'); FS.ping(stop); }
        else if (lit && last.b > 2) { lit = false; stop.style.setProperty('--sr', '0%'); }
      }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', kick, { passive: true });
    const remeasure = () => { measure(); kick(); };
    addEventListener('resize', remeasure);
    FS.on('fonts', remeasure);
    ST().addEventListener('refresh', remeasure);
    measure(); frame();
  }

  /* ── 4 · irises: every ice section opens from the light above it (motion.js S.irises) ─────────────────────────
     Its origin is the last stop or index disc of the section before it: the Brief's stop for the first, the last
     decision's disc for Final designs, a quote's stop, a head's stop. An origin more than 320px above the section
     (a head at the top of a tall section), and the footer's, on the lit Next band, draw their halos only inside the
     opening section, where it is the opening's own edge; a near one draws the whole circle over the ground it opens
     from. The footer opens from the Next band's arrow
     disc, its last light, and its field clip follows (light.footer). Each is a whole circle centred on its origin: a
     lit rim inside the clip, a hairline halo drawing the rest of the circle over the ground it opens from. */
  function originOf(sec) {
    let prev = sec.previousElementSibling;
    while (prev && !prev.matches('section')) prev = prev.previousElementSibling;
    if (!prev || prev.classList.contains('w-hero')) return null;
    const c = $$('.stop, .dec-idx, .stp-idx', prev).filter((e) => !e.closest('.seq-bar, .pl, .stg-rail'));
    return c[c.length - 1] || null;
  }
  function irises() {
    if (!live) return;
    const defs = $$('main > .w-sec.on-ice').map((el) => ({ el, from: originOf(el) }))
      .concat([{ el: $('#footer'), from: $('#next .nx-go') || $('#outcome .stop'), field: true }]).filter((d) => d.el && d.from);
    defs.forEach((d) => {
      const fb = d.from.getBoundingClientRect(), sb = d.el.getBoundingClientRect();
      /* the footer's too: its origin is the Next arrow, on the lit band, where a hairline circle would be drawn across
         the light the band is filled with */
      d.clip = d.field || sb.top - (fb.top + fb.height / 2) > 320;
      d.rim = document.createElement('i'); d.rim.className = 'iris-rim'; d.rim.setAttribute('aria-hidden', 'true');
      if (d.field) d.rim.classList.add('iris-rim--field');
      d.el.appendChild(d.rim);
      d.halo = document.createElement('i'); d.halo.className = 'iris-halo'; d.halo.setAttribute('aria-hidden', 'true');
      if (d.from.closest('.on-ice')) d.halo.classList.add('iris-halo--ice');
      document.body.appendChild(d.halo);
      let pinged = false, on = false;
      const halo = (vis, x, y, r, pr, b) => {
        if (!vis) { if (on) { on = false; d.el.classList.remove('is-iris'); d.halo.style.opacity = '0'; } return; }
        if (!on) { on = true; d.el.classList.add('is-iris'); }
        d.halo.style.width = d.halo.style.height = (2 * r).toFixed(1) + 'px';
        d.halo.style.transform = `translate(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px)`;
        d.halo.style.clipPath = d.clip ? `inset(${Math.max(0, b.top - (y - r)).toFixed(1)}px 0 0 0)` : '';
        d.halo.style.opacity = (E.smoothstep(.02, .08, pr) * (1 - E.smoothstep(.55, .95, pr))).toFixed(3);
      };
      const apply = (pr) => {
        const b = d.el.getBoundingClientRect();
        const o = d.from.classList.contains('stop') ? FS.iris.stopCentre(d.from) : FS.iris.circleCentre(d.from);
        const ox = o.x - b.left, oy = o.y - b.top;
        let r = 0;
        if (pr >= 1) {
          if (d.el.style.clipPath) d.el.style.clipPath = '';
          if (d.field) light.footer('open');
        } else {
          const d0 = Math.max(0, -oy), rMax = Math.hypot(Math.max(Math.abs(ox), Math.abs(b.width - ox)), b.height - oy) + 2;
          r = pr < .02 ? 0 : lerp(d0 + 24, rMax, E.iris((pr - .02) / .98));
          d.el.style.clipPath = `circle(${r.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
          d.el.style.setProperty('--ir', r.toFixed(1) + 'px');
          d.el.style.setProperty('--iox', ox.toFixed(1) + 'px'); d.el.style.setProperty('--ioy', oy.toFixed(1) + 'px');
          if (d.field) light.footer(r > 0 ? { x: o.x, y: o.y, r } : null);
        }
        halo(pr > .02 && pr < 1 && r > 0, o.x, o.y, r, pr, b);
        if (pr > .005 && !pinged) { pinged = true; FS.ping(d.from); }
        if (pr <= 0) pinged = false;
      };
      const st = ST().create({ trigger: d.el, start: 'top 92%', end: 'top 22%', onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
      d.apply = () => apply(st.progress);
      apply(st.progress);
    });
    FS.on('menu:close', () => defs.forEach((d) => d.apply && d.apply()));
  }

  /* ── 5 · reveals: focus-in as things enter (blur 10 → 0, opacity 0 → 1, 560ms, the focus curve, staggered) ── */
  function splitWords(el) {                          /* motion.js splitWords: one span per word, for line groups */
    if (!el || el.__words) return (el && el.__words) || [];
    const out = [];
    const walk = (n) => Array.from(n.childNodes).forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((s) => { if (!s) return; if (/^\s+$/.test(s)) frag.appendChild(document.createTextNode(s)); else { const w = document.createElement('span'); w.className = 'ln-w'; w.textContent = s; frag.appendChild(w); out.push(w); } });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) { if (c.classList.contains('w')) out.push(c); else walk(c); }
    });
    walk(el); el.__words = out; return out;
  }
  function lineGroups(words) {
    const g = []; let top = null;
    words.forEach((w) => { const t = w.getBoundingClientRect().top; if (top === null || Math.abs(t - top) > 6) { g.push([]); top = t; } g[g.length - 1].push(w); });
    return g;
  }
  function reveals() {
    if (!live) return;
    const gsap = G(), hid = { opacity: 0, filter: 'blur(10px)' };
    const show = (els, o) => gsap.to(els, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus, stagger: .07, clearProps: 'opacity,filter' }, o));
    const stepper = html.classList.contains('seq-live');
    /* blocks: each group enters as one batch, staggered in document order */
    const blocks = $$([
      '#brief .label', '.w-head .label', '.w-head .h2', '.dec-idx', '.dec-h', '.dec-body', '.dec-fig', '.dec-illus',
      '.fdc', '.fd-cap', '.fd-gh', '.gd-f', '.gd-cap', '#outcome > .label', '.stat', '.nx-label', '.nx-back', '.nx-no', '.nx-title', '.nx-name', '.nx-go',
      '.w-note', '.w-list li', '.pf-grid > .pf', '.pf--guide', '.pf--ia', '.stg-gl', '.stg-rail', '.stage-no', '.stage-h', '.stp-idx', '.stp-h', '.stp-p',
      '.ph-band', '.feat-it', stepper ? '.seq-stage' : '.seq-step',
    ].join(','));
    /* a jump (a hash, a restored scroll, keyboard focus, find in page) enters every block it passed in one batch: the
       ones jumped past take their end state at once; the ones in view focus in, the stagger capped at .35s */
    if (blocks.length) {
      gsap.set(blocks, hid);
      ST().batch(blocks, { start: 'top 88%', once: true, onEnter: (b) => {
        const vh = innerHeight, past = [], now = [];
        b.forEach((el) => { const r = el.getBoundingClientRect(); (r.bottom < 0 || r.top > vh ? past : now).push(el); });
        if (past.length) gsap.set(past, { clearProps: 'opacity,filter' });
        if (now.length) show(now, { stagger: Math.min(.07, .35 / now.length) });
      } });
      /* what takes keyboard focus is never left waiting for its reveal (nor its pieces: the Next link holds four) */
      document.addEventListener('focusin', (e) => {
        const t = e.target;
        if (!t || !t.contains) return;
        const els = blocks.filter((b) => (b === t || b.contains(t) || t.contains(b)) && b.style.opacity !== '');
        if (els.length) show(els, { duration: .24, stagger: 0 });
      });
    }
    /* copy: line by line (the bio band's reveal), each line once it is on screen */
    const copies = $$('.what-cols p, #outcome .w-outcome, .w-p p, .w-lead, .ph-col p, .ph-lead, .w-ia-p p, .stg-gp, .stage-p');
    copies.forEach((el) => {
      const ws = splitWords(el);
      gsap.set(ws, hid);
      ST().create({ trigger: el, start: 'top 86%', once: true, onEnter: () => {
        lineGroups(ws).forEach((g, k) => show(g, { stagger: 0, delay: k * .08 }));
        const s = $('.stop', el); if (s) setTimeout(() => FS.ping(s), 80 * lineGroups(ws).length + 480);
      } });
    });
  }

  /* ── 6 · lights that follow the reading ──────────────────────────────────────────────────────────────────────
     The decisions' index discs light while their row is in view; the process discs light one by one as their row
     comes in, each hairline drawing on to the next; the bullets' stops light in turn. Static: all lit (css). */
  function decisions() {
    const rows = $$('.dec');
    if (!rows.length) return;
    if (!live) { if (!F.static) rows.forEach((r) => r.classList.add('is-lit')); return; }
    rows.forEach((row) => ST().create({ trigger: row, start: 'top 64%', end: 'bottom 36%',
      onToggle: (s) => { row.classList.toggle('is-lit', s.isActive); if (s.isActive) FS.ping($('.dec-idx', row)); } }));
  }
  function processSteps() {
    const lists = $$('.stp-list');
    if (!lists.length || !live) return;
    html.classList.add('stp-live');
    lists.forEach((l) => {
      const it = $$('.stp', l);
      ST().create({ trigger: l, start: 'top 74%', once: true, onEnter: () => it.forEach((s, i) => setTimeout(() => { s.classList.add('is-lit'); FS.ping($('.stp-idx', s)); }, 200 + i * 320)) });
    });
  }
  function bullets() {
    if (!live) return;
    $$('.w-list').forEach((l) => {
      const st = $$('.li-stop .lit', l);
      st.forEach((s) => s.style.setProperty('--bl', '0%'));
      ST().create({ trigger: l, start: 'top 76%', once: true, onEnter: () => st.forEach((s, i) => setTimeout(() => { s.style.removeProperty('--bl'); FS.ping(s.parentNode); }, 260 + i * 220)) });
    });
  }
  /* the atomic stages' rail: the stage whose top has passed the reading line (half the viewport) is the one in view.
     Its disc lights, its name steps up; the compact row names it (data-at). Runs in every mode: it is state, not
     motion (static and reduced light every disc, css/work.css) */
  function rail() {
    const r = $('.stg-rail');
    if (!r) return;
    const ol = $('ol', r), links = $$('.stg-a', r), st = $$('.stage'), names = links.map((a) => $('.stg-n', a).textContent);
    let cur = -2, raf = 0;
    const seenStage = new Set();
    const frame = () => {
      raf = 0;
      const mid = innerHeight * .5;
      let k = -1;
      st.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) k = i; });
      const last = st[st.length - 1], lb = last.getBoundingClientRect();
      if (lb.bottom < innerHeight * .2) k = -1;                       /* past the last stage: the rail rests */
      if (k === cur) return;
      const was = cur; cur = k;
      links.forEach((a, i) => { a.classList.toggle('is-on', i === k); if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      ol.dataset.at = k >= 0 ? names[k] : names[0];
      if (k >= 0 && was !== -2 && live && !seenStage.has(k)) { seenStage.add(k); FS.ping($('.stg-d', links[k])); }   /* once per stage */
    };
    onScroll(() => { if (!raf) raf = requestAnimationFrame(frame); });
    addEventListener('resize', frame);
    frame();
  }

  /* ── 7 · the sticky stages: the stepped sequences and the ideation track (wide screens, live; css/work.css §14) ──
     A sequence's height is its steps' scroll; its stage sticks under the header while the scroll steps through it:
     the step at the scroll's share is in focus, its dot lit, the readout "03 / 07" and the UI's own step tab beside it.
     A dot takes you to its step. The ideation track rides sideways: the scroll's share of its travel (the track's
     overflow). Both fall back to their stacks (phones, static, reduced, no GSAP), where nothing moves. */
  function sequences() {
    const seqs = $$('.seq');
    if (!seqs.length) return null;
    const hh = () => cssPx('--header-h') || 88;
    const all = seqs.map((sq) => {
      const steps = $$('.seq-step', sq), dots = $$('.seq-dot', sq), at = $('.seq-at', sq), rt = $('.seq-rt', sq), n = steps.length;
      const tabs = steps.map((s) => { const t = $('.seq-tab', s); return t ? t.textContent : ''; });
      let cur = -1, asked = -1;
      const seen = new Set();
      const set = (i) => {
        if (i === cur) return;
        const was = cur; cur = i;
        steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
        dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
        if (at) at.textContent = pad2(i + 1);
        if (rt) rt.textContent = tabs[i];
        if (was >= 0 && dots[i] && (asked === i || !seen.has(i))) { seen.add(i); FS.ping(dots[i]); }   /* first visit, or asked */
        asked = -1;
      };
      const span = () => Math.max(1, sq.offsetHeight - (innerHeight - hh()));
      const frame = () => {
        if (!html.classList.contains('seq-live')) return;
        const pr = clamp((hh() - sq.getBoundingClientRect().top) / span(), 0, 1);
        set(Math.min(n - 1, Math.floor(pr * n)));
      };
      const go = (k) => {
        asked = k;
        const y = scrollY + sq.getBoundingClientRect().top - hh() + span() * (k + .5) / n;
        if (window.lenis) window.lenis.scrollTo(y); else scrollTo({ top: y, behavior: 'smooth' });
      };
      dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
      /* r6 review: the dots are the sequence's keyboard controls too (the arrows move one step, focus follows) */
      dots.forEach((d, k) => d.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const j = clamp(k + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1);
        dots[j].focus({ preventScroll: true }); go(j);
      }));
      set(0);
      return { frame };
    });
    const mode = () => { html.classList.toggle('seq-live', live && wide()); all.forEach((s) => s.frame()); };
    mode();
    onScroll(() => all.forEach((s) => s.frame()));
    return mode;
  }
  function features() {
    const fs = $$('.feat');
    if (!fs.length) return null;
    const frame = () => fs.forEach((f) => {
      if (!f.__travel) return;
      const pr = clamp(-f.getBoundingClientRect().top / Math.max(1, f.offsetHeight - innerHeight), 0, 1);
      f.__tr.style.setProperty('--fx', (pr * f.__travel).toFixed(1));
    });
    const mode = () => {
      const on = live && wide();
      html.classList.toggle('feat-live', on);
      fs.forEach((f) => {
        f.__tr = $('.feat-track', f);
        f.__travel = on ? Math.max(0, f.__tr.scrollWidth - html.clientWidth) : 0;
        if (on) f.style.setProperty('--travel', f.__travel + 'px'); else { f.style.removeProperty('--travel'); f.__tr.style.removeProperty('--fx'); }
      });
      frame();
    };
    mode();
    onScroll(frame);
    return mode;
  }

  /* ── 8 · rack focus (motion.js S.work): away from the viewport's centre band a plate's device racks to its
     scheme-tinted soft layer (a live render blurs), a flat screen blurs and takes the hue pair; in the band it is sharp
     and true colour. A plate taller than the band is in focus while the band is inside it. Hover pulls it into focus
     wherever it is, and brings its key light up (css). The plate stays the full gradient throughout. ── */
  function rack() {
    const els = $$('.rack');
    if (!els.length) return;
    let raf = 0;
    const hovered = (c) => c.classList.contains('is-hover') || !!c.closest('.is-hover');
    function frame() {
      raf = 0;
      const vh = innerHeight, mid = vh / 2;
      els.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.bottom < -vh * .5 || r.top > vh * 1.5) return;
        const dist = Math.max(0, r.top - mid, mid - r.bottom) / vh, u = E.smoothstep(.12, .42, dist);
        const k = !live || hovered(c) || u < .002 ? 0 : u;          /* hover pulls it into focus; static and reduced stay sharp */
        const soft = (.7 * k).toFixed(3), halo = (1 - .4 * k).toFixed(3);
        if (c.__soft !== soft) { c.__soft = soft; c.style.setProperty('--soft', soft); c.style.setProperty('--halo', halo); }
      });
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    WORK.rack = kick;
    els.forEach((c) => {
      const band = c.closest('.w-next'), host = band ? $('.nx-link', band) : c;
      host.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; (band || c).classList.add('is-hover'); kick(); });
      host.addEventListener('pointerleave', () => { (band || c).classList.remove('is-hover'); kick(); });
    });
    if (!live) return;
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    kick();
  }

  /* ── 9 · outcome: the stat discs light from their centres and count up (companies' count). No ping: FS.ping grows
     6× from the disc's own diameter, a 1200px ring across the statement. ── */
  function stats() {
    const row = $('.stats');
    if (!row || !live) return;
    const items = $$('.stat', row);
    items.forEach((it) => { const n = $('.st-n[data-count]', it); if (n) n.textContent = '0'; });
    ST().create({ trigger: row, start: 'bottom bottom', once: true, onEnter: () => items.forEach((it, i) => {
      const n = $('.st-n[data-count]', it), v = n ? +n.dataset.count : 0, o = { e: 0 };
      setTimeout(() => it.classList.add('is-lit'), 160 + i * 140);
      if (n) G().to(o, { e: 1, duration: 1.1, delay: .16 + i * .14, ease: E.focus, onUpdate: () => { n.textContent = String(Math.round(v * o.e)); },
        onComplete: () => { n.textContent = String(v); } });
    }) });
  }

  /* ── 10 · the Next band: the name as large as the width allows; the link for the next page ── */
  const band = $('#next');
  function fitNext() {
    if (!band) return;
    const name = $('.nx-name', band), go = $('.nx-go', band);
    if (!name) return;
    band.style.removeProperty('--nfs');
    const s0 = parseFloat(getComputedStyle(name).fontSize), m = cssPx('--margin') || 48;
    const avail = band.clientWidth - 2 * m - (go ? go.offsetWidth + (mobile() ? 16 : 32) : 0);
    /* grow or shrink to the width, up to the footer marquee's size (224) on desktop and 104 on phones */
    const w = name.getBoundingClientRect().width, cap = mobile() ? 104 : 224;
    band.style.setProperty('--nfs', px(Math.min(cap, Math.floor(s0 * avail / w * 10) / 10)));
  }
  if (band) {
    const link = $('.nx-link', band);
    WORK.next = { el: band, link, href: link && link.getAttribute('href'), slug: link && link.dataset.next };
  }

  /* ── 11 · footer: ring, disc spring, velocity marquee (home.js footer + motion.js S.footer) ── */
  function footerRing() {
    const svg = $('#disc-ring');
    if (!svg) return;
    const m = mobile(), R = m ? 146 : 200, size = m ? 10 : 11;
    FS.ring(svg, 'ME@WERNERSDESIGNS.COM · CONTACT ME · ', R, size);
    const box = 2 * (R + size + 4);
    svg.style.width = svg.style.height = box + 'px';
    svg.style.marginLeft = svg.style.marginTop = (-box / 2) + 'px';
  }
  function footer() {
    const ft = $('#footer'), wrap = $('.disc-wrap'), disc = $('.disc'), track = $('.ft-track');
    if (!ft) return;
    let visible = false, raf = 0, last = 0, off = 0, mul = 1, hot = false;
    const base = () => (mobile() ? 100 : 140), open = () => (mobile() ? 130 : 180);
    const sp = FS.spring({ value: base(), response: .35, damping: .85 });
    const setHot = (v) => { hot = v; wrap.classList.toggle('is-open', v); sp.target = v ? open() : base(); loop(); };
    if (wrap && disc) {
      wrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHot(true); });
      wrap.addEventListener('pointerleave', () => setHot(false));
      disc.addEventListener('focus', () => setHot(true)); disc.addEventListener('blur', () => setHot(false));
      addEventListener('resize', () => { sp.target = hot ? open() : base(); if (F.still) sp.set(sp.target); loop(); });
    }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      if (F.reduced) sp.set(sp.target); else sp.step(dt);
      if (disc) disc.style.setProperty('--dr', sp.value.toFixed(2) + 'px');
      let again = !sp.settled();
      if (track && !F.still && visible) {
        const half = track.scrollWidth / 2, v = window.lenis && window.lenis.velocity ? Math.abs(window.lenis.velocity) : 0;
        mul = FS.smooth(mul, 1 + Math.min(4, v / 12), dt, .25);
        off = (off + (half / 28) * mul * dt) % half;
        track.style.transform = `translate3d(${(-off).toFixed(2)}px,0,0)`;
        again = true;
      }
      if (again && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(ft);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    loop();
  }

  /* ── 12 · menu choreography (motion.js S.menu): links focus in, the card irises from its notch, the shader lens ── */
  function menu() {
    const menuEl = $('#menu'), links = $$('.menu-link'), card = $('.menu-card');
    if (!menuEl || !links.length) return;
    const stops = links.map((l) => $('.stop', l));
    const cc = { r: 0 };
    const cardOrigin = () => (mobile() ? { x: card.offsetWidth, y: 0 } : { x: 0, y: parseFloat(getComputedStyle(card).getPropertyValue('--mc-ty')) || 300 });
    const cardMax = () => (mobile() ? Math.hypot(card.offsetWidth, card.offsetHeight) + 2 : 640);
    const setCard = () => {
      if (!card) return;
      if (cc.r >= cardMax() - .5) { card.style.clipPath = ''; return; }
      const o = cardOrigin();
      card.style.clipPath = `circle(${Math.max(0, cc.r).toFixed(1)}px at ${o.x}px ${o.y}px)`;
    };
    let tl = null;
    FS.on('menu:open', (d) => {
      if (tl) { tl.kill(); tl = null; }
      if (d.instant || !window.gsap) {
        if (window.gsap) G().set(links, { clearProps: 'opacity,filter' });
        stops.forEach((s) => s && s.style.removeProperty('--sr'));
        cc.r = cardMax(); setCard(); return;
      }
      if (!d.resumed) {
        G().set(links, { opacity: 0, filter: 'blur(12px)' });
        stops.forEach((s) => s && s.style.setProperty('--sr', '0%'));
        cc.r = 0; setCard();
      }
      tl = G().timeline();
      tl.to(links, { opacity: 1, filter: 'blur(0px)', duration: .56, stagger: .06, ease: E.focus, clearProps: 'filter,opacity' }, d.resumed ? 0 : .26)
        .to(stops, { '--sr': '50%', duration: .24, stagger: .06, ease: E.glass }, d.resumed ? .08 : .38)
        .call(() => FS.ping(stops[stops.length - 1]), null, d.resumed ? .5 : .80)
        .to(cc, { r: cardMax(), duration: .64, ease: E.iris, onUpdate: setCard }, d.resumed ? 0 : .36);
    });
    FS.on('menu:closing', () => {
      if (tl) { tl.kill(); tl = null; }
      lensOff();
      if (!window.gsap || F.reduced || F.static) return;
      tl = G().timeline();
      tl.to(links.slice().reverse(), { opacity: 0, filter: 'blur(8px)', duration: .2, stagger: .04, ease: 'none' }, 0)
        .to(cc, { r: 0, duration: .36, ease: E.irisClose, onUpdate: setCard }, 0);
    });
    FS.on('menu:close', () => {
      if (tl) { tl.kill(); tl = null; }
      if (window.gsap) G().set(links, { clearProps: 'opacity,filter' });
      stops.forEach((s) => s && s.style.removeProperty('--sr'));
      cc.r = cardMax(); setCard();
    });
    const nav = $('.menu-links');
    links.forEach((l) => { const r = document.createElement('i'); r.className = 'm-ring lit'; r.setAttribute('aria-hidden', 'true'); l.appendChild(r); FS.lit.track(r); });
    const lx = FS.spring({ value: 0, response: .35, damping: .85 }), ly = FS.spring({ value: 0, response: .35, damping: .85 });
    const lr = FS.spring({ value: 0, response: .35, damping: .85 });
    let active = null, raf = 0, last = 0, lensOn = false;
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      lx.step(dt); ly.step(dt); lr.step(dt);
      if (!active && lr.settled()) lensOn = false;
      FS.field.lens = lensOn && lr.value > .5 ? [lx.value / innerWidth, ly.value / innerHeight, lr.value / innerHeight] : [0, 0, 0];
      if (!(lx.settled() && ly.settled() && lr.settled())) raf = requestAnimationFrame(frame); else last = 0;
    }
    const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };
    function lensAt(l) {
      const s = $('.stop', l); if (!s) return;
      const c = FS.iris.stopCentre(s), b = l.getBoundingClientRect(), fs = parseFloat(getComputedStyle(l).fontSize), ring = $('.m-ring', l);
      ring.style.setProperty('--rx', (c.x - b.left).toFixed(1) + 'px'); ring.style.setProperty('--ry', (c.y - b.top).toFixed(1) + 'px');
      if (!lensOn || lr.value < 1) { lx.set(c.x); ly.set(c.y); lr.set(.095 * fs); }
      lensOn = true;
      lx.target = c.x; ly.target = c.y; lr.target = .65 * fs;
      if (F.reduced) { lx.set(c.x); ly.set(c.y); lr.set(.65 * fs); }
      FS.lit.kick(); loop();
    }
    function enter(l) {
      if (!FS.menu.open) return;
      active = l;
      links.forEach((o) => { o.classList.toggle('is-hover', o === l); o.classList.toggle('is-lensed', o === l); });
      nav.classList.add('has-hover');
      lensAt(l);
    }
    function leave(l) {
      if (active !== l) return;
      active = null;
      l.classList.remove('is-hover', 'is-lensed'); nav.classList.remove('has-hover');
      if ($('.stop', l)) lr.target = .095 * parseFloat(getComputedStyle(l).fontSize);
      if (F.reduced) lr.set(0);
      loop();
    }
    function lensOff() { if (active) leave(active); lr.target = 0; lensOn = false; FS.field.lens = [0, 0, 0]; }
    links.forEach((l) => {
      l.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') enter(l); });
      l.addEventListener('pointerleave', () => leave(l));
      l.addEventListener('focus', () => { if (l.matches(':focus-visible')) enter(l); });
      l.addEventListener('blur', () => leave(l));
    });
  }

  /* ── 13 · header: the brand disc pings on hover and focus; the pill names the section at mid-viewport ── */
  function header() {
    const brand = $('.site-header .brand'), dot = brand && $('.brand-dot', brand);
    if (brand && dot) {
      let last = 0;
      const ping = () => { const t = performance.now(); if (t - last < 700) return; last = t; FS.ping(dot); };
      brand.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') ping(); });
      brand.addEventListener('focus', () => { if (brand.matches(':focus-visible')) ping(); });
    }
  }
  function readout() {
    const secs = $$('[data-f]');
    let raf = 0;
    const update = () => {
      raf = 0;
      if (refreshing || FS.menu.open) return;
      const mid = innerHeight * .5;
      let f = 1.4;
      for (const s of secs) if (s.getBoundingClientRect().top <= mid) f = +s.dataset.f;
      FS.readout.set(f);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    FS.on('menu:close', update);
    WORK.readout = update;
    update();
  }

  /* ── 14 · smooth scroll and links (home.js scroller + links) ─────────────── */
  function scroller() {
    if (F.static || F.reduced || F.nogsap || typeof window.Lenis === 'undefined') return;
    try {
      const lenis = new window.Lenis({ lerp: .1 });
      window.lenis = lenis;
      if (window.ScrollTrigger) { window.gsap.registerPlugin(window.ScrollTrigger); lenis.on('scroll', window.ScrollTrigger.update); }
      lenis.on('scroll', () => scrollers.forEach((fn) => fn()));
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
      if (F.menu) lenis.stop();
    } catch (e) { console.warn('lenis', e); }
  }
  function links() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#') { e.preventDefault(); return; }                          /* data-todo="resume" */
      if (href[0] === '#' && !a.classList.contains('menu-link') && !e.metaKey && !e.ctrlKey) {
        const el = href === '#top' ? null : document.querySelector(href);
        if (href !== '#top' && !el) return;
        e.preventDefault();
        if (el) { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
        const off = el && el.classList.contains('stage') ? -(cssPx('--header-h') + 24) : 0;
        if (window.lenis) window.lenis.scrollTo(el || 0, { offset: off });
        else if (!el) scrollTo({ top: 0, behavior: F.reduced ? 'auto' : 'smooth' });
        else el.scrollIntoView({ behavior: F.reduced ? 'auto' : 'smooth' });
      }
    });
  }

  /* ── boot ───────────────────────────────────────────────────────────────── */
  let readyResolve;
  WORK.ready = new Promise((r) => { readyResolve = r; });
  function boot() {
    /* a panning strip whose point is at its far end starts there (Affinidi's Header organism: the dropdown) */
    $$('.pl-pan[data-pan=end]').forEach((el) => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
    /* polish review: on desktop the wide boards don't pan, so they are not tab stops (their ring painted under the board) */
    const pans = () => $$('.pl-pan').forEach((el) => { el.tabIndex = el.scrollWidth > el.clientWidth + 1 ? 0 : -1; });
    pans(); addEventListener('resize', pans);
    if (F.static || F.reduced) html.classList.remove('hero-pre');
    if (!FS.field.el) html.classList.add('no-field');
    layout();
    scroller();
    light.init();
    footerRing();
    fitNext();
    /* the sticky stages first: they set their heights, which every trigger below measures */
    const seqMode = sequences(), featMode = features();
    readout();
    header();
    links();
    menu();
    footer();
    heroExit();
    rack();
    rail();
    decisions();
    if (live) { readLine($('#brief .w-statement')); $$('.w-qt').forEach(readLine); irises(); reveals(); processSteps(); bullets(); stats(); }
    FS.on('fonts', () => { layout(); fitNext(); footerRing(); if (featMode) featMode(); if (live) ST().refresh(); });
    if ('ResizeObserver' in window) {
      let w0 = html.clientWidth, h0 = innerHeight;
      new ResizeObserver(() => {
        if (html.clientWidth === w0 && Math.abs(innerHeight - h0) < 2) return;
        w0 = html.clientWidth; h0 = innerHeight;
        if (seqMode) seqMode(); if (featMode) featMode();
        layout(); fitNext(); footerRing(); FS.lit.refresh(); if (live) ST().refresh(); if (WORK.rack) WORK.rack();
      }).observe(html);
    }
    if (live) {
      ST().addEventListener('refreshInit', () => { refreshing = true; });
      ST().addEventListener('refresh', () => { refreshing = false; if (WORK.readout) WORK.readout(); FS.header.update(); light.update(); });
      addEventListener('load', () => { if (featMode) featMode(); ST().refresh(); });
    }
    if (F.reduced && hero && hero.animate) hero.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'linear' });

    /* ready: the hero is laid out with its webfonts (or 900ms have passed) and the fonts gate has lifted the pill */
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 900))]).then(() => {
      layout(); fitNext();
      html.classList.add('work-ready');
      readyResolve();
      FS.emit('work:ready');
      if (!html.classList.contains('hero-pre')) { H.done = true; light.intro(null); if (H.exit) H.exit(true); return; }   /* bailed, restored */
      if (html.classList.contains('is-arriving')) return;          /* the arrival calls WORK.hero.focusIn() */
      H.intro();
    });
    FS.emit('work:boot', { FS, WORK, F, live });
  }
  FS.on('boot', boot);

  /* bfcache: a page restored by Back never shows a stuck cover, a held light or a hero waiting for an intro that
     already ran (js/handoff.js puts its own layers back; the field and the band come back here) */
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    html.classList.remove('hero-pre', 'is-arriving', 'is-leaving');
    if (FS.field.el) FS.field.el.style.zIndex = '';
    $$('.w-next [data-ho]').forEach((el) => { el.style.filter = ''; el.style.opacity = ''; el.removeAttribute('data-ho'); });
    light.intro(null); light.release();
    FS.emit('work:pageshow');
  });

  /* QA hooks */
  window.__fs = Object.assign(window.__fs || {}, { openMenu: () => FS.menu.show(), closeMenu: () => FS.menu.hide(), work: WORK });
})();
