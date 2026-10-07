/* Full Stop · stage 2: motion and signature moments
 * Fills the HOME.stage2.* hooks that js/home.js calls once at boot (in insertion order):
 *   portrait   depth parallax (raw WebGL, <img> fallback) + focus pull (soft → sharp)
 *   loader     §8.1 the pinhole is the hero: real progress, detents, FLIP to rest, failsafe, skip; round 7: the bleed
 *              (js/handoff.js) takes its place: the scheme's light fills the screen, the hero waits at rest under it
 *   stopDown   §7 hero pin + scrub: Werner ends up inside the full stop of "shipped."
 *   manifesto  §7 pull focus: 11 words, scroll blur min'd with the cursor lens
 *   irises     §3.8 exactly four: bio card, work, companies, footer (+ bio line reveal)
 *   work       rack focus, halo breathing/tightening, the stop travels, touch travel
 *   services   panel focus-in (the height/leak/toggle run on interruptible CSS transitions)
 *   companies  count + clarity + punch on one tween
 *   footer     disc spring, ring badge, velocity marquee
 *   menu       links focus-reveal, card iris from its notch, shader lens on hover/focus
 *   header     the brand disc pings on hover, section detent pings
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

  /* ── 1 · portrait: depth parallax + focus ──────────────────────────────── */
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
    const soft = $('.p-soft', box), moon = $('.p-moon', box), imgs = [soft, moon];
    let focus = H.mode === 'loader' ? 0 : 1;
    let gl = null, cv = null, ok = false, U = {}, raf = 0, last = 0, restR = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    HOME.setFocus = (f) => { focus = f; hero.style.setProperty('--focus', f.toFixed(3)); if (ok) kick(); };
    HOME.setFocus(focus);
    const interactive = live && F.fine && !F.touch;

    function render() {
      if (!ok) return;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uPtr, ptr.x, ptr.y);
      gl.uniform1f(U.uAmt, 8 / Math.max(1, 2.36 * restR));       // ±8px of depth parallax across the box
      gl.uniform1f(U.uFocus, focus);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      ptr.x = FS.smooth(ptr.x, ptr.tx, dt, .14); ptr.y = FS.smooth(ptr.y, ptr.ty, dt, .14);
      if (ok) render();
      else imgs.forEach((im) => { im.style.transform = `translate(${(ptr.x * 4).toFixed(2)}px, ${(ptr.y * 4).toFixed(2)}px)`; });
      if (Math.abs(ptr.x - ptr.tx) > .001 || Math.abs(ptr.y - ptr.ty) > .001) kick(); else last = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    function sizeCanvas() {
      if (!cv) return;
      restR = (HOME.aperture.rest || HOME.rest()).r;
      const px = Math.min(2048, Math.round(2.36 * restR * Math.min(2, window.devicePixelRatio || 1)));
      if (cv.width !== px) { cv.width = cv.height = px; }
      render();
    }
    if (interactive) {
      addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        if (html.classList.contains('hero-off')) return;
        const A = HOME.aperture;
        ptr.tx = clamp((e.clientX - A.cx) / (innerWidth / 2), -1, 1);
        ptr.ty = clamp((e.clientY - A.cy) / (innerHeight / 2), -1, 1);
        kick();
      }, { passive: true });
    }
    /* WebGL only where it can pay off: a fine pointer, http(s), and the field is allowed */
    if (!interactive || F.file || F.nogl) return;
    const fail = () => { ok = false; html.classList.remove('portrait-gl'); if (cv) cv.remove(); cv = null; };
    try {
      cv = document.createElement('canvas'); cv.className = 'p-gl'; cv.id = 'portrait-gl'; cv.setAttribute('aria-hidden', 'true');
      box.appendChild(cv);
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      if (!gl) return fail();
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 v;uniform sampler2D uMoon,uSoft,uDepth;uniform vec2 uPtr;uniform float uAmt,uFocus;' +
        'void main(){float d=texture2D(uDepth,v).r;vec2 uv=v+(d-.5)*uPtr*uAmt;gl_FragColor=mix(texture2D(uSoft,uv),texture2D(uMoon,uv),uFocus);}'));
      gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['uMoon', 'uSoft', 'uDepth', 'uPtr', 'uAmt', 'uFocus'].forEach((n) => (U[n] = gl.getUniformLocation(pr, n)));
      cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(); });
    } catch (e) { return fail(); }
    const load = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
    Promise.all([moon.currentSrc || moon.src, soft.currentSrc || soft.src, 'assets/ext/portrait-depth.png'].map(load)).then((ims) => {
      if (!cv) return;
      try {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        ims.forEach((im, i) => {
          const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        });
        gl.uniform1i(U.uMoon, 0); gl.uniform1i(U.uSoft, 1); gl.uniform1i(U.uDepth, 2);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('upload');
        ok = true; sizeCanvas();
        html.classList.add('portrait-gl');
        imgs.forEach((im) => (im.style.transform = ''));
      } catch (e) { fail(); }
    }).catch(fail);
    addEventListener('resize', sizeCanvas);
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
       runs without its FLIP: the focus pull, the ring, the words, the counter, the chrome, the final stop */
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

    /* T: FLIP to the rest, focus pulls, ring, words, counter, chrome, the final stop */
    function start() {
      if (tl) return tl;
      cancelAnimationFrame(raf); raf = 0;
      showPct(100);
      if (!B) { H.from = { cx: H.lc.cx, cy: H.lc.cy, r: H.lc.r }; H.flip = 0; H.mode = 'flip'; }
      const f = { v: 0 };
      const words = $$('.hero-title:not(.ink):not(.knock) .w'), ink = $$('.hero-title.ink .w'), knock = $$('.hero-title.knock .w');
      const chrome = [$('.hero-eyebrow'), ...$$('.hero-sub'), $('.site-header .brand'), $('.site-header .f-pill'), $('.site-header .nav-r')].filter(Boolean);
      const see = $('.see');
      const off = { immediateRender: false, clearProps: 'opacity,filter' };
      /* the barrel and the words keep their inline opacity 1 until is-loading lifts: clearing it earlier handed them
         back to html.is-loading's opacity 0, so the ring and 'Zero to' blinked out for ~250ms at the end of the FLIP */
      const keepO = { immediateRender: false, clearProps: 'filter',
        onComplete() { if (!html.classList.contains('is-loading')) gsap.set(this.targets(), { clearProps: 'opacity' }); } };
      tl = gsap.timeline();
      if (rd) tl.to(rd, { opacity: 0, filter: 'blur(6px)', duration: .2, ease: 'none' }, 0)
        .to(H, { flip: 1, duration: .9, ease: E.iris, onUpdate: HOME.renderHero }, 0);
      else if (html.classList.contains('is-bleed')) B.out(1100);   /* the light fades from the portrait out as the hero focuses in */
      tl.to(f, { v: 1, duration: .7, ease: E.focus, onUpdate: () => HOME.setFocus(f.v) }, .2)
        .fromTo(barrel, { opacity: 0, filter: 'blur(6px)' }, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .6, ease: E.focus }, keepO), .35);
      words.forEach((w, i) => tl.fromTo([w, ink[i], knock[i]].filter(Boolean), { opacity: .14, filter: 'blur(12px)' },
        Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus }, keepO), .5 + i * .09));
      tl.to($$('.hero .ctr'), { '--cr': '50%', duration: .42, ease: E.glass }, .76)
        .fromTo(chrome, { opacity: 0, filter: 'blur(8px)' }, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .48, ease: E.focus, stagger: .06 }, off), .9)
        .to($$('.hero .stop'), { '--sr': '50%', duration: .24, ease: E.glass }, 1.1);
      /* the See-the-work badge follows the subline: it opens from its centre (fade, .9 → 1) */
      if (see) tl.fromTo(see, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .56, ease: E.focus, immediateRender: false, clearProps: 'opacity,transform' }, 1.02);
      tl.call(() => FS.ping($('#hero-stop')), null, 1.2)
        .call(finish, null, 1.2);                        /* §8.1: is-loading lifts at T + 1200; the chrome settles after it */
      L.tl = tl;
      return tl;
    }
    function finish() {
      if (L.done) return; L.done = true;
      clearTimeout(failsafe); cancelAnimationFrame(raf);
      H.mode = 'rest'; HOME.setFocus(1); HOME.renderHero();
      html.classList.remove('is-loading');
      /* the words and barrel whose tweens are done hand their opacity back now (the barrel's was already reset by
         renderHero above); the ones still running clear it themselves on complete */
      $$('.hero-title .w').forEach((w) => { if (!gsap.isTweening(w)) gsap.set(w, { clearProps: 'opacity' }); });
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
    const tw = G().to(H, {
      p: 1, ease: 'none', onUpdate,
      scrollTrigger: { trigger: hero, start: 'top top', end: () => '+=' + Math.round(innerHeight * (mobile() ? .72 : .8)),
        pin: true, scrub: .6, anticipatePin: 1, invalidateOnRefresh: true },
    });
    FS.on('fonts', () => HOME.renderHero());
    /* leaving the hero: once released, the headline, subline and CTA pull out of focus before they reach the header,
       so nothing ever slides under the mark (the same focus language as every reveal, run backwards) */
    const outs = [
      { els: $$('.hero-title'), probe: $('h1.hero-title') },
      { els: $$('.hero-sub'), probe: $('.hero-sub') },
      { els: [$('.hero-eyebrow')], probe: $('.hero-eyebrow') },
    ].filter((o) => o.probe);
    let raf = 0;
    const exit = () => {
      raf = 0;
      const st = tw.scrollTrigger, released = st && scrollY > st.end + 1 && HOME.loader && HOME.loader.done;
      const hh = parseFloat(getComputedStyle(html).getPropertyValue('--header-h')) || 88;
      outs.forEach((o) => {
        const e = released ? 1 - E.smoothstep(hh - 16, hh + 190, o.probe.getBoundingClientRect().top) : 0;
        const f = e < .002 ? '' : `blur(${(10 * e).toFixed(2)}px)`, op = e < .002 ? '' : (1 - e).toFixed(3);
        if (o.f === f && o.op === op) return; o.f = f; o.op = op;
        o.els.forEach((el) => { el.style.filter = f; el.style.opacity = op; });
      });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(exit); }, { passive: true });
    HOME.heroExit = exit;
  };

  /* ── 4 · manifesto: pull focus ──────────────────────────────────────────── */
  S.manifesto = function () {
    const sec = $('#vision'), words = $$('.manifesto .w');
    if (!live || !sec || !words.length) return;
    const lines = $$('.manifesto .m-line').map((l) => { const ws = $$('.w', l); return { last: words.indexOf(ws[ws.length - 1]), stop: $('.stop', l), lit: false }; });
    lines.forEach((l) => { l.stop.style.setProperty('--sr', '0%'); FS.lit.track(l.stop); });
    let raw = 0, prog = 0, raf = 0, last = 0, visible = false;
    const cur = words.map(() => ({ b: -1, o: -1 }));
    const m = mobile();
    HOME.visionST = ST().create({
      trigger: sec, start: m ? 'top 80%' : 'center center', end: m ? 'bottom 60%' : () => '+=' + Math.round(innerHeight * 1.4),
      pin: !m, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { raw = s.progress; loop(); }, onRefresh: (s) => { raw = s.progress; loop(); },
    });
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      prog = FS.smooth(prog, raw, dt, .1);
      const cp = FS.cursor.enabled && html.classList.contains('cursor-on') ? FS.cursor.pos : null;
      let moving = Math.abs(prog - raw) > .0005;
      words.forEach((w, i) => {
        const win = clamp((prog - i * .082) / .18, 0, 1);
        let b = 12 * (1 - E.focus(win));
        if (cp && b > 0) {
          const r = w.getBoundingClientRect();
          const d = Math.hypot(cp.x - (r.left + r.width / 2), cp.y - (r.top + r.height / 2));
          b = Math.min(b, 12 * E.smoothstep(40, 170, d));
        }
        const o = .14 + .86 * (1 - b / 12);
        const c = cur[i];
        if (Math.abs(c.b - b) > .04) { c.b = b; w.style.filter = b < .05 ? 'none' : `blur(${b.toFixed(2)}px)`; }
        if (Math.abs(c.o - o) > .004) { c.o = o; w.style.opacity = o >= .999 ? '' : o.toFixed(3); }
      });
      lines.forEach((l) => {
        const b = cur[l.last].b;
        if (!l.lit && b < .5) { l.lit = true; l.stop.style.setProperty('--sr', '50%'); FS.ping(l.stop); }
        else if (l.lit && b > 2) { l.lit = false; l.stop.style.setProperty('--sr', '0%'); }
      });
      if (visible && (moving || cp)) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(sec);
    addEventListener('pointermove', () => { if (visible) loop(); }, { passive: true });
    loop();
  };

  /* ── 5 · irises: exactly four, each opening from a live stop or circle ─── */
  function splitWords(el) {
    if (!el || el.__words) return (el && el.__words) || [];
    const out = [];
    const walk = (n) => {
      Array.from(n.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p)); else { const s = document.createElement('span'); s.className = 'ln-w'; s.textContent = p; frag.appendChild(s); out.push(s); } });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el); el.__words = out; return out;
  }
  function lineGroups(words) {
    const g = []; let top = null;
    words.forEach((w) => { const t = w.getBoundingClientRect().top; if (top === null || Math.abs(t - top) > 6) { g.push([]); top = t; } g[g.length - 1].push(w); });
    return g;
  }
  S.irises = function () {
    const defs = [
      { el: $('.bio-card'), from: $('#vision-stop'), bio: true },
      { el: $('#work'), from: $('#clients-stop') },
      { el: $('#companies'), from: $('#svc-idx-4') },
      { el: $('#footer'), from: $('#croove-punch'), field: true },
    ].filter((d) => d.el && d.from);
    if (!live) return;
    /* bio band: focus-reveal line by line from iris p .6. The band is a viewport tall, so each line waits until it is
       on screen (top above 90% of the viewport) instead of resolving below the fold; the eye pulls focus (soft to
       sharp) with its own line. Two columns, two staggers: the bio from 0, the stub from 2. */
    const card = $('.bio-card'), bioEye = card && $('.bio-eye', card);
    let bioCols = null, bioArmed = false, bioRaf = 0;
    if (card) {
      const body = [$('.bio-body .label', card), ...splitWords($('.bio-h', card)), ...splitWords($('.bio-text', card))];
      const stub = [bioEye, ...splitWords($('.bio-now', card)), ...$$('.bio-facts > div', card), $('.pill', card)];
      bioCols = [body.filter(Boolean), stub.filter(Boolean)];
      G().set(bioCols.flat().filter((el) => el !== bioEye), { opacity: 0, filter: 'blur(8px)' });
      card.classList.add('is-soft');                     /* the small portrait pulls focus with the copy */
    }
    const bioScroll = () => { if (!bioRaf) bioRaf = requestAnimationFrame(revealBio); };
    function revealBio() {
      bioRaf = 0;
      if (!bioArmed || !bioCols) return;
      const edge = innerHeight * .9;
      bioCols = bioCols.map((col, ci) => {
        const due = col.filter((el) => el.getBoundingClientRect().top < edge);
        if (!due.length) return col;
        let k = ci * 2;
        lineGroups(due).forEach((g) => {
          const delay = k++ * .06;
          if (g.includes(bioEye)) { setTimeout(() => card.classList.remove('is-soft'), 120 + delay * 1000); g = g.filter((el) => el !== bioEye); }
          if (g.length) G().to(g, { opacity: 1, filter: 'blur(0px)', duration: .56, delay, ease: E.focus, clearProps: 'filter,opacity' });
        });
        return col.filter((el) => !due.includes(el));
      });
      if (!bioCols.some((c) => c.length)) { bioCols = null; removeEventListener('scroll', bioScroll); }
    }
    function armBio() {
      if (bioArmed || !bioCols) return; bioArmed = true;
      addEventListener('scroll', bioScroll, { passive: true });
      revealBio();
    }
    /* every iris is a whole circle centred on its stop: the lit rim runs inside the clip (so it follows the circle
       exactly), and a hairline halo draws the rest of that circle over the ground it opens from, so the cap reads as
       an aperture opening from the stop, not as a shape hanging under the previous section */
    defs.forEach((d) => {
      d.rim = document.createElement('i'); d.rim.className = 'iris-rim'; d.rim.setAttribute('aria-hidden', 'true');
      if (d.field) d.rim.classList.add('iris-rim--field');
      d.el.appendChild(d.rim);
      d.halo = document.createElement('i'); d.halo.className = 'iris-halo'; d.halo.setAttribute('aria-hidden', 'true');
      if (d.from.closest('.on-ice')) d.halo.classList.add('iris-halo--ice');
      document.body.appendChild(d.halo);
    });
    defs.forEach((d) => {
      let pinged = false, on = false;
      const halo = (vis, x, y, r, p) => {
        if (!vis) { if (on) { on = false; d.el.classList.remove('is-iris'); d.halo.style.opacity = '0'; } return; }
        if (!on) { on = true; d.el.classList.add('is-iris'); }
        d.halo.style.width = d.halo.style.height = (2 * r).toFixed(1) + 'px';
        d.halo.style.transform = `translate(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px)`;
        /* strongest while the circle is small and close to its stop, gone as the ground is fully covered */
        d.halo.style.opacity = (E.smoothstep(.02, .08, p) * (1 - E.smoothstep(.55, .95, p))).toFixed(3);
      };
      const apply = (p) => {
        const b = d.el.getBoundingClientRect();
        const o = d.from.classList.contains('stop') ? FS.iris.stopCentre(d.from) : FS.iris.circleCentre(d.from);
        const ox = o.x - b.left, oy = o.y - b.top;
        let r = 0;
        if (p >= 1) {
          if (d.el.style.clipPath) d.el.style.clipPath = '';
          if (d.field) { HOME.footerClip = null; if (FS.field.mode === 'full') FS.field.setClip(null); }
        } else {
          /* the stop pings first; from p .02 the circle appears as a proper cap (d0 + 24), never a hairline chord */
          const d0 = Math.max(0, -oy);
          const rMax = Math.hypot(Math.max(Math.abs(ox), Math.abs(b.width - ox)), b.height - oy) + 2;
          r = p < .02 ? 0 : lerp(d0 + 24, rMax, E.iris((p - .02) / .98));
          d.el.style.clipPath = `circle(${r.toFixed(1)}px at ${ox.toFixed(1)}px ${oy.toFixed(1)}px)`;
          d.el.style.setProperty('--ir', r.toFixed(1) + 'px');
          d.el.style.setProperty('--iox', ox.toFixed(1) + 'px'); d.el.style.setProperty('--ioy', oy.toFixed(1) + 'px');
          if (d.field) { HOME.footerClip = { x: o.x, y: o.y, r }; if (FS.field.mode === 'full') FS.field.setClip(HOME.footerClip); }
        }
        halo(p > .02 && p < 1 && r > 0, o.x, o.y, r, p);
        if (p > .005 && !pinged) { pinged = true; FS.ping(d.from); }
        if (p <= 0) pinged = false;
        if (d.el === card && p >= .6) armBio();                    /* §7: the copy focus-reveals from iris p .6 */
      };
      /* desktop: the bio card's iris starts as the manifesto pin releases, when the card sits ~100px under "happens."
         (during the pin the card rises invisibly under the pinned lines, so an earlier start would open far from its stop) */
      const start = d.bio && HOME.visionST && !mobile() ? () => HOME.visionST.end + 1 : 'top 92%';
      /* the bio card finishes opening before its copy is read (top 45%), the section irises keep the spec's 22% */
      const st = ST().create({ trigger: d.el, start, end: d.bio ? 'top 45%' : 'top 22%', onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
      d.apply = () => apply(st.progress);
      apply(st.progress);
    });
    /* the footer's field clip must be re-applied whenever the field comes back to full mode */
    FS.on('menu:close', () => defs.forEach((d) => d.apply && d.apply()));
  };

  /* ── 6 · work: rack focus, breathing halos, the stop travels ───────────── */
  S.work = function () {
    const sec = $('#work'), cards = $$('.work-card');
    if (!sec || !cards.length) return;
    let raf = 0, visible = false;
    /* rack focus, written only when something scrolls: out of focus the device is "stopped down" to the circle of
       light behind it (a circular window on the soft, moon-tinted layer); as the card reaches the centre band the
       window opens to the full rect and the true-colour device breaks out of its circle */
    function frame() {
      raf = 0;
      const vh = innerHeight;
      cards.forEach((c) => {
        if (c.hidden) return;                              /* filtered out: no box to focus */
        const r = c.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - vh / 2) / vh;
        const u = E.smoothstep(.38, .62, dist);
        c.style.setProperty('--soft', (.7 * u).toFixed(3));
        c.style.setProperty('--rack-scale', (1 + .04 * u).toFixed(4));
        c.style.setProperty('--halo', (1 - .4 * u).toFixed(3));
        const w = c.offsetWidth, h = c.__mediaH || (c.__mediaH = ($('.wc-media', c) || c).offsetHeight);
        const open = c.classList.contains('is-hover') || u < .002;
        const rOpen = Math.hypot(w / 2, h / 2) + 2;
        const win = `circle(${(open ? rOpen : lerp(rOpen, .4 * h, E.iris(u))).toFixed(1)}px at 50% 50%)`;
        if (c.__win !== win) { c.__win = win; c.style.setProperty('--win', win); }
        if (c.__touch) {                                   /* touch: the stop travels in the centre band, and back out */
          if (!c.__in && dist < .3) { c.__in = true; c.__touch.enter(); }
          else if (c.__in && dist > .4) { c.__in = false; c.__touch.leave(); }
        }
      });
    }
    const kick = () => { if (visible && !raf) raf = requestAnimationFrame(frame); };
    if (live) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { rootMargin: '120px' }).observe(sec);
      addEventListener('scroll', kick, { passive: true });
      addEventListener('resize', () => { cards.forEach((c) => (c.__mediaH = 0)); kick(); });
      HOME.workRack = kick;
    }

    /* the stop travels: headline period → up to the tear → along it → into the glass arrow, which lights */
    const ink = getComputedStyle(html).getPropertyValue('--ink').trim() || '#15111F';
    cards.forEach((card) => {
      const stop = $('.wc-title .stop', card), btn = $('.wc-btn', card);
      if (!stop) return;
      /* card.__off: a filter takes the card out of the layout, so whatever hover state it had resets (HOME.work.place) */
      if (!btn) return;                                     /* round 7: every card has its button (Bandcamp too) */
      if (!window.gsap || F.reduced) {                      /* no choreography: the button simply lights */
        const light = $('.b-light', btn);
        const on = (v) => { card.classList.toggle('is-hover', v); light.style.setProperty('--bl', v ? '50%' : '0%'); $('.arr', btn).style.color = v ? ink : ''; };
        card.__off = () => on(false);
        card.addEventListener('pointerenter', () => on(true)); card.addEventListener('pointerleave', () => on(false));
        card.addEventListener('focusin', () => on(true)); card.addEventListener('focusout', () => on(false));
        return;
      }
      const light = $('.b-light', btn), arr = $('.arr', btn);
      const trav = document.createElement('i');
      trav.className = 'wc-trav lit'; trav.setAttribute('data-lit', 'track'); trav.setAttribute('aria-hidden', 'true');
      card.appendChild(trav);
      FS.lit.track(trav);
      let tl = null;
      function build() {
        const cb = card.getBoundingClientRect(), k = card.offsetWidth ? cb.width / card.offsetWidth : 1;
        const s = FS.iris.stopCentre(stop), bb = btn.getBoundingClientRect();
        const sx = (s.x - cb.left) / k, sy = (s.y - cb.top) / k, sr = s.r / k;
        const bx = (bb.left + bb.width / 2 - cb.left) / k, by = (bb.top + bb.height / 2 - cb.top) / k;
        trav.style.width = trav.style.height = (2 * sr).toFixed(2) + 'px';
        const sync = () => {
          FS.lit.kick();
          const on = tl.time() > .0005;
          if (stop.classList.contains('is-unlit') !== on) stop.classList.toggle('is-unlit', on);
          const v = on ? 'visible' : 'hidden'; if (trav.style.visibility !== v) trav.style.visibility = v;
        };
        tl = G().timeline({ paused: true, onUpdate: sync, onReverseComplete: sync });
        tl.fromTo(trav, { x: sx - sr, y: sy - sr, opacity: 1 }, { y: by - sr, duration: .16, ease: E.focus, immediateRender: true }, 0)
          .to(trav, { x: bx - sr, duration: .36, ease: E.focus }, .16)
          .fromTo(light, { '--bl': '0%' }, { '--bl': '50%', duration: .36, ease: E.glass, immediateRender: false }, .5)
          .to(arr, { color: ink, duration: .24, ease: E.focus }, .5)
          .to(trav, { opacity: 0, duration: .14, ease: 'none' }, .56);
      }
      const enter = () => {
        if (card.hidden || card.inert) return;               /* filtered out, or on its way out */
        card.classList.add('is-hover');
        if (HOME.workRack) HOME.workRack();
        if (!tl || (tl.progress() === 0 && !tl.isActive())) { if (tl) tl.kill(); build(); }
        tl.timeScale(1).play();
      };
      const leave = () => { card.classList.remove('is-hover'); if (HOME.workRack) HOME.workRack(); if (tl) tl.timeScale(1.15).reverse(); };
      /* out of the layout: the travel snaps home and is dropped, so the next hover rebuilds it from the new geometry */
      card.__off = () => { card.classList.remove('is-hover'); card.__in = false; if (tl) { tl.pause().progress(0); tl.kill(); tl = null; } };
      if (!F.touch) {
        card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') enter(); });
        card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') leave(); });
      }
      card.addEventListener('focusin', enter);
      card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) leave(); });
      /* touch: the travel plays in the centre band and reverses as the card leaves it, so the sentence ends in a period */
      if (F.touch && live) card.__touch = { enter, leave };
    });

    /* the filter (round 4: hide, not grey). Leaving cards defocus out (blur + fade, 240ms); then the layout changes
       once (HOME.work.place) and the kept cards FLIP from where they were to their new places (560ms, the focus
       curve) while entering ones focus in (blur → sharp, staggered), and each title stop pings as its card lands.
       The grid's height rides the same curve, so the sections below glide rather than jump, and ScrollTrigger
       refreshes once it has settled. A click mid-way takes over from what is on screen: the running tweens are killed
       where they are and the next run measures from there. Mobile has one column: no FLIP, a moved card focuses in
       at its new place. Reduced motion and ?static=1 never get here (js/home.js places at once). */
    const W = HOME.work, grid = $('.work-grid', sec);
    if (!live || !W || !grid) return;
    const retarget = () => { if (FS.cursor && FS.cursor.retarget) FS.cursor.retarget(); };
    const tick = () => { FS.lit.kick(); kick(); retarget(); };          /* lights, rack focus and loupe follow the cards */
    let run = null;
    function swap(me, list) {
      if (run !== me) return;
      const m = mobile(), g0 = grid.getBoundingClientRect(), first = new Map(), was = new Map();
      list.forEach((c) => {
        if (c.hidden) return;
        const r = c.getBoundingClientRect();
        first.set(c, [r.left - g0.left, r.top - g0.top]);
        was.set(c, c.style.opacity !== '' || c.style.filter !== '');   /* caught on its way out by this click */
      });
      G().set(cards, { clearProps: 'transform' });
      grid.style.height = '';
      W.place(list);
      cards.forEach((c) => { if (c.hidden) G().set(c, { clearProps: 'opacity,filter' }); });
      const g1 = grid.getBoundingClientRect(), h0 = g0.height, h1 = g1.height;
      const tl = G().timeline({ onUpdate: tick, onComplete: () => done(me) });
      me.tls.push(tl);
      if (Math.abs(h1 - h0) > .5) { grid.style.height = h0.toFixed(2) + 'px'; tl.to(grid, { height: h1, duration: .56, ease: E.focus }, 0); }
      let k = 0;
      const reveal = (c) => tl.fromTo(c, { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', duration: .5, ease: E.focus }, .14 + .06 * k++);
      list.forEach((c, i) => {
        const f = first.get(c), r = c.getBoundingClientRect();
        if (!f) reveal(c);                                                  /* entering */
        else {
          const dx = f[0] - (r.left - g1.left), dy = f[1] - (r.top - g1.top), moved = Math.abs(dx) > .5 || Math.abs(dy) > .5;
          if (moved && m) reveal(c);                                        /* one column: it re-appears in its place */
          else {
            if (moved) tl.fromTo(c, { x: dx, y: dy }, { x: 0, y: 0, duration: .56, ease: E.focus }, 0);
            if (was.get(c)) tl.to(c, { opacity: 1, filter: 'blur(0px)', duration: .32, ease: E.focus }, 0);
          }
        }
        const s = $('.wc-title .stop', c);
        if (s) tl.call(() => FS.ping(s), null, .36 + .06 * i);
      });
      tick();
    }
    function done(me) {
      if (run !== me) return;
      run = null;
      grid.style.height = '';
      G().set(cards, { clearProps: 'transform,opacity,filter' });
      ST().refresh();                          /* services, companies and footer pins, scrubs and irises re-measure */
      W.hold(me.y0);
      cards.forEach((c) => (c.__mediaH = 0));
      FS.lit.refresh(); kick(); retarget();
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
      tl.to(leaving, { opacity: 0, filter: 'blur(12px)', duration: .24, ease: 'power1.in' }, 0)
        .call(() => swap(me, list), null, .24);
    };
    W.stop = () => {
      if (!run) return;
      run.tls.forEach((t) => t.kill()); run = null;
      G().set(cards, { clearProps: 'transform,opacity,filter' });
      grid.style.height = '';
    };
  };

  /* ── 7 · services: the panel copy focuses in as the row opens ──────────── */
  S.services = function () {
    if (!live) return;
    $$('.svc').forEach((li) => {
      const head = $('.svc-head', li), parts = $$('.svc-body > p, .svc-tags .tag', li);
      head.addEventListener('click', () => {
        if (!li.classList.contains('is-open')) return;
        G().fromTo(parts, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: .48, delay: .14, stagger: .04, ease: E.focus, overwrite: true, clearProps: 'filter,opacity' });
      });
    });
  };

  /* ── 8 · companies: count, clarity and punch on one timeline ───────────── */
  S.companies = function () {
    const cards = $$('.co-card');
    if (!live || !cards.length) return;
    const run = (c, delay) => {
      if (c.__ran) return; c.__ran = true;
      const parts = $$('.co-year, .co-tag, .co-body, .co-out', c), val = $('.co-val', c), punch = $('.co-punch', c);
      const v = +c.dataset.value || 0, o = { e: 0 };
      G().to(o, {
        e: 1, duration: 1.2, delay, ease: E.focus,
        onUpdate() {
          const e = o.e;
          parts.forEach((p) => { p.style.filter = e > .995 ? '' : `blur(${(8 * (1 - e)).toFixed(2)}px)`; p.style.opacity = (.3 + .7 * e).toFixed(3); });
          if (val) val.textContent = String(Math.round(v * e));
        },
        onComplete() {
          parts.forEach((p) => { p.style.filter = ''; p.style.opacity = ''; });
          if (val) val.textContent = String(v);
          if (punch && !punch.classList.contains('is-unlit')) {          /* exactly as the number lands */
            G().to(punch, { '--pr': '50%', duration: .18, ease: E.glass });
            FS.ping(punch);
          }
        },
      });
    };
    cards.forEach((c) => {
      $$('.co-year, .co-tag, .co-body, .co-out', c).forEach((p) => { p.style.filter = 'blur(8px)'; p.style.opacity = '.3'; });
      const val = $('.co-val', c); if (val) val.textContent = '0';
      const punch = $('.co-punch', c); if (punch && !punch.classList.contains('is-unlit')) punch.style.setProperty('--pr', '0%');
    });
    ST().batch(cards, { start: 'top 85%', once: true, onEnter: (batch) => batch.forEach((c, i) => run(c, i * .09)) });
  };

  /* ── 9 · footer: the final full stop, the ring badge, the marquee ──────── */
  S.footer = function () {
    const ft = $('#footer'), wrap = $('.disc-wrap'), disc = $('.disc'), track = $('.ft-track');
    if (!ft) return;
    let visible = false, raf = 0, last = 0, off = 0, mul = 1;
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
      let again = !sp.settled();
      if (track && !F.static && !F.reduced && visible) {
        const half = track.scrollWidth / 2;
        const v = window.lenis && window.lenis.velocity ? Math.abs(window.lenis.velocity) : 0;
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
  };

  /* ── 10 · menu: links focus-reveal, the card irises from its notch, the shader lens ── */
  S.menu = function () {
    const menu = $('#menu'), links = $$('.menu-link'), card = $('.menu-card');
    if (!menu || !links.length) return;
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

    /* hover / focus: the shader lens springs out of the stop; a glass rim opens under the text */
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
      const c = FS.iris.stopCentre(s), b = l.getBoundingClientRect(), fs = parseFloat(getComputedStyle(l).fontSize);
      const ring = $('.m-ring', l);
      ring.style.setProperty('--rx', (c.x - b.left).toFixed(1) + 'px'); ring.style.setProperty('--ry', (c.y - b.top).toFixed(1) + 'px');
      if (!lensOn || lr.value < 1) { lx.set(c.x); ly.set(c.y); lr.set(.095 * fs); }
      lensOn = true;
      lx.target = c.x; ly.target = c.y; lr.target = .65 * fs;
      if (F.reduced) { lx.set(c.x); ly.set(c.y); lr.set(.65 * fs); }
      FS.lit.kick();
      loop();
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
      const s = $('.stop', l);
      if (s) lr.target = .095 * parseFloat(getComputedStyle(l).fontSize);
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
  };

  /* ── 11 · header: the brand disc pings on hover and focus; section detents ping their stop ── */
  S.header = function () {
    const brand = $('.site-header .brand'), dot = brand && $('.brand-dot', brand);
    if (brand && dot) {
      let last = 0;
      const ping = () => { const t = performance.now(); if (t - last < 700) return; last = t; FS.ping(dot); };
      brand.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') ping(); });
      brand.addEventListener('focus', () => { if (brand.matches(':focus-visible')) ping(); });
    }
    if (!live) return;
    const pinged = new Set();
    FS.on('readout', (n) => {
      if (!HOME.loader || !HOME.loader.done || pinged.has(n)) return;
      const sec = document.querySelector(`[data-f="${n}"]`);
      const s = sec && $('.h2 .stop', sec);
      if (s) { pinged.add(n); FS.ping(s); }
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
