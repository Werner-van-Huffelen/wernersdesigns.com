/* Full Stop · stage 2: motion and signature moments
 * Fills the HOME.stage2.* hooks that js/home.js calls once at boot (in insertion order):
 *   portrait   focus pull (soft → sharp)
 *   loader     §8.1 the pinhole is the hero: real progress, detents, FLIP to rest, failsafe, skip; round 7: the bleed
 *              (js/handoff.js) takes its place: the scheme's light fills the screen, the hero waits at rest under it
 *   stopDown   §7 hero pin + scrub: Werner ends up inside the full stop of "shipped."
 *   manifesto  §7 pull focus, word by word, scrubbed by the scroll
 *   irises     the footer only: its light opens from Croove's punch
 *   work       card hover (the disc opens, the button lights), the filter reflow
 *   footer     disc spring, ring badge
 *   menu       the sibling dim on hover/focus
 * 2026-10-08 motion cut (Werner: "half the animations, and more intentional"): the portrait's depth parallax, the
 * hero's staggered entrances and its exit blur, the manifesto's cursor lens, three of the four irises (with their rim,
 * halo and pings), the bio reveal, the work rack focus and stop travel, the services copy focus-in, the companies
 * count-up, the footer marquee, the menu choreography and lens, and the header pings are gone. What they animated
 * rests at its end state (the CSS default).
 * Everything interruptible starts from its live value (springs, or GSAP .to from the current state).
 * ?static=1 and reduced motion: nothing here hides content; every end state is the CSS default.
 */
(function () {
  'use strict';
  const FS = window.FS, HOME = window.HOME;
  if (!FS || !HOME) return;
  const F = FS.flags, html = document.documentElement, E = FS.ease;
  const { clamp, lerp } = FS.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const mobile = () => FS.util.mq('(max-width: 767px)');
  const G = () => window.gsap, ST = () => window.ScrollTrigger;
  const live = !F.static && !F.reduced && !!window.gsap && !!window.ScrollTrigger;
  if (live) window.gsap.registerPlugin(window.ScrollTrigger);
  const S = (HOME.stage2 = HOME.stage2 || {});
  const hero = $('#top'), barrel = $('.barrel'), seeA = $('.see'), seeIn = $('.see-in');

  /* ── the hero renderer: one place decides (cx, cy, r, pr, alpha) ───────── */
  const H = (HOME.hero = {
    mode: html.classList.contains('is-loading') ? 'loader' : 'rest',   // loader | flip | rest
    lc: { cx: innerWidth / 2, cy: innerHeight / 2, r: 1 },               // loader circle (viewport px)
    from: null, flip: 0,                                                 // FLIP from the last detent
    p: 0,                                                                // stop-down progress (linear; eased here)
  });
  HOME.renderHero = function () {
    const rest = HOME.aperture.rest || HOME.rest();
    let cx = rest.cx, cy = rest.cy, r = rest.r, pr = rest.r, alpha = 1, so = '';
    if (H.mode === 'loader') { cx = H.lc.cx; cy = H.lc.cy; r = H.lc.r; }
    else if (H.mode === 'flip') { const e = H.flip; cx = lerp(H.from.cx, rest.cx, e); cy = lerp(H.from.cy, rest.cy, e); r = lerp(H.from.r, rest.r, e); }
    else if (H.p > 0) {
      const e = E.iris(H.p), t = HOME.stopDisc();
      /* the path bends (a curve, not a diagonal slide): x leads, so the still-large circle sweeps across "ped."
         and the ink notch reads for a third of the scrub before the circle settles onto the stop */
      const ex = 1 - Math.pow(1 - e, 1.9);
      cx = lerp(rest.cx, t.x, ex); cy = lerp(rest.cy, t.y, e); r = lerp(rest.r, t.r, e); pr = r;
      alpha = 1 - clamp((H.p - .92) / .08, 0, 1);
      /* the moon headline is cut out by the aperture (CSS mask), so the period is swallowed geometrically. The ink
         copy's stop stays dark until the aperture has become the stop (p .92), then crossfades in as it fades out. */
      const o = 1 - alpha;
      so = o >= .999 ? '' : o.toFixed(3);
    }
    if (hero && hero.style.getPropertyValue('--stop-o') !== so) { if (so) hero.style.setProperty('--stop-o', so); else hero.style.removeProperty('--stop-o'); }
    HOME.setAperture(cx, cy, r, { pr, alpha });
    if (hero) hero.style.setProperty('--br', rest.r.toFixed(2) + 'px');   /* the barrel stays at rest; the aperture stops down inside it */
    if (barrel && H.mode === 'rest') {
      const o = H.p > 0 ? E.smoothstep(.55, .9, r / rest.r).toFixed(3) : '';   /* gone before the aperture reaches the subline */
      if (barrel.style.opacity !== o) barrel.style.opacity = o;
      /* the See-the-work badge fades with the ring, and leaves the tab order and the pointer once it is gone */
      if (seeIn && seeIn.__o !== o) { seeIn.__o = o; seeIn.style.opacity = o; seeA.style.visibility = o === '0.000' ? 'hidden' : ''; }
    }
  };

  /* ── 1 · portrait: focus ───────────────────────────────────────────────── */
  S.portrait = function () {
    const box = $('.portrait'); if (!box || !hero) return;
    const link = $('.portrait-link');
    if (link) {
      link.addEventListener('focus', () => {
        let fv = true; try { fv = link.matches(':focus-visible'); } catch (e) {}
        if (!fv) return;
        html.classList.add('portrait-focus');
        if (live && H.p > .001) { if (window.lenis) window.lenis.scrollTo(0, { force: true }); else scrollTo(0, 0); }
      });
      link.addEventListener('blur', () => html.classList.remove('portrait-focus'));
    }
    /* 2026-10-08 motion cut: the depth parallax (a WebGL displacement toward the cursor) is gone, and its renderer with
       it. The two <img> layers crossfade on --focus everywhere (css/home.css), the path touch devices already took. */
    HOME.setFocus = (f) => { hero.style.setProperty('--focus', f.toFixed(3)); };
    HOME.setFocus(H.mode === 'loader' ? 0 : 1);
  };

  /* ── 2 · loader: the pinhole is the hero (§8.1) ─────────────────────────── */
  S.loader = function () {
    const L = (HOME.loader = { done: false });
    if (!html.classList.contains('is-loading')) {
      H.mode = 'rest'; HOME.renderHero();
      if (F.reduced && hero && hero.animate) hero.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'linear' });
      L.done = true; return;
    }
    if (!window.gsap) { if (window.FS_BLEED) window.FS_BLEED.out(0); html.classList.remove('is-loading'); H.mode = 'rest'; HOME.renderHero(); L.done = true; return; }
    const gsap = G();
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    scrollTo(0, 0);
    if (window.lenis) { window.lenis.scrollTo(0, { immediate: true, force: true }); window.lenis.stop(); }

    /* round 7, the bleed (js/handoff.js): the new scheme's light is opening over the page, so there is no pinhole and
       no readout. The hero is at rest under the light, out of focus, its words and chrome hidden (is-loading); once
       the light is open and the same real progress is in, the light dissolves (FS_BLEED.out) and the timeline below
       runs without its FLIP: the focus pull, the hero fade, the counter, the final stop */
    const B = window.FS_BLEED;                         /* even if its light already went (a bail): no pinhole then */
    if (B) B.claimed = true;
    if (B) { H.mode = 'rest'; if (HOME.setFocus) HOME.setFocus(0); HOME.renderHero(); }
    let opened = !B, armed = false, tl = null;           /* armed: set up below; a progress signal can come in sync */
    if (B) B.opened.then(() => { opened = true; ready(); });

    const STEPS = [22, 16, 11, 8, 5.6, 4, 2.8, 2, 1.4];
    const W = { fonts: .30, soft: .20, moon: .20, field: .20, load: .10 };
    const got = {}; let progress = 0;
    const add = (k) => { if (got[k]) return; got[k] = 1; progress = Math.min(1, progress + W[k]); ready(); };
    /* the bleed goes on once its light is open and everything is in */
    function ready() { if (B && armed && opened && !tl && !L.done && progress >= 1 - 1e-6) start(); }
    L.set = (p) => { progress = clamp(p, 0, 1); };

    /* real progress */
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => add('fonts'));
    const dec = (im, k) => { if (!im) return add(k); (im.decode ? im.decode() : Promise.resolve()).then(() => add(k), () => add(k)); };
    dec($('.portrait .p-soft'), 'soft'); dec($('.portrait .p-moon'), 'moon');
    const fieldDone = () => {
      if (FS.field.ready) return add('field');
      if (html.classList.contains('field-still') || !FS.field.ok) {
        const im = new Image(); im.onload = im.onerror = () => add('field'); im.src = FS.theme.src('assets/aurora-still.webp'); return;
      }
      FS.on('field:ready', fieldDone);
    };
    fieldDone();
    if (document.readyState === 'complete') add('load'); else addEventListener('load', () => add('load'));
    /* failsafe: at 4 s jump straight to the widest detent and run the FLIP at 2.5×, so nothing is hidden past ~4.5 s */
    const failsafe = setTimeout(() => {
      if (L.done) return;
      progress = 1;
      if (B) { if (!opened) B.out(0); ready(); }                 /* the light never opened: it goes, the hero comes in */
      else if (!tl) { step = 8; showPct(100); start(); }
      if (tl) tl.timeScale(2.5);
    }, 4000);

    /* the readout beside the pinhole: a plain percentage that follows the detents (step / 8), counting up quickly */
    const rd = B ? null : document.createElement('div');
    if (rd) {
      rd.className = 'ld-read'; rd.setAttribute('aria-hidden', 'true');
      rd.innerHTML = '<span class="roll"><span>0%</span></span>';
      document.body.appendChild(rd);
    }
    const pctEl = rd && rd.querySelector('.roll > span');
    let pct = 0, pctShown = 0;
    function showPct(v) { pct = v; const n = Math.round(v); if (pctEl && n !== pctShown) { pctShown = n; pctEl.textContent = n + '%'; } }

    /* detents: advance when real progress allows and 110 ms have passed; the diameter springs */
    const dia = FS.spring({ value: 2, response: .28, damping: 1 });
    let step = 0, lastStep = performance.now(), raf = 0, prev = 0;
    const vmin = () => Math.min(innerWidth, innerHeight);
    const targetD = (n) => Math.max(2, .36 * vmin() * Math.pow(1.4 / n, 2));
    function place() {
      H.lc = { cx: innerWidth / 2, cy: innerHeight / 2, r: Math.max(1, dia.value / 2) };
      HOME.renderHero();
      if (rd) rd.style.transform = `translate(${(H.lc.cx + H.lc.r + 16).toFixed(1)}px, ${(H.lc.cy - 7).toFixed(1)}px)`;
    }
    function frame(now) {
      raf = 0;
      const dt = prev ? Math.min(.05, (now - prev) / 1000) : 1 / 60; prev = now;
      if (step < 8 && progress >= (step + 1) / 8 - 1e-6 && now - lastStep >= 110) { step++; lastStep = now; }
      dia.target = targetD(STEPS[step]); dia.step(dt);
      showPct(FS.smooth(pct, step * 12.5, dt, .05));
      place();
      if (step === 8 && now - lastStep >= 120) { start(); return; }
      raf = requestAnimationFrame(frame);
    }
    if (!B) { place(); raf = requestAnimationFrame(frame); }
    armed = true; ready();

    /* T: FLIP to the rest, the focus pull, the hero fade, counter, the final stop */
    function start() {
      if (tl) return tl;
      cancelAnimationFrame(raf); raf = 0;
      showPct(100);
      if (!B) { H.from = { cx: H.lc.cx, cy: H.lc.cy, r: H.lc.r }; H.flip = 0; H.mode = 'flip'; }
      const f = { v: 0 };
      const chrome = [$('.hero-eyebrow'), ...$$('.hero-sub'), $('.site-header .brand'), $('.site-header .f-pill'), $('.site-header .nav-r')].filter(Boolean);
      /* 2026-10-08 motion cut: one entrance for the whole hero instead of four (the ring's focus-in, the per-word blur,
         the chrome's staggered blur, the badge's scale). The ring, the words of all three headline copies, the eyebrow,
         the subline, the header and the See badge fade in together, opacity only, as the pinhole lands. They keep their
         inline opacity 1 until is-loading lifts: clearing it earlier handed them back to html.is-loading's opacity 0
         (the ring and 'Zero to' blinked out at the end of the FLIP); finish() clears it */
      L.fade = [barrel, ...$$('.hero-title .w'), ...chrome, $('.see')].filter(Boolean);
      tl = gsap.timeline();
      if (rd) tl.to(rd, { opacity: 0, filter: 'blur(6px)', duration: .2, ease: 'none' }, 0)
        .to(H, { flip: 1, duration: .9, ease: E.iris, onUpdate: HOME.renderHero }, 0);
      else if (html.classList.contains('is-bleed')) B.out(1100);   /* the light fades from the portrait out as the hero focuses in */
      tl.to(f, { v: 1, duration: .7, ease: E.focus, onUpdate: () => HOME.setFocus(f.v) }, .2)
        .fromTo(L.fade, { opacity: 0 }, { opacity: 1, duration: .48, ease: E.focus, immediateRender: false,
          onComplete() { if (!html.classList.contains('is-loading')) gsap.set(L.fade, { clearProps: 'opacity' }); } }, .5)
        .to($$('.hero .ctr'), { '--cr': '50%', duration: .42, ease: E.glass }, .76)
        .to($$('.hero .stop'), { '--sr': '50%', duration: .24, ease: E.glass }, 1.1);
      tl.call(() => FS.ping($('#hero-stop')), null, 1.2)
        .call(finish, null, 1.2);                        /* §8.1: is-loading lifts at T + 1200, the hero fade already done */
      L.tl = tl;
      return tl;
    }
    function finish() {
      if (L.done) return; L.done = true;
      clearTimeout(failsafe); cancelAnimationFrame(raf);
      H.mode = 'rest'; HOME.setFocus(1); HOME.renderHero();
      html.classList.remove('is-loading');
      /* the hero fade hands its opacity back now (the barrel's was already reset by renderHero above); if it is still
         running, it clears it itself on complete */
      if (L.fade) L.fade.forEach((el) => { if (!gsap.isTweening(el)) gsap.set(el, { clearProps: 'opacity' }); });
      /* tweens still running clear their own props when they end; only the readout goes now */
      if (rd) rd.remove();
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => removeEventListener(t, skip, true));
      if (window.lenis && !FS.menu.busy) window.lenis.start();
      if (ST()) ST().refresh();
      FS.emit('loader:done');
    }
    function skip() { if (L.done) return; progress = 1; if (B) B.out(0); start().progress(1); finish(); }
    L.skip = skip;
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, skip, { capture: true, passive: true }));
  };

  /* ── 3 · stop-down: the aperture shrinks into the period of "shipped." ─── */
  S.stopDown = function () {
    if (!live || !hero) return;
    let pinged = false;
    const onUpdate = () => {
      if (H.mode === 'rest') HOME.renderHero();
      if (HOME.syncSy) HOME.syncSy();
      if (HOME.readout) HOME.readout();
      if (H.p > .995 && !pinged) { pinged = true; FS.ping($('#hero-stop')); }
      if (H.p < .9) pinged = false;
    };
    /* the pin ends as the stop lands (.8vh desktop, .72vh mobile): the iris ease already spends its tail on the
       last fifth, so a longer pin only held an empty frame */
    G().to(H, {
      p: 1, ease: 'none', onUpdate,
      scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + Math.round(innerHeight * (mobile() ? .72 : .8)),
        pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true },
    });
    FS.on('fonts', () => HOME.renderHero());
    /* 2026-10-08 motion cut: the hero copy no longer blurs out under the header once the pin releases; it scrolls
       under it like any copy (the header's scrim keeps the mark legible) */
  };

  /* ── 4 · manifesto: pull focus ──────────────────────────────────────────── */
  S.manifesto = function () {
    const sec = $('#vision'), words = $$('.manifesto .w');
    if (!live || !sec || !words.length) return;
    /* 2026-10-08: the vision is one sentence over four lines, so only the line that ends it carries a stop */
    const lines = $$('.manifesto .m-line').map((l) => { const ws = $$('.w', l); return { last: words.indexOf(ws[ws.length - 1]), stop: $('.stop', l), lit: false }; }).filter((l) => l.stop);
    lines.forEach((l) => { l.stop.style.setProperty('--sr', '0%'); FS.lit.track(l.stop); });
    let raw = 0, prog = 0, raf = 0, last = 0, visible = false;
    const cur = words.map(() => ({ b: -1, o: -1 }));
    /* each word resolves over .18 of the progress; the stagger spreads the rest over the words, so the last one is sharp
       as the scrub ends (.082 for the original 11 words; a fixed .082 left the 17-word vision's 'what to build next.'
       blurred at full scroll, its stop never lit) */
    const step = (1 - .18) / Math.max(1, words.length - 1);
    const m = mobile();
    HOME.visionST = ST().create({
      trigger: sec, start: m ? 'top 80%' : 'center center', end: m ? 'bottom 60%' : () => '+=' + Math.round(innerHeight * 1.4),
      pin: !m, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { raw = s.progress; loop(); }, onRefresh: (s) => { raw = s.progress; loop(); },
    });
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      /* out of view the words snap to the scroll (a fast jump past the section no longer leaves its last words
         blurred until it is scrolled back into) */
      prog = visible ? FS.smooth(prog, raw, dt, .1) : raw;
      /* 2026-10-08 motion cut: the cursor no longer sharpens words ahead of the scroll; the reader's scroll alone
         pulls them into focus */
      const moving = Math.abs(prog - raw) > .0005;
      words.forEach((w, i) => {
        const win = clamp((prog - i * step) / .18, 0, 1);
        const b = 12 * (1 - E.focus(win));
        const o = .14 + .86 * (1 - b / 12);
        const c = cur[i];
        if (Math.abs(c.b - b) > .04) { c.b = b; w.style.filter = b < .05 ? 'none' : `blur(${b.toFixed(2)}px)`; }
        if (Math.abs(c.o - o) > .004 || (o >= .999) !== (c.o >= .999)) { c.o = o; w.style.opacity = o >= .999 ? '' : o.toFixed(3); }   /* sharp hands back to the CSS default */
      });
      lines.forEach((l) => {
        const b = cur[l.last].b;
        if (!l.lit && b < .5) { l.lit = true; l.stop.style.setProperty('--sr', '50%'); FS.ping(l.stop); }
        else if (l.lit && b > 2) { l.lit = false; l.stop.style.setProperty('--sr', '0%'); }
      });
      if (visible && moving) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(sec);
    loop();
  };

  /* ── 5 · iris: the footer's light opens from Croove's punch ─────────────── */
  /* 2026-10-08 motion cut: one iris, at the end, where the aurora returns: the page closes the way it opened, with
     light opening from a full stop. The bio card, Work and Companies irises are gone (those sections are simply
     there), and so are the bio's line-by-line focus-in, its eye's soft-to-sharp, the lit rim, the hairline halo and
     the origin ping. */
  S.irises = function () {
    const defs = [
      { el: $('#footer'), from: $('#croove-punch'), field: true },
    ].filter((d) => d.el && d.from);
    if (!live) return;
    defs.forEach((d) => {
      const apply = (p) => {
        const b = d.el.getBoundingClientRect();
        const o = d.from.classList.contains('stop') ? FS.iris.stopCentre(d.from) : FS.iris.circleCentre(d.from);
        const ox = o.x - b.left, oy = o.y - b.top;
        if (p >= 1) {
          if (d.el.style.clipPath) d.el.style.clipPath = '';
          if (d.field) { HOME.footerClip = null; if (FS.field.mode === 'full') FS.field.setClip(null); }
        } else {
          /* from p .02 the circle appears as a proper cap (d0 + 24), never a hairline chord */
          const d0 = Math.max(0, -oy);
          const rMax = Math.hypot(Math.max(Math.abs(ox), Math.abs(b.width - ox)), b.height - oy) + 2;
          const r = p < .02 ? 0 : lerp(d0 + 24, rMax, E.iris((p - .02) / .98));
          d.el.style.clipPath = `circle(${r.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
          if (d.field) { HOME.footerClip = { x: o.x, y: o.y, r }; if (FS.field.mode === 'full') FS.field.setClip(HOME.footerClip); }
        }
      };
      const st = ST().create({ trigger: d.el, start: 'top 92%', end: 'top 22%', onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
      d.apply = () => apply(st.progress);
      apply(st.progress);
    });
    /* the footer's field clip must be re-applied whenever the field comes back to full mode */
    FS.on('menu:close', () => defs.forEach((d) => d.apply && d.apply()));
  };

  /* ── 6 · work: the card hover, the filter ────────────────────────────────── */
  S.work = function () {
    const sec = $('#work'), cards = $$('.work-card');
    if (!sec || !cards.length) return;
    /* 2026-10-08 motion cut: the rack focus (cards soft, tinted and stopped down away from the centre band) and the
       stop's travel into the button are gone. The media rest sharp and full (css/home.css defaults); a hover or focus
       opens the card's disc, grows its halo and lights the button directly (.is-hover, css/home.css), the disc that
       grows into the project page on click. Touch has no hover: a tap goes straight to the handoff. */
    cards.forEach((card) => {
      if (!$('.wc-btn', card)) return;                     /* round 7: every card has its button (Bandcamp too) */
      const on = (v) => { if (v && (card.hidden || card.inert)) return; card.classList.toggle('is-hover', v); };   /* filtered out, or on its way out */
      /* card.__off: a filter takes the card out of the layout, so whatever hover state it had resets (HOME.work.place) */
      card.__off = () => on(false);
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') on(true); });
      card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') on(false); });
      card.addEventListener('focusin', () => on(true));
      card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) on(false); });
    });

    /* the filter (round 4: hide, not grey). Leaving cards fade out (240ms); then the layout changes once
       (HOME.work.place) and the kept cards FLIP from where they were to their new places (560ms, the focus curve)
       while entering ones fade in, staggered. 2026-10-08 motion cut: opacity only (no blur), and the title stops no
       longer ping as their cards land. The grid's height rides the same curve, so the sections below glide rather
       than jump, and ScrollTrigger refreshes once it has settled. A click mid-way takes over from what is on screen:
       the running tweens are killed where they are and the next run measures from there. Mobile has one column: no
       FLIP, a moved card fades in at its new place. Reduced motion and ?static=1 never get here (js/home.js places at
       once). */
    const W = HOME.work, grid = $('.work-grid', sec);
    if (!live || !W || !grid) return;
    const retarget = () => { if (FS.cursor && FS.cursor.retarget) FS.cursor.retarget(); };
    const tick = () => { FS.lit.kick(); retarget(); };                  /* lights and loupe follow the cards */
    let run = null;
    function swap(me, list) {
      if (run !== me) return;
      const m = mobile(), g0 = grid.getBoundingClientRect(), first = new Map(), was = new Map();
      list.forEach((c) => {
        if (c.hidden) return;
        const r = c.getBoundingClientRect();
        first.set(c, [r.left - g0.left, r.top - g0.top]);
        was.set(c, c.style.opacity !== '');                             /* caught on its way out by this click */
      });
      G().set(cards, { clearProps: 'transform' });
      grid.style.height = '';
      W.place(list);
      cards.forEach((c) => { if (c.hidden) G().set(c, { clearProps: 'opacity' }); });
      const g1 = grid.getBoundingClientRect(), h0 = g0.height, h1 = g1.height;
      const tl = G().timeline({ onUpdate: tick, onComplete: () => done(me) });
      me.tls.push(tl);
      if (Math.abs(h1 - h0) > .5) { grid.style.height = h0.toFixed(2) + 'px'; tl.to(grid, { height: h1, duration: .56, ease: E.focus }, 0); }
      let k = 0;
      const reveal = (c) => tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: .5, ease: E.focus }, .14 + .06 * k++);
      list.forEach((c) => {
        const f = first.get(c), r = c.getBoundingClientRect();
        if (!f) reveal(c);                                                  /* entering */
        else {
          const dx = f[0] - (r.left - g1.left), dy = f[1] - (r.top - g1.top), moved = Math.abs(dx) > .5 || Math.abs(dy) > .5;
          if (moved && m) reveal(c);                                        /* one column: it re-appears in its place */
          else {
            if (moved) tl.fromTo(c, { x: dx, y: dy }, { x: 0, y: 0, duration: .56, ease: E.focus }, 0);
            if (was.get(c)) tl.to(c, { opacity: 1, duration: .32, ease: E.focus }, 0);
          }
        }
      });
      tick();
    }
    function done(me) {
      if (run !== me) return;
      run = null;
      grid.style.height = '';
      G().set(cards, { clearProps: 'transform,opacity' });
      ST().refresh();                          /* the pins, scrubs and the footer iris below re-measure */
      W.hold(me.y0);
      FS.lit.refresh(); retarget();
    }
    W.run = (list) => {
      const y0 = run ? run.y0 : W.barY();
      if (run) run.tls.forEach((t) => t.kill());
      const me = (run = { tls: [], y0 });
      const leaving = cards.filter((c) => !c.hidden && !list.includes(c));
      leaving.forEach((c) => { c.inert = true; if (c.__off) c.__off(); });
      if (!leaving.length) { swap(me, list); return; }
      const tl = G().timeline();
      me.tls.push(tl);
      tl.to(leaving, { opacity: 0, duration: .24, ease: 'power1.in' }, 0)
        .call(() => swap(me, list), null, .24);
    };
    W.stop = () => {
      if (!run) return;
      run.tls.forEach((t) => t.kill()); run = null;
      G().set(cards, { clearProps: 'transform,opacity' });
      grid.style.height = '';
    };
  };

  /* 2026-10-08 motion cut: the services panel copy no longer focuses in as its row opens (the height already reveals
     it), and the companies cards no longer count up through a blur and ping their punch: the values, the sharp copy
     and the lit punches are the markup's and the CSS defaults. */

  /* ── 7 · footer: the final full stop, the ring badge ───────────────────── */
  /* 2026-10-08 motion cut: the 'Let's connect.' marquee is one still line on the margin (css/home.css) */
  S.footer = function () {
    const ft = $('#footer'), wrap = $('.disc-wrap'), disc = $('.disc');
    if (!ft) return;
    let raf = 0, last = 0;
    const base = () => (mobile() ? 100 : 140), open = () => (mobile() ? 130 : 180);
    const sp = FS.spring({ value: base(), response: .35, damping: .85 });
    let hot = false;
    const setHot = (v) => { hot = v; wrap.classList.toggle('is-open', v); sp.target = v ? open() : base(); loop(); };
    if (wrap && disc) {
      wrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setHot(true); });
      wrap.addEventListener('pointerleave', () => setHot(false));
      disc.addEventListener('focus', () => setHot(true)); disc.addEventListener('blur', () => setHot(false));
      addEventListener('resize', () => { sp.target = hot ? open() : base(); if (F.reduced || F.static) sp.set(sp.target); loop(); });
    }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      if (F.reduced) sp.set(sp.target); else sp.step(dt);
      if (disc) disc.style.setProperty('--dr', sp.value.toFixed(2) + 'px');
      if (!sp.settled() && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
    loop();
  };

  /* ── 8 · menu: hovering a link dims its siblings ───────────────────────── */
  /* 2026-10-08 motion cut: the links' focus-reveal, the stops lighting in turn with their ping, the card's iris from
     its notch, the reverse blur-out on close and the shader lens with its glass ring are gone. The menu's own iris
     (js/system.js) opens onto the links and the card at rest; a hover or keyboard focus dims the other links
     (css/system.css .has-hover). The header stage went too: the brand's hover ping and the section-entry pings. */
  S.menu = function () {
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
  };

  /* ── last: page-order refresh once every trigger exists ─────────────────── */
  S.zRefresh = function () {
    if (!live) return;
    /* a refresh briefly reverts the pins: nothing that reads rects may react to it */
    ST().addEventListener('refreshInit', () => { HOME.refreshing = true; });
    ST().addEventListener('refresh', () => { HOME.refreshing = false; if (HOME.relayoutHero) HOME.relayoutHero(); if (HOME.readout) HOME.readout(); FS.header.update(); });
    ST().sort && ST().sort();
    ST().refresh();
    FS.on('fonts', () => ST().refresh());
    addEventListener('load', () => ST().refresh());
  };
})();
