/* Full Stop · work pages · the decision illustrations (round 5)
 * Fills the decisions that have no image: figure.dec-illus[data-illus="<slug>-<n>"] (js/work-data.js writes the slot,
 * css/work.css keeps its 4:3 box, css/work-illus.css draws the diagrams). Deferred, after js/work.js: it builds at once
 * (the DOM is parsed and FS has not booted yet, so FS.lit.scan and FS.probe at boot see the new lights), then animates
 * from FS 'work:boot'. The finished diagram is the resting state; live (not static, not reduced) each one sets its own
 * start state and plays once its card is well in view, after the core has focused the card in.
 *
 *   affinidi-2   White-label as the proof of concept: one component, five duplicates, each re-lit by one of the site's
 *                five ⌘R schemes (the same idea: same system, different brand); the duplicates come out from under it
 *                and their lights iris open. Ring text: ADAPT WITHOUT FORKING.
 *   goodworker-1 Scope the MVP to three screens: three flows racked into focus on one hairline, everything else the same
 *                light out of focus behind them.
 *   heycar-2     Contextual tips over permanent tooltips: a path of five steps; the header's own readout pill opens as a
 *                tip on its step only, as a lit disc walks the path (live), both standing open at rest.
 *
 * Copy: every visible word is taken from the decision's own body (WORK.p.decisions[n - 1].body, verbatim from
 * src/components/projects-data.ts); a label that is not in it is dropped, never shown. The data has no captions for
 * these, so there is no <figcaption>: the figure carries an sr-only description and its drawing is aria-hidden.
 */
(function () {
  'use strict';
  const FS = window.FS, WORK = window.WORK;
  if (!FS || !WORK || !WORK.p || !WORK.util) return;
  const html = document.documentElement;
  const { clamp } = FS.util;
  const { esc, ARR } = WORK.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ── the five schemes' lights, read from css/system.css itself (§1b), so no colour is restated here: the violet
     tokens are its :root, the rest html[data-theme=<id>]. --aurora-lit's own declaration (with its var()s) is copied
     too, so each copy recomputes the aurora from its own tokens. If the rules cannot be read (file://), the copies all
     take the page's light, and none is marked as the current one. ── */
  function schemes() {
    const ids = (window.FS_SCHEME && window.FS_SCHEME.list) || ['violet', 'ember', 'cobalt', 'sodium', 'borealis'];
    const keys = ['iris', 'glacier', 'orchid', 'pearl', 'lit-1', 'lit-2', 'lit-3'];
    const found = {};
    let aurora = '';
    Array.from(document.styleSheets).forEach((sh) => {
      let rules = null;
      try { rules = sh.cssRules; } catch (e) { return; }
      if (!rules) return;
      Array.from(rules).forEach((r) => {
        if (!r.style || !r.selectorText) return;
        const m = /^html\[data-theme="?([a-z]+)"?\]$/.exec(r.selectorText);
        const root = !m && r.selectorText === ':root' && r.style.getPropertyValue('--iris');
        if (!m && !root) return;
        const id = m ? m[1] : 'violet';
        if (root && !aurora) aurora = r.style.getPropertyValue('--aurora-lit').trim();
        const t = found[id] || (found[id] = {});
        keys.forEach((k) => { const v = r.style.getPropertyValue('--' + k).trim(); if (v) t[k] = v; });
      });
    });
    return aurora && ids.every((id) => found[id] && found[id].iris) ? { ids, t: found, aurora } : { ids, t: null, aurora: '' };
  }

  /* verbatim guard: a label shows only if its words are the body's own (case aside, for the ring's capitals) */
  const said = (body) => (t) => (body.toLowerCase().indexOf(String(t).toLowerCase()) >= 0 ? t : '');
  /* micro labels are set in sentence case (the site's mono rule): the body's own words, their first letter capitalised
     where they are shown (said() is case-blind, so the guard is unchanged) */
  const cap = (t) => (t ? String(t).charAt(0).toUpperCase() + String(t).slice(1) : t);
  const note = (t, end) => (t ? '<span class="il-note' + (end ? ' il-note--end' : '') + '">' + esc(cap(t)) + '</span>' : '');
  const sr = (t) => '<p class="sr-only">' + esc(t) + '</p>';

  /* play once the card is well in view (its top past 62% of the viewport: a phone's card is then whole, a desktop
     one shows its centre), after the core's own focus-in of the card (top 88%). Already past it (a restored scroll):
     the end state at once. */
  function onView(fig, play, finish) {
    const ST = window.ScrollTrigger;
    const r = fig.getBoundingClientRect();
    if (r.bottom < 0) { finish(); return; }
    if (r.top < innerHeight * .62) { play(); return; }
    ST.create({ trigger: fig, start: 'top 62%', once: true, onEnter: play });
  }
  const E = FS.ease;

  /* ── 1 · Affinidi · white-label ─────────────────────────────────────────────────────────────────────────────────
     Geometry from the card's height h (px, so the ring can be set by FS.ring): orbit .27h, copies .14h, core .2h; the
     ring's inner hairline clears the copies by .035h, its caps sit 1.25 cap heights inside each hairline (the hero's
     air). Cards under 340px tall (phones) pull the orbit in and use 9.5px caps. */
  function whiteLabel(fig, d) {
    const say = said(d.body), S = schemes(), cur = (window.FS_SCHEME && window.FS_SCHEME.id) || 'violet';
    const ring = say('adapt without forking');
    const copies = S.ids.map((id, i) =>
      '<span class="wl-copy il-rim" data-s="' + id + '" style="--a:' + (-90 + i * 72) + 'deg">' + ARR +
        '<i class="wl-light">' + ARR + '</i></span>').join('');
    fig.insertAdjacentHTML('afterbegin',
      '<div class="il il--wl" aria-hidden="true">' +
        note(say('swapped the style guide')) + note(say('new branded applications'), true) +
        '<div class="wl-c">' +
          (ring ? '<div class="wl-ring"><i class="wl-hair wl-hair--in"></i><i class="wl-hair wl-hair--out"></i><svg class="ring-svg" id="' + fig.dataset.illus + '-ring"></svg></div>' : '') +
          '<i class="wl-orbit"></i>' + copies +
          '<span class="wl-core il-rim"><i></i>' + ARR + '</span>' +
        '</div>' +
      '</div>' +
      sr('Illustration: one component at the centre, duplicated five times around it. Each copy has its style guide swapped for one of the five colour schemes this site itself cycles through. Around them, the words adapt without forking.'));
    const il = $('.il', fig), c = $('.wl-c', il), svg = $('.ring-svg', il);
    const els = $$('.wl-copy', il);
    els.forEach((el) => {
      const t = S.t && S.t[el.dataset.s];
      if (!t) return;
      Object.keys(t).forEach((k) => el.style.setProperty('--' + k, t[k]));
      el.style.setProperty('--aurora-lit', S.aurora);
      if (el.dataset.s === cur) el.classList.add('is-on');
    });
    let key = '';
    function layout() {
      const h = fig.clientHeight;
      if (!h) return;
      const small = h < 340, size = small ? 9.5 : clamp(h * .022, 10, 11.5), cap = .7 * size, air = 1.25 * cap;
      const ro = h * (small ? .25 : .27), cd = h * (small ? .135 : .14), cc = h * (small ? .19 : .2);
      c.style.setProperty('--ro', ro.toFixed(1) + 'px'); c.style.setProperty('--cd', cd.toFixed(1) + 'px'); c.style.setProperty('--cc', cc.toFixed(1) + 'px');
      if (!svg) return;
      const inner = ro + cd / 2 + h * .035, R = inner + air;
      const k = h + ':' + (document.fonts && document.fonts.check && document.fonts.check('400 11px "Fragment Mono"') ? 1 : 0);
      if (k === key) return;
      key = k;
      const res = FS.ring(svg, ring.toUpperCase() + ' · ', R, size, { track: .22, fit: 'fill', range: [size * .9, size * 1.12] });
      const s = res ? res.size : size, Rr = res ? res.R : R, box = 2 * (Rr + s + 4);
      svg.style.width = svg.style.height = box + 'px';
      svg.style.marginLeft = svg.style.marginTop = (-box / 2) + 'px';
      $('.wl-hair--in', il).style.setProperty('--hr', (Rr - air).toFixed(1) + 'px');
      $('.wl-hair--out', il).style.setProperty('--hr', (Rr + .7 * s + air).toFixed(1) + 'px');
    }
    layout();
    return {
      fig, layout,
      boot(ctx) {
        if (!ctx.live) return;
        const gsap = window.gsap, core = $('.wl-core', il), rg = $('.wl-ring', il), notes = $$('.il-note', il), on = $('.wl-copy.is-on', il);
        const lights = els.map((el) => $('.wl-light', el));
        /* start: the core alone, the copies stacked under it and unlit, the ring and notes out of focus */
        gsap.set(c, { '--k': 0 });
        gsap.set(lights, { '--o': '0%' });
        gsap.set(els, { '--gl': 0 });
        if (on) on.style.setProperty('--on', '0');
        gsap.set([core], { opacity: 0, filter: 'blur(8px)' });
        gsap.set([rg, ...notes].filter(Boolean), { opacity: 0, filter: 'blur(8px)' });
        const clear = { clearProps: 'opacity,filter' };
        const play = () => {
          const tl = gsap.timeline({ delay: .15, onComplete: () => { c.style.removeProperty('--k'); } });
          tl.to(core, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .5, ease: E.focus }, clear), 0)
            /* the duplication: the five come out from under the core together, the orbit carrying them */
            .to(c, { '--k': 1, duration: 1.05, ease: E.iris }, .28)
            /* the style guide swapped: each copy's light irises open from its centre, clockwise from the top */
            .to(lights, { '--o': '50%', duration: .52, ease: E.glass, stagger: .11, clearProps: '--o' }, 1.12)
            .to(els, { '--gl': 1, duration: .6, ease: E.focus, stagger: .11, clearProps: '--gl' }, 1.12)
            .to(notes, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus, stagger: .12 }, clear), 1.5);
          if (rg) tl.to(rg, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .7, ease: E.focus }, clear), 1.3);
          if (on) {
            const t = 1.12 + .11 * els.indexOf(on) + .4;
            tl.to(on, { '--on': 1, duration: .4, ease: E.focus, onComplete: () => on.style.removeProperty('--on') }, t)
              .call(() => FS.ping(on, { size: on.offsetWidth / 4 }), null, t + .05);   /* 6× a quarter: just past its rim */
          }
        };
        onView(fig, play, () => {
          gsap.set([core, rg, ...notes].filter(Boolean), { clearProps: 'opacity,filter' });
          c.style.removeProperty('--k'); lights.forEach((l) => l.style.removeProperty('--o')); els.forEach((e) => e.style.removeProperty('--gl'));
          if (on) on.style.removeProperty('--on');
        });
      },
    };
  }

  /* ── 2 · GoodWorker · scope ─────────────────────────────────────────────────────────────────────────────────────
     The three flows at 22 / 50 / 78% on the hairline at 42%, their labels under them. The field: a fixed list, placed
     by eye around the three and clear of the labels and the notes: [x%, y%, diameter in card heights, opacity, light
     (iris, glacier, orchid: the scheme's own), rim only]. Bigger discs are dimmer, further out of focus. */
  const FIELD = [
    [31, 12, .12, .6, 'o'], [46, 1, .22, .45, 'i'], [62, 17, .08, .8, 'g'], [75, 3, .16, .7, 'g', 1], [91, 15, .26, .42, 'i'],
    [104, 44, .18, .55, 'g'], [64, 27, .055, .85, 'o'], [-3, 34, .2, .5, 'o'], [3, 66, .09, .7, 'i', 1],
    [97, 69, .11, .7, 'o'], [7, 90, .28, .4, 'g'], [27, 80, .1, .7, 'i'], [41, 99, .2, .45, 'o'],
    [53, 81, .065, .85, 'g', 1], [64, 96, .13, .55, 'i'], [80, 78, .09, .75, 'o'], [95, 88, .17, .5, 'i', 1], [18, 104, .14, .5, 'g'],
  ];
  function scope(fig, d) {
    const say = said(d.body);
    const flows = [say('create a job posting'), say('review candidates'), say('contact one')];
    const X = [22, 50, 78];
    const field = FIELD.map((b) => '<i class="sc-bk' + (b[5] ? ' sc-bk--ring' : '') + '" data-c="' + b[4] + '" style="--x:' + b[0] + '%;--y:' + b[1] + '%;--d:' + (b[2] * 100).toFixed(1) + 'cqh;--op:' + b[3] + '"></i>').join('');
    fig.insertAdjacentHTML('afterbegin',
      '<div class="il il--scope" data-lit="track" aria-hidden="true">' +
        '<div class="sc-field">' + field + '</div>' +
        '<i class="sc-line"></i>' +
        X.map((x, i) => '<span class="sc-flow il-rim" style="--x:' + x + '%"><i class="lit"></i></span>' +
          (flows[i] ? '<span class="sc-lab" style="--x:' + x + '%">' + esc(cap(flows[i])) + '</span>' : '')).join('') +
        note(say('three flows')) + note(say('deferred everything else'), true) +
      '</div>' +
      sr('Illustration: three flows in focus on one line, create a job posting, review candidates and contact one. Everything else is deferred, out of focus behind them.'));
    const il = $('.il', fig);
    return {
      fig, layout() {},
      boot(ctx) {
        if (!ctx.live) return;
        const gsap = window.gsap, h = () => fig.clientHeight;
        const field = $('.sc-field', il), fl = $$('.sc-flow', il), labs = $$('.sc-lab', il), notes = $$('.il-note', il), line = $('.sc-line', il);
        /* start: everything equally soft and equally present, the three no sharper than the rest (the whole scope,
           nothing chosen yet), no focus rings */
        gsap.set(fl, { opacity: .42, filter: `blur(${(h() * .02).toFixed(1)}px)`, '--fr': 0 });
        gsap.set(field, { '--fo': 1.35, '--fb': '0px' });
        gsap.set(line, { clipPath: 'inset(0 100% 0 0)' });
        gsap.set([...labs, ...notes], { opacity: 0, filter: 'blur(8px)' });
        const clear = { clearProps: 'opacity,filter' };
        const play = () => {
          const tl = gsap.timeline({ delay: .1 });
          /* the rack: the field falls further out of focus and dims while the three pull sharp, one by one, each
             closing its focus ring as it lands */
          tl.to(field, { '--fo': 1, '--fb': `${(h() * .012).toFixed(1)}px`, duration: 1.7, ease: E.focus }, .1);
          fl.forEach((f, i) => {
            tl.to(f, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .8, ease: E.focus }, clear), .3 + i * .32)
              .to(f, { '--fr': 1, duration: .4, ease: E.focus, onComplete: () => f.style.removeProperty('--fr') }, .66 + i * .32);
            if (labs[i]) tl.to(labs[i], Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus }, clear), .56 + i * .32);
          });
          tl.to(line, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: E.iris, clearProps: 'clipPath' }, .36)
            .to(notes, Object.assign({ opacity: 1, filter: 'blur(0px)', duration: .56, ease: E.focus, stagger: .14 }, clear), 1.3)
            .call(() => FS.ping(fl[2], { size: fl[2].offsetWidth / 4 }), null, 1.3);
        };
        onView(fig, play, () => {
          gsap.set([line, ...fl, ...labs, ...notes], { clearProps: 'opacity,filter,clipPath' });
          fl.forEach((f) => f.style.removeProperty('--fr'));
          gsap.set(field, { '--fo': 1, '--fb': `${(h() * .012).toFixed(1)}px` });
        });
      },
    };
  }

  /* ── 3 · heycar · contextual tips ───────────────────────────────────────────────────────────────────────────────
     Five steps at 7 / 26 / 50 / 74 / 93% on the hairline at 60%. The moments are the car detail page (step 2)
     and the financing step (step 4), in the order a buyer meets them; the other three steps get nothing. */
  const STEPS = [7, 26, 50, 74, 93];
  function tips(fig, d) {
    const say = said(d.body);
    const T = [
      { i: 1, tip: say('a quality check tip'), step: say('the car detail page') },
      { i: 3, tip: say('a financing tip'), step: say('the financing step') },
    ].filter((t) => t.tip && t.step);
    const at = (i) => T.find((t) => t.i === i);
    fig.insertAdjacentHTML('afterbegin',
      '<div class="il il--tips" data-lit="track" aria-hidden="true">' +
        '<i class="tp-path"></i>' +
        STEPS.map((x, i) => {
          const t = at(i), s = ' data-i="' + i + '" style="--x:' + x + '%"';
          if (!t) return '<i class="tp-node"' + s + '></i>';
          return '<i class="tp-node"' + s + '></i><i class="tp-ap"' + s + '><i class="lit"></i></i>' +
            '<i class="tp-stem"' + s + '></i>' +
            '<span class="tp-tip il-rim"' + s + '><i class="tp-ico"><i class="lit"></i></i>' + esc(cap(t.tip)) + '</span>' +
            /* its ghost: while the walk has a moment closed, its tip stays drawn as a hairline stadium (live only), so
               the card never reads as an empty box between steps */
            '<span class="tp-tip tp-gh"' + s + '><i class="tp-ico"></i>' + esc(cap(t.tip)) + '</span>' +
            '<span class="tp-lab"' + s + '>' + esc(cap(t.step)) + '</span>';
        }).join('') +
        '<i class="tp-dot lit"></i>' +
        note(say('Relevant at the right moment')) + note(say('invisible otherwise'), true) +
      '</div>' +
      sr('Illustration: a buyer’s path of five steps. A quality check tip appears only on the car detail page, and a financing tip only on the financing step; the other steps show nothing.'));
    const il = $('.il', fig);
    /* small cards: a pill wider than its share slides along its stem to stay inside the notes' margins (the stem
       keeps its step; a tooltip's stem can meet it anywhere), then the two slide apart to keep 14px between them; where
       even that leaves too little room (the 324px card at 768), both set their words on two balanced lines, the
       stadium growing taller rather than the type smaller */
    function layout() {
      const W = fig.clientWidth, n = $('.il-note', il), m = n ? n.offsetLeft : 18, GAP = 14;
      const tp = $$('.tp-tip:not(.tp-gh)', il);
      const place = () => {
        const b = fig.getBoundingClientRect();
        tp.forEach((e) => e.style.removeProperty('--dx'));
        const box = tp.map((e) => { const r = e.getBoundingClientRect(); return { l: r.left - b.left, r: r.right - b.left, dx: 0 }; });
        box.forEach((x) => { x.dx = x.l < m ? m - x.l : x.r > W - m ? W - m - x.r : 0; });
        let left = 0;
        if (box.length === 2) {
          const a = box[0], c = box[1], need = GAP - ((c.l + c.dx) - (a.r + a.dx));
          if (need > 0) {
            const la = Math.max(0, a.l + a.dx - m), rc = Math.max(0, W - m - (c.r + c.dx));
            const sa = Math.min(la, Math.max(need / 2, need - rc)), sc = Math.min(rc, need - sa);
            a.dx -= sa; c.dx += sc; left = need - sa - sc;
          }
        }
        box.forEach((x, i) => { if (Math.abs(x.dx) > .5) tp[i].style.setProperty('--dx', x.dx.toFixed(1) + 'px'); });
        return left;
      };
      tp.forEach((e) => { e.classList.remove('is-wrap'); e.style.removeProperty('max-width'); e.style.removeProperty('width'); });
      if (place() > .5) {
        const half = Math.floor((W - 2 * m - GAP) / 2);              /* each pill's share: only one that needs it wraps */
        tp.forEach((e) => { e.classList.add('is-wrap'); e.style.maxWidth = half + 'px'; });
        /* a wrapped box keeps its capped width: hug the longest line (the text's own line boxes, via a Range) */
        tp.forEach((e) => {
          const tn = Array.from(e.childNodes).find((c) => c.nodeType === 3), rg = tn && document.createRange();
          if (!rg) return;
          rg.selectNodeContents(tn);
          const rs = Array.from(rg.getClientRects());
          if (rs.length < 2) return;
          const right = Math.max(...rs.map((r) => r.right)), pb = e.getBoundingClientRect();
          e.style.width = Math.ceil(right - pb.left + parseFloat(getComputedStyle(e).paddingRight)) + 'px';
        });
        place();
      }
      /* the ghosts take their tips' places and line breaks */
      tp.forEach((e) => {
        const g = $('.tp-gh[data-i="' + e.dataset.i + '"]', il), dx = e.style.getPropertyValue('--dx');
        if (!g) return;
        g.classList.toggle('is-wrap', e.classList.contains('is-wrap'));
        if (dx) g.style.setProperty('--dx', dx); else g.style.removeProperty('--dx');
        g.style.maxWidth = e.style.maxWidth; g.style.width = e.style.width;
      });
    }
    layout();
    return {
      fig, layout,
      boot(ctx) {
        if (!ctx.live || !T.length) return;
        const gsap = window.gsap, dot = $('.tp-dot', il);
        const q = (c, i) => $('.' + c + ':not(.tp-gh)[data-i="' + i + '"]', il);
        const P = T.map((t) => ({ i: t.i, ap: q('tp-ap', t.i), tip: q('tp-tip', t.i), stem: q('tp-stem', t.i), lab: q('tp-lab', t.i) }));
        const tipR = (p) => (p.tip.offsetWidth + 24) + 'px';
        /* the walk's start: every moment closed (light, stem, tip), the walker at the first step */
        P.forEach((p) => { gsap.set(p.ap, { '--o': '0%' }); gsap.set(p.stem, { '--cut': '100%' }); gsap.set(p.tip, { '--tr': '0px' }); gsap.set(p.lab, { opacity: .5 }); });
        il.classList.add('is-live');
        gsap.set(dot, { '--tx': STEPS[0], '--td-o': 0 });
        /* one walk, looped while the card is in view. At a tip's step the light irises open from the step, the stem
           rises and the pill irises open from its own disc; as the walker moves on, all of it closes again */
        /* polish review: no perpetual motion beside reading copy. The walk plays twice, then rests at the finished
           diagram (both tips open, the css resting state); hovering the card walks it again */
        const rest = () => { il.classList.remove('is-live'); P.forEach((p) => gsap.set([p.ap, p.stem, p.tip, p.lab], { clearProps: '--o,--cut,--tr,opacity' })); gsap.set(dot, { clearProps: '--tx,--td-o' }); };
        const tl = gsap.timeline({ paused: true, repeat: 1, repeatDelay: .5, onComplete: rest });
        let t = 0, openAt = 0;
        tl.to(dot, { '--td-o': 1, duration: .35, ease: 'none' }, t);
        t += .5;
        for (let i = 1; i < STEPS.length; i++) {
          tl.to(dot, { '--tx': STEPS[i], duration: 1, ease: E.iris }, t);
          t += 1;
          const p = P.find((q) => q.i === i);
          if (p) {
            tl.to(p.ap, { '--o': '50%', duration: .62, ease: E.iris }, t - .14)
              .to(p.lab, { opacity: 1, duration: .4, ease: E.focus }, t)
              .to(p.stem, { '--cut': '0%', duration: .36, ease: E.focus }, t + .22)
              .fromTo(p.tip, { '--tr': '0px' }, { '--tr': () => tipR(p), duration: .6, ease: E.iris }, t + .42);
            if (!openAt) openAt = t + 1.05;                        /* the first tip stands open */
            t += 2.8;
            tl.to(p.tip, { '--tr': '0px', duration: .38, ease: E.irisClose }, t)
              .to(p.stem, { '--cut': '100%', duration: .28, ease: E.irisClose }, t + .2)
              .to(p.ap, { '--o': '0%', duration: .46, ease: E.irisClose }, t + .3)
              .to(p.lab, { opacity: .5, duration: .4, ease: E.focus }, t + .4);
            t += .6;
          } else t += .5;
        }
        tl.to(dot, { '--td-o': 0, duration: .35, ease: 'none' }, t + .2)
          .set(dot, { '--tx': STEPS[0] }, t + .6);
        let inView = false, started = false;
        const sync = () => { if (started && inView && !document.hidden) tl.play(); else tl.pause(); };
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { rootMargin: '48px' }).observe(fig);
        document.addEventListener('visibilitychange', sync);
        /* the first play starts where the first tip stands open: from the walk's own start, the card arrived as a
           dark box with a hairline (every moment closed) */
        const play = () => { if (!started && openAt) tl.time(openAt); started = true; sync(); };
        onView(fig, play, play);
        fig.addEventListener('pointerenter', (e) => {
          if (e.pointerType !== 'mouse' || tl.isActive() || !started) return;
          il.classList.add('is-live'); tl.restart(); sync();
        });
        WORK.illusTips = tl;                                        /* QA: scrub the walk (tl.pause().time(s)) */
      },
    };
  }

  /* ── build now, animate at boot ──────────────────────────────────────────────────────────────────────────────── */
  const MAKE = { 'affinidi-2': whiteLabel, 'goodworker-1': scope, 'heycar-2': tips };
  const built = [];
  $$('figure.dec-illus[data-illus]').forEach((fig) => {
    const make = MAKE[fig.dataset.illus], row = fig.closest('.dec');
    const d = row && WORK.p.decisions[+row.dataset.i - 1];
    if (!make || !d || !d.body) return;
    built.push(make(fig, d));
    fig.dataset.state = 'ready';
    fig.removeAttribute('aria-hidden');                 /* the drawing is aria-hidden; its sr-only description is not */
  });
  if (!built.length) return;
  WORK.illus = built;
  FS.on('work:boot', (ctx) => built.forEach((b) => { try { b.boot(ctx); } catch (e) { console.warn('illus', e); } }));
  const relayout = () => built.forEach((b) => b.layout());
  FS.on('fonts', relayout);
  if ('ResizeObserver' in window) {
    let raf = 0;
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; relayout(); }); });
    built.forEach((b) => ro.observe(b.fig));
  }
  html.classList.add('has-illus');
})();
