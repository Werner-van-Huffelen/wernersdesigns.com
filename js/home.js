/* Full Stop · homepage
 * Stage 1 (this file today): geometry, rest states, the logo cut-outs, services, filters, section readout, field modes.
 * Stage 2 (choreography) plugs into HOME.stage2.* — every hook below is called once at boot with the shared context,
 * and the helpers it needs (setAperture, rest, stopDisc, clients.speed…) are already exposed on window.HOME.
 *
 *   HOME.stage2.loader(ctx)     §8.1 pinhole loader  (html.is-loading, detents, FLIP to rest)
 *   HOME.stage2.stopDown(ctx)   §7 hero pin + scrub: aperture → the stop of "shipped."
 *   HOME.stage2.manifesto(ctx)  §7 pull focus (11 words, lens-sharpening)
 *   HOME.stage2.irises(ctx)     §3.8 the four irises (bio card, work, companies, footer)
 *   HOME.stage2.work(ctx)       rack focus, loupe, stop travel, filter pings
 *   HOME.stage2.companies(ctx)  count + clarity + punch
 *   HOME.stage2.footer(ctx)     disc spring, marquee velocity
 *   HOME.stage2.menu(ctx)       menu choreography (links focus-reveal, card iris, shader lens)
 */
(function () {
  'use strict';
  const FS = window.FS;
  if (!FS) return;
  const F = FS.flags, html = document.documentElement;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const mobile = () => FS.util.mq('(max-width: 767px)');

  const HOME = (window.HOME = window.HOME || {});
  HOME.stage2 = HOME.stage2 || {};

  /* ── hero aperture: one writer for every circle that must agree ─────────── */
  const hero = $('#top');
  const ringSvg = $('#hero-ring');
  const barrel = $('.barrel');
  const A = (HOME.aperture = { cx: 0, cy: 0, r: 0, rest: null, sy: 0 });

  /* B (default): the portrait is D ≤ 72svh, centred in the band between the header (ring text ≥ 82px, i.e. 16px under
     the header's 66px) and the bottom (ring text ≥ 32px up): cy = (82 + h − 32) / 2. On short screens it gives up
     size (not the ring's air) so the photo-to-text gap stays ≥ 44px. A (?hero=a): the first refinement, 78svh at 52svh. */
  const heroA = html.classList.contains('hero-a');
  const RING = { cx: .68, top: 82, bottom: 32, size: 14, gap: 54, minGap: 44, side: 27, track: .22, cap: .7, fill: .58 };
  /* round 3 (Werner: "move the ring closer to the image like you had before, make the text a little smaller so there
     is more spacing between the rings and the text"). Everything scales with the portrait radius r (reference r 324
     at 1440×900): the inner hairline returns to its round-1 place (23px outside the photo), the text is 14px (was 16)
     and sits centred between the two hairlines with 1.35 cap heights of air on each side. out = the outer hairline's
     offset per px of r: (23 + 2·1.35·.7·14 + .7·14) / 324. Mobile: inner 14, text 10, air 1.2 caps at r 152. */
  const RG = { ref: 324, inner: 23, size: 14, air: 1.35, sMin: 11, sMax: 17, mRef: 152, mInner: 14, mSize: 10, mAir: 1.2 };
  RG.out = (RG.inner + (2 * RG.air + 1) * RING.cap * RG.size) / RG.ref;
  HOME.heroA = heroA;
  HOME.rest = function () {
    const w = html.clientWidth, h = hero ? hero.clientHeight : innerHeight;
    if (mobile()) return { cx: w * .5, cy: 266, r: w * .37 };
    if (heroA) return { cx: w * .66, cy: h * .52, r: h * .39 };
    if (h > w * 1.15) {
      /* portrait tablets (768–1023 wide, taller than wide): the portrait goes above the stack, centred, like mobile.
         Its ring lives between the header and the headline's ink (at the ceiling size), 24px clear of it. */
      const s = Math.max(64, Math.min(188, .115 * w, .185 * h)), sub = Math.max(28, Math.min(40, .038 * w));
      const floor = h - 64 - 28 - 2.007 * sub - 1.745 * s + .08 * s - 24 - 36 - 28, half = (floor - RING.top) / 2;
      return { cx: w * .5, cy: RING.top + half, r: Math.max(120, Math.min(h * .36, w / 2 - RING.side - RING.minGap, half - RING.size - RING.minGap)), floor };
    }
    const band = (h - RING.top - RING.bottom) / 2;                       /* the ring's outer text radius may reach this */
    const side = w * (1 - RING.cx) - RING.side - RING.minGap;           /* narrow screens: the right edge caps it too */
    /* round 2: the See-the-work badge owns the bottom-right corner. Where even its smallest size (104px) would touch
       the ring (1024×768 and narrower landscape screens), the portrait gives up size so the outer hairlines keep 12px.
       The ring's outer hairline is ≈ 1.042·(r + 54) + .5 (R = r + 54, band from the text size 16.5·R/378). */
    const cx = w * RING.cx, cy = (RING.top + h - RING.bottom) / 2;
    /* round 3: the ring's outer hairline sits at ≈ r·(1 + RG.out) (see HOME.ringGeom); the badge is ≈ 57px in radius */
    const bx = w - 48 - 57, by = h - 48 - 57, corner = (Math.hypot(bx - cx, by - cy) - 57 - 24) / (1 + RG.out);
    return { cx, cy, r: Math.max(120, Math.min(h * .36, band - RING.size - RING.minGap, side, corner)) };
  };
  /* (cx, cy, r) in viewport px while the aperture is fixed, in hero px when static */
  /* o.pr: the portrait's reference radius (hero scale during the loader, r during the stop-down)
     o.alpha: the aperture's opacity (it fades onto the identical lit stop at the end of the stop-down) */
  const apEl = $('#aperture');
  HOME.setAperture = function (cx, cy, r, o) {
    const pr = o && o.pr != null ? o.pr : r, alpha = o && o.alpha != null ? o.alpha : 1;
    A.cx = cx; A.cy = cy; A.r = r; A.pr = pr; A.alpha = alpha;
    if (!hero) return;
    hero.style.setProperty('--acx', cx.toFixed(2) + 'px');
    hero.style.setProperty('--acy', cy.toFixed(2) + 'px');
    hero.style.setProperty('--ar', Math.max(0, r).toFixed(2) + 'px');
    hero.style.setProperty('--pr', Math.max(0, pr).toFixed(2) + 'px');
    const a = alpha >= 1 ? '' : alpha.toFixed(3);
    if (apEl && apEl.style.opacity !== a) apEl.style.opacity = a;
    if (FS.field.mode === 'aperture') {
      FS.field.setClip({ x: cx, y: cy - (F.still ? scrollY : 0), r });
      if (FS.field.el && FS.field.el.style.opacity !== a) FS.field.el.style.opacity = a;
    }
  };
  /* the stop of "shipped." as a disc (stage 2 stop-down target) */
  HOME.stopDisc = () => FS.iris.stopCentre($('#hero-stop'));

  /* the lens-barrel ring. B: R = r0 + 54px, capped by hard margins, never leftovers: the ring text stays ≥ 82px from the
     top (16px under the header), ≥ 32px from the bottom, and the outer hairline (R + 15) ≥ 12px inside the right edge.
     A (?hero=a): 1.12·(r + 28), bottom-capped. Mobile: 1.12·(r + 18), text ≥ 10px inside the sides.
     The text is name, role, company and city only. Round 2 ("fill the circle"): FS.ring fit 'fill' holds the tracking
     at .22em at every size, and picks the repeat count and the size (≈16px at R 378, scaling with R; 11–12px on
     mobile) so every space is half a cell and the circle closes with identical separators. The hairlines hug the
     text: cap height (.7em in Fragment Mono) is 58% of the band between them. Mobile: the outer hairline ≥ 8px
     inside the sides. */
  HOME.ringGeom = function () {
    const m = mobile(), rest = A.rest || HOME.rest(), r0 = rest.r;   /* always the rest radius, never the live one */
    const w = html.clientWidth, h = hero ? hero.clientHeight : innerHeight;
    if (heroA) {
      const R = Math.min(1.12 * (r0 + 28), h - rest.cy - 27, w - rest.cx - RING.side), gap = R - r0, size = 16.5 * R / 378;
      return { R, r0, inner: Math.round(gap * .43), outer: gap + 15, size, air: 0, range: [size * .92, size * 1.1] };
    }
    /* round 3: inner hairline gi outside the photo, then air, the caps, air, the outer hairline (all ∝ r) */
    const size = m ? Math.max(9.5, Math.min(11, RG.mSize * r0 / RG.mRef)) : Math.max(RG.sMin, Math.min(RG.sMax, RG.size * r0 / RG.ref));
    const cap = RING.cap * size;
    let gi = m ? RG.mInner * r0 / RG.mRef : Math.max(14, RG.inner * r0 / RG.ref), air = (m ? RG.mAir : RG.air) * cap;
    /* hard limits for the outer hairline: 12px inside the sides (mobile), and on desktop 12px inside the right edge,
       under the header (the ring text stays ≥ 82px from the top) and above the stack floor / the bottom margin */
    const tmax = m ? w / 2 - 12 - r0
      : Math.min(w - rest.cx - 12, rest.cy - RING.top + air, (rest.floor || h - RING.bottom) - rest.cy + air) - r0;
    const t = gi + 2 * air + cap;
    if (t > tmax) {                        /* too tight: give up air first (down to .8 caps), then the inner gap (to 6px) */
      const cut = t - tmax, da = Math.min(cut / 2, air - .8 * cap);
      air -= Math.max(0, da); gi = Math.max(6, gi - Math.max(0, cut - 2 * Math.max(0, da)));
    }
    const R = r0 + gi + air;               /* FS.ring's radius: the caps run from R to R + cap */
    return { R, r0, size, air, inner: gi, outer: gi + 2 * air + cap, range: [size * .97, size * 1.03] };
  };
  function buildRing() {
    if (!ringSvg) return;
    const g = HOME.ringGeom(), m = mobile();
    const res = FS.ring(ringSvg, 'WERNER VAN HUFFELEN · LEAD PRODUCT DESIGNER · GALVANY · BERLIN · ', g.R, g.size, { track: RING.track, fit: 'fill', range: g.range });
    const size = res ? res.size : g.size, R = res ? res.R : g.R, gap = R - g.r0;
    const box = 2 * (R + size + 4);
    ringSvg.style.width = ringSvg.style.height = box + 'px';
    /* round 3: the hairlines sit one 'air' inside and outside the caps (hero A keeps its round-1 lines) */
    const cap = RING.cap * size;
    const inner = +((g.air ? R - g.air : g.r0 + g.inner) - g.r0 + .5).toFixed(1);   /* +.5: the 1px line is inset */
    const outer = +((g.air ? R + cap + g.air : g.r0 + g.outer) - g.r0 + .5).toFixed(1);
    if (hero) { hero.style.setProperty('--hair-in', inner + 'px'); hero.style.setProperty('--hair-out', outer + 'px'); }
    HOME.ring = Object.assign({}, g, res || {}, { R, gap, inner, outer });
    /* every ring glyph with its base angle (FS.ring writes rotate(θ) into its transform), for the whole-letter pass */
    ringGlyphs = Array.from(ringSvg.querySelectorAll('text')).map((el) => {
      const mt = /rotate\(([-\d.]+)\)/.exec(el.getAttribute('transform') || '');
      return { el, th: mt ? +mt[1] * Math.PI / 180 : 0, off: false };
    });
  }

  /* ── whole letters only (round 2 review). The .knock halo alone slices any ring glyph it crosses, which left
     half-letters floating between "d" and the stop. Every ring glyph that comes within the halo (10px) of a headline
     glyph now fades out whole (120ms, css) before the halo can cut it, so the ring breaks once, cleanly, around the
     headline. The halo stays as the backstop for the hairlines. Headline ink boxes are hero-local px (the same
     Range + canvas ink metrics as fitHeadline); the ring centre is the aperture's, rotated by the live ring angle. */
  let ringGlyphs = [], knock = null;
  const KNOCK = { halo: 10, glyph: .46, margin: 4 };   /* glyph: its half-diagonal in em (mono caps .7 × .6 + tracking) */
  function headlineBoxes() {
    knock = null;
    if (!h1 || !hero) return;
    const hb = hero.getBoundingClientRect(), cs = getComputedStyle(h1), fs = parseFloat(cs.fontSize);
    inkCtx = inkCtx || document.createElement('canvas').getContext('2d');
    inkCtx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const boxes = [], tw = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (n.parentNode.closest('.stop')) continue;                 /* the transparent '.': the disc stands in for it */
      for (let i = 0; i < n.data.length; i++) {
        if (!n.data[i].trim()) continue;
        const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
        const gr = rg.getBoundingClientRect(), m = inkCtx.measureText(n.data[i]), by = gr.top + m.fontBoundingBoxAscent;
        boxes.push({ l: gr.left - m.actualBoundingBoxLeft - hb.left, r: gr.left + m.actualBoundingBoxRight - hb.left,
          t: by - m.actualBoundingBoxAscent - hb.top, b: by + m.actualBoundingBoxDescent - hb.top });
      }
    }
    /* round 4: the doubled subline reaches the ring's text band too, so its glyphs (and the arrow) break the ring the
       same way; its .knock copy (HOME.subKnock) keeps the hairlines clear of it */
    const sub = $('.hero-sub:not(.knock)');
    if (sub) {
      const cs2 = getComputedStyle(sub), f2 = parseFloat(cs2.fontSize), sw = document.createTreeWalker(sub, NodeFilter.SHOW_TEXT);
      inkCtx.font = `${cs2.fontWeight} ${f2}px ${cs2.fontFamily}`;
      for (let n = sw.nextNode(); n; n = sw.nextNode()) for (let i = 0; i < n.data.length; i++) {
        if (!n.data[i].trim()) continue;
        const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
        const gr = rg.getBoundingClientRect(), m = inkCtx.measureText(n.data[i]), by = gr.top + m.fontBoundingBoxAscent;
        boxes.push({ l: gr.left - m.actualBoundingBoxLeft - hb.left, r: gr.left + m.actualBoundingBoxRight - hb.left,
          t: by - m.actualBoundingBoxAscent - hb.top, b: by + m.actualBoundingBoxDescent - hb.top });
      }
      $$('.arr', sub).forEach((ar) => { const q = ar.getBoundingClientRect(); boxes.push({ l: q.left - hb.left, r: q.right - hb.left, t: q.top - hb.top, b: q.bottom - hb.top }); });
      inkCtx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    }
    const eb = $('.hero-eyebrow');                                 /* the scheme line: the ring breaks for it too */
    if (eb) { const q = eb.getBoundingClientRect(); boxes.push({ l: q.left - hb.left, r: q.right - hb.left, t: q.top - hb.top, b: q.bottom - hb.top }); }
    const sd = $('#hero-stop') ? FS.iris.stopCentre($('#hero-stop')) : null;
    if (sd) boxes.push({ l: sd.x - sd.r - hb.left, r: sd.x + sd.r - hb.left, t: sd.y - sd.r - .08 * fs - hb.top, b: sd.y + sd.r - hb.top });
    /* the bridge between "d" and the stop (css .knock .stop::after), less the halo that the pad adds back */
    const sp = $('#hero-stop');
    if (sp) { const q = sp.getBoundingClientRect(), hl = KNOCK.halo;
      boxes.push({ l: q.left - .1 * fs + hl - hb.left, r: q.left + .234 * fs - hl - hb.left, t: q.top + .542 * fs - hb.top, b: q.top + 1.0024 * fs - hb.top }); }
    if (!boxes.length) return;
    const hull = boxes.reduce((a, k) => ({ l: Math.min(a.l, k.l), r: Math.max(a.r, k.r), t: Math.min(a.t, k.t), b: Math.max(a.b, k.b) }));
    knock = { boxes, hull };
  }
  function knockPass(angle) {
    if (!knock || !ringGlyphs.length || !HOME.ring) return;
    const ring = HOME.ring, s = ring.size, Rc = ring.R + RING.cap * s / 2, pad = KNOCK.halo + KNOCK.glyph * s + KNOCK.margin;
    const cx = A.cx, cy = A.cy + (F.still ? 0 : HOME.syv || 0), a0 = angle * Math.PI / 180, H = knock.hull;
    const near = (x, y, k) => Math.hypot(Math.max(0, k.l - x, x - k.r), Math.max(0, k.t - y, y - k.b)) < pad;
    for (const gl of ringGlyphs) {
      const th = gl.th + a0, x = cx + Rc * Math.sin(th), y = cy - Rc * Math.cos(th);
      const off = near(x, y, H) && knock.boxes.some((k) => near(x, y, k));
      if (off !== gl.off) { gl.off = off; gl.el.style.opacity = off ? '0' : ''; }
    }
  }
  HOME.knockPass = knockPass;

  /* ── See the work: the portrait ring's small sibling, bottom-right ─────────
     Same ring: FS.ring fit 'fill', .22em tracking, half-cell spaces, 2 repeats of 'SEE THE WORK · ', so the radius
     follows from the text size (R ∝ size) and the circle closes with identical separators. The hairlines use the
     portrait ring's cap/band ratio; the glass core is half the badge (≈64px at 128) and the arrow 18px at that size. The outer hairline is
     right-aligned to the menu button and sits 48px above the hero bottom. The size starts at the portrait ring's and
     only gives way (to 104px across at least) to keep ≥ 12px between the two rings' outer hairlines. Mobile: 16px
     right margin, below the subline. */
  const seeEl = $('.see'), seeSvg = $('#see-ring');
  /* gap: the air between the two rings' outer hairlines, 1.25 bands of the portrait ring (24px at 1440×900) so the
     badge reads as a placed sibling, not tangent to the big ring (round 2 review) */
  /* round 3 ("same for the see the work ring"): the text is .82 of the portrait ring's (≈11.5px at 1440×900; mobile
     ≥ 9.5px), with 1.2 caps of air between it and each hairline, and the inner hairline sits 5px outside the glass
     core, like the portrait ring hugging the photo. */
  const SEE = { text: 'SEE THE WORK · ', n: 2, bottom: 48, gap: 1.25, min: 46, rel: .82, mMin: 9.5, air: 1.2, coreGap: 5 };
  const seeR = (s) => FS.ring(seeSvg, SEE.text, 50, s, { track: RING.track, fit: 'fill', n: SEE.n });
  const seeGeo = (s) => {
    const res = seeR(s), cap = RING.cap * res.size, air = SEE.air * cap;
    return { res, cap, air, inner: res.R - air, outer: res.R + cap + air };
  };
  const seeOut = (R, s) => R + (1 + SEE.air) * RING.cap * s;   /* the outer hairline for text radius R at size s */
  function buildSee() {
    if (!seeEl || !seeSvg || !hero) return;
    const m = mobile(), w = html.clientWidth, h = hero.clientHeight, rest = A.rest, ring = HOME.ring;
    const mb = $('.menu-btn'), right = m ? w - 16 : (mb ? mb.getBoundingClientRect().right : w - 48);
    const s0 = ring ? Math.max(SEE.mMin, SEE.rel * ring.size) : 12, k = seeOut(seeR(s0).R, s0) / s0;   /* b = k·s: every length scales with the size */
    const place = (b) => {
      const x = right - b;
      let y = h - SEE.bottom - b;
      if (m) { const sub = $('.hero-sub'), sb = sub ? sub.getBoundingClientRect().bottom - hero.getBoundingClientRect().top : 0; y = Math.max(y, sb + 20 + b); }
      return { x, y };
    };
    const gap = ring ? SEE.gap * RING.cap * ring.size / RING.fill : 24;
    const clear = (b) => {
      if (!ring || m) return true;
      const p = place(b), Ro = ring.r0 + ring.outer;
      return Math.hypot(p.x - rest.cx, p.y - rest.cy) - Ro - b >= gap;
    };
    let b = k * s0;
    /* the floor never grows a badge that is already smaller than it (1024×768 follows the ring's smaller text) */
    if (!clear(b)) { let lo = Math.min(SEE.min, b), hi = b; for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (clear(mid)) lo = mid; else hi = mid; } b = lo; }
    const s = Math.floor(b / k * 10 + 1e-6) / 10, sg = seeGeo(s), res = sg.res, bo = sg.outer;
    const box = 2 * (res.R + s + 4), p = place(bo), core = 2 * (sg.inner - SEE.coreGap);
    seeSvg.style.width = seeSvg.style.height = box + 'px';
    const set = (k2, v) => seeEl.style.setProperty(k2, v.toFixed(2) + 'px');
    set('--see-x', p.x); set('--see-y', p.y); set('--see-d', 2 * bo + 1);
    set('--see-hin', sg.inner + .5);
    set('--see-core', core); set('--see-arr', Math.max(12, .3 * core));
    HOME.see = { x: p.x, y: p.y, b: bo, d: 2 * bo, size: s, R: res.R, n: res.n, space: res.space, gap,
      clear: ring && rest ? Math.hypot(p.x - rest.cx, p.y - rest.cy) - ring.r0 - ring.outer - bo : null };
  }

  /* ── the headline: as large as the ceiling allows while every glyph stays ≥ 24px outside the aperture ──
     Glyph ink boxes come from the rendered text (Range origins + canvas ink metrics), in em, so one measurement
     predicts every size: the stack is bottom-anchored, so the h1 top moves by 1.745em per em of size. */
  const h1 = $('h1.hero-title');
  let inkCtx = null;
  function inkBoxes(fs, hb) {
    const b = h1.getBoundingClientRect(), cs = getComputedStyle(h1);
    inkCtx = inkCtx || document.createElement('canvas').getContext('2d');
    inkCtx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const stopEl = $('#hero-stop'), bl = stopEl && stopEl.querySelector(':scope > .bl');
    const out = [];
    const glyph = (node, i, base) => {
      const rg = document.createRange(); rg.setStart(node, i); rg.setEnd(node, i + 1);
      const gr = rg.getBoundingClientRect(), m = inkCtx.measureText(node.data[i]);
      const ox = gr.left, by = base != null ? base : gr.top + m.fontBoundingBoxAscent;
      out.push({ l: (ox - m.actualBoundingBoxLeft - b.left) / fs, r: (ox + m.actualBoundingBoxRight - b.left) / fs,
        t: (by - m.actualBoundingBoxAscent - b.top) / fs, b: (by + m.actualBoundingBoxDescent - b.top) / fs });
    };
    const ws = $$('.w', h1);
    const base2 = bl ? bl.getBoundingClientRect().top : null;
    const t3 = ws[2] && ws[2].firstChild;
    /* line 1's last word, every glyph, the lit counter's "o" included (round 4: it moves into "to" in the new schemes) */
    if (ws[1]) { const tw = document.createTreeWalker(ws[1], NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) for (let i = 0; i < n.data.length; i++) if (n.data[i].trim()) glyph(n, i, base2 != null ? base2 - .88 * fs : null); }
    if (t3 && t3.nodeType === 3) for (let i = Math.max(0, t3.data.length - 3); i < t3.data.length; i++) glyph(t3, i, base2);
    const sd = stopEl ? FS.iris.stopCentre(stopEl) : null;
    return { boxes: out, stop: sd && { x: (sd.x - b.left) / fs, y: (sd.y - b.top) / fs, r: sd.r / fs }, left: b.left - hb.left, top: b.top - hb.top };
  }
  HOME.fitHeadline = function () {
    if (!hero || !h1) return;
    hero.style.removeProperty('--h1-size');
    if (mobile() || heroA) return;
    const rest = A.rest || HOME.rest(), clear = rest.r + 25;   /* 24px, plus a px for the rounding of the stack */
    const s0 = parseFloat(getComputedStyle(h1).fontSize), hb = hero.getBoundingClientRect();
    const g = inkBoxes(s0, hb);
    const ok = (s) => {
      const top = g.top + 1.745 * (s0 - s), x = (e) => g.left + e * s, y = (e) => top + e * s;
      for (const k of g.boxes) {
        const dx = Math.max(0, x(k.l) - rest.cx, rest.cx - x(k.r)), dy = Math.max(0, y(k.t) - rest.cy, rest.cy - y(k.b));
        if (Math.hypot(dx, dy) < clear) return false;
      }
      return !g.stop || Math.hypot(x(g.stop.x) - rest.cx, y(g.stop.y) - rest.cy) - g.stop.r * s >= clear;
    };
    let s = s0;
    if (!ok(s0)) { let lo = 64, hi = s0; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; } s = lo; }
    if (s < s0 - .05) hero.style.setProperty('--h1-size', s.toFixed(2) + 'px');
    HOME.h1 = { size: s, ceiling: s0, clear };
  };

  /* ── the ring reads as one complete circle (round 2): no mask, no fade. Where "shipped." crosses the text band the
     headline sits in front, and the .knock copy (a 10px night halo around every glyph, on its own layer between the
     barrel and the headline) keeps every ring letter and hairline clear of the ink. HOME.maskRing only sizes the
     .b-lens frame now (the ring still spins inside it, centred on the aperture). */
  const lens = $('.b-lens');
  HOME.maskRing = function () {
    if (!lens || !hero) return;
    lens.style.setProperty('--fw', html.clientWidth + 'px'); lens.style.setProperty('--fh', hero.clientHeight + 'px');
    lens.style.removeProperty('--lens-mask');
  };

  function layoutHero() {
    A.rest = HOME.rest();
    HOME.fitHeadline();
    if (HOME.renderHero) HOME.renderHero(); else HOME.setAperture(A.rest.cx, A.rest.cy, A.rest.r);
    buildRing();
    buildSee();
    HOME.maskRing();
    headlineBoxes();
    knockPass(ringAngle);
    heroKey = html.clientWidth + 'x' + (hero ? hero.clientHeight : innerHeight);
  }
  HOME.layoutHero = layoutHero;
  /* after a ScrollTrigger refresh: a live resize reads the hero while its pin still holds the old height, so the
     hero is laid out again once the pin has let go, if its size moved (round 2 review) */
  let heroKey = '';
  HOME.relayoutHero = () => { if (html.clientWidth + 'x' + (hero ? hero.clientHeight : innerHeight) !== heroKey) layoutHero(); };

  /* ring rotation: 6°/s plus |scroll velocity|·0.35, spring-smoothed (stage 2 may replace). The badge turns the same
     way at the same angular speed, and its own spring eases it to 3× while it is hovered or focused (interruptible). */
  let ringAngle = 0, ringRaf = 0, ringLast = 0, heroVisible = true, seeAngle = 0, seeHover = false, seeFocus = false;
  const ringVel = FS.spring({ value: 6, response: .6, damping: 1 });
  const seeVel = FS.spring({ value: 6, response: .6, damping: 1 });
  if (seeEl) {
    /* hover and keyboard focus are separate: leaving with the pointer keeps the speed-up while focus stays */
    seeEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { seeHover = true; ringPlay(); } });
    seeEl.addEventListener('pointerleave', () => { seeHover = false; ringPlay(); });
    seeEl.addEventListener('focus', () => { let fv = true; try { fv = seeEl.matches(':focus-visible'); } catch (e) {} if (fv) { seeFocus = true; ringPlay(); } });
    seeEl.addEventListener('blur', () => { seeFocus = false; ringPlay(); });
  }
  function ringTick(now) {
    ringRaf = 0;
    const dt = ringLast ? Math.min(.05, (now - ringLast) / 1000) : 1 / 60; ringLast = now;
    const v = window.lenis && window.lenis.velocity ? Math.abs(window.lenis.velocity) : 0;
    ringVel.target = 6 + v * .35;
    const rv = ringVel.step(dt);
    ringAngle = (ringAngle + rv * dt) % 360;
    if (ringSvg) ringSvg.style.transform = `translate(-50%,-50%) rotate(${ringAngle.toFixed(3)}deg)`;
    knockPass(ringAngle);
    seeVel.target = ringVel.target * (seeHover || seeFocus ? 3 : 1);
    seeAngle = (seeAngle + seeVel.step(dt) * dt) % 360;
    if (seeSvg) seeSvg.style.transform = `translate(-50%,-50%) rotate(${seeAngle.toFixed(3)}deg)`;
    if (heroVisible && !document.hidden) ringRaf = requestAnimationFrame(ringTick);
  }
  function ringPlay() { if (F.still || ringRaf) return; ringLast = 0; ringRaf = requestAnimationFrame(ringTick); }

  /* ── field modes: aperture in the hero, full in the footer, paused between ─ */
  let footerVisible = false;
  function fieldMode() {
    if (FS.menu.busy) return;
    if (footerVisible) {
      FS.field.setMode('full', HOME.footerClip || null);
      if (FS.field.el) FS.field.el.style.opacity = '';
      FS.field.play();
    }
    else if (heroVisible) { FS.field.setMode('aperture'); HOME.setAperture(A.cx, A.cy, A.r, { pr: A.pr, alpha: A.alpha }); FS.field.play(); }
    else {
      /* between hero and footer: park the field as a (hidden) aperture, so no menu clip or z-index lingers */
      if (FS.field.mode !== 'aperture') { FS.field.setMode('aperture'); HOME.setAperture(A.cx, A.cy, A.r, { pr: A.pr, alpha: A.alpha }); }
      FS.field.pause();
    }
    html.classList.toggle('hero-off', !heroVisible);
  }
  HOME.fieldMode = fieldMode;

  /* ── clients: light through the logos (one canvas, one destination-in) ─── */
  const clients = (HOME.clients = { speedMul: 1, target: 1, offset: 0, ready: false });
  (function () {
    const band = $('.logo-band'), cv = $('#logo-canvas');
    const list = window.FS_LOGOS || [];
    if (!band || !cv || !list.length) return;
    let ctx, mask, mctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0, visible = false, seqW = 0, items = [];
    try { ctx = cv.getContext('2d'); mask = document.createElement('canvas'); mctx = mask.getContext('2d'); } catch (e) { return; }
    if (!ctx || !mctx) return;
    const imgs = list.map((l) => { const im = new Image(); im.decoding = 'async'; im.src = 'assets/logos/' + l.id + '.png'; return { l, im }; });
    Promise.all(imgs.map(({ im }) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).then(() => { clients.ready = true; size(); draw(0); });

    /* the scheme's --aurora-lit, token for token (css/system.css §1b) */
    const tk = (n, a) => { const c = FS.theme.rgb(n).map((v) => Math.round(v * 255)); return `rgba(${c.join(',')},${a})`; };
    const LAYERS = [ /* painted bottom → top; CSS lists them top → bottom */
      { at: [.50, .45], r: [1.20, 1.20], stops: [[0, tk('lit-1', 1)], [.55, tk('lit-2', 1)], [1, tk('lit-3', 1)]] },
      { at: [.46, .50], r: [.16, .18], stops: [[0, tk('pearl', .90)], [.70, tk('pearl', 0)]] },
      { at: [.56, .74], r: [.36, .34], stops: [[0, tk('orchid', .85)], [.70, tk('orchid', 0)]] },
      { at: [.72, .28], r: [.30, .36], stops: [[0, tk('glacier', .85)], [.70, tk('glacier', 0)]] },
      { at: [.24, .32], r: [.34, .40], stops: [[0, tk('iris', .95)], [.72, tk('iris', 0)]] },
    ];
    const floor = tk('lit-2', .6);
    /* the crest's interior detail needs a little more height to survive as a silhouette */
    const boost = (l) => (l.id === 'group-12' ? 1.1 : 1);
    let grid = false;
    function size() {
      const b = band.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, Math.round(b.width * dpr)); H = Math.max(1, Math.round(b.height * dpr));
      cv.width = mask.width = W; cv.height = mask.height = H;
      const k = mobile() ? .62 : .9, gap = (mobile() ? 56 : 88) * dpr;
      grid = F.still;
      if (grid) {
        /* still modes: every logo visible at once, a 6×2 grid (3×4 under 768), each centred in its cell */
        const cols = mobile() ? 3 : 6, rows = Math.ceil(imgs.length / cols), cw = W / cols, ch = H / rows;
        items = imgs.map(({ l, im }, i) => {
          let h = l.h * k * boost(l) * dpr, w = h * l.ar;
          if (w > cw * .84) { w = cw * .84; h = w / l.ar; }
          const c = i % cols, r = Math.floor(i / cols);
          return { im, x: c * cw + (cw - w) / 2, y: r * ch + (ch - h) / 2, w, h };
        });
        seqW = W; return;
      }
      let x = 0;
      items = imgs.map(({ l, im }) => { const h = l.h * k * boost(l) * dpr, w = h * l.ar, it = { im, x, w, h }; x += w + gap; return it; });
      seqW = x;
    }
    function paintAurora(b) {
      const dp = FS.driftPx(performance.now());
      const bw = 1.3 * innerWidth * dpr, bh = 1.3 * innerHeight * dpr;
      const ox = (dp.x - b.left) * dpr, oy = (dp.y - b.top) * dpr;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = floor; ctx.fillRect(0, 0, W, H);   /* the darkest cut-out stays light */
      LAYERS.forEach((L) => {
        const cx = ox + L.at[0] * bw, cy = oy + L.at[1] * bh, rx = L.r[0] * bw, ry = L.r[1] * bh;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(rx, ry);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        L.stops.forEach(([p, c]) => g.addColorStop(p, c));
        ctx.fillStyle = g; ctx.fillRect(-cx / rx, -cy / ry, W / rx, H / ry);
        ctx.restore();
      });
    }
    function draw(dt) {
      if (!clients.ready || !W) return;
      const b = band.getBoundingClientRect();
      /* 1 · the mask: every logo, source-over, once */
      mctx.clearRect(0, 0, W, H);
      if (grid) items.forEach((it) => mctx.drawImage(it.im, it.x, it.y, it.w, it.h));
      const off = grid ? 0 : ((clients.offset % seqW) + seqW) % seqW;
      for (let base = -off; !grid && base < W; base += seqW) {
        for (const it of items) {
          const x = base + it.x;
          if (x > W || x + it.w < 0) continue;
          mctx.drawImage(it.im, x, (H - it.h) / 2, it.w, it.h);
        }
      }
      /* 2 · the light · 3 · one destination-in */
      paintAurora(b);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
    function tick(now) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      clients.speedMul = FS.smooth(clients.speedMul, clients.target, dt, .2);
      const v = window.lenis && window.lenis.velocity ? Math.abs(window.lenis.velocity) : 0;
      const base = mobile() ? seqW / dpr / 34 : 40;
      clients.offset += (base * clients.speedMul + v * .6) * dt * dpr;
      draw(dt);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    }
    const play = () => { if (F.still) return draw(0); if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); }, { rootMargin: '80px' }).observe(band);
    else { visible = true; play(); }
    addEventListener('scroll', () => { if (F.still && visible) draw(0); }, { passive: true });
    addEventListener('resize', () => { size(); draw(0); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) play(); });
    band.addEventListener('pointerenter', () => { clients.target = .2; FS.ping($('#clients-stop')); });
    band.addEventListener('pointerleave', () => { clients.target = 1; });
    clients.redraw = () => draw(0);
  })();

  /* ── services: one open at a time ───────────────────────────────────────── */
  function services() {
    const rows = $$('.svc');
    const set = (li, open) => {
      li.classList.toggle('is-open', open);
      const b = $('.svc-head', li); b.setAttribute('aria-expanded', String(open));
    };
    rows.forEach((li) => $('.svc-head', li).addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      rows.forEach((o) => { if (o !== li) set(o, false); });
      set(li, open);
      if (open) FS.ping($('.svc-idx', li));
      setTimeout(() => ScrollRefresh(), 700);
    }));
    if (rows[0]) set(rows[0], true);
  }
  const ScrollRefresh = () => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };

  /* ── work: filter + whole-card target ───────────────────────────────────── */
  /* round 4 (Werner: "filter the section by hiding the other items"): a filter keeps only its projects. The others
     leave the layout ([hidden]: display none, so out of the tab order and the accessibility tree) and the kept cards
     reflow into the two columns in number order, the original zigzag (1st left, 2nd right, 3rd left…), so All
     restores 01 03 05 | 02 04 06 under the right column's offset. Mobile is one column in number order (2026-10-05:
     01 and 02, the two Recent work cards, lead together), and cards only hide. HOME.work.place() is the instant layout; stage 2 (HOME.work.run, js/motion.js) choreographs it. */
  function work() {
    const tags = $$('.work-tags .tag'), cards = $$('.work-card'), cols = $$('.work-grid > .wcol'), bar = $('.work-tags');
    const per = cols.map((col) => $$('.work-card', col)), order = [];
    for (let i = 0; i < Math.max(0, ...per.map((a) => a.length)); i++) per.forEach((a) => a[i] && order.push(a[i]));
    const W = (HOME.work = {
      order, filter: 'all',
      pick: (f) => order.filter((c) => f === 'all' || (c.dataset.kind || '').split(' ').includes(f)),   /* a card can sit in several filters (2026-10-08: Recent work) */
      place(list) {
        const on = new Set(list), seq = cols.map(() => []);
        if (mobile()) seq[0].push(...order);   /* one column, 01 02 03 …; the empty right column hides (css/home.css) */
        else {
          list.forEach((c, i) => seq[i % cols.length].push(c));
          per.forEach((a, j) => a.forEach((c) => { if (!on.has(c)) seq[j].push(c); }));   /* parked in their own column */
        }
        seq.forEach((s, j) => s.forEach((c, i) => { if (cols[j].children[i] !== c) cols[j].insertBefore(c, cols[j].children[i] || null); }));
        cards.forEach((c) => {
          const h = !on.has(c);
          if (c.hidden !== h) { c.hidden = h; if (h && c.__off) c.__off(); }   /* __off: its hover state resets (js/motion.js) */
          if (c.inert) c.inert = false;
        });
      },
      /* the filter bar's page position: a reflow must never move it under the pointer */
      barY: () => (bar ? bar.getBoundingClientRect().top + scrollY : 0),
      hold(y0) {
        const d = W.barY() - y0;
        if (Math.abs(d) < .5) return;
        if (window.lenis) window.lenis.scrollTo(scrollY + d, { immediate: true, force: true }); else scrollBy(0, d);
      },
    });
    const select = (tag) => {
      const f = tag.dataset.filter;
      tags.forEach((t) => t.setAttribute('aria-checked', String(t === tag)));
      W.filter = f;
      const list = W.pick(f);
      cards.forEach((c) => { if (!list.includes(c) && c.contains(document.activeElement)) document.activeElement.blur(); });
      if (W.run) { W.run(list); return; }
      /* no choreography (reduced motion, ?static=1, no GSAP): the layout changes at once */
      const y0 = W.barY();
      W.place(list);
      list.forEach((c, k) => { const s = $('.wc-title .stop', c); setTimeout(() => FS.ping(s), 60 * k); });
      ScrollRefresh(); W.hold(y0);
    };
    /* crossing the breakpoint switches between the two layouts at once */
    try { matchMedia('(max-width: 767px)').addEventListener('change', () => { if (W.stop) W.stop(); W.place(W.pick(W.filter)); }); } catch (e) { /* old Safari */ }
    W.place(W.pick(W.filter));   /* phones load in number order (desktop: the markup's zigzag already is the layout) */
    tags.forEach((t) => t.addEventListener('click', () => select(t)));
    $('.work-tags') && $('.work-tags').addEventListener('keydown', (e) => {
      if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return;
      e.preventDefault();
      const i = tags.indexOf(document.activeElement); if (i < 0) return;
      const n = tags[(i + (/Right|Down/.test(e.key) ? 1 : tags.length - 1)) % tags.length];
      n.focus(); select(n);
    });
    tags.forEach((t) => (t.tabIndex = t.getAttribute('aria-checked') === 'true' ? 0 : -1));
    new MutationObserver(() => tags.forEach((t) => (t.tabIndex = t.getAttribute('aria-checked') === 'true' ? 0 : -1)))
      .observe($('.work-tags'), { subtree: true, attributes: true, attributeFilter: ['aria-checked'] });
    cards.forEach((c) => c.addEventListener('click', (e) => {
      const btn = $('.wc-btn', c);
      if (!btn || e.target.closest('a')) return;
      btn.click();
    }));
  }

  /* ── section readout: the section at 50% of the viewport names the header pill ── */
  function readout() {
    const secs = $$('[data-f]');
    let raf = 0;
    const update = () => {
      raf = 0;
      if (HOME.refreshing || FS.menu.open) return;       /* the menu keeps the name of the section it opened over */
      const mid = innerHeight * .5;
      let f = 1.4;
      for (const s of secs) if (s.getBoundingClientRect().top <= mid) f = +s.dataset.f;
      FS.readout.set(f);
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    FS.on('menu:close', update);
    HOME.readout = update;
    update();
  }

  /* ── footer disc ring ───────────────────────────────────────────────────── */
  function footer() {
    const svg = $('#disc-ring');
    if (!svg) return;
    const m = mobile(), R = m ? 146 : 200, size = m ? 10 : 11;
    FS.ring(svg, 'ME@WERNERSDESIGNS.COM · CONTACT ME · ', R, size);
    const box = 2 * (R + size + 4);
    svg.style.width = svg.style.height = box + 'px';
    svg.style.marginLeft = svg.style.marginTop = (-box / 2) + 'px';
  }

  /* ── smooth scroll (Lenis), wired to ScrollTrigger ─────────────────────── */
  function scroller() {
    if (F.static || F.reduced || F.nogsap || typeof window.Lenis === 'undefined') return;
    try {
      const lenis = new window.Lenis({ lerp: .1 });
      window.lenis = lenis;
      if (window.ScrollTrigger) { window.gsap.registerPlugin(window.ScrollTrigger); lenis.on('scroll', window.ScrollTrigger.update); }
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
      if (F.menu) lenis.stop();
    } catch (e) { console.warn('lenis', e); }
  }

  /* ── links that go nowhere yet, and in-page scroll ─────────────────────── */
  function links() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#') { e.preventDefault(); return; }                       /* "Soon" projects, data-todo="resume" */
      if (href[0] === '#' && !a.classList.contains('menu-link') && !e.metaKey && !e.ctrlKey) {
        /* the hero is pinned: its measured position is the end of the pin, so "home" is scroll 0; any other pinned
           target resolves through its pin spacer */
        const el = href === '#top' ? null : document.querySelector(href);
        if (href !== '#top' && !el) return;
        e.preventDefault();
        const t = el ? (el.closest('.pin-spacer') || el) : 0;
        /* focus follows the jump (the badge leaves the tab order as the hero stops down), so the next Tab continues
           from the target instead of <body> */
        if (el && a.hasAttribute('data-scroll')) { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
        if (window.lenis) window.lenis.scrollTo(t);
        else if (t === 0) scrollTo({ top: 0, behavior: F.reduced ? 'auto' : 'smooth' });
        else t.scrollIntoView({ behavior: F.reduced ? 'auto' : 'smooth' });
      }
    });
  }

  /* ── the scheme switch (round 4): the keys press, then the page reloads, and a reload moves to the next scheme ── */
  function scheme() {
    const b = $('[data-scheme-next]');
    if (!b) return;
    b.addEventListener('click', () => {
      b.classList.add('is-pressed');
      setTimeout(() => location.reload(), F.reduced ? 0 : 220);
    });
  }

  /* ── boot ───────────────────────────────────────────────────────────────── */
  function boot() {
    scheme();
    /* the subline's knockout copy (like the headline's .knock): a night halo on its own layer under the text */
    const sub = $('.hero-sub');
    if (sub && !$('.hero-sub.knock')) { const k = sub.cloneNode(true); k.classList.add('knock'); k.setAttribute('aria-hidden', 'true'); $$('[role],[aria-label]', k).forEach((e) => { e.removeAttribute('role'); e.removeAttribute('aria-label'); }); sub.after(k); }
    layoutHero();
    scroller();
    services();
    work();
    readout();
    footer();
    links();

    /* the aperture is fixed in the live page: hero-local circles need the scroll offset */
    /* hero-local offset of the fixed aperture: the hero's own scroll displacement (0 while it is pinned) */
    if (!F.still && hero) {
      let last = null;
      const sy = () => { const v = (-hero.getBoundingClientRect().top).toFixed(1); if (v !== last) { last = v; HOME.syv = +v; hero.style.setProperty('--sy', v + 'px'); } };
      HOME.syncSy = sy;
      addEventListener('scroll', sy, { passive: true }); sy();
      if (window.gsap) window.gsap.ticker.add(() => { if (heroVisible) sy(); });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; fieldMode(); if (heroVisible) ringPlay(); }).observe(hero);
      const ft = $('#footer');
      if (ft) new IntersectionObserver(([e]) => { footerVisible = e.isIntersecting; fieldMode(); }).observe(ft);
    }
    FS.on('menu:close', fieldMode);
    FS.on('fonts', () => { layoutHero(); footer(); });
    if ('ResizeObserver' in window) {
      let w0 = html.clientWidth, h0 = innerHeight;
      new ResizeObserver(() => {
        if (html.clientWidth === w0 && Math.abs(innerHeight - h0) < 2) return;
        w0 = html.clientWidth; h0 = innerHeight;
        layoutHero(); footer(); FS.lit.refresh(); ScrollRefresh();
      }).observe(html);
    }
    fieldMode();
    ringPlay();

    const ctx = { FS, HOME, F, hero, $, $$ };
    Object.keys(HOME.stage2).forEach((k) => { try { typeof HOME.stage2[k] === 'function' && HOME.stage2[k](ctx); } catch (e) { console.warn('stage2.' + k, e); } });
    html.classList.add('home-ready');
  }
  FS.on('boot', boot);

  /* QA hooks (stage 2 fills setLoader/skip with the real loader timeline) */
  window.__fs = Object.assign(window.__fs || {}, {
    setLoader: (p) => (HOME.loader && HOME.loader.set ? HOME.loader.set(p) : null),
    skip: () => (HOME.loader && HOME.loader.skip ? HOME.loader.skip() : null),
    openMenu: () => FS.menu.show(),
    closeMenu: () => FS.menu.hide(),
  });
})();
