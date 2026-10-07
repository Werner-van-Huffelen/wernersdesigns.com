/* Full Stop · the handoff (round 5; round 6: the filled light): one light between the homepage and the work pages
 * Werner: "an iris from the card (the card's light disc opens to fill the screen and lands as the page's hero; Next
 * project and back use the same idea)"; round 6: "the background should be completely filled with the gradient", so
 * the light no longer lands in a disc: it is the hero's own. A classic script, loaded synchronously in the head of both
 * pages (index.html after its flags, work.html after js/work-data.js), so part 1 runs before the first paint. Part 2
 * waits for DOMContentLoaded, whose listener here is older than system.js's, so its FS.on('boot') lands behind
 * home.js/work.js.
 *
 *   leave     a plain click on a card (homepage): the disc's own light, a fixed cover (.ho-cover), irises open from the
 *             disc's centre and visible radius to the whole viewport (650ms, the iris curve) while a copy of the device
 *             (.ho-ghost) focuses out into it; then sessionStorage['fs.handoff'] = {slug, t, paint 'disc', and the last
 *             circle: x, y, r, s, hx, hy, vw, vh} and the page goes. Unchanged from round 5.
 *             A plain click on the Next band (work page): the band's light grows to fill the viewport. That light is
 *             the live field itself (WORK.light holds it), lifted over the page (the band's words and the header ride
 *             above it while they focus out) with its clip growing from the band's visible rect to the viewport's
 *             (650ms, the iris curve); then the handoff, paint 'field', and the page goes.
 *             Modifier and middle clicks open normally (on a card's body too).
 *   arrive    work.html sees a fresh handoff (under 4s, the same ?p=) before the first paint: html.is-arriving and a
 *             full-viewport cover painted as the last page ended (the card's disc grown, or the field's light: the
 *             scheme's still, dimmed like the field), from the first frame. At WORK.ready (the hero laid out, fonts in)
 *             and once the hero's own light has drawn, the cover dissolves into it (760ms): nothing moves or shrinks,
 *             and WORK.hero.focusIn() brings the device, copy and meta into focus under it. Without a handoff (a direct
 *             visit, a reload) work.js plays its own intro, the light's iris from the device; never both.
 *   back      the "Selected work" pill, "Back to all work" and the menu's homepage links: sessionStorage['fs.back'] (the
 *             click time), and the page focuses out into the night (a veil under the header) and goes. The homepage's
 *             head then turns its pinhole loader (is-loading) into html.is-back: the night stays up until the section
 *             is landed (after the pins are measured), then lifts, the blur racking out behind it. Other visits keep
 *             the loader.
 *   bleed     (round 7, Werner: "when reloading the page and changing the color scheme can you use the same interaction
 *             as when loading the project pages, full color bleed (of the new color) instead of the percentage loader")
 *             the homepage's reloads that move the scheme on (FS_SCHEME.changed, js/scheme.js; Werner: "keep the original
 *             page load one first loading the page", so a first visit and any other load keep the pinhole loader and
 *             its percentage) where the loader would have played (is-loading, no return): the new scheme's
 *             light irises open from its dot in the eyebrow (the one ⌘R just lit) to the whole viewport, painted like a
 *             card's disc (650ms, the iris curve), inside a cover that is the night itself from the first paint
 *             (Werner: "the colors on the page already change before the animation starts": nothing of the new
 *             scheme shows until its light does). It holds a beat (and while the page loads); js/motion.js waits for
 *             it (window.FS_BLEED.opened) and for the hero's assets, then the light fades out (FS_BLEED.out, 1100ms,
 *             Werner: "a nice fade out effect after the full screen bleed"): a soft dissolve that starts at the
 *             portrait and spreads to the edges, while the hero comes into focus under it. No percentage, no pinhole.
 *   bfcache   pageshow with persisted: no cover, veil, ghost, arriving, loading or back state survives the Back button.
 *   still     ?static=1 and reduced motion: nothing is intercepted, the links just go (the back flag is still set; the
 *             homepage has no loader to skip there, and its own anchor lands the section).
 *
 * The card's cover is painted exactly like the disc it leaves (css/handoff.css), so the two meet without a seam: the
 * scheme's --aurora-lit anchored to the viewport (a 130vw × 130vh sky at the drift offset, like every tracked light),
 * then the project's key (--h1 at --ax/--ay) and fill (--h2, blend color) inside the circle's own square, so at every
 * size it is that disc, grown. It opens off the card, and the next page takes it over where it stopped (same circle,
 * same square, same sky), then dissolves it into the hero's own light (round 6: the hero has no disc to close into).
 * The Next band's leave needs no cover at all: its light is the field, which it grows, and the next page's cover is
 * that field's light as its still.
 *
 * Hooks: FS 'handoff:out' {slug, href}, 'handoff:in' (the cover has dissolved into the hero), 'handoff:back' {href};
 * window.__fs.handoff (QA) = {state(), reset()}.
 */
(function () {
  'use strict';
  const d = document, html = d.documentElement, cl = html.classList, W = window;
  const KEY = 'fs.handoff', BACK = 'fs.back', FRESH = 4000, BACK_FRESH = 8000;
    /* IN: the arrival's dissolve, long enough for the device and the headline's first words to focus in under it */
  const OUT = 650, IN = 760, VEIL = 300, HOLD = 260;   /* HOLD: the bleed's full-screen beat before it fades */
  const onWork = !!(W.WORK && W.WORK.projects);
  const ss = (() => { try { return W.sessionStorage; } catch (e) { return null; } })();
  const get = (k) => { try { return ss ? ss.getItem(k) : null; } catch (e) { return null; } };
  const put = (k, v) => { try { if (ss) ss.setItem(k, v); } catch (e) { /* private mode: the page still goes */ } };
  const drop = (k) => { try { if (ss) ss.removeItem(k); } catch (e) {} };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const slugOf = (href) => { const m = /[?&]p=([a-z0-9-]+)/.exec(href || ''); return m ? m[1] : null; };
  /* the layers are aria-hidden and hide the cursor lens (its target test reads data-cursor) */
  const layer = (cls, inner) => {
    const el = d.createElement('div');
    el.className = cls; el.setAttribute('aria-hidden', 'true'); el.setAttribute('data-cursor', 'hide');
    if (inner) el.innerHTML = inner;
    return el;
  };
  const SKY = '<i class="ho-light"><i class="ho-sky"></i><i class="ho-key"></i><i class="ho-fill"></i></i>';
  const lightOf = (cv) => cv && cv.firstElementChild;
  let cover = null, veil = null, ghostEl = null, anim = null, fadeAnim = null, navT = 0;
  let busy = false, gone = false, arriving = false, motion = false;
  const early = [];                                   /* made before <body> exists: moved into it at DOMContentLoaded */
  /* QA: sessionStorage['fs.slow'] = n runs the irises n× slower on every page of the tab (the veil is CSS, unscaled);
     __fs.handoff.state().log has what happened when (performance.now() of this page) */
  const slow = () => Math.min(20, Math.max(1, +get('fs.slow') || 1)), log = [];
  const note = (k) => log.push(k + ' ' + Math.round(performance.now()));

  /* ── 1 · before the first paint ────────────────────────────────────────────────────────────────────────────
     work.html: a fresh handoff for this very page raises the cover, and the hero's light is on under it (js/work.js
     opens the field on the hero rect instead of waiting for its intro). Only where the hero waits for an intro at all
     (hero-pre: not static, reduced or ?menu). The handoff is consumed either way, so a reload plays the plain intro.
     From a card, the cover starts as the circle the last page ended on (its centre and radius, its key/fill box, its sky
     offset), so the first frame here is that page's last one; a handoff without it (or from another window size)
     starts from a circle over the viewport. From the Next band, it is the field's light (paint 'field', css/handoff.css
     .ho-cover--field), the whole viewport. The layer is appended to <html> itself: <body> does not exist yet, and the
     parser appends it after this node. */
  let from = null;
  if (onWork) {
    let h = null;
    try { h = JSON.parse(get(KEY) || 'null'); } catch (e) {}
    drop(KEY);
    const slug = slugOf(location.search), p = slug && W.WORK.projects[slug], age = h && h.t ? Date.now() - h.t : -1;
    if (p && h && h.slug === slug && age >= 0 && age < FRESH && cl.contains('hero-pre')) {
      const field = h.paint === 'field';
      cl.add('is-arriving'); note('cover ' + (field ? 'field' : 'disc'));
      cover = layer('ho-cover is-on' + (field ? ' ho-cover--field' : ''), SKY);
      if (W.WORK.util && W.WORK.util.hue) cover.setAttribute('style', W.WORK.util.hue(p.hue));
      const vw = html.clientWidth, vh = innerHeight, same = Math.abs(h.vw - vw) < 2 && Math.abs(h.vh - vh) < 2 && h.r > 0;
      from = same ? { x: +h.x, y: +h.y, r: +h.r, s: Math.max(+h.s || 0, +h.r), hx: +h.hx || 0, hy: +h.hy || 0 }
        : { x: vw / 2, y: vh / 2, r: Math.hypot(vw, vh) / 2 + 2, s: Math.hypot(vw, vh) / 2 + 2, hx: 0, hy: 0 };
      if (!field) paint(cover, from.x, from.y, from.r, from.s, from.hx, from.hy);
      html.appendChild(cover); early.push(cover);
      /* scripts that never arrive: the page comes back by itself (before the flags' own 5s hero bail) */
      setTimeout(() => { if (cl.contains('is-arriving') && !arriving) bail(); }, 4500);
    }
  } else {
    /* index.html: a fresh back flag with a section to land on turns the pinhole loader into html.is-back. The flags
       script above only sets is-loading where a loader would play (not static, reduced or ?menu), so that is the test;
       its own 7s bail then finds nothing to lift. */
    const t = +get(BACK), hash = location.hash;
    drop(BACK);
    if (t && Date.now() - t >= 0 && Date.now() - t < BACK_FRESH && /^#[a-z][\w-]*$/i.test(hash) && cl.contains('is-loading')) {
      cl.remove('is-loading'); cl.add('is-back'); note('back ' + hash);
      veil = layer('ho-veil is-on');
      html.appendChild(veil); early.push(veil);
      setTimeout(() => { if (cl.contains('is-back')) lift(); }, 3500);
    }
    /* a reload that moved the scheme on, where the loader would play: the bleed. Its cover is the night from the first
       paint and its light opens once the page is laid out (boot). Every other visit keeps the pinhole loader */
    if (cl.contains('is-loading') && W.FS_SCHEME && W.FS_SCHEME.changed) {
      cl.add('is-bleed'); note('bleed');
      /* the cover is the night, opaque (its own background); only its light is clipped, so the page in the new
         scheme stays hidden until the light has opened over it */
      cover = layer('ho-cover ho-cover--bleed is-on', SKY);
      lightOf(cover).style.clipPath = 'circle(0px at 50% 50%)';
      html.appendChild(cover); early.push(cover);
      let opened = null;
      W.FS_BLEED = { opened: new Promise((r) => { opened = r; }), out: bleedOut };
      W.FS_BLEED.open = () => opened();
      /* scripts that never arrive: the night comes back by itself (before the flags' 7s loader bail); once
         js/motion.js has taken the bleed over (claimed) its own failsafe runs it instead */
      setTimeout(() => { if (cl.contains('is-bleed') && !W.FS_BLEED.claimed) bleedOut(0); }, 6500);
    }
  }

  /* ── 2 · wiring, once the core boots ─────────────────────────────────────────────────────────────────────── */
  d.addEventListener('DOMContentLoaded', () => {
    early.forEach((el) => d.body.appendChild(el));
    const FS = W.FS;
    if (!FS || !FS.on) { if (cl.contains('is-arriving')) bail(); if (cl.contains('is-back')) lift(); if (cl.contains('is-bleed')) bleedOut(0); return; }
    FS.on('boot', boot);
  });
  function boot() {
    const FS = W.FS, F = FS.flags || {};
    motion = !F.static && !F.reduced;
    d.addEventListener('click', onClick, true);
    d.addEventListener('auxclick', onAux, true);
    note('boot');
    if (onWork) { if (cl.contains('is-arriving')) Promise.resolve(W.WORK.ready).then(() => { note('ready'); arrive(); }, bail); }
    else if (cl.contains('is-back')) land();
    else if (cl.contains('is-bleed')) bleedOpen();
    W.__fs = Object.assign(W.__fs || {}, { handoff: { state, reset } });
  }
  const state = () => ({ busy, gone, arriving, motion, cover: !!(cover && cover.classList.contains('is-on')),
    veil: !!(veil && veil.classList.contains('is-on')), ghost: !!ghostEl,
    classes: ['is-arriving', 'is-back', 'is-bleed', 'is-loading', 'hero-pre'].filter((c) => cl.contains(c)),
    handoff: get(KEY), back: get(BACK), log: log.slice() });

  /* ── 3 · clicks (capture, so a card's own forwarder never sees the ones taken here) ───────────────────────── */
  const mod = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0;
  const cardBtn = (card) => card && card.querySelector('a.wc-btn[href*="work.html?p="]');
  function onClick(e) {
    if (e.defaultPrevented || !e.target || !e.target.closest) return;
    const a = e.target.closest('a[href]');
    if (busy) { if (a) e.preventDefault(); return; }     /* on the way out already (a key can still reach a link) */
    /* back: the pills, and on a work page the menu's homepage links (About, Case studies, Companies): a return to the
       homepage like the pills, so they land their section at once instead of replaying the loader in front of it */
    if (a && (a.hasAttribute('data-back') || (onWork && a.classList.contains('menu-link') && /^index\.html#[a-z]/i.test(a.getAttribute('href'))))) {
      if (mod(e)) return;                                 /* a new tab: a normal visit, with its loader */
      put(BACK, String(Date.now()));
      if (!motion) return;
      e.preventDefault();
      back(a.href);
      return;
    }
    if (onWork) {
      const n = W.WORK.next;
      if (!motion || !n || !n.link || a !== n.link || mod(e)) return;
      e.preventDefault(); e.stopPropagation();
      leaveNext(n);
      return;
    }
    /* the homepage: the whole card is its button's link (js/home.js forwards a click on its body to it) */
    const card = e.target.closest('.work-card'), btn = cardBtn(card);
    if (!btn || (a && a !== btn)) return;
    if (mod(e)) {
      /* on the button the browser opens its new tab itself; on the body the forwarder would turn it into a plain click */
      if (!a) { e.preventDefault(); e.stopPropagation(); W.open(btn.href, '_blank', 'noopener'); }
      return;
    }
    if (!motion) return;                                  /* the link (or the forwarder) just goes */
    e.preventDefault(); e.stopPropagation();
    leaveCard(card, btn);
  }
  /* a middle click on a card's body opens it in a new tab, as it would on a link */
  function onAux(e) {
    if (onWork || e.button !== 1 || !e.target || !e.target.closest || e.target.closest('a')) return;
    const btn = cardBtn(e.target.closest('.work-card'));
    if (!btn) return;
    e.preventDefault();
    W.open(btn.href, '_blank', 'noopener');
  }

  /* ── 4 · leave (the homepage's cards): the disc opens into the cover ─────────────────────────────────────────
     The cover starts as the disc itself (its centre, its visible radius, its box for the key and fill, the page's drift
     offset for the sky, its breathing opacity), so the first frame changes nothing; the disc under it is hidden
     (is-handoff), or the two would add up. Then the circle opens to the farthest corner on the iris curve and its opacity
     to 1. The key and fill box grows with it, always the circle's own square (times the disc's box over its visible
     radius, 1/.92 at rest): a box smaller than the circle showed its edges as a lit rectangle. The sky keeps following
     the page's drift, as the card's own light does. The last circle and sky go into the handoff, where the next page's
     cover starts from them. */
  /* the disc's visible radius in viewport px: its clip (46% at rest, 50% + 56px hovered, anything between while it
     eases), never past its own edge (border-radius), times the rack's scale on the card */
  function apR(ap) {
    const b = ap.getBoundingClientRect(), D = ap.offsetWidth || b.width, k = D ? b.width / D : 1;
    const m = /circle\(\s*(?:calc\()?\s*(-?[\d.]+)%\s*(?:([+-])\s*([\d.]+)px)?/.exec(getComputedStyle(ap).clipPath || '');
    const r = m ? D * m[1] / 100 + (m[2] ? (m[2] === '-' ? -1 : 1) * m[3] : 0) : .46 * D;
    return Math.min(r, D / 2) * k;
  }
  /* a rack window (circle(Rpx at x y) on .wc-zoom or .st-dev) in viewport px, or null when it is open ('none') */
  function winOf(el) {
    if (!el) return null;
    const m = /circle\(\s*([\d.]+)px\s+at\s+(-?[\d.]+)(px|%)\s+(-?[\d.]+)(px|%)/.exec(getComputedStyle(el).clipPath || '');
    if (!m) return null;
    const b = el.getBoundingClientRect(), k = el.offsetWidth ? b.width / el.offsetWidth : 1;
    const at = (v, u, o, size) => o + (u === '%' ? size * v / 100 : v * k);
    return { x: at(+m[2], m[3], b.left, b.width), y: at(+m[4], m[5], b.top, b.height), R: +m[1] * k };
  }
  function leaveCard(card, btn) {
    const ap = card.querySelector('.wc-ap'), media = card.querySelector('.wc-media'), slug = slugOf(btn.getAttribute('href'));
    if (!ap || !media || !slug) { location.assign(btn.href); return; }
    const cs = getComputedStyle(card);
    leave({ href: btn.href, slug, host: card, keep: card, disc: ap, r: apR(ap), tone: card,
      ghost: { box: media, radius: cs.borderTopLeftRadius + ' ' + cs.borderTopRightRadius + ' 0 0', win: winOf(card.querySelector('.wc-zoom')),
        parts: Array.from(media.querySelectorAll('.wc-halo, .wc-soft, .wc-sharp')) } });
  }
  /* the Next band (round 6): its light is the live field, which already fills it, so the leave grows that very light:
     the field is lifted over the page (z 95, under the band and the header, which ride above it at 96 and 97 while
     they focus out) and its clip grows from the band's visible rect to the whole viewport. The band's veil lifts, its
     words and device blur out, the header fades; nothing is copied, so the first frame changes nothing. Works the same
     on the field's still (no WebGL). */
  function leaveNext(n) {
    const FS = W.FS, E = FS.ease, band = n.el, f = FS.field, L = W.WORK && W.WORK.light;
    if (!band || !f || !f.el || !n.slug) { location.assign(n.link.href); return; }
    busy = true;
    const vw = html.clientWidth, vh = innerHeight, b = band.getBoundingClientRect();
    const t0 = clamp(b.top, 0, vh), b0 = clamp(vh - b.bottom, 0, vh);
    if (L) L.hold();
    keepHover(n.link);
    cl.add('is-leaving');
    f.setMode('full'); f.play(); f.el.style.zIndex = '95';
    const parts = Array.from(band.querySelectorAll('.nx-copy, .nx-stage, .nx-go, .nx-label, .nx-back, .w-veil'));
    parts.forEach((el) => el.setAttribute('data-ho', ''));
    head = d.querySelector('.site-header');
    hold();
    const draw = (t) => {
      const e = E.iris(t), fo = E.focus(Math.min(1, t / .7)), op = (1 - E.smoothstep(.1, .75, t)).toFixed(3);
      f.setClip(`inset(${lerp(t0, 0, e).toFixed(1)}px 0 ${lerp(b0, 0, e).toFixed(1)}px 0)`);
      parts.forEach((el) => {
        if (el.classList.contains('w-veil')) { el.style.opacity = (1 - fo).toFixed(3); return; }
        el.style.filter = fo < .002 ? '' : `blur(${(16 * fo).toFixed(2)}px)`; el.style.opacity = op;
      });
      if (head) head.style.opacity = (1 - E.smoothstep(0, .5, t)).toFixed(3);
    };
    draw(0);
    FS.emit('handoff:out', { slug: n.slug, href: n.link.href });
    const go = () => {
      clearTimeout(navT);
      if (gone) return;
      gone = true; note('go');
      put(KEY, JSON.stringify({ slug: n.slug, t: Date.now(), paint: 'field', vw, vh }));
      location.assign(n.link.href);
    };
    note('out ' + n.slug);
    anim = run(OUT * slow(), draw, go);
    navT = setTimeout(go, OUT * slow() + 250);                      /* a hidden tab pauses rAF: the page still goes */
  }
  function leave(o) {
    if (busy) return;
    busy = true;
    const FS = W.FS, E = FS.ease, cv = coverEl();
    const cs = getComputedStyle(o.tone);
    ['--h1', '--h2', '--ax', '--ay'].forEach((k) => { const v = cs.getPropertyValue(k).trim(); if (v) cv.style.setProperty(k, v); else cv.style.removeProperty(k); });
    const b = o.disc.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const vw = html.clientWidth, vh = innerHeight, rMax = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 2;
    const k = Math.max(1, b.width / 2 / Math.max(1, o.r)), op0 = parseFloat(getComputedStyle(o.disc).opacity);
    let sky = FS.driftPx(performance.now()), r = o.r;
    const op = op0 > 0 && op0 < 1 ? op0 : 1;
    const g = o.ghost ? ghost(o.ghost) : null;
    o.host.classList.add('is-handoff');
    keepHover(o.keep);
    if (lightOf(cv)) lightOf(cv).style.opacity = '';
    cv.classList.add('is-on');
    hold();
    const draw = (t) => {
      r = lerp(o.r, rMax, E.iris(t)); sky = FS.driftPx(performance.now());
      paint(cv, cx, cy, r, r * k, sky.x, sky.y);
      cv.style.opacity = t < .3 ? lerp(op, 1, E.smoothstep(0, .3, t)).toFixed(3) : '';
      if (g) g.draw(t);
    };
    draw(0);
    FS.emit('handoff:out', { slug: o.slug, href: o.href });
    const go = () => {
      clearTimeout(navT);
      if (gone) return;
      gone = true; note('go');
      put(KEY, JSON.stringify({ slug: o.slug, t: Date.now(), paint: 'disc', x: +cx.toFixed(1), y: +cy.toFixed(1), r: +rMax.toFixed(1), s: +(rMax * k).toFixed(1),
        hx: +sky.x.toFixed(1), hy: +sky.y.toFixed(1), vw, vh }));
      location.assign(o.href);
    };
    note('out ' + o.slug);
    anim = run(OUT * slow(), draw, go);
    navT = setTimeout(go, OUT * slow() + 250);                      /* a hidden tab pauses rAF: the page still goes */
  }
  /* the device's copy, over the cover: its halo, soft and sharp layers at their boxes and opacities, in its media box
     and rack window. It focuses out: true colour hands over to the scheme-tinted soft layer (first half), the blur
     grows to 18px (first 80%), and it dissolves into the light (from 28%). */
  function ghost(o) {
    const b = o.box.getBoundingClientRect(), g = layer('ho-ghost'), w = d.createElement('div');
    w.className = 'ho-win';
    Object.assign(g.style, { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: o.radius || '' });
    if (o.win) w.style.clipPath = `circle(${o.win.R.toFixed(1)}px at ${(o.win.x - b.left).toFixed(1)}px ${(o.win.y - b.top).toFixed(1)}px)`;
    g.appendChild(w);
    const COPY = ['objectFit', 'objectPosition', 'backgroundImage', 'maskSize', 'maskPosition', 'maskRepeat', 'webkitMaskSize', 'webkitMaskPosition', 'webkitMaskRepeat'];
    const parts = o.parts.map((el) => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el), c = el.cloneNode(false);
      ['id', 'loading', 'fetchpriority', 'data-loupe'].forEach((k) => c.removeAttribute(k));
      if (c.tagName === 'IMG') c.alt = '';
      c.className = 'ho-part';
      Object.assign(c.style, { left: (r.left - b.left).toFixed(1) + 'px', top: (r.top - b.top).toFixed(1) + 'px', width: r.width.toFixed(1) + 'px', height: r.height.toFixed(1) + 'px' });
      COPY.forEach((k) => { if (s[k]) c.style[k] = s[k]; });
      const o0 = parseFloat(s.opacity) || 0;
      c.style.opacity = o0.toFixed(3);
      w.appendChild(c);
      return { el: c, o: o0, soft: /(^|\s)(wc|st)-soft(\s|$)/.test(el.className) };
    });
    d.body.appendChild(g);
    ghostEl = g;
    return {
      draw(t) {
        const E = W.FS.ease, s = E.focus(Math.min(1, t / .5)), f = E.focus(Math.min(1, t / .8));
        g.style.filter = f < .002 ? '' : `blur(${(18 * f).toFixed(2)}px)`;
        g.style.opacity = (1 - E.smoothstep(.28, .92, t)).toFixed(3);
        parts.forEach((p) => { p.el.style.opacity = (p.soft ? lerp(p.o, 1, s) : p.o * (1 - s)).toFixed(3); });
      },
    };
  }

  /* ── 5 · arrive: the cover dissolves into the hero's own light ──────────────────────────────────────────────
     The hero is filled with the same light the cover holds (the field, or its still), so the arrival moves nothing: once
     the hero's light has drawn its first frame (WORK.light.ready, 600ms at most), the cover fades out over it (760ms)
     while WORK.hero.focusIn() brings the device, the copy and the meta into focus, so the page comes into focus out of
     the light it was handed. Landed, is-arriving goes and the page scrolls again. */
  function arrive() {
    const FS = W.FS, WORK = W.WORK, H = WORK && WORK.hero;
    if (arriving || !cl.contains('is-arriving')) return;
    if (!FS || !cover || !H || !H.focusIn) { bail(); return; }
    arriving = true; note('in');
    hold();
    const ready = WORK.light && WORK.light.ready ? WORK.light.ready() : Promise.resolve();
    ready.then(() => {
      if (!cl.contains('is-arriving')) return;                    /* reset (bfcache) in the meantime */
      note('light');
      try { H.focusIn(); } catch (e) { console.warn(e); }
      cl.remove('hero-pre');
      fadeCover(IN * slow(), () => { cl.remove('is-arriving'); arriving = false; note('landed'); release(); FS.emit('handoff:in'); }, 'cubic-bezier(.45,0,.3,1)');
    });
  }
  /* anything wrong on the way in: the cover goes, the hero comes in by itself */
  function bail() {
    if (anim) { anim.kill(); anim = null; }
    const H = W.WORK && W.WORK.hero;
    if (cl.contains('hero-pre')) { try { if (H && H.focusIn && W.FS) H.focusIn(); } catch (e) {} cl.remove('hero-pre'); }
    fadeCover(0);
    cl.remove('is-arriving');
    arriving = false;
    release();
  }

  /* ── 6 · back: the page focuses out into the night, the homepage lands its section and lifts it ───────────── */
  function back(href) {
    busy = true;
    const v = veilEl();
    void getComputedStyle(v).opacity;                     /* start the transition from the veil's off state */
    v.classList.remove('is-lift'); v.classList.add('is-on');
    hold();
    W.FS.emit('handoff:back', { href });
    const go = () => { clearTimeout(navT); if (gone) return; gone = true; location.assign(href); };
    navT = setTimeout(go, VEIL + 20);
  }
  /* the homepage, html.is-back: after home.js and motion.js have booted (the pins exist), refresh them, land the
     section at the top (a pinned target through its spacer, as home.js links() does), and follow it while the webfonts
     and the load event's refresh can still move it, until the first input or 2.5s. The veil lifts once the images in
     view have decoded (450ms at most). The section takes focus (no ring: tabindex -1), so the next Tab starts there. */
  function land() {
    note('land');
    const FS = W.FS, ST = W.ScrollTrigger;
    let el = null;
    try { el = d.querySelector(location.hash); } catch (e) {}
    if (!el) { lift(); return; }
    const target = el.closest('.pin-spacer') || el;
    let follow = true;
    const stop = () => { follow = false; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((k) => addEventListener(k, stop, { capture: true, passive: true, once: true }));
    const to = () => {
      if (!follow) return;
      const y = Math.max(0, Math.round(target.getBoundingClientRect().top + scrollY));
      if (Math.abs(scrollY - y) > .5) { if (W.lenis) W.lenis.scrollTo(y, { immediate: true, force: true }); else W.scrollTo(0, y); }
      if (W.HOME && W.HOME.readout) W.HOME.readout();
      if (el.dataset.f && FS.readout) FS.readout.set(+el.dataset.f, { instant: true });
      if (FS.header) FS.header.update();
    };
    if (ST) { try { ST.refresh(); } catch (e) {} ST.addEventListener('refresh', to); }
    FS.on('fonts', to);
    to();
    setTimeout(() => { follow = false; if (ST) ST.removeEventListener('refresh', to); }, 2500);
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (e) {}
    const vh = innerHeight, imgs = Array.from(el.querySelectorAll('img')).filter((im) => {
      const r = im.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < vh;
    });
    const decoded = Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
    Promise.race([decoded, new Promise((r) => setTimeout(r, 450))]).then(() => requestAnimationFrame(() => { to(); lift(); }));
  }
  /* the night lifts first, the blur racks out behind it (css/handoff.css .is-lift); the header pill, hidden while it
     still named the hero, focuses in with it */
  function lift() {
    note('lift');
    const FS = W.FS, was = cl.contains('is-back');
    cl.remove('is-back');
    if (veil && veil.classList.contains('is-on')) {
      veil.classList.add('is-lift'); veil.classList.remove('is-on');
      setTimeout(() => { if (veil && !veil.classList.contains('is-on')) veil.classList.remove('is-lift'); }, 800);
    }
    const pill = d.querySelector('.site-header .f-pill');
    if (was && pill && FS && FS.reveal) FS.reveal.focus([pill], { blur: 8, dur: 420, delay: 140 });
  }

  /* ── 6b · bleed (round 7): the new scheme's light opens from its dot to the whole viewport, then dissolves ─────
     It is painted like a card's disc grown (the scheme's sky at the page's drift, its key and fill in the circle's own
     square, the project hues left at their defaults: the scheme's iris and glacier), so it is the same light the
     project pages arrive in. It opens from the lit dot in the hero's eyebrow, the scheme ⌘R just moved to (hidden
     under is-loading, but laid out), or from the centre where the eyebrow is out of view. */
  function bleedOpen() {
    const FS = W.FS, E = FS && FS.ease, B = W.FS_BLEED, cv = cover;
    if (!B) return;
    if (!cv || !E || !FS.driftPx) { B.open(); return; }
    hold();
    const vw = html.clientWidth, vh = innerHeight, dot = d.querySelector('.hero-eyebrow .eb-dots i.is-on');
    const b = dot && dot.getBoundingClientRect(), seen = b && b.width > 0 && b.bottom > 0 && b.top < vh;
    const cx = seen ? b.left + b.width / 2 : vw / 2, cy = seen ? b.top + b.height / 2 : vh / 2, r0 = seen ? b.width / 2 : 0;
    const rMax = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 2;
    const lt = lightOf(cv);
    const draw = (t) => {
      const r = lerp(r0, rMax, E.iris(t)), sky = FS.driftPx(performance.now());
      paint(lt, cx, cy, r, r / .92, sky.x, sky.y);
    };
    draw(0);
    note('open ' + (seen ? 'dot' : 'centre'));
    /* open, then the full-screen light holds a beat before it may go (the bleed reads as one, not a flash) */
    anim = run(OUT * slow(), draw, () => {
      anim = null; note('bled');
      lt.style.clipPath = 'none';
      setTimeout(() => B.open(), HOLD * slow());
    });
  }
  /* the fade out: a soft-edged hole opens in the cover at the portrait (the hero's aperture, where the eye lands) and
     spreads past the farthest corner, its edge a wide feather (80% of that distance), while the whole light dims from a
     quarter of the way in, so it reads as the light fading from the middle outwards, not a hole cut through it. The cover's own mask, written per
     frame on the run() clock; ms 0 takes it away at once (a skip, a bail). */
  function bleedOut(ms, done) {
    if (anim) { anim.kill(); anim = null; }
    if (W.FS_BLEED && W.FS_BLEED.open) W.FS_BLEED.open();
    const cv = cover, E = W.FS && W.FS.ease;
    const end = () => { cl.remove('is-bleed'); note('bleed out'); release(); if (done) done(); };
    if (!ms || !cv || !E || !cv.classList.contains('is-on')) { fadeCover(0, end); return; }
    /* the aperture's own circle (HOME.aperture, viewport px; the portrait link's box is the whole hero) */
    const vw = html.clientWidth, vh = innerHeight, A = W.HOME && W.HOME.aperture;
    const seen = A && A.r > 1 && A.cy > 0 && A.cy < vh;
    const cx = seen ? A.cx : vw / 2, cy = seen ? A.cy : vh / 2;
    const far = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)), F = .8 * far;
    const st = cv.style;
    const draw = (t) => {
      const r = lerp(-F, far, E.smoothstep(0, 1, t));
      const m = `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px,#0000 ${Math.max(0, r).toFixed(1)}px,#000 ${Math.max(0, r + F).toFixed(1)}px)`;
      st.webkitMaskImage = m; st.maskImage = m;
      st.opacity = t < .25 ? '' : (1 - E.smoothstep(.25, 1, t)).toFixed(3);
    };
    draw(0);
    note('fade ' + (seen ? 'portrait' : 'centre'));
    anim = run(ms * slow(), draw, () => { anim = null; fadeCover(0, end); });
  }

  /* ── 7 · the layers and their painter ──────────────────────────────────────────────────────────────────────── */
  function coverEl() {
    if (!cover) { cover = layer('ho-cover', SKY); d.body.appendChild(cover); }
    if (fadeAnim) { fadeAnim.cancel(); fadeAnim = null; }
    return cover;
  }
  function veilEl() {
    if (!veil) { veil = layer('ho-veil'); d.body.appendChild(veil); }
    return veil;
  }
  /* one writer: the circle (viewport px), the key/fill box (a square of half-side s about the same centre), the sky's
     drift offset. A function declaration, so part 1 can paint the arrival's first frame before the rest is defined. */
  function paint(cv, x, y, r, s, hx, hy) {
    const st = cv.style;
    st.clipPath = `circle(${Math.max(0, r).toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
    st.setProperty('--bx', (x - s).toFixed(1) + 'px'); st.setProperty('--by', (y - s).toFixed(1) + 'px');
    st.setProperty('--bw', (2 * s).toFixed(1) + 'px'); st.setProperty('--bh', (2 * s).toFixed(1) + 'px');
    st.setProperty('--hx', hx.toFixed(1) + 'px'); st.setProperty('--hy', hy.toFixed(1) + 'px');
  }
  /* the fade holds the cover at 0 for one more frame before it goes (is-on off, its clip and box cleared), so taking
     away a full-viewport blended layer never lands in the same frame as the fade's last step (WebKit showed a
     96–194ms stall right at the landing, mid focus-in; unverified in Safari itself, cheap either way) */
  function fadeCover(ms, done, easing) {
    const cv = cover;
    const end = () => {
      if (fadeAnim) { fadeAnim.cancel(); fadeAnim = null; }
      if (cv) {
        cv.classList.remove('is-on', 'ho-cover--bleed');
        ['clip-path', 'opacity', 'will-change', 'mask-image', '-webkit-mask-image', '--bx', '--by', '--bw', '--bh', '--hx', '--hy'].forEach((k) => cv.style.removeProperty(k));
        /* the bleed painted its light, not the cover: a card's leave reuses this cover, unclipped */
        const lt = lightOf(cv);
        if (lt) ['opacity', 'clip-path', '--bx', '--by', '--bw', '--bh', '--hx', '--hy'].forEach((k) => lt.style.removeProperty(k));
      }
      if (done) done();
    };
    if (!cv || !ms || !cv.animate || !cv.classList.contains('is-on')) { end(); return; }
    if (fadeAnim) fadeAnim.cancel();
    cv.style.willChange = 'opacity';
    const a = (fadeAnim = cv.animate([{ opacity: getComputedStyle(cv).opacity }, { opacity: 0 }], { duration: ms, easing: easing || 'linear', fill: 'forwards' }));
    a.onfinish = () => requestAnimationFrame(() => { if (fadeAnim === a) end(); });
  }
  /* the cover takes the pointer, so what was clicked would see a pointerleave and play its hover out under the growing
     light (the card's arrow going dark as you press it). A capture listener on the element itself runs before its own
     listeners (capture first at the target) and swallows it until reset. */
  let kept = null, head = null;
  const swallow = (e) => e.stopImmediatePropagation();
  function keepHover(el) {
    if (!el) return;
    kept = el;
    el.addEventListener('pointerleave', swallow, true);
  }
  /* while a layer is up nothing scrolls under it and the lens closes. Called once the layer is on: it takes the
     pointer (data-cursor=hide), and retarget() re-reads what is under it and runs the cursor's springs, which a mode
     change alone does not start */
  function hold() {
    const FS = W.FS;
    if (W.lenis) W.lenis.stop();
    if (FS && FS.cursor && FS.cursor.enabled) { if (FS.cursor.setMode) FS.cursor.setMode('hide', null); if (FS.cursor.retarget) FS.cursor.retarget(); }
  }
  function release() {
    const FS = W.FS;
    if (W.lenis && !(FS && FS.menu && FS.menu.busy)) W.lenis.start();
    if (FS && FS.cursor && FS.cursor.enabled && FS.cursor.retarget) FS.cursor.retarget();
  }
  /* a tween on rAF and the core's curves (no GSAP: the handoff must work even where the CDN did not) */
  /* the clock starts on the first frame, not at the call: a call made in a heavy frame (the homepage's boot) would
     otherwise spend the opening's first 50–100ms before anything is drawn and then jump */
  function run(ms, fn, done) {
    let t0 = 0, raf = 0, dead = false, n = 0, prev = 0, gap = 0, at = 0;
    const step = (now) => {
      raf = 0;
      if (dead) return;
      if (!t0) t0 = now;
      const t = Math.min(1, Math.max(0, (now - t0) / ms));
      if (prev && now - prev > gap) { gap = now - prev; at = t; }
      prev = now; n++;
      fn(t);
      if (t < 1) raf = requestAnimationFrame(step);
      else { dead = true; note('frames ' + n + ' worst ' + Math.round(gap) + ' at ' + at.toFixed(2)); if (done) done(); }
    };
    raf = requestAnimationFrame(step);
    return { kill() { dead = true; cancelAnimationFrame(raf); } };
  }

  /* ── 8 · bfcache: Back restores the page as it was frozen, cover and all. Everything goes: the tween and its
     fallback timer (a frozen timer would fire on restore and leave again), the ghost, the hidden originals, the covers
     (a quick fade, not a pop), the flags, the loader (skipped to its end if it was still running). ── */
  function reset() {
    note('reset');
    if (anim) { anim.kill(); anim = null; }
    clearTimeout(navT); navT = 0;
    busy = false; gone = false; arriving = false;
    drop(KEY); drop(BACK);
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
    d.querySelectorAll('.is-handoff').forEach((el) => el.classList.remove('is-handoff'));
    if (kept) {
      kept.removeEventListener('pointerleave', swallow, true);
      /* the leave it swallowed, now, if the pointer is no longer on it (Back puts the page back as it was frozen) */
      if (!kept.matches(':hover') && typeof PointerEvent === 'function') kept.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
      kept = null;
    }
    fadeCover(240);
    if (veil && veil.classList.contains('is-on')) { veil.classList.add('is-lift'); veil.classList.remove('is-on'); }
    /* the Next band's leave: the header and the band's parts come back (js/work.js restores the field and its clip) */
    if (head) { head.style.opacity = ''; head = null; }
    cl.remove('is-arriving', 'is-back', 'is-leaving', 'is-bleed');
    const HOME = W.HOME;
    if (HOME && HOME.loader && !HOME.loader.done && HOME.loader.skip) { try { HOME.loader.skip(); } catch (e) {} }
    cl.remove('is-loading');
    release();
  }
  W.addEventListener('pageshow', (e) => { if (e.persisted) reset(); });
})();
