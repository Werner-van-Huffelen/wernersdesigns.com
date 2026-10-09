/* Full Stop · system core
 * window.FS = { flags, ease, spring, smooth, drift, lit, ping, ring, field, cursor, readout, iris, menu, header, reveal }
 * Every light on the page comes through a circle. Every reveal opens from a circle's centre.
 * Classic script, no modules (file:// safe). Stage 2 choreography hooks in through FS.on / js/home.js.
 */
(function () {
  'use strict';
  const FS = (window.FS = window.FS || {});
  const html = document.documentElement;
  const qs = new URLSearchParams(location.search);
  const mq = (s) => { try { return matchMedia(s).matches; } catch (e) { return false; } };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  FS.util = { clamp, lerp, mq };

  /* ── flags ───────────────────────────────────────────────────────────── */
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const F = (FS.flags = {
    static: qs.has('static'),
    menu: qs.has('menu') || location.hash === '#menu',
    nogl: qs.has('nogl'),
    reduced: mq('(prefers-reduced-motion: reduce)'),
    touch: mq('(pointer: coarse)') || ios,
    fine: mq('(pointer: fine)'),
    file: location.protocol === 'file:',
    ios,
    nogsap: typeof window.gsap === 'undefined',
    mobile: mq('(max-width: 767px)'),
  });
  F.still = F.static || F.reduced;             // no drift, no live motion
  html.classList.toggle('is-static', F.static);
  html.classList.toggle('is-reduced', F.reduced);
  html.classList.toggle('is-touch', F.touch);
  html.classList.toggle('no-gsap', F.nogsap);
  html.classList.remove('no-js');

  /* ── the scheme (round 4). index.html's head script picks it before the first paint (html[data-theme]) and
     css/system.css §1b holds its colours; the night and the ice never change. FS.theme.src() maps a light-tinted asset
     to its assets/t/<id>/ copy (tools/themes.py), FS.theme.rgb() reads a colour token as 0–1 floats for the shaders. */
  const TINTED = /(^|\/)assets\/((portrait-moon(-soft)?|[a-z][a-z-]*-soft-moon)\.webp|aurora-still\.webp)$/;
  FS.theme = {
    id: html.dataset.theme || 'violet',
    /* round 4b (Werner: "I really like the black and white image, change all the images to black and white"): the
       portrait is the mono scheme's in every scheme; the light around it keeps the scheme's colour */
    src: (p) => {
      if (!p || !TINTED.test(p)) return p;
      if (/portrait-moon(-soft)?\.webp$/.test(p)) return p.replace(/assets\/([^/]+)$/, 'assets/t/mono/$1');
      return FS.theme.id === 'violet' ? p : p.replace(/assets\/([^/]+)$/, 'assets/t/' + FS.theme.id + '/$1');
    },
    rgb(name) {
      const m = /#([0-9a-f]{6})/i.exec(getComputedStyle(html).getPropertyValue('--' + name));
      const n = m ? parseInt(m[1], 16) : 0x7C6BFF;
      return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    },
    hex: (name) => { const m = /#([0-9a-f]{6})/i.exec(getComputedStyle(html).getPropertyValue('--' + name)); return m ? '#' + m[1] : '#7C6BFF'; },
    /* every tinted <img src> and lens data-src (the hero's own portrait is already swapped inline, under the hero) */
    retint(root) {
      (root || document).querySelectorAll('img[src], [data-src]').forEach((el) => {
        ['src', 'data-src'].forEach((a) => { const v = el.getAttribute(a), t = FS.theme.src(v); if (v && t !== v) el.setAttribute(a, t); });
      });
    },
  };
  FS.theme.retint();

  /* tiny event bus for stage-2 hooks */
  const bus = {};
  FS.on = (n, fn) => { (bus[n] = bus[n] || []).push(fn); };
  FS.emit = (n, d) => { (bus[n] || []).forEach((fn) => { try { fn(d); } catch (e) { console.warn(e); } }); };

  /* ── easing (cubic-bezier evaluator, mirrors the CSS tokens) ─────────── */
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) break; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      return sy(clamp(t, 0, 1));
    };
  }
  FS.ease = {
    bezier,
    iris: bezier(.65, 0, .15, 1),
    irisClose: bezier(.85, 0, .35, 1),
    focus: bezier(.22, 1, .36, 1),
    smoothstep: (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
  };
  /* --ease-glass: linear(0,.36 8%,.82 18%,1.04 30%,1.01 45%,1), evaluated piecewise so GSAP and CSS agree */
  const GLASS = [[0, 0], [.08, .36], [.18, .82], [.30, 1.04], [.45, 1.01], [1, 1]];
  FS.ease.glass = (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    for (let i = 1; i < GLASS.length; i++) if (x <= GLASS[i][0]) { const a = GLASS[i - 1], b = GLASS[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); }
    return 1;
  };

  /* ── springs: interruptible, always start from the current value ─────── */
  FS.spring = function (opts) {
    const o = Object.assign({ value: 0, response: .35, damping: .85 }, opts);
    const s = { value: o.value, target: o.value, v: 0 };
    const k = Math.pow((2 * Math.PI) / o.response, 2), c = (4 * Math.PI * o.damping) / o.response;
    s.step = (dt) => {
      dt = Math.min(dt, 1 / 20);
      const n = Math.ceil(dt / (1 / 240)), h = dt / n;
      for (let i = 0; i < n; i++) { const a = -k * (s.value - s.target) - c * s.v; s.v += a * h; s.value += s.v * h; }
      if (Math.abs(s.value - s.target) < 1e-4 && Math.abs(s.v) < 1e-3) { s.value = s.target; s.v = 0; }
      return s.value;
    };
    s.set = (v) => { s.value = s.target = v; s.v = 0; };
    s.settled = () => s.value === s.target && s.v === 0;
    return s;
  };
  FS.smooth = (x, t, dt, tau) => x + (t - x) * (1 - Math.exp(-dt / tau));

  /* ── drift: the sky's offset behind every light (percent of free space) ─ */
  /* 2026-10-08 motion cut: the sky no longer drifts (a 72 s loop through six waypoints on every light). Every light
     holds its resting slice, drift 0, as ?static=1 always did; FS.driftPx stays the one source, so the handoff's cover
     and the tracked lights still agree with the fixed ones */
  FS.drift = function () { return { x: 0, y: 0 }; };
  /* drift in px for a 130vw × 130vh image (free space is negative) */
  FS.driftPx = function (tMs) {
    const d = FS.drift(tMs), w = innerWidth, h = innerHeight;
    return { x: (d.x / 100) * (w - 1.3 * w), y: (d.y / 100) * (h - 1.3 * h) };
  };

  /* ── light: fixed mode (background-attachment: fixed) or track mode ──── */
  const LIT_SEL = '.lit, .stop, .ctr';
  FS.lit = (function () {
    const tracked = new Set(), visible = new Set();
    let io = null, raf = 0, allTrack = F.touch || F.ios, lastAct = performance.now();
    if (allTrack) html.classList.add('lit-track');
    /* 2026-10-08 motion cut: a fixed-mode light no longer runs its own 72 s drift (WAAPI on background-position). The
       CSS alone holds it on the sky's resting slice, so there is nothing to start */
    function fixed() {}
    function track(el) {
      if (tracked.has(el)) return;
      el.setAttribute('data-lit', 'track');
      tracked.add(el);
      /* a light that comes into view with nothing scrolling (the menu opening, an accordion panel) gets one pass: it was
         last written where it sat hidden, and the 20 fps idle pass that used to catch it is gone (2026-10-08 motion cut) */
      if (!io && 'IntersectionObserver' in window) {
        io = new IntersectionObserver((es) => {
          let entered = false;
          es.forEach((e) => { if (e.isIntersecting) { visible.add(e.target); entered = true; } else visible.delete(e.target); });
          if (entered) loop();
        }, { rootMargin: '64px' });
      }
      io ? io.observe(el) : visible.add(el);
      write(el); loop();
    }
    function write(el, dp) {
      const r = el.getBoundingClientRect();
      dp = dp || FS.driftPx(performance.now());
      el.style.setProperty('--lx', (-r.left + dp.x).toFixed(1) + 'px');
      el.style.setProperty('--ly', (-r.top + dp.y).toFixed(1) + 'px');
    }
    /* a tracked light only has to follow its own box: every frame while something scrolls or moves (and 400ms after),
       one pass when it comes into view (track()), nothing at rest (2026-10-08 motion cut: the 20 fps idle pass went with
       the drift) */
    function frame() {
      raf = 0;
      if (!visible.size) return;
      const now = performance.now(), dp = FS.driftPx(now), cur = html.classList.contains('cursor-on');
      visible.forEach((el) => { if (el.__cursor && !cur) return; write(el, dp); });
      if (now - lastAct < 400) loop();
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    function kick() { lastAct = performance.now(); loop(); }
    function scan(root) {
      (root || document).querySelectorAll(LIT_SEL).forEach((el) => {
        if (allTrack || el.getAttribute('data-lit') === 'track' || el.closest('[data-lit=track]')) track(el);
        else fixed(el);
      });
    }
    addEventListener('scroll', kick, { passive: true });
    addEventListener('pointermove', kick, { passive: true });
    addEventListener('resize', () => tracked.forEach((el) => write(el)));
    /* the page can still settle under a light that nothing scrolls (the webfonts, the load event): one more pass each */
    addEventListener('load', () => tracked.forEach((el) => write(el)));
    FS.on('fonts', () => tracked.forEach((el) => write(el)));
    return { scan, track, fixed, kick, refresh: () => tracked.forEach((el) => write(el)), get allTrack() { return allTrack; } };
  })();

  /* ── ping: the only use of scale on the page ─────────────────────────── */
  FS.ping = function (el, opts) {
    if (!el || F.reduced) return;
    const o = Object.assign({ size: null }, opts);
    const i = document.createElement('i');
    i.className = 'ping';
    i.setAttribute('aria-hidden', 'true');
    /* centre it on the disc: a stop's ::before (font-accurate), or the element's own circle */
    const b = el.getBoundingClientRect();
    const c = el.classList.contains('stop') ? FS.iris.stopCentre(el) : FS.iris.circleCentre(el);
    i.style.setProperty('--pcx', (c.x - b.left).toFixed(1) + 'px');
    i.style.setProperty('--pcy', (c.y - b.top).toFixed(1) + 'px');
    i.style.setProperty('--pd', (o.size || c.r * 2).toFixed(1) + 'px');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(i);
    const a = i.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: .9 }, { transform: 'translate(-50%,-50%) scale(6)', opacity: 0 }],
      { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' });
    a.onfinish = () => i.remove();
  };

  /* ── ring text: seamless closure, one <text> per glyph ───────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  let measureCtx = null;
  FS.ring = function (svg, text, R, size, opts) {
    const o = Object.assign({ track: .30, font: '"Fragment Mono", "Fragment Mono Fallback", "Courier New", monospace', weight: 400, pad: 4 }, opts);
    if (!svg) return;
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d');
    const chars = Array.from(text.toUpperCase());
    /* size may be a list (e.g. [13, 14]).
       Default: the size whose seamless closure strays least from the base tracking (spread over every glyph).
       opts.flex 'sep': the circle closes in the word spaces (the ones around each ' · ' included), in stages, each
       used up before the next: spaces ±40% → tracking ±.02em → spaces −60%/+45% (mono caps at .28em keep a word gap
       at twice the letter gap even then) → tracking ±.03em → a text still too short pulls the radius in (≤ opts.give,
       12px; it never grows, since its caps are the frame's margins).
       Every size in the list is tried; the one needing the fewest stages wins. Otherwise: the default.
       opts.fit 'fill' (the hero ring and its siblings): the tracking is fixed (opts.track, never adjusted). size is a
       target and opts.range [lo, hi] bounds it; the repeat count n and the size are chosen so every space (word gaps
       and the two around each ' · ') is opts.f0 (.5) of a space cell. The size closes the circle to a tenth of a px and
       the last space-delta makes it exact, so every separator, the seam included, gets the identical gap. */
    const flexAt = chars.map((ch) => (o.flex === 'sep' || o.fit === 'fill') && ch === ' ');
    const nFlex = flexAt.filter(Boolean).length, give = o.give == null ? 12 : o.give;
    const metrics = (sz) => {
      measureCtx.font = `${o.weight} ${sz}px ${o.font}`;
      const aw = sz * .82, ad = chars.map((ch) => (ch === '→' ? aw : measureCtx.measureText(ch).width) + o.track * sz);
      return { size: sz, arrowW: aw, adv: ad, L0: ad.reduce((a, b) => a + b, 0), sp: measureCtx.measureText(' ').width + o.track * sz };
    };
    const byTrack = (m) => {
      const C = 2 * Math.PI * R, nn = Math.max(1, Math.round(C / m.L0)), ex = (C - nn * m.L0) / (nn * chars.length);
      return Object.assign({}, m, { R, n: nn, extra: ex, sepX: 0, cost: 1e6 + Math.abs(ex / m.size) });
    };
    const byFlex = (m) => {
      let best = null;
      const n0 = Math.round(2 * Math.PI * R / m.L0), S = m.sp * nFlex, T = m.size * chars.length;
      const take = (d, lo, hi) => Math.max(lo, Math.min(hi, d));
      for (let nn = Math.max(1, n0 - 1); nn <= n0 + 1; nn++) {
        let d = 2 * Math.PI * R / nn - m.L0;                         /* per repeat: + the text is short, − too long */
        const s1 = take(d, -.4 * S, .4 * S); d -= s1;
        const t1 = take(d, -.02 * T, .02 * T); d -= t1;
        const s2 = take(d, -.2 * S, .05 * S); d -= s2;
        const t2 = take(d, -.01 * T, .01 * T); d -= t2;
        if (d < -1e-6) continue;                     /* text still longer than the circle: the radius may not grow */
        const r = R - d * nn / (2 * Math.PI);        /* text still shorter: the circle shrinks onto it */
        if (R - r > give) continue;
        const sx = s1 + s2, tx = t1 + t2;
        const cost = (R - r) * 1e3 + (t2 ? 300 : 0) + (s2 ? 100 : 0) + Math.abs(tx / T) * 1e3 + Math.abs(sx / S);
        if (!best || cost < best.cost) best = Object.assign({}, m, { R: r, n: nn, extra: tx / chars.length, sepX: sx / nFlex, cost });
      }
      return best;
    };
    const byFill = () => {
      const C = 2 * Math.PI * R, m1 = metrics(100), target = [].concat(size)[0];
      const A = (m1.L0 - m1.sp * nFlex) / 100, Sp = m1.sp / 100, f0 = o.f0 == null ? .5 : o.f0;   /* per px of size */
      /* opts.n (the See-the-work badge): the size is exact and the repeat count fixed, so the radius is solved instead:
         R = n · (text at f0 spaces) / 2π. Same tracking, same spaces, same closure as the portrait ring. */
      if (o.n) {
        const m = metrics(Math.round(target * 10) / 10), L = m.L0 - nFlex * m.sp * (1 - f0);
        return Object.assign({}, m, { R: o.n * L / (2 * Math.PI), n: o.n, cost: 0, extra: 0, sepX: nFlex ? -(1 - f0) * m.sp : 0 });
      }
      const lo = o.range ? o.range[0] : target * .92, hi = o.range ? o.range[1] : target * 1.1;
      let pick = null;
      for (let nn = 1; nn <= Math.max(1, Math.ceil(C / (lo * A))); nn++) {
        const s0 = C / (nn * (A + nFlex * Sp * f0)), sc = Math.max(lo, Math.min(hi, s0));
        const cost = Math.abs(sc - s0) * 100 + Math.abs(sc - target);   /* stay in range first, then near the target */
        if (!pick || cost < pick.cost) pick = { n: nn, s: sc, cost };
      }
      const m = metrics(Math.round(pick.s * 10) / 10);
      return Object.assign({}, m, { R, n: pick.n, cost: 0,
        extra: nFlex ? 0 : (C / pick.n - m.L0) / chars.length, sepX: nFlex ? (C / pick.n - m.L0) / nFlex : 0 });
    };
    const fits = o.fit === 'fill' ? [byFill()] : [].concat(size).map(metrics).map((m) => (nFlex && byFlex(m)) || byTrack(m));
    const best = fits.reduce((a, b) => (b.cost < a.cost - 1e-4 ? b : a));
    size = best.size; R = best.R;
    const { arrowW, adv, n, extra, sepX } = best;
    const box = 2 * (R + size + o.pad);
    svg.setAttribute('viewBox', `${-box / 2} ${-box / 2} ${box} ${box}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `<symbol id="${svg.id || 'r'}-arr" viewBox="0 0 24 24"><path d="M3 12h17M14 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></symbol>`;
    svg.appendChild(defs);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('font-family', o.font);
    g.setAttribute('font-size', size);
    g.setAttribute('font-weight', o.weight);
    g.setAttribute('fill', 'currentColor');
    svg.appendChild(g);
    let s = 0;
    for (let k = 0; k < n; k++) {
      chars.forEach((ch, idx) => {
        const w = adv[idx] + extra + (flexAt[idx] ? sepX : 0);
        const theta = (s + w / 2) / R;                    // centre of this glyph's advance
        const deg = (theta * 180) / Math.PI;
        const x = R * Math.sin(theta), y = -R * Math.cos(theta);
        if (ch === '→') {
          const u = document.createElementNS(NS, 'use');
          u.setAttribute('href', `#${svg.id || 'r'}-arr`);
          u.setAttribute('width', arrowW); u.setAttribute('height', arrowW);
          u.setAttribute('x', -arrowW / 2); u.setAttribute('y', -arrowW * .78);
          u.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(3)})`);
          g.appendChild(u);
        } else if (ch !== ' ') {
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('text-anchor', 'middle');
          t.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(3)})`);
          t.textContent = ch;
          g.appendChild(t);
        }
        s += w;
      });
    }
    return { R, n, size, track: o.track + extra / size, sep: sepX, space: best.sp ? (best.sp + sepX) / best.sp : 1 };
  };

  /* ── aurora field: one raw-WebGL canvas, or the still ────────────────── */
  /* 2026-10-08 motion cut: the field's own light is unchanged, but the grain holds still (it re-seeded every frame),
     the pointer no longer bulges it (uPtr) and the menu links' shader lens is gone (uLens) */
  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `precision mediump float;
uniform vec2 uRes;uniform float uT;uniform float uDim;uniform float uSat;uniform float uGrain;
uniform vec3 uBase,uC1,uC2,uC3,uC4;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p*=2.;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;uv.y=1.-uv.y;
 float a=uRes.x/uRes.y;vec2 p=uv*vec2(a,1.);
 vec2 q=p+.35*vec2(fbm(1.3*p+.021*uT)-.45,fbm(1.3*p-.017*uT+7.1)-.45);
 float T=6.2831853;
 vec2 c1=vec2(.30*a+.18*a*sin(T*uT/55.),.35+.12*cos(T*uT/55.));
 vec2 c2=vec2(.72*a+.14*a*sin(T*uT/43.+1.3),.30+.10*cos(T*uT/43.+.4));
 vec2 c3=vec2(.55*a+.20*a*sin(T*uT/67.+2.1),.72+.10*cos(T*uT/67.+2.7));
 vec2 c4=vec2(.46*a+.10*a*sin(T*uT/48.+4.2),.50+.08*cos(T*uT/48.+3.3));
 float s=.42*.42;
 vec3 col=uBase;
 col=mix(col,uC1,exp(-dot(q-c1,q-c1)/s)*.85);
 col=mix(col,uC2,exp(-dot(q-c2,q-c2)/s)*.75);
 col=mix(col,uC3,exp(-dot(q-c3,q-c3)/s)*.70);
 col=mix(col,uC4,exp(-dot(q-c4,q-c4)/s)*.55);
 float l=dot(col,vec3(.299,.587,.114));col=mix(vec3(l),col,uSat);
 col+=(hash(gl_FragCoord.xy)-.5)*uGrain;
 col*=1.-uDim;
 gl_FragColor=vec4(col,1.);
}`;
  FS.field = (function () {
    const api = { ok: false, el: null, mode: null, dim: 0, sat: .82, t0: performance.now(), clip: null };
    let gl, prog, U = {}, raf = 0, running = false, firstFrame = false, scale = .5;
    api.shader = { VERT, FRAG };

    /* standalone renderer (tools/still.html) */
    api.render = function (canvas, t, dim) {
      const g = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
      if (!g) throw new Error('no webgl');
      const pr = build(g); g.useProgram(pr);
      const u = (n) => g.getUniformLocation(pr, n);
      g.viewport(0, 0, canvas.width, canvas.height);
      g.uniform2f(u('uRes'), canvas.width, canvas.height); g.uniform1f(u('uT'), t);
      g.uniform1f(u('uDim'), dim || 0); g.uniform1f(u('uSat'), .82); g.uniform1f(u('uGrain'), .06);
      palette(g, u);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };
    /* the scheme's light: the sky base and the four lights, from the colour tokens (css/system.css §1b) */
    function palette(g, u) {
      [['uBase', 'dusk'], ['uC1', 'iris'], ['uC2', 'glacier'], ['uC3', 'orchid'], ['uC4', 'pearl']].forEach(([n, t]) => g.uniform3fv(u(n), FS.theme.rgb(t)));
    }
    function build(g) {
      const sh = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s)); return s; };
      const pr = g.createProgram();
      g.attachShader(pr, sh(g.VERTEX_SHADER, VERT)); g.attachShader(pr, sh(g.FRAGMENT_SHADER, FRAG)); g.linkProgram(pr);
      if (!g.getProgramParameter(pr, g.LINK_STATUS)) throw new Error('link');
      const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b);
      g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
      const loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
      return pr;
    }
    function fallback(reason) {
      const old = api.el;
      const div = document.createElement('div');
      div.id = 'field'; div.className = 'field field--still'; div.setAttribute('aria-hidden', 'true');
      if (old && old.parentNode) old.parentNode.replaceChild(div, old); else document.body.prepend(div);
      api.el = div; api.ok = false; running = false; cancelAnimationFrame(raf);
      html.classList.add('field-still');
      if (reason) api.reason = reason;
      if (api.mode) api.setMode(api.mode, api.clip);
      FS.emit('field:ready', { gl: false });
    }
    function size() {
      if (!api.ok) return;
      const c = api.el, w = Math.max(2, Math.round(innerWidth * scale)), h = Math.max(2, Math.round(innerHeight * scale));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
    }
    function draw() {
      const t = (performance.now() - api.t0) / 1000 + 12;
      gl.uniform2f(U.uRes, api.el.width, api.el.height);
      gl.uniform1f(U.uT, F.reduced ? 12 : t);
      gl.uniform1f(U.uDim, api.dim);
      gl.uniform1f(U.uSat, api.sat);
      gl.uniform1f(U.uGrain, F.touch ? .04 : .06);            /* ±2% on coarse pointers, where the grain reads larger */
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!firstFrame) { firstFrame = true; api.ready = true; FS.emit('field:ready', { gl: true }); }
    }
    function tick() { raf = 0; if (!running) return; draw(); if (!F.reduced) raf = requestAnimationFrame(tick); }
    api.init = function () {
      let el = document.getElementById('field');
      if (!el) return;
      api.el = el;
      if (F.static || F.reduced || F.nogl || el.tagName !== 'CANVAS') return fallback('flag');
      try {
        gl = el.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power', premultipliedAlpha: false });
        if (!gl) return fallback('no-webgl');
        prog = build(gl); gl.useProgram(prog);
        ['uRes', 'uT', 'uDim', 'uSat', 'uGrain'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
        palette(gl, (n) => gl.getUniformLocation(prog, n));
        api.ok = true;
        el.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fallback('lost'); });
        size(); addEventListener('resize', size);
        api.play();
        setTimeout(() => { if (!firstFrame) fallback('timeout'); }, 1500);
        document.addEventListener('visibilitychange', () => (document.hidden ? api.pause() : api.play()));
      } catch (e) { fallback('error'); }
    };
    api.play = function () { if (!api.ok || running || document.hidden) return; running = true; if (!raf) raf = requestAnimationFrame(tick); };
    api.pause = function () { running = false; cancelAnimationFrame(raf); raf = 0; };
    /* modes: aperture | full | menu, plus an optional circle clip {x, y, r} in viewport px */
    api.setMode = function (name, clip) {
      api.mode = name; if (!api.el) return;
      api.el.dataset.mode = name;
      /* only the hero aperture fades (onto the lit stop at the end of the stop-down); every other mode is fully opaque,
         so an opacity left behind by the stop-down can never leave the menu or footer without their field */
      if (name !== 'aperture' && api.el.style.opacity) api.el.style.opacity = '';
      /* footer: lighter dim and fuller saturation so the footer field stays pastel light, not fog.
         menu: a deeper dim on narrow screens, where the links sit on the brightest part of the field */
      api.dim = name === 'full' ? .26 : name === 'menu' ? (mq('(max-width: 767px)') ? .38 : .3) : 0;
      api.sat = name === 'full' ? .94 : .82;
      if (clip !== undefined) api.setClip(clip);
    };
    /* c: a circle {x, y, r}, or (round 6, the work pages' lit bands) a whole clip-path value as a string, such as the
       path() union of the hero's rect and the footer's iris; null for none */
    api.setClip = function (c) {
      api.clip = c; if (!api.el) return;
      api.el.style.clipPath = !c ? 'none' : typeof c === 'string' ? c : `circle(${Math.max(0, c.r).toFixed(2)}px at ${c.x.toFixed(2)}px ${c.y.toFixed(2)}px)`;
    };
    return api;
  })();

  /* ── section readout: the header pill names the section you are in ─────── */
  /* Sections keep their internal stop (data-f) for ordering and the detent pings; the pill shows data-name. */
  FS.STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  FS.readout = (function () {
    let cur = null, curName = null;
    const nameOf = (n) => { const s = document.querySelector(`[data-f="${n}"][data-name]`); return s ? s.dataset.name : 'Intro'; };
    const fitWidth = (roll, span, instant) => {
      const w = span.offsetWidth; if (!w) return;
      if (instant) { roll.style.transition = 'none'; roll.style.width = w + 'px'; void roll.offsetWidth; roll.style.transition = ''; }
      else roll.style.width = w + 'px';
    };
    let held = null;
    function set(n, opts) {
      if (n === cur) return;
      const prev = cur; cur = n;
      if (!held) show(nameOf(n), FS.STOPS.indexOf(n) > FS.STOPS.indexOf(prev) ? -1 : 1, prev === null || (opts && opts.instant));
      FS.emit('readout', n);
    }
    /* the full-screen menu names itself: hold('Menu') rolls the pill to it, hold(null) rolls back to the section */
    function hold(label, instant) {
      held = label || null;
      show(held || nameOf(cur), held ? -1 : 1, instant);
    }
    function show(name, dir, instantIn) {
      const instant = instantIn || F.reduced;
      if (name !== curName) {
        curName = name;
        document.querySelectorAll('[data-readout]').forEach((el) => {
          const roll = el.querySelector('.roll');
          if (!roll) return;
          while (roll.children.length > 1) roll.firstElementChild.remove();   /* an interrupted roll never leaves an orphan */
          const now = document.createElement('span'); now.textContent = name;
          const old = roll.firstElementChild;
          roll.appendChild(now);
          fitWidth(roll, now, instant);
          if (old && !instant && now.animate) {
            old.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dir * 100}%)` }], { duration: 80, easing: 'linear' }).onfinish = () => old.remove();
            now.animate([{ transform: `translateY(${-dir * 100}%)` }, { transform: 'translateY(0)' }], { duration: 80, easing: 'linear' });
          } else if (old) old.remove();
        });
      }
    }
    /* webfont swap changes the name's width: refit without animating */
    function refit() { document.querySelectorAll('[data-readout] .roll').forEach((roll) => { const sp = roll.lastElementChild; if (sp) fitWidth(roll, sp, true); }); }
    return { set, hold, refit, get value() { return cur; }, get name() { return curName; } };
  })();

  /* ── header: tone per section + name blurs out after 80px ────────────── */
  FS.header = (function () {
    let el, sections = [], tone = null, scrolled = null, raf = 0;
    /* the tone under a viewport point: innermost / latest [data-tone] wins (the ice bio card on night, a night card on ice) */
    function toneAt(x, y) {
      if (html.classList.contains('menu-open')) return 'night';
      for (let i = sections.length - 1; i >= 0; i--) {
        const r = sections[i].getBoundingClientRect();
        if (r.top <= y && r.bottom > y && r.left <= x && r.right > x) return sections[i].dataset.tone;
      }
      return 'night';
    }
    let items = [];
    function update() {
      raf = 0; if (!el) return;
      /* one probe per header item, applied to the whole item: the brand takes the tone under its disc, the menu
         control the tone under its glass */
      /* the header (and its scrim) takes the tone at its centre; while the scrim is up it is the ground under every
         item, so they all follow it */
      const t = toneAt(innerWidth / 2, el.offsetHeight / 2);
      if (t !== tone) { tone = t; el.dataset.tone = t; }
      const sc = scrollY > 80, scrim = sc || mq('(max-width: 767px)');
      items.forEach((it) => {
        const r = it.probe.getBoundingClientRect(), ti = scrim ? t : toneAt(r.left + r.width / 2, r.top + r.height / 2);
        if (it.node.dataset.tone !== ti) it.node.dataset.tone = ti;
      });
      if (sc !== scrolled) { scrolled = sc; el.classList.toggle('is-scrolled', sc); }
    }
    function init() {
      el = document.querySelector('.site-header');
      const pair = (n, p) => (n && p ? { node: n, probe: p } : null);
      items = el ? [pair(el.querySelector('.brand'), el.querySelector('.brand .brand-dot')), pair(el.querySelector('.f-pill'), el.querySelector('.f-pill')),
        pair(el.querySelector('.nav-r'), el.querySelector('.menu-btn .glass'))].filter(Boolean) : [];
      sections = Array.from(document.querySelectorAll('[data-tone]')).filter((s) => s !== el && !s.closest('.site-header'));
      update();
      addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
      addEventListener('resize', update);
    }
    return { init, update, toneAt };
  })();

  /* ── glass: press (its inner light is a fixed sheen on hover, css/system.css §9) ─ */
  /* 2026-10-08 motion cut: the inner light no longer follows the pointer (--px/--py are not written any more) */
  function glass() {
    document.addEventListener('pointerdown', (e) => { const g = e.target.closest && e.target.closest('.glass'); if (g) g.classList.add('is-pressed'); });
    const up = () => document.querySelectorAll('.glass.is-pressed').forEach((g) => g.classList.remove('is-pressed'));
    document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  }

  /* ── cursor: stop dot + lens (media loupe / portrait) ─────────── */
  /* 2026-10-08 motion cut: no text lens. Over headings and copy the dot stays a dot; the lens opens only over images,
     screenshots and device renders ([data-lens=media]) and fills the portrait. [data-lens=text] is inert now */
  FS.cursor = (function () {
    const api = { enabled: false, mode: 'default' };
    let dot, lens, lensMedia, lensImg, lensRing, ringSvg, raf = 0, last = 0, lensLayer = null;
    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    const r = FS.spring({ value: 0, response: .35, damping: .85 });
    const dr = FS.spring({ value: 0, response: .35, damping: .85 });
    /* round 4b · fill: over a [data-lens-circle] target (the portrait) the lens leaves the pointer and swells into that
       circle (k: 0 at the pointer, 1 on the circle's centre), uncovering the whole true-colour photo, then shrinks back
       onto the pointer as it closes. Its media is masked to the circle, so no colour ever leaks past the photo's edge. */
    const k = FS.spring({ value: 0, response: .7, damping: 1 });
    const rf = FS.spring({ value: 0, response: .7, damping: 1 });   /* the fill's own, slower radius: a swell, not a snap */
    let fillEl = null, fillInset = 0, fc = null, L = 120;
    let media = null, ringText = '';
    api.init = function () {
      if (!F.fine || F.reduced || F.touch) return;
      api.enabled = true;
      html.classList.add('has-cursor');
      const wrap = document.createElement('div');
      wrap.className = 'cursor'; wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = '<i class="cursor-dot lit" data-lit="track"></i>';
      /* the lens lives in its own fixed layer, under the dot's */
      lensLayer = document.createElement('div');
      lensLayer.className = 'cursor cursor--lens'; lensLayer.setAttribute('aria-hidden', 'true');
      lensLayer.innerHTML = '<div class="cursor-lens"><div class="lens-media"><img alt="" decoding="async"></div>' +
        '<svg class="lens-ring" id="lens-ring"></svg><i class="lens-rim"></i></div>';
      document.body.appendChild(wrap); document.body.appendChild(lensLayer);
      dot = wrap.querySelector('.cursor-dot'); lens = lensLayer.querySelector('.cursor-lens');
      lensMedia = lensLayer.querySelector('.lens-media'); lensImg = lensMedia.querySelector('img'); ringSvg = lensLayer.querySelector('.lens-ring');
      dot.__cursor = true;
      FS.lit.track(dot);
      addEventListener('pointermove', (e) => {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        pos.tx = e.clientX; pos.ty = e.clientY;
        if (pos.x < -50) { pos.x = pos.tx; pos.y = pos.ty; }
        html.classList.add('cursor-on');
        target(e.target);
        loop();
      }, { passive: true });
      document.addEventListener('pointerleave', () => html.classList.remove('cursor-on'));
      addEventListener('scroll', () => { target(document.elementFromPoint(pos.tx, pos.ty)); loop(); }, { passive: true });
      dr.target = 5;
    };
    function target(el) {
      const t = el && el.closest ? el.closest('[data-lens=media], [data-lens=portrait]') : null;
      let m = 'default';
      if (t) m = t.getAttribute('data-lens');
      if (el && el.closest && el.closest('[data-cursor=hide]')) m = 'hide';
      setMode(m, t);
    }
    function setMode(m, t) {
      if (m === api.mode && t === media) return;
      api.mode = m; media = t;
      lens.dataset.mode = m;
      const fsel = (m === 'portrait' && t && t.getAttribute('data-lens-circle')) || '';
      const was = !!fillEl;
      fillEl = fsel ? document.querySelector(fsel) : null;
      if (!was && fillEl) { rf.value = r.value; rf.v = r.v; }          /* hand the radius over without a jump, both ways */
      else if (was && !fillEl) { r.value = rf.value; r.v = rf.v; }
      fillInset = fillEl ? parseFloat(t.getAttribute('data-lens-inset')) || 0 : 0;
      k.target = fillEl ? 1 : 0;
      if (m === 'portrait' && fillEl) {
        dr.target = 5;                                     /* the pointer's own dot stays: the lens is no longer under it */
        const src = t.getAttribute('data-src');
        if (src && lensImg.getAttribute('src') !== src) lensImg.src = src;
      }
      else if (m === 'media' || m === 'portrait') {
        r.target = 120; dr.target = 0;
        const src = t.getAttribute('data-src');
        if (src && lensImg.getAttribute('src') !== src) lensImg.src = src;
        const txt = t.getAttribute('data-ring') || '';
        if (txt !== ringText) { ringText = txt; if (txt) FS.ring(ringSvg, txt, 104, 10); else ringSvg.innerHTML = ''; }
      }
      else if (m === 'hide') { r.target = 0; dr.target = 0; }
      else { r.target = 0; dr.target = 5; }
      FS.emit('cursor:mode', { mode: m, el: t });
    }
    function placeMedia() {
      if (!media || (api.mode !== 'media' && api.mode !== 'portrait')) return;
      const sel = media.getAttribute('data-loupe-for');
      const img = (sel && document.querySelector(sel)) || media.querySelector('[data-loupe]') || media.querySelector('img:last-of-type');
      if (!img || !img.naturalWidth) return;
      const b = img.getBoundingClientRect();
      /* object-fit: contain → the drawn content rect */
      const ar = img.naturalWidth / img.naturalHeight;
      let w = b.width, h = b.width / ar;
      if (h > b.height) { h = b.height; w = h * ar; }
      const left = b.left + (b.width - w) / 2, top = b.top + (b.height - h) / 2;
      const z = api.mode === 'portrait' ? 1 : 1.6;
      lensImg.style.width = w * z + 'px'; lensImg.style.height = h * z + 'px';
      lensImg.style.transform = `translate(${(-(lc.x - left) * z + L).toFixed(1)}px, ${(-(lc.y - top) * z + L).toFixed(1)}px)`;
    }
    const lc = { x: -100, y: -100 };                      /* the lens centre: the pointer, or on its way to the fill circle */
    function frame(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      pos.x = FS.smooth(pos.x, pos.tx, dt, .06); pos.y = FS.smooth(pos.y, pos.ty, dt, .06);
      if (fillEl) {                                        /* the circle to fill, live (it moves with the stop-down) */
        const b = fillEl.getBoundingClientRect();
        fc = { x: b.left + b.width / 2, y: b.top + b.height / 2, r: Math.max(0, b.width / 2 - fillInset) };
        rf.target = fc.r;
        /* the circle can leave a pointer that never moved (the stop-down scrubs on after the last scroll event) */
        if (Math.hypot(pos.tx - fc.x, pos.ty - fc.y) > fc.r + 1) target(document.elementFromPoint(pos.tx, pos.ty));
      }
      let rv = fillEl ? rf.step(dt) : r.step(dt);
      const dv = dr.step(dt), kv = Math.min(1, Math.max(0, k.step(dt)));
      if (fillEl && fc) rv = Math.min(rv, fc.r);           /* never past the photo's edge, not even on the spring's overshoot */
      lc.x = fc ? lerp(pos.x, fc.x, kv) : pos.x; lc.y = fc ? lerp(pos.y, fc.y, kv) : pos.y;
      if (!fillEl && kv < .002 && fc) { fc = null; lensMedia.style.webkitMaskImage = lensMedia.style.maskImage = ''; }
      if (lens.classList.contains('is-fill') !== !!fc) lens.classList.toggle('is-fill', !!fc);
      /* the lens box grows with the circle it has to hold, and returns to 240 once it has closed below that */
      const want = fc ? Math.max(120, Math.ceil(fc.r) + 2) : 120;
      if (want > L || rv <= 120) { if (L !== want) { L = want; lens.style.width = lens.style.height = 2 * L + 'px'; } }
      lens.style.transform = `translate(${(lc.x - L).toFixed(2)}px, ${(lc.y - L).toFixed(2)}px)`;
      lens.style.clipPath = `circle(${Math.max(0, rv).toFixed(2)}px at 50% 50%)`;
      if (fc) {
        const mx = (fc.x - lc.x + L).toFixed(1), my = (fc.y - lc.y + L).toFixed(1), R = fc.r;
        const mk = `radial-gradient(circle ${R.toFixed(1)}px at ${mx}px ${my}px,#000 ${(R - .5).toFixed(1)}px,#0000 ${(R + .5).toFixed(1)}px)`;
        lensMedia.style.webkitMaskImage = lensMedia.style.maskImage = mk;
      }
      dot.style.transform = `translate(${(pos.x - 5).toFixed(2)}px, ${(pos.y - 5).toFixed(2)}px)`;
      dot.style.clipPath = `circle(${Math.max(0, dv).toFixed(2)}px at 50% 50%)`;
      placeMedia();
      /* rf only steps while there is a fill (fillEl, which loops anyway): a fill left mid-spring kept rf unsettled for
         good and the dot's loop ran at rest forever (2026-10-08, found in the motion-cut smoke test) */
      if (Math.abs(pos.x - pos.tx) > .1 || Math.abs(pos.y - pos.ty) > .1 || !r.settled() || !dr.settled() || !k.settled() || fillEl) loop();
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    api.setMode = setMode;
    /* re-read what is under the pointer (after the menu opens/closes, nothing moved but the page did) */
    api.retarget = () => { if (!api.enabled) return; target(document.elementFromPoint(pos.tx, pos.ty)); loop(); };
    api.dotSpring = dr;
    api.pos = pos;
    return api;
  })();

  /* ── iris: circle clips that open from a stop or button (stage 2 drives p) ─ */
  FS.iris = {
    /* write a circle clip on el; origin is a viewport point, r in px */
    set(el, ox, oy, r) {
      const b = el.getBoundingClientRect();
      el.style.clipPath = `circle(${Math.max(0, r).toFixed(1)}px at ${(ox - b.left).toFixed(1)}px ${(oy - b.top).toFixed(1)}px)`;
    },
    open(el) { el.style.clipPath = ''; },
    /* centre of a stop's disc (the ::before) in viewport px, font-accurate */
    /* the ::before disc: .043em in from the stop's start, bottom .01em under the baseline, Ø.19em.
       The baseline is read from a zero-size probe (.bl) that FS.probe() puts inside every stop. */
    stopCentre(stop) {
      const r = stop.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(stop).fontSize);
      const bl = stop.querySelector(':scope > .bl');
      const base = bl ? bl.getBoundingClientRect().top : r.top + r.height - .25 * fs;
      const sk = parseFloat(getComputedStyle(stop).getPropertyValue('--sk')) || 1;   /* scaled stops keep their centre */
      return { x: r.left + .138 * fs, y: base - (.095 * sk - .01) * fs, r: .095 * sk * fs };
    },
    circleCentre(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; },
  };

  /* baseline probes for every stop and counter (font-accurate geometry for irises, pings, stop-down) */
  FS.probe = function (root) {
    (root || document).querySelectorAll('.stop, .ctr').forEach((s) => {
      if (s.querySelector(':scope > .bl')) return;
      const i = document.createElement('i'); i.className = 'bl'; i.setAttribute('aria-hidden', 'true'); s.appendChild(i);
    });
  };

  /* ── reveal: focus pulls (blur → sharp). Stage 2 choreographs; stage 1 = end state ─ */
  FS.reveal = {
    focus(els, o) {
      o = Object.assign({ blur: 12, from: .14, dur: 560, stagger: 60, delay: 0 }, o);
      if (F.still || !els) return;
      Array.from(els).forEach((el, i) => el.animate && el.animate(
        [{ filter: `blur(${o.blur}px)`, opacity: o.from }, { filter: 'blur(0px)', opacity: 1 }],
        { duration: o.dur, delay: o.delay + i * o.stagger, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
    },
  };

  /* ── menu: iris from the button; focus trap; ⌘/Ctrl+. ─────────────────── */
  /* The iris is driven in JS from its live radius, so a close during the open (or a reopen during the close)
     reverses from wherever the circle is. Choreography inside the dialog hooks in via menu:open / menu:closing. */
  FS.menu = (function () {
    const api = { open: false, closing: false };
    let menu, btn, prevMode = null, prevClip = null, closeT = 0, focusT = 0, irisR = 0, irisTw = null, fade = null;
    function origin() {
      const r = (btn.querySelector('.glass') || btn).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function focusables() { return Array.from(menu.querySelectorAll('a[href], button:not([disabled])')).concat([btn]); }
    /* everything behind the dialog is inert while it is open (the menu button stays reachable: it is Close) */
    const behind = () => ['#main', '#footer', '.skip', '.site-header .brand', '.site-header .f-pill']
      .map((q) => document.querySelector(q)).filter(Boolean);
    function setInert(v) { behind().forEach((n) => { if (v) { n.inert = true; n.setAttribute('inert', ''); } else { n.inert = false; n.removeAttribute('inert'); } }); }
    let kbd = false;
    document.addEventListener('keydown', () => { kbd = true; }, true);
    document.addEventListener('pointerdown', () => { kbd = false; }, true);
    function setIris(r, o) {
      o = o || origin(); irisR = r;
      menu.style.setProperty('--mx', o.x + 'px'); menu.style.setProperty('--my', o.y + 'px');
      menu.style.clipPath = `circle(${Math.max(0, r).toFixed(2)}px at ${o.x.toFixed(2)}px ${o.y.toFixed(2)}px)`;
      if (FS.field.mode === 'menu') FS.field.setClip({ x: o.x, y: o.y, r });
    }
    function irisTo(r, dur, ease, delay) {
      if (irisTw) { irisTw.kill(); irisTw = null; }
      const o = origin();
      if (!window.gsap) { setIris(r, o); return; }
      const s = { r: irisR };
      irisTw = window.gsap.to(s, { r, duration: dur / 1000, delay: (delay || 0) / 1000, ease, overwrite: true,
        onUpdate: () => setIris(s.r, o), onComplete: () => { irisTw = null; } });
    }
    const maxR = () => Math.hypot(innerWidth, innerHeight) * 1.02;
    function fadeTo(v, done) {
      if (fade) fade.cancel();
      if (!menu.animate) { menu.style.opacity = v; done && done(); return; }
      const from = getComputedStyle(menu).opacity;
      fade = menu.animate([{ opacity: from }, { opacity: v }], { duration: 200, easing: 'linear', fill: 'forwards' });
      fade.onfinish = () => { menu.style.opacity = v; fade && fade.cancel(); fade = null; done && done(); };
    }
    function open(instant) {
      if (api.open) return;
      const wasClosing = api.closing;
      api.open = true; api.closing = false; clearTimeout(closeT);
      html.classList.add('menu-open', 'menu-on', 'field-borrowed');
      menu.hidden = false; menu.setAttribute('aria-hidden', 'false');
      setInert(true);
      btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Close menu');
      if (window.lenis) window.lenis.stop();
      if (!wasClosing) { prevMode = FS.field.mode; prevClip = FS.field.clip; }
      FS.field.setMode('menu'); FS.field.play();
      const quick = instant || F.static || !window.gsap;
      if (!wasClosing) setIris(0);
      if (quick) setIris(maxR());
      else if (F.reduced) { setIris(maxR()); menu.style.opacity = 0; fadeTo(1); }
      else irisTo(maxR(), 820, FS.ease.iris);
      menu.classList.add('is-open');
      FS.readout.hold('Menu', quick);
      FS.header.update();
      FS.emit('menu:open', { instant: quick || F.reduced, resumed: wasClosing });
      requestAnimationFrame(() => FS.cursor.retarget && FS.cursor.retarget());
      clearTimeout(focusT);
      focusT = setTimeout(() => { const a = menu.querySelector('.menu-link'); a && a.focus({ preventScroll: true }); }, quick ? 0 : 380);
    }
    function close(then) {
      if (!api.open) return;
      api.open = false; api.closing = true; clearTimeout(focusT);
      menu.classList.remove('is-open');
      html.classList.remove('menu-on');
      FS.readout.hold(null);
      btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu');
      const done = () => {
        api.closing = false;
        if (irisTw) { irisTw.kill(); irisTw = null; }
        menu.hidden = true; menu.setAttribute('aria-hidden', 'true'); menu.style.opacity = '';
        setInert(false);
        html.classList.remove('menu-open', 'field-borrowed');
        /* re-derive mode, clip and opacity from where the page is now, not from a snapshot taken at open */
        if (window.HOME && window.HOME.fieldMode) window.HOME.fieldMode(); else FS.field.setMode(prevMode || 'aperture', prevClip);
        if (window.lenis) window.lenis.start();
        FS.header.update();
        btn.focus({ preventScroll: true });
        FS.emit('menu:close');
        FS.cursor.retarget && FS.cursor.retarget();
        if (typeof then === 'function') then();
      };
      FS.emit('menu:closing');
      if (F.static || !window.gsap) { setIris(0); done(); return; }
      if (F.reduced) { fadeTo(0, () => { setIris(0); done(); }); return; }
      /* 2026-10-08 motion cut: the iris closes at once (it waited 120ms for the links' blur-out, which is gone) */
      irisTo(0, 620, FS.ease.irisClose);
      closeT = setTimeout(done, 620);
    }
    api.init = function () {
      menu = document.getElementById('menu'); btn = document.querySelector('.menu-btn');
      if (!menu || !btn) return;
      btn.addEventListener('click', () => (api.open ? close() : open()));
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === '.') { e.preventDefault(); api.open ? close() : open(); return; }
        if (!api.open) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        if (e.key === 'Tab') {
          /* always move focus ourselves: the button sits before the dialog in DOM order, so native Tab would leak */
          e.preventDefault();
          const f = focusables(); let i = f.indexOf(document.activeElement);
          i = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i < 0 || i === f.length - 1 ? 0 : i + 1);
          f[i].focus();
        }
      });
      menu.querySelectorAll('.menu-link').forEach((a) => a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href[0] !== '#' || e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        const viaKey = kbd;
        close(() => {
          const t = document.querySelector(href); if (!t) return;
          /* keyboard users land on the section itself, so they hear where they are */
          const land = () => { if (!viaKey) return; if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); };
          if (window.lenis) window.lenis.scrollTo(t, { onComplete: land });
          else { t.scrollIntoView({ behavior: F.reduced ? 'auto' : 'smooth' }); land(); }
        });
      }));
      addEventListener('resize', () => { if (api.open) setIris(maxR()); });
      if (F.menu) open(true);
    };
    api.show = () => open(); api.hide = (fn) => close(fn);
    Object.defineProperty(api, 'busy', { get: () => api.open || api.closing });
    return api;
  })();

  /* ── boot ────────────────────────────────────────────────────────────── */
  function fontsGate() {
    const cap = new Promise((r) => setTimeout(r, 600));
    let mono = Promise.resolve();
    try { mono = document.fonts.load('400 11px "Fragment Mono"', 'Companies 100%'); } catch (e) {}
    Promise.race([mono, cap]).then(() => { html.classList.add('f-ready'); FS.readout.refit(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
      FS.readout.refit();
      try { if (!document.fonts.check('600 100px "Funnel Display"')) html.classList.add('no-ctr'); } catch (e) {}
      FS.emit('fonts');
    });
    setTimeout(() => html.classList.add('f-ready'), 900);
  }
  function boot() {
    fontsGate();
    FS.probe();
    glass();
    FS.field.init();
    FS.lit.scan();
    FS.header.init();
    FS.cursor.init();
    FS.menu.init();
    FS.readout.set(1.4, { instant: true });
    FS.emit('boot');
  }
  let booted = false;
  FS.boot = () => { if (booted) return; booted = true; boot(); };
  if (!window.FS_NO_BOOT) {
    /* deferred scripts run before DOMContentLoaded: wait for it so js/home.js can register hooks first */
    if (document.readyState === 'complete') FS.boot();
    else { document.addEventListener('DOMContentLoaded', FS.boot); addEventListener('load', FS.boot); }
  }
})();
