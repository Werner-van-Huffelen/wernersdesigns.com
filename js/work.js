/* Full Stop · work pages (round 5; round 6: the filled gradient and the live content): behaviour for work.html?p=<slug>
 * The page is already written before the first paint (js/work-data.js WORK.render). This brings it to life at FS boot,
 * in the homepage's language: focus (blur → sharp) and irises (circle clips opening from a stop or a disc). It stands
 * in for js/home.js and js/motion.js, which are homepage-only (they assume the portrait hero); the pieces lifted from
 * them say so.
 *
 *   hero      the device on the filled light, the headline fit to its column, the intro: the light comes up out of
 *             the night, the device focuses in, the copy fades in as one and the headline's stop lights
 *   light     the one aurora field, clipped to the hero, the Next band and the footer's iris (whichever are in view)
 *   brief     the statement focuses word by word as it passes the reading line
 *   iris      the footer opens from the Next arrow
 *   live      the atomic stages' rail follows the stage in view, the stepped sequences ride the scroll on wide screens
 *   next      the Next band: the name fitted to the width, hover lifts the veil and lights the arrow
 *   footer, menu, readout, scroller, links: as on the homepage (lifted from home.js / motion.js)
 *
 * 2026-10-08 motion cut (Werner: half the animations, and intentional): what replayed on every block or followed the
 * scroll is gone and rests at its finished state. No block, paragraph or quote reveals, no hero exit, no rack focus on
 * the plates, no sideways ideation track, no count-up; the ice sections are simply there (only the footer irises open);
 * the decision, process, bullet and stat discs rest lit (css/work.css); no menu choreography, link lens or brand ping.
 * A ping now marks only the headline's stop and the Brief's.
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
  /* the sticky stages (the stepped sequences) run where there is room for them: css/work.css §14 */
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
    FS.emit('work:layout');
    light.update();
  }
  H.layout = layout;

  /* ── 2 · the light: one aurora field for the hero, the Next band and the footer ────────────────────────────────
     The field is one fixed canvas (FS.field, the footer's mode) under every section; the sections are opaque, except
     the hero and the Next band (transparent, .w-lit: filled with it) and the footer (transparent inside its iris). So
     the field is clipped to exactly what should show it: the hero's rect and the band's rect while they are in view,
     the footer's iris circle (its whole rect once open), one path, their union (2026-10-08 motion cut: the ice
     sections no longer iris open over it, they are simply there). The clip is written in the scroll's own
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
     colour) as it comes, then the copy fades in as one (back pill, label, name, headline, tags, meta) and the
     headline's stop lights and pings as it lands. With a handoff (html.is-arriving) the arrival's cover dissolves into
     the light, which is already there, and calls focusIn(): the same, minus the light's own rise. Every tween clears
     its props. */
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
    /* the hidden state moves inline before hero-pre lifts, so nothing flashes between the class and the tweens (the
       pieces css/work.css §13 hides). The not-found hero has no words, tags or meta: the group is just shorter */
    const hide = [$('.wh-back', hero), $('.wh-label', hero), $('.wh-name', hero),
      ...$$('.wh-title .w', hero), ...$$('.wh-tags .tag', hero), ...$$('.wm', hero)].filter(Boolean);
    if (hide.length) gsap.set(hide, { opacity: 0 });
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
    /* 2026-10-08 motion cut: the copy is one fade (it was a blur-in per piece, the headline word by word: about 1.7s
       before a case study could be read), and the stop lights on a fixed beat, as the fade lands */
    if (hide.length) tl.to(hide, { opacity: 1, duration: .4, ease: E.focus, clearProps: 'opacity' }, t0 + .22);
    if (stop) tl.to(stop, { '--sr': '50%', duration: .24, ease: E.glass, onComplete: () => stop.style.removeProperty('--sr') }, t0 + .62)
      .call(() => FS.ping(stop), null, t0 + .72);
    return tl;
  }
  H.intro = () => heroIn({ iris: true });              /* iris: the light's own rise (the name kept from round 5) */
  H.focusIn = () => heroIn({ iris: false });
  /* 2026-10-08 motion cut: the hero's pieces no longer blur out as they reach the header (heroExit); the header's
     scrim holds the copy passing under it */

  /* ── 3 · the reading line: the Brief's statement pulls focus word by word as it passes it (the one reading moment
     per case study; 2026-10-08 motion cut: the quotes rest sharp, their stops lit). Each word's focus runs over 1.7
     lines of scroll around the reading line (66% of the viewport, 72% on phones), and within a line from left to
     right, so a line reads into focus the way it is read. The stop lights (and pings) when the last word is sharp, and
     goes out again if you scroll back (motion.js S.manifesto, without the pin). */
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

  /* ── 4 · the footer's iris (motion.js S.irises): it opens from the Next band's arrow disc, its last light, and the
     field's clip follows it (light.footer, the only way the footer gets its light): the page closes the way the hero
     opened, with light. 2026-10-08 motion cut: the ice sections no longer iris open from the light above them (they
     are simply there), and the circle has no lit rim, hairline halo or ping. ── */
  function iris() {
    const el = $('#footer'), from = $('#next .nx-go') || $('#outcome .stop');
    if (!live || !el || !from) return;
    const apply = (pr) => {
      if (pr >= 1) { if (el.style.clipPath) el.style.clipPath = ''; light.footer('open'); return; }
      const b = el.getBoundingClientRect();
      const o = from.classList.contains('stop') ? FS.iris.stopCentre(from) : FS.iris.circleCentre(from);
      const ox = o.x - b.left, oy = o.y - b.top;
      const d0 = Math.max(0, -oy), rMax = Math.hypot(Math.max(Math.abs(ox), Math.abs(b.width - ox)), b.height - oy) + 2;
      const r = pr < .02 ? 0 : lerp(d0 + 24, rMax, E.iris((pr - .02) / .98));
      el.style.clipPath = `circle(${r.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
      light.footer(r > 0 ? { x: o.x, y: o.y, r } : null);
    };
    const st = ST().create({ trigger: el, start: 'top 92%', end: 'top 22%', onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
    apply(st.progress);
    FS.on('menu:close', () => apply(st.progress));
  }
  /* 2026-10-08 motion cut: no reveals. The heads, rows, plates, captions and stats no longer focus in as they enter,
     nor the paragraphs line by line: everything is at its place, sharp, from the first paint (they were hidden only
     inline, by the reveal itself) */

  /* ── 5 · the atomic stages' rail ─────────────────────────────────────────────────────────────────────────────
     2026-10-08 motion cut: the lights no longer follow the reading. The decisions' index discs, the process discs (with
     their hairlines drawn) and the bullets' stops rest lit in every mode (css/work.css §7, §9); only the rail is left,
     and it is state. The stage whose top has passed the reading line (half the viewport) is the one in view: its disc
     lights, its name steps up, the compact row names it (data-at). No ping. Runs in every mode (static and reduced
     light every disc, css/work.css) */
  function rail() {
    const r = $('.stg-rail');
    if (!r) return;
    const ol = $('ol', r), links = $$('.stg-a', r), st = $$('.stage'), names = links.map((a) => $('.stg-n', a).textContent);
    let cur = -2, raf = 0;
    const frame = () => {
      raf = 0;
      const mid = innerHeight * .5;
      let k = -1;
      st.forEach((s, i) => { if (s.getBoundingClientRect().top <= mid) k = i; });
      const last = st[st.length - 1], lb = last.getBoundingClientRect();
      if (lb.bottom < innerHeight * .2) k = -1;                       /* past the last stage: the rail rests */
      if (k === cur) return;
      cur = k;
      links.forEach((a, i) => { a.classList.toggle('is-on', i === k); if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
      ol.dataset.at = k >= 0 ? names[k] : names[0];
    };
    onScroll(() => { if (!raf) raf = requestAnimationFrame(frame); });
    addEventListener('resize', frame);
    frame();
  }

  /* ── 6 · the sticky stages: the stepped sequences (wide screens, live; css/work.css §14) ──────────────────────
     A sequence's height is its steps' scroll; its stage sticks under the header while the scroll steps through it:
     the step at the scroll's share is shown (a crossfade), its dot lit, the readout "03 / 07" and the UI's own step tab
     beside it. A dot takes you to its step. It falls back to its stack (phones, static, reduced, no GSAP), where
     nothing moves. 2026-10-08 motion cut: the dots no longer ping, and the ideation track no longer rides sideways on
     a pinned track (features(): heycar's features are the stack of rows, css/work.css §7). */
  function sequences() {
    const seqs = $$('.seq');
    if (!seqs.length) return null;
    const hh = () => cssPx('--header-h') || 88;
    const all = seqs.map((sq) => {
      const steps = $$('.seq-step', sq), dots = $$('.seq-dot', sq), at = $('.seq-at', sq), rt = $('.seq-rt', sq), n = steps.length;
      const tabs = steps.map((s) => { const t = $('.seq-tab', s); return t ? t.textContent : ''; });
      let cur = -1;
      const set = (i) => {
        if (i === cur) return;
        cur = i;
        steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
        dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
        if (at) at.textContent = pad2(i + 1);
        if (rt) rt.textContent = tabs[i];
      };
      const span = () => Math.max(1, sq.offsetHeight - (innerHeight - hh()));
      const frame = () => {
        if (!html.classList.contains('seq-live')) return;
        const pr = clamp((hh() - sq.getBoundingClientRect().top) / span(), 0, 1);
        set(Math.min(n - 1, Math.floor(pr * n)));
      };
      const go = (k) => {
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
  /* 2026-10-08 motion cut: no rack focus (rack()). The plates, the hero device and the Next device stay sharp and true
     colour wherever they are (--soft 0, css/work.css §1); the hero device's own focus-in still sets --soft as it comes.
     No count-up either (stats()): the outcome's numbers are the markup's, their discs lit (css/work.css §11). */

  /* ── 7 · the Next band: the name as large as the width allows; the link for the next page; its hover ── */
  const band = $('#next');
  function fitNext() {
    if (!band) return;
    const name = $('.nx-name', band), go = $('.nx-go', band);
    if (!name) return;
    band.style.removeProperty('--nfs');
    const s0 = parseFloat(getComputedStyle(name).fontSize), m = cssPx('--margin') || 48;
    const avail = band.clientWidth - 2 * m - (go ? go.offsetWidth + (mobile() ? 16 : 32) : 0);
    /* grow or shrink to the width, up to the footer line's size (224) on desktop and 104 on phones */
    const w = name.getBoundingClientRect().width, cap = mobile() ? 104 : 224;
    band.style.setProperty('--nfs', px(Math.min(cap, Math.floor(s0 * avail / w * 10) / 10)));
  }
  if (band) {
    const link = $('.nx-link', band);
    WORK.next = { el: band, link, href: link && link.getAttribute('href'), slug: link && link.dataset.next };
  }
  /* the hover (a mouse or a pen): the veil lifts a little and the arrow lights (css/work.css §12; keyboard focus does
     the same in css). The leave keeps it while the band's light grows (js/handoff.js swallows the link's pointerleave) */
  function nextHover() {
    const link = band && $('.nx-link', band);
    if (!link) return;
    link.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') band.classList.add('is-hover'); });
    link.addEventListener('pointerleave', () => band.classList.remove('is-hover'));
  }

  /* ── 8 · footer: ring, disc spring (home.js footer + motion.js S.footer). 2026-10-08 motion cut: no velocity
     marquee, 'Let's connect.' is one still line (css/home.css) ── */
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
    const wrap = $('.disc-wrap'), disc = $('.disc');
    if (!wrap || !disc) return;
    let raf = 0, last = 0, hot = false;
    const base = () => (mobile() ? 100 : 140), open = () => (mobile() ? 130 : 180);
    const sp = FS.spring({ value: base(), response: .35, damping: .85 });
    const setHot = (v) => { hot = v; wrap.classList.toggle('is-open', v); sp.target = v ? open() : base(); loop(); };
    wrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHot(true); });
    wrap.addEventListener('pointerleave', () => setHot(false));
    disc.addEventListener('focus', () => setHot(true)); disc.addEventListener('blur', () => setHot(false));
    addEventListener('resize', () => { sp.target = hot ? open() : base(); if (F.still) sp.set(sp.target); loop(); });
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      if (F.reduced) sp.set(sp.target); else sp.step(dt);
      disc.style.setProperty('--dr', sp.value.toFixed(2) + 'px');
      if (!sp.settled() && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    loop();
  }

  /* ── 9 · menu: the links' hover (motion.js S.menu): the other links dim (css/system.css). 2026-10-08 motion cut: no
     choreography inside the menu's own iris (the links, their stops and the card are simply there as it opens, and
     close with it) and no shader lens or lit ring out of the hovered link's stop ── */
  function menu() {
    const nav = $('.menu-links'), links = $$('.menu-link');
    if (!nav || !links.length) return;
    let active = null;
    function enter(l) {
      if (!FS.menu.open) return;
      active = l;
      links.forEach((o) => o.classList.toggle('is-hover', o === l));
      nav.classList.add('has-hover');
    }
    function leave(l) {
      if (active !== l) return;
      active = null;
      l.classList.remove('is-hover'); nav.classList.remove('has-hover');
    }
    FS.on('menu:closing', () => { if (active) leave(active); });
    links.forEach((l) => {
      l.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') enter(l); });
      l.addEventListener('pointerleave', () => leave(l));
      l.addEventListener('focus', () => { if (l.matches(':focus-visible')) enter(l); });
      l.addEventListener('blur', () => leave(l));
    });
  }

  /* ── 10 · header: the pill names the section at mid-viewport. 2026-10-08 motion cut: the brand disc no longer pings
     on hover and focus (header()) ── */
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

  /* ── 11 · smooth scroll and links (home.js scroller + links) ─────────────── */
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
    const seqMode = sequences();
    readout();
    links();
    menu();
    footer();
    nextHover();
    rail();
    if (live) { readLine($('#brief .w-statement')); iris(); }
    FS.on('fonts', () => { layout(); fitNext(); footerRing(); if (live) ST().refresh(); });
    if ('ResizeObserver' in window) {
      let w0 = html.clientWidth, h0 = innerHeight;
      new ResizeObserver(() => {
        if (html.clientWidth === w0 && Math.abs(innerHeight - h0) < 2) return;
        w0 = html.clientWidth; h0 = innerHeight;
        if (seqMode) seqMode();
        layout(); fitNext(); footerRing(); FS.lit.refresh(); if (live) ST().refresh();
      }).observe(html);
    }
    if (live) {
      ST().addEventListener('refreshInit', () => { refreshing = true; });
      ST().addEventListener('refresh', () => { refreshing = false; if (WORK.readout) WORK.readout(); FS.header.update(); light.update(); });
      addEventListener('load', () => { ST().refresh(); });
    }
    if (F.reduced && hero && hero.animate) hero.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'linear' });

    /* ready: the hero is laid out with its webfonts (or 900ms have passed) and the fonts gate has lifted the pill */
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 900))]).then(() => {
      layout(); fitNext();
      html.classList.add('work-ready');
      readyResolve();
      FS.emit('work:ready');
      if (!html.classList.contains('hero-pre')) { H.done = true; light.intro(null); return; }   /* bailed, restored */
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
