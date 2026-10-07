/* Full Stop · work pages · the data and the template (round 5; round 6: the filled gradient and the live content)
 * A classic, blocking script in work.html's head: the inline WORK.render() that sits directly after <main> writes the
 * whole page before the first paint, so nothing reflows when js/work.js (deferred) brings it to life at FS boot.
 *
 * Round 6, Werner (binding): "On the case study pages, I don't want the circle with the image, instead the background
 * should be completely filled with the gradient". No light disc sits behind any image any more: the hero and the Next
 * band are filled edge to edge by the live aurora field (js/work.js light()), every media plate by the scheme's
 * --aurora-lit with the project's key and fill (css/work.css .pl-lt). And, from his live site (wernersdesigns.com), the
 * three case studies gain their process sections, as data (WORK.sections) rendered by generic blocks.
 *
 *   WORK.projects[slug]  the five projects. Copy verbatim from src/components/projects-data.ts (CASE_STUDIES,
 *                        EYE_CANDY: never edit src/). Added for the concept, and marked so: no (the homepage's Nº),
 *                        hue (the homepage card's --h1/--h2/--ax/--ay), card/cardAlt (the homepage card's device,
 *                        PROJECTS[].image/.alt, which the hero shows), stats (outcome numbers, cut from the
 *                        outcome's own sentences), links (the live site's Link row), order (the page's sections).
 *   WORK.sections[slug]  the live site's process sections (_brief/work-pages-live-content.md, its typo fixes applied),
 *                        each { type: 'story', name, h2, blocks } in the page's order (projects[].order).
 *   WORK.finals[slug]    the Final designs as the page shows them: the data's own entries (src, alt, caption) with
 *                        the live site's image (m), title and text where the brief adds them, and heycar's financing
 *                        calculator group.
 *   WORK.media[path]     the data's image paths → this concept's files: the keyed device renders in assets/ (with their
 *                        -soft-moon layer and their halo, feathered, in assets/work/) or a flat screen.
 *                        box: the device's content box in the 1600w render (PIL getbbox), so every plate can centre and
 *                        size the device itself, not its padding.
 *   WORK.live[path]      the live site's images (assets/work/live/<project>/, tools/live.py): screens (flat, opaque),
 *                        boards (flat UI on transparency; ground 'night' for the ones whose type is set light on dark)
 *                        and devices (on the light directly).
 *   WORK.decMedia[slug-n] a decision's own framing of its data image, where the page shows that image whole elsewhere.
 *   WORK.screens[slug]   eye candy: the one render's screen, flat and whole (tools/work.py), the Gallery's first card.
 *   WORK.views[type]     the page body between the Brief and the Next band: 'case' (projects[].order) and 'eye-candy'.
 *   WORK.render()        writes <main> for ?p=<slug>, or a short not-found note; sets the title and the pill's name.
 *   WORK.after()         inline after the footer: the footer's section number and stop follow the page's own.
 */
(function () {
  'use strict';
  var WORK = (window.WORK = window.WORK || {});

  /* ── media: the data's paths → the concept's own assets ──────────────────── */
  var dev = function (id, w, h, box) {
    return { kind: 'device', src: 'assets/' + id + '.webp', soft: 'assets/' + id + '-soft-moon.webp', halo: 'assets/work/' + id + '-halo.png', w: w, h: h, box: box };
  };
  WORK.media = {
    '/projects/affinidi-phones.webp': dev('affinidi', 1600, 970, [231, 68, 1358, 859]),
    '/projects/goodworker-devices.webp': dev('goodworker', 1600, 934, [143, 62, 1492, 859]),
    '/projects/heycar-macbook.webp': dev('heycar', 1600, 1634, [110, 110, 1477, 1493]),
    /* GALVANY Sales Portal: its leads board on a laptop render (tools/galvany_portal.py) */
    'sales-portal/laptop': Object.assign(dev('sales-portal', 1600, 1352, [110, 93, 1490, 1259]), { x2: 'assets/sales-portal-3200.webp' }),
    '/projects/heycar.jpg': { kind: 'screen', src: 'assets/ext/heycar.jpg', w: 1024, h: 640 },
    /* round 7: Werner's own shot of his Bandcamp player, the two panels overlapping (his 8.webp, rebuilt on the light: tools/bandcamp.py) */
    /* GALVANY OS: the leads board on a laptop render */
    'galvany-os/laptop': Object.assign(dev('galvany-os', 1600, 1352, [110, 93, 1490, 1259]), { x2: 'assets/galvany-os-3200.webp' }),   /* x2: its 3200w twin */
    'bandcamp/panels': dev('bandcamp', 1600, 1787, [244, 272, 1356, 1515]),
  };
  /* the live site's images. Screens are flat and opaque (a glass frame on the light); boards are flat UI on
     transparency with their own baked shadows (straight on the light, or on a night board where their type is set
     light on dark: the style guide, the inputs' check labels, the information architecture); devices sit on the light
     (their own baked shadows; heycar's was keyed off its studio grey, tools/filled.py). box as above. */
  var LV = 'assets/work/live/';
  var scr = function (p, w, h) { return { kind: 'screen', src: LV + p + '.webp', w: w, h: h }; };
  var brd = function (p, w, h, o) { return Object.assign({ kind: 'board', src: LV + p + '.webp', w: w, h: h }, o || {}); };
  var ldv = function (p, w, h, box) { return { kind: 'device', src: LV + p + '.webp', w: w, h: h, box: box }; };
  WORK.live = {
    'affinidi/styleguide': brd('affinidi/styleguide', 1862, 2400, { ground: 'night' }),
    'affinidi/atoms-messages': brd('affinidi/atoms-messages', 1536, 928),
    'affinidi/atoms-inputs': brd('affinidi/atoms-inputs', 2400, 441, { ground: 'night' }),
    'affinidi/molecules': brd('affinidi/molecules', 2400, 735),
    'affinidi/organism-header': Object.assign(brd('affinidi/organism-header', 2400, 541), { pan: 'end' }),   /* the dropdown is the point */
    'affinidi/organism-sidebar': brd('affinidi/organism-sidebar', 904, 2272),
    'affinidi/organism-form': brd('affinidi/organism-form', 1597, 1394),
    'affinidi/template-headline': brd('affinidi/template-headline', 2400, 1689),
    'affinidi/template-drawer': brd('affinidi/template-drawer', 2400, 1600),
    'affinidi/template-tabs': brd('affinidi/template-tabs', 2400, 1743),
    'affinidi/page-login': scr('affinidi/page-login', 1728, 1120),
    'affinidi/page-projects': scr('affinidi/page-projects', 1732, 1120),
    'affinidi/page-bulk-issuance': scr('affinidi/page-bulk-issuance', 1728, 1164),
    'affinidi/page-analytics': scr('affinidi/page-analytics', 1728, 1120),
    'affinidi/page-schemas': scr('affinidi/page-schemas', 1732, 1132),
    'affinidi/page-qualification': scr('affinidi/page-qualification', 1732, 1128),
    'affinidi/console-macbook': ldv('affinidi/console-macbook', 2400, 1618, [0, 0, 2400, 1572]),
    'affinidi/phones-b': ldv('affinidi/phones-b', 2400, 1482, [217, 5, 2231, 1482]),
    'goodworker/photo-worker': { kind: 'photo', src: LV + 'goodworker/photo-worker.webp', w: 2400, h: 1544 },
    'goodworker/ia': brd('goodworker/ia', 1280, 1440, { ground: 'night' }),
    'goodworker/wireframe-job-postings': scr('goodworker/wireframe-job-postings', 1440, 900),
    'goodworker/wireframe-job-detail': scr('goodworker/wireframe-job-detail', 2200, 1360),
    'goodworker/wireframe-candidate': scr('goodworker/wireframe-candidate', 2200, 1360),
    'goodworker/final-job-postings': scr('goodworker/final-job-postings', 1440, 900),
    'goodworker/final-create-posting': scr('goodworker/final-create-posting', 1440, 900),
    'goodworker/final-job-detail': scr('goodworker/final-job-detail', 2096, 1312),
    'goodworker/final-candidate-detail': scr('goodworker/final-candidate-detail', 1440, 900),
    'heycar/devices': ldv('heycar/devices-keyed', 2400, 1394, [0, 138, 2400, 1293]),
    'heycar/idea-search': scr('heycar/idea-search', 2400, 1707),
    'heycar/idea-models': scr('heycar/idea-models', 2400, 1707),
    'heycar/idea-tips': scr('heycar/idea-tips', 2400, 1708),
    'heycar/idea-dealer': scr('heycar/idea-dealer', 2400, 1707),
    'heycar/idea-message': scr('heycar/idea-message', 2400, 1707),
  };
  /* round 7, the Bandcamp player (tools/bandcamp.py): the extension's panels are flat UI on transparency (2× of its
     ~384pt panel), so they sit on the light as boards; cap keeps them near their own pixels (the collapsed player
     would otherwise be stretched across the grid); bandcamp.com with the player docked is a screen */
  var BC = 'assets/work/bandcamp/';
  WORK.live['bandcamp/browser'] = { kind: 'screen', src: BC + 'browser.webp', w: 1482, h: 812 };
  WORK.live['bandcamp/collection'] = { kind: 'board', src: BC + 'collection.webp', w: 769, h: 1347, cap: 480 };
  WORK.live['bandcamp/discovery'] = { kind: 'board', src: BC + 'discovery.webp', w: 769, h: 1347, cap: 480 };
  WORK.live['bandcamp/mini'] = { kind: 'board', src: BC + 'mini.webp', w: 769, h: 158, cap: 480 };   /* the panels' scale */
  /* GALVANY OS: prototype screens, whole or cropped; people, customers and records on them are fictional mock data */
  ['orders', 'order-review'].forEach(function (k) { WORK.live['galvany-os/' + k] = scr('galvany-os/' + k, 2880, 1800); });   /* 1440 x 900 at 2x */
  WORK.live['galvany-os/leads-board'] = scr('galvany-os/leads-board', 2320, 1688);
  WORK.live['galvany-os/offers-board'] = scr('galvany-os/offers-board', 2320, 1688);
  WORK.live['galvany-os/three-f'] = scr('galvany-os/three-f', 2240, 910);
  /* GALVANY Sales Portal: Werner's screenshots at 2x (tools/galvany_portal.py) */
  ['board', 'drawer', 'profile', 'calendar'].forEach(function (k) { WORK.live['sales-portal/' + k] = scr('sales-portal/' + k, 4348, 2269); });
  WORK.live['sales-portal/attention'] = scr('sales-portal/attention', 1931, 1280);
  for (var i = 1; i <= 7; i++) WORK.live['heycar/finance-0' + i] = scr('heycar/finance-0' + i, 2400, 1500);
  var L = function (k) { return WORK.live[k]; };

  /* the decisions' own framings (concept data): each of these images is shown whole elsewhere on its page (the device
     in the hero, heycar's screen in Final designs), so here it gets a detail of its real pixels instead of the same
     picture again. A detail (round 6: a rectangle, the plate's own, no lens) is the 1600w render at 1:1 on the plate,
     render px (cx, cy) at its centre: Affinidi's StudID certificates beside GameID's Battletag (two products, one
     system); GoodWorker's candidate panel, with the location the sessions moved up. Phones centre on (mcx, mcy): a
     certificate card; the candidate's photo and basic info. heycar's is its screen cropped to the three questions
     (tools/work.py questions). */
  WORK.decMedia = {
    'galvany-os-1': L('galvany-os/orders'),
    'galvany-os-2': L('galvany-os/order-review'),
    'galvany-os-3': L('galvany-os/three-f'),
    'sales-portal-1': L('sales-portal/board'),
    'sales-portal-2': L('sales-portal/drawer'),
    'sales-portal-3': L('sales-portal/attention'),
    'affinidi-1': { kind: 'detail', of: '/projects/affinidi-phones.webp', cx: 760, cy: 370, mcx: 700, mcy: 345 },
    'goodworker-2': { kind: 'detail', of: '/projects/goodworker-devices.webp', cx: 915, cy: 350, mcx: 735, mcy: 310 },   /* r6: clear of the bezel (≈542–578) */
    'heycar-1': { kind: 'screen', src: 'assets/work/heycar-questions.webp', w: 1900, h: 670 },   /* r6: cut from the live idea-search screen */
  };
  /* eye candy's one screen, flat (tools/work.py gallery): the hero shows the render, the Gallery opens on its screen */
  WORK.screens = {
  };

  /* ── the projects ─────────────────────────────────────────────────────────── */
  WORK.projects = {
    affinidi: {
      type: 'case', no: '04', hue: { h1: 'iris', h2: 'glacier', ax: '74%', ay: '72%' },
      card: '/projects/affinidi-phones.webp', cardAlt: 'Affinidi identity apps on four iPhones',
      /* concept: the page's sections after the Brief, and the live site's Link row */
      order: ['what', 'decisions', 'system', 'atomic', 'final', 'outcome'],   /* r6 review: the why before the deep-dive */
      links: [{ href: 'https://www.affinidi.com', text: 'affinidi.com' }],
      slug: 'affinidi',
      name: 'Affinidi',
      headline: "A design system for Affinidi's identity apps.",
      company: 'Affinidi',
      role: 'Lead Product Designer',
      year: '2022 – 2023',
      team: '3 designers, 1 PM',
      tags: ['Design system', 'Design leadership', 'Responsive design', 'UX/UI', 'Web 3.0'],
      heroImage: '/projects/affinidi-hero.png',
      heroImageAlt: 'Affinidi identity apps on multiple devices',
      brief: "Multiple product teams had spent years on what was supposed to be one product, and each had drifted into its own visual language. Over about six months in 2022 and 2023, we built one design system to pull them together under a single developer portal.",
      whatIDid: [
        'As Lead Designer, I was the link between the Berlin and Singapore teams. I had worked on most of these products at some point, so I could see exactly where the experiences had fragmented.',
        'I led the team in designing and building the design system components using an atomic design approach, and managed the handover to the developers building it out. I was also responsible for the final product: the developer portal that brought everything together.',
      ],
      decisions: [
        {
          heading: 'Atomic design from the start',
          body: 'We had 4 products and hundreds of misaligned components. Starting at the atom level meant any future product could compose from the same building blocks instead of duplicating them. It also gave us a shared vocabulary across the Berlin and Singapore teams.',
          image: '/projects/affinidi-phones.webp',
          imageAlt: 'Four Affinidi apps on iPhones',
          imageCaption: 'Multiple products with one system underneath',
        },
        {
          heading: 'White-label as the proof of concept',
          body: 'To me, the test of a design system is whether it can adapt without forking. So we duplicated ours, swapped the style guide, and used it to build new branded applications in a fraction of the original time. The architecture held up.',
        },
      ],
      finalDesigns: [
        { src: '/projects/affinidi.png', alt: 'Affinidi developer console', caption: 'Developer console: the primary application built on the design system' },
        { src: '/projects/affinidi-phones.webp', alt: 'White-label credential applications across four phones', caption: 'White-label credential apps: the same system with a different brand, built in a fraction of the time' },
      ],
      outcome: 'The design system was adopted across 3 product teams and used as the foundation for 4 white-label credential applications. Design-to-dev handover went from weeks to days.',
      /* concept: the outcome's numbers, echoed as stat discs (label = the words beside the number, in sentence case) */
      stats: [{ n: '3', label: 'Product teams' }, { n: '4', label: 'White-label credential applications' }, { from: 'weeks', to: 'days', label: 'Design-to-dev handover' }],
      nextSlug: 'goodworker',
    },
    goodworker: {
      type: 'case', no: '05', hue: { h1: 'orchid', h2: 'glacier', ax: '50%', ay: '18%' },
      card: '/projects/goodworker-devices.webp', cardAlt: 'GoodWorker platform on desktop, tablet and phone',
      /* concept. GoodWorker was sold in 2025 (Werner 2026-10-07: sold, not terminated), so its live link (goodworker.in) is left out */
      order: ['context', 'what', 'process', 'research', 'concept', 'wireframes', 'decisions', 'final', 'outcome'],
      slug: 'goodworker',
      name: 'GoodWorker',
      headline: 'GoodWorker set out to give millions of people in India control of their livelihoods.',
      company: 'Temasek',
      role: 'Lead Product Designer',
      year: 'Mar – Jun 2020',
      team: '1 junior designer, 1 researcher, 1 PM',
      tags: ['UX design', 'UI design', 'Design leadership', 'User research', 'Usability testing'],
      heroImage: '/projects/goodworker-hero.png',
      heroImageAlt: 'GoodWorker platform on multiple devices',
      brief: 'There are four hundred and fifty million blue-collar workers in India. Most are hired through middlemen and have no formal record of their skills or employment history. GoodWorker set out to fix that and needed three products to do it.',
      whatIDid: [
        'I joined halfway through the project to lead the product team: one junior designer, one researcher, one PM. My focus was end-to-end design of the employer portal, plus overseeing and mentoring the rest of the team.',
        'I ran research interviews with employers, set the information architecture, and took the employer portal from wireframes through a tested high-fidelity prototype. I also made the call on what went into the MVP.',
      ],
      decisions: [
        {
          heading: 'Scope the MVP to three screens',
          body: 'Of the three products, the employer portal had the clearest success metric: does an employer hire someone? We scoped the MVP to three flows (create a job posting, review candidates, contact one) and deferred everything else, so we could stay focused and learn faster.',
        },
        {
          heading: 'Test wireframes before going high-fidelity',
          body: "We ran 10 employer usability sessions on wireframes before touching any high-fidelity design. Those sessions caught a critical issue: employers wanted to see a candidate's location before their skills, so we flipped the order. Finding that kind of thing before hi-fi saves a lot of rework.",
          image: '/projects/goodworker-devices.webp',
          imageAlt: 'GoodWorker employer portal on desktop, tablet and phone',
          imageCaption: 'The final employer portal, tested and iterated before any pixel polish',
        },
      ],
      finalDesigns: [
        { src: '/projects/goodworker.png', alt: 'GoodWorker employer portal overview', caption: 'Job postings board: status at a glance, one click to the detail view' },
        { src: '/projects/goodworker-devices.webp', alt: 'GoodWorker across desktop, tablet and phone', caption: 'Responsive across all breakpoints, since employers work from desktops and phones' },
      ],
      outcome: "The employer portal shipped as the MVP for Temasek's GoodWorker platform. Usability testing with 10 employers caught issues that we fixed before launch. GoodWorker reached 1 million users in its first year, but we couldn't find enough employers to place them, and the company was sold in 2025.",
      stats: [{ n: '1M', label: 'Users in the first year' }, { n: '10', label: 'Employers in usability testing' }],
      nextSlug: 'heycar',
    },
    heycar: {
      type: 'case', no: '06', hue: { h1: 'glacier', h2: 'iris', ax: '20%', ay: '46%' },
      card: '/projects/heycar-macbook.webp', cardAlt: 'heycar vehicle page on a MacBook',
      order: ['challenge', 'what', 'ideation', 'decisions', 'final', 'outcome'],
      links: [{ href: 'https://www.hey.car', text: 'hey.car' }, { href: 'https://www.heycar.co.uk', text: 'heycar.co.uk' }],
      slug: 'heycar',
      name: 'heycar',
      headline: 'heycar makes buying a second-hand car simple, fair and transparent.',
      company: 'Volkswagen Financial Services',
      role: 'Lead Product Designer',
      year: '2017 – 2018',
      team: '3 designers, 1 PM',
      tags: ['UX design', 'UI design', 'Design leadership', 'User research', 'Prototyping'],
      heroImage: '/projects/heycar-hero.png',
      heroImageAlt: 'heycar car search interface on a laptop',
      brief: 'Buying a second-hand car feels like a minefield: opaque dealers, no way to judge quality, and financing that only gets harder. heycar started as a pitch concept and became two years of shipping product.',
      whatIDid: [
        'I was involved from day one and designed the concept that won the pitch with Volkswagen Financial Services. After that, I delivered the financing calculator and the dealer portal for the Germany launch.',
        'After heycar Germany, I led the design team on the UK pitch, and that pitch sold the project. The audience and the regulations were different, but the goal was the same: make buying a second-hand car feel trustworthy.',
      ],
      decisions: [
        {
          heading: 'Three questions instead of a filter panel',
          body: 'Every other car site leads with an overwhelming filter panel: make, model, year, price, mileage. We replaced it with three adaptive questions based on how much the buyer already knows. That reduced the cognitive load significantly in testing and got buyers to the right cars faster.',
          image: '/projects/heycar.jpg',
          imageAlt: 'heycar simplified search interface',
          imageCaption: 'Three questions instead of twenty filters',
        },
        {
          heading: 'Contextual tips over permanent tooltips',
          body: 'Buyers felt inadequate judging car quality, and permanent help text gets ignored. So we surfaced specific tips based on context: a financing tip on the financing step, a quality check tip on the car detail page. That way each tip is relevant at the right moment and invisible otherwise.',
        },
      ],
      finalDesigns: [
        { src: '/projects/heycar.jpg', alt: 'heycar car search', caption: 'Simplified search: adaptive questions guide the buyer to the right car' },
        { src: '/projects/heycar-macbook.webp', alt: 'heycar vehicle detail page on a MacBook', caption: 'Vehicle detail page: quality signals, contextual tips and dealer connection' },
      ],
      outcome: 'heycar launched in Germany and quickly became one of the leading platforms for quality second-hand cars, and the UK pitch my team designed sold the project there. The platform has since expanded across multiple European markets.',
      stats: [],                                  /* no numbers in the outcome, so no stat row */
      nextSlug: 'galvany-os',
    },
    /* 2026-10-05, Werner: "add another recent work project for the sales portal" (his zip, sales-portal-screens), replacing
       the old portal page. Copy from what the screens show and from the portal's own project notes; drafted for his review */
    'sales-portal': {
      type: 'case', kind: 'recent', no: '02', hue: { h1: 'orchid', h2: 'pearl', ax: '28%', ay: '24%' },
      card: 'sales-portal/laptop', cardAlt: 'The GALVANY Sales Portal leads board on a laptop',
      order: ['what', 'decisions', 'final'],
      slug: 'sales-portal',
      name: 'GALVANY Sales Portal',
      headline: 'What to do next, for sales partners and their teams.',
      company: 'GALVANY',
      role: 'Lead Product Designer',
      year: '2026',
      tags: ['Product design', 'UX design', 'UI design', 'Sales tools'],
      brief: 'GALVANY’s sales partners sell its heat pumps and batteries. The Sales Portal is where they work: their leads and appointments, the offers about to expire and, for team and area leaders, what needs attention in the team.',
      whatIDid: [
        'Alongside GALVANY OS, I design the Sales Portal: a seller’s day with their leads and offers, and a team view for team and area leaders.',
        'I scoped the portal to one question: what do I, or my team, do next, and how are we doing? Anything GALVANY runs internally stays in the OS, so the portal has no admin area.',
      ],
      decisions: [
        { heading: 'Hot leads and expiring offers have their own filters', body: 'Both filters sit right above the board, which runs from leads without an appointment to signed orders on their way to installation, with a column each for appointment, offer, detailed planning and order.', image: 'sales-portal-1', imageAlt: 'The leads board: no appointment, appointment, offer, detailed planning and order, with the hot-lead and expiring-offer filters above' },
        { heading: 'The lead opens beside the board', body: 'A lead opens in a drawer on the right, so the seller keeps their place on the board. Calling, the offer and the next steps sit at the top. On a phone, the drawer goes full screen.', image: 'sales-portal-2', imageAlt: 'A lead’s drawer over the board: call and e-mail, the offer, the next steps, the key facts and the appointments' },
        { heading: 'Every exception starts with a lead', body: 'The team view lists what needs attention as open exceptions, each one triggered by a lead’s state, like a lead still waiting three days in a seller’s inbox. Sellers aren’t measured on speed or activity. One click opens the seller’s page, where a call can unblock it.', image: 'sales-portal-3', imageAlt: 'Needs attention in the team: open exceptions, each a lead a seller hasn’t accepted yet, with how long it has waited' },
      ],
      nextSlug: 'bandcamp',
      nextType: 'side-quest',
    },
    /* round 7 (Werner, 2026-10-02): his Chrome extension for listening on Bandcamp. Copy from his own words in the
       session ("Minimum copy, role, year, company (self-employed)" and why it exists); the year (2026, his screenshots
       show Bandcamp's September 2026 editorial) and the role are my reading of it, flagged to him. */
    /* GALVANY OS (2026-10-05): drafted for Werner's review */
    'galvany-os': {
      type: 'case', kind: 'recent', no: '01', hue: { h1: 'iris', h2: 'orchid', ax: '30%', ay: '24%' },
      card: 'galvany-os/laptop', cardAlt: "GALVANY OS's leads board on a laptop",
      order: ['context', 'what', 'system', 'decisions', 'research', 'outcome'],
      slug: 'galvany-os',
      name: 'GALVANY OS',
      headline: 'One system for every team, from lead to installed heat pump.',
      company: 'GALVANY',
      role: 'Lead Product Designer',
      year: '2026',
      tags: ['Product design', 'Design in code', 'Design systems', 'User research', 'Internal tools'],
      brief: 'GALVANY sells heat pumps. Every team, from sales to legal, works out of Airtable, and the same project data is kept in several places. GALVANY OS is meant to replace Airtable, and I’m designing it as a clickable prototype first.',
      whatIDid: [
        'I lead product design at GALVANY. For the OS I own the prototype and the interviews: what each team sees, how a project moves from one team to the next, and what the backend will be built against.',
        'I design it in code with Claude Code: a clickable prototype with over two thousand mock projects and a home view for every team. Claude asks, I decide. Even a sort order waits for my answer, which is logged in the code as a dated decision. When I let it run ahead, as in the overnight build of the first twelve work views, every guess is logged for my review.',
      ],
      decisions: [
        { heading: 'A view is a pattern plus a config', body: 'The queues share one pattern, and each brings its own config: its tiles, its list, its filters and its actions. When a workshop changes how a team works, the change is a line in a config and doesn’t need a new screen.', image: 'galvany-os-1', imageAlt: 'The orders queue: four tiles above the list, the overdue reviews flagged on the first, then each order with its reviewer and status' },
        { heading: 'A rejection names the page', body: "Order review sits beside the signed offer: a seven-point checklist, each point with its page, then release or reject with a reason. A rejection names the failed check and the page, like 'Cancellation policy not signed · p. 12', so whoever fixes it doesn’t have to guess.", image: 'galvany-os-2', imageAlt: 'Order review: the signed offer on the left, the seven-point checklist with its page numbers on the right' },
        { heading: 'Gates before anyone installs', body: 'Nothing gets installed until its gates are clear: subsidy, detailed planning, financing and the customer’s own work. Pipeline cards show the first three as check circles (the electrics joined them later) and the customer’s own work as a tag. The project file shows all four, so what’s blocking is visible at a glance.', image: 'galvany-os-3', imageAlt: 'Three of the gates (subsidy, detailed planning and financing), each with its open, done and not-applicable count' },
      ],
      outcome: 'GALVANY’s design system took its brand colours from the prototype, and I settled the ten design decisions it still had open. The prototype is meant to become the spec the backend is built from. For now, its status model, decisions and interview findings are inputs to the migration’s planning.',
      stats: [{ n: '10', label: 'Open design-system decisions settled' }],   /* the outcome's one number */
      nextSlug: 'sales-portal',
      nextType: 'case',
    },
    bandcamp: {
      type: 'side-quest', no: '03', hue: { h1: 'orchid', h2: 'iris', ax: '72%', ay: '26%' },
      card: 'bandcamp/panels', cardAlt: "The Bandcamp player's Collection and Discovery panels",
      order: ['player'],
      slug: 'bandcamp',
      name: 'Bandcamp',
      headline: 'Music player for Bandcamp.',
      company: 'Self-employed',
      role: 'Designer & developer',
      year: '2026',
      tags: ['Chrome extension', 'Product design', 'UI design'],
      brief: "Bandcamp is where my music lives, but listening there never worked the way I like. So I wanted to see if I could build it: a Chrome extension that makes it easy to discover new music, and plays my own library at work without downloading all of it.",
      nextSlug: 'affinidi',
      nextType: 'case',
    },
  };
  WORK.kinds = { 'case': 'Case study', 'eye-candy': 'Eye candy', 'side-quest': 'Side quest', 'recent': 'Recent work' };   /* p.kind overrides the type's label (2026-10-05: Recent work) */

  /* ── the live site's sections (round 6) ──────────────────────────────────────────────────────────────────────────
     Copy verbatim from _brief/work-pages-live-content.md (the live site's words, its typos fixed there, in sentence
     case). A section is a story: its name (the header pill and the mono label), its H2 (the name unless set; a stop is
     added, or the heading's own full stop becomes it) and its blocks, in order:
       lead     a statement (Display 500) · p        paragraphs (cols: 2 flows them in two columns, 3 on the side)
       list     lit-stop bullets          · note     a lead-in line (Sans) before what it introduces
       quote    a big Display statement, word by word into focus, its stop lit last
       figs     media plates in a 12-column grid: { m, label, span } (span: columns on desktop, 12 unless set)
       steps    the process as glass index discs 01–04 on one hairline
       photo    a full-bleed colour photo band, its lead over the photo on a night veil, two columns beside it
       stages   Affinidi's atomic design: the style guide, then the five stages beside a sticky rail of five discs
       seq      a stepped sequence (Affinidi's pages, heycar's calculator): full-stop step dots, "01 / 07" labels
       features heycar's ideation: image, title and line, a horizontal sequence
     Images carry alt text (what they show) and never a caption the brief does not give: unlabelled slots get a mono
     index ("01 / 03"). */
  WORK.sections = {
    'galvany-os': {
      context: { name: 'The challenge', h2: 'Five teams, one record.', blocks: [
        { p: [
          'Every team works off the same project record in Airtable. Mapping it field by field showed how much of it repeats: the date goods leave the warehouse alone turns up in four places.',
          'The OS had to move the data and give every team its own place to work, without splitting the one record they all share.',
        ], cols: 2 },
        { quote: 'One field, one place.' },
      ] },
      system: { name: 'The system', h2: 'A lead board reads like an offer board.', blocks: [
        { p: [
          'Sales follows four steps: lead, offer, order, project. Each step is its own queue, built on the same grammar, so the boards read the same way from the first call to the signature.',
          'Behind it sits the status model, from order review through detailed planning, procurement and scheduling to installation, acceptance and close. Every status belongs to a station, so the system always knows whose move it is.',
        ], cols: 2 },
        { figs: [
          { m: L('galvany-os/leads-board'), label: 'Leads', alt: 'Leads as a board: new, contacted, waitlist, scheduled', span: 6 },
          { m: L('galvany-os/offers-board'), label: 'Offers', alt: 'Offers as a board in the same grammar: sent, opened, expiring, signed', span: 6 },
        ] },
        { note: 'Every person, customer and record on these screens is fictional: the prototype runs on a seeded mock world. Only the product names are GALVANY’s own.' },
      ] },
      research: { name: 'Research', h2: 'Workarounds are findings, not mistakes.', size: 'statement', blocks: [
        { p: [
          'I test the prototype with the people who will live in it, and every workaround they show me counts as a finding. In one session, two order managers spent thirty minutes on how they work today and thirty on the prototype. In a paired interview the biggest risk is false agreement, so on the main questions both wrote their answers down before saying them, and only one of them drove.',
          'What the interviews showed changed the product. A ‘blocked’ badge became a named reason, the electrics got their own traffic light, and add-on orders got a record of their own. Next came installer matching, ‘best three’: three ranked installer teams with plain-language reasons. Assigning a team doesn’t fix the date: the installer accepts and picks the start day.',
        ], cols: 2 },
      ] },
    },
    /* round 7: the Bandcamp player's one section, its gallery. Labels are the extension's own names for its tabs
       (Collection, Discovery) and what the shot shows (the player in the browser, collapsed); nothing else is said */
    bandcamp: {
      player: { name: 'Gallery', blocks: [
        { figs: [
          { m: L('bandcamp/browser'), label: 'In the browser', alt: 'bandcamp.com with the player docked on the right: the Discovery queue over the player' },
          { m: L('bandcamp/collection'), label: 'Collection', alt: 'The Collection tab: the synced library, 2,735 tracks, with Re-sync, over the player', span: 6 },
          { m: L('bandcamp/discovery'), label: 'Discovery', alt: 'The Discovery tab: a session queue of 200 tracks, with Load page and Add page, over the player', span: 6 },
          { m: L('bandcamp/mini'), label: 'Collapsed', alt: 'The player collapsed to one bar: artwork, track, shuffle, previous, pause, next and expand' },
        ] },
      ] },
    },
    affinidi: {
      system: { name: 'The system', h2: "Building a design system for Affinidi's privacy-preserving applications.", size: 'statement', blocks: [
        { p: [
          'A design system gives every team the same reusable components and guidelines, so all platforms and products look and feel consistent. It also makes products faster to build and easier to scale.',
          'Design and development get simpler, with less duplicate work and fewer errors, and teams find it easier to work together.',
          'A solid design system lets organisations innovate faster and ship high-quality products that give users what they need and expect.',
        ], cols: 2 },
      ] },
      atomic: { name: 'Atomic design', blocks: [
        { lead: 'For our design system we used atomic design, a method with five stages that work together. It lets you build an interface design system in a more deliberate, hierarchical way. The stages are atoms, molecules, organisms, templates and pages.' },
        { stages: {
          guide: { name: 'Style guide', text: 'The style guide below was the foundation of our design system. Most elements were already defined, and we added more as we needed them.',
            fig: { m: L('affinidi/styleguide'), alt: 'The Affinidi style guide: brand, utility and neutral colours, text styles and icons' } },
          list: [
            { name: 'Atoms', text: 'Atoms are the most basic components, the building blocks of a design system: buttons, lines, shapes, icons, text fields, text labels and so on. Here are some of the atoms we used.',
              figs: [
                { m: L('affinidi/atoms-messages'), label: 'Messages', alt: 'Message atoms: info, warning, error and success', span: 7 },
                { m: L('affinidi/atoms-inputs'), label: 'Inputs and selects', alt: 'Input and select atoms: text fields, a pin input, dropdowns, a search field, checkboxes, toggles and radio buttons' },
              ] },
            { name: 'Molecules', text: 'Molecules are made by combining two or more atoms. An input field and a button, for instance, can combine into a search form. Below are some of the molecules from our design system.',
              figs: [{ m: L('affinidi/molecules'), alt: 'Molecules: an attribute form, a project card, an upload field, a schema card and a drawer' }] },
            { name: 'Organisms', text: 'Multiple molecules together form an organism, for example a header, sidebar or signup form.',
              figs: [
                { m: L('affinidi/organism-header'), label: 'Header', alt: 'The console header with its project switcher open' },
                { m: L('affinidi/organism-sidebar'), label: 'Sidebar', alt: 'The console sidebar navigation', span: 4 },
                { m: L('affinidi/organism-form'), label: 'Form', alt: 'A nested attribute form', span: 8 },
              ] },
            { name: 'Templates', text: 'Templates are the glue that combines the different organisms or individual sections to create a complete design.',
              figs: [
                { m: L('affinidi/template-headline'), alt: 'A page template with a headline', index: true },
                { m: L('affinidi/template-drawer'), alt: 'A page template with a drawer', index: true, span: 6 },
                { m: L('affinidi/template-tabs'), alt: 'A page template with tabs', index: true, span: 6 },
              ] },
            { name: 'Pages', text: 'The highest level of hierarchy in an atomic design system is the actual pages that make up a product. Below is a selection of the pages of our developer portal.',
              seq: { ring: 'PAGES', steps: [
                { m: L('affinidi/page-login'), alt: 'Developer portal page: log in' },
                { m: L('affinidi/page-projects'), alt: 'Developer portal page: my projects' },
                { m: L('affinidi/page-bulk-issuance'), alt: 'Developer portal page: bulk issuance' },
                { m: L('affinidi/page-analytics'), alt: 'Developer portal page: analytics' },
                { m: L('affinidi/page-schemas'), alt: 'Developer portal page: schema manager' },
                { m: L('affinidi/page-qualification'), alt: 'Developer portal page: qualification criteria' },
              ] } },
          ],
        } },
      ] },
    },
    goodworker: {
      context: { name: 'Context', blocks: [
        { photo: { m: L('goodworker/photo-worker'), alt: 'A worker at a sewing machine in a garment workshop',
          lead: 'The challenge was to design 3 different products: an Android app for workers, a responsive web app for employers and a back-office tool for operators.',
          cols: [
            ['The 450 million blue-collar workers in India include security guards, delivery staff, construction labourers, housekeepers, maids, assembly line workers, plumbers, electricians and more. They work hard every day, but their situation is becoming unstable.',
              'Inflation is threatening their already meagre earnings. Applying for jobs through middlemen or agencies gives them little transparency. Recruitment agencies can exploit them, and employers can pay them late or unfairly. They might not get adequate training either, which could later cost them the job they rely on.'],
            ['Contract employers struggle with workforce management too: a high risk of improper background checks, workers who are hard to find and match on skills, and a time-consuming recruitment process.',
              'GoodWorker gives workers in India a digital, verified biodata through our platform. With it they can find jobs more easily, secure their livelihood and establish a formal career. And employers can hire the right worker more efficiently and at lower cost.'],
          ] } },
      ] },
      process: { name: 'My process', blocks: [
        { steps: [
          { name: 'Research', text: 'When I joined the project, I interviewed several employers about their needs and pain points. I also did a UX competitor analysis to see what was already out there.' },
          { name: 'Conceptualise', text: 'Working from the research, we brainstormed features, created a user flow and set the information architecture for the employer portal.' },
          { name: 'Design', text: 'I started with low-fidelity wireframes built on the user flow and information architecture, then turned them into a high-fidelity prototype.' },
          { name: 'Test', text: 'We ran a usability test with 10 employers to gauge their interest and to spot UX design problems.' },
        ] },
      ] },
      research: { name: 'Research', blocks: [
        { lead: 'In the research we found three major pain points for our employer portal to solve:' },
        { list: [
          "Workers' skills are hard to verify because there is little formal record of their employment history",
          'Relying on intermediaries often makes hiring slow',
          'Replacements are hard to find when workers do not show up',
        ] },
        { note: 'That gave us this solution statement:' },
        { quote: 'Allow employers to hire the right workers, at the right time.' },
      ] },
      concept: { name: 'Conceptualise', blocks: [
        { lead: 'We prioritised the following features for the MVP of the employer portal:' },
        { list: ['Create a job listing', 'See candidates that applied for a job', 'Contact candidates'] },
        /* the information architecture beside the three paragraphs that walk it (the diagram is light on a night board) */
        { ia: {
          note: 'Those features led to this information architecture:',
          fig: { m: L('goodworker/ia'), alt: 'Information architecture: login, then job listings, with create new job listing and company profile beside it; each job listing leads to its candidates, and each candidate to contact candidate' },
          p: [
            'After logging in, the user lands on the job listings overview page. From there they can create a new job posting, which then appears in the job listings.',
            'From the job listings they can open any listing and see the candidates who applied for the job.',
            "Clicking one of the candidates opens their profile, where the user can contact them about the role.",
          ] } },
      ] },
      wireframes: { name: 'Wireframes', blocks: [
        { lead: 'I start every design phase by drawing up some wireframes.' },
        { figs: [
          { m: L('goodworker/wireframe-job-postings'), alt: 'Wireframe: job postings', index: true },
          { m: L('goodworker/wireframe-job-detail'), alt: 'Wireframe: job detail', index: true, span: 6 },
          { m: L('goodworker/wireframe-candidate'), alt: 'Wireframe: candidate', index: true, span: 6 },
        ] },
      ] },
    },
    heycar: {
      challenge: { name: 'The challenge', blocks: [
        { lead: 'A lot of people feel lost when it comes to buying a second-hand car. During our research we identified 4 major pain points in the buying process:' },
        { list: [
          'Buyers often feel overwhelmed when buying a second-hand car',
          'They often feel inadequate to judge whether a car is a good buy',
          'They find it difficult to bargain for a good price',
          "It's difficult to get good financing for second-hand cars",
        ] },
        { quote: 'With heycar we aimed to make the buyer more confident when it comes to buying a second-hand car.' },
      ] },
      ideation: { name: 'Ideation', blocks: [
        { lead: 'During the ideation phase we brainstormed around different features that would simplify the buying process for buyers. I created wireframes for these different features, which we then tested with users.' },
        /* the wireframes carry the working name "KITTKAT" in their header: that is how they are */
        { features: [
          { m: L('heycar/idea-search'), name: 'Simplify the search', text: 'Reducing the number of options the user can choose from reduces the cognitive load.', alt: 'Wireframe: the simplified search' },
          { m: L('heycar/idea-models'), name: 'Provide a list of suitable models', text: 'Based on the option selected by the user we provide them with a list of suitable cars they can select from.', alt: 'Wireframe: a list of suitable models' },
          { m: L('heycar/idea-tips'), name: 'Contextual tips', text: 'Providing the buyer with contextual tips will give them confidence to find the right car for them.', alt: 'Wireframe: search results with a contextual tip' },
          { m: L('heycar/idea-dealer'), name: 'Connect with dealership', text: 'Buyers can connect with a dealership beforehand to request a personalised quote, request a video or book a test drive.', alt: 'Wireframe: a request to a dealership' },
          { m: L('heycar/idea-message'), name: 'Message dealership', text: 'Message the dealership to bargain the price beforehand or make an appointment for a test drive.', alt: 'Wireframe: a chat with a dealership' },
        ] },
      ] },
    },
  };

  /* ── the Final designs as shown (concept): the data's entries, with the live site's images, titles and text where the
     brief adds them. Affinidi 01 was the cropped console rail: the real console now (its newer caption stays the card
     caption); 02 takes the second four-phone render, so it does not repeat the hero. GoodWorker's two become the live
     site's five: 01 keeps the newer caption, now on the right image (the job postings board); 05 is the devices render.
     heycar keeps its two and adds the financing calculator: the devices, then its seven screens as a stepped sequence.
     Its step labels quote the UI's own step tabs, which are real text in the images. ── */
  var P = WORK.projects;
  WORK.finals = {
    'sales-portal': [
      { m: L('sales-portal/calendar'), alt: 'The week view: on-site appointments, product demos and calls', title: 'The week', text: ['On-site visits, product demos and calls in one week view, with an export to iCal and Google.'] },
      { m: L('sales-portal/profile'), alt: 'A lead’s full profile: contact, home and system, financing and the contact history', title: 'The lead profile', text: ['Contact details, the home and the system, financing and every contact so far.'], caption: 'Every person and lead on these screens is fictional.' },
    ],
    affinidi: [
      Object.assign({}, P.affinidi.finalDesigns[0], { m: L('affinidi/console-macbook'), title: 'Developer console',
        text: ['We first built this design system for our developer console, which gives our customers tools to improve data privacy and portability in their own applications.'] }),
      /* r6 review: phones-b was the hero's four phones again; a 1:1 detail on the white-label Home app instead
         (Decision 01 already frames StudID beside GameID) */
      Object.assign({}, P.affinidi.finalDesigns[1], { m: { kind: 'detail', of: '/projects/affinidi-phones.webp', cx: 1150, cy: 540, mcx: 1150, mcy: 560 },
        text: ['The design system was flexible enough to reuse across different applications.',
          'We duplicated it and updated the style guide to give each new application its own look and feel, which made them much faster to build.'] }),
    ],
    goodworker: [
      { m: L('goodworker/final-job-postings'), alt: P.goodworker.finalDesigns[0].alt, caption: P.goodworker.finalDesigns[0].caption, title: 'Job postings',
        text: ['The job postings board shows all the available positions in the company, with the status of each posting at a glance. From the board the user can open the detail view of any posting or create a new job posting.'] },
      { m: L('goodworker/final-create-posting'), alt: 'GoodWorker employer portal: creating a new job posting', title: 'Create new job posting',
        text: ['Employers can easily create a new job posting and set all its requirements. Workers are then matched on those requirements.'] },
      { m: L('goodworker/final-job-detail'), alt: 'GoodWorker employer portal: a job detail page with its candidates', title: 'Job detail page',
        text: ['The job detail page gives a clear overview of the job requirements and lists all candidates with their current status. Clicking a candidate takes the user to the candidate detail page.'] },
      { m: L('goodworker/final-candidate-detail'), alt: 'GoodWorker employer portal: a candidate detail page', title: 'Candidate detail page',
        text: ['The candidate profile shows the details of that candidate. From here the employer can reject or contact them, and contacting them reveals their phone number.'] },
      P.goodworker.finalDesigns[1],
    ],
    heycar: [
      /* r6 review: the data's 01 (heycar.jpg, 'Simplified search') is really the calculator's step 05, which the
         sequence below shows, so it is left out until there is a real search screen (for Werner); 02 is a 1:1 detail
         of the vehicle page on the hero's MacBook: the car, its price and the dealer contact the caption names */
      Object.assign({}, P.heycar.finalDesigns[1], { m: { kind: 'detail', of: '/projects/heycar-macbook.webp', cx: 640, cy: 520, mcx: 620, mcy: 520 } }),
      { group: 'Financing calculator', lead: { m: L('heycar/devices'), alt: 'The heycar financing calculator on a laptop, a tablet and a phone' },
        seq: { ring: 'FINANCING CALCULATOR', steps: [
          { m: L('heycar/finance-01'), alt: 'Financing calculator: the start, in three steps to the best financing for the BMW X3' },
          { m: L('heycar/finance-02'), alt: 'Financing calculator: the car detail page with its financing button' },
          { m: L('heycar/finance-03'), tab: 'Mobilität', alt: 'Financing calculator, step Mobilität: keep the car or return it' },
          { m: L('heycar/finance-04'), tab: 'Ratenplaner', alt: 'Financing calculator, step Ratenplaner: the monthly rate plan' },
          { m: L('heycar/finance-05'), tab: 'Anzahlung/Laufzeit', alt: 'Financing calculator, step Anzahlung/Laufzeit: down payment and term' },
          { m: L('heycar/finance-06'), tab: 'Deine Finanzierung', alt: 'Financing calculator, step Deine Finanzierung: the recommended credit' },
          { m: L('heycar/finance-07'), tab: 'Deine Finanzierung', alt: 'Financing calculator, step Deine Finanzierung: the rate optimised in the calculator' },
        ] } },
    ],
  };

  /* ── template helpers ─────────────────────────────────────────────────────── */
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARR = '<svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var STOP = '<span class="stop">.</span>';
  /* one span per word (the focus reveals run per word), the closing period as the lit stop inside the last word, so it
     never wraps onto a line of its own. Copy stays verbatim: the stop is the period's own glyph, drawn transparent. */
  function words(s, keep) {
    var t = String(s), end = /\.$/.test(t);
    if (end) t = t.slice(0, -1);
    var ws = t.split(/\s+/), out = ws.map(function (w, i) { return '<span class="w' + (/\w-\w/.test(w) ? ' nw' : '') + '">' + esc(w) + (end && i === ws.length - 1 ? STOP : '') + '</span>'; });
    /* polish review: text-wrap pretty cannot see orphans across one inline-block per word, so a statement could end on
       one short word ("markets.", "do it."). keep: its closing words wrap as one group of at least `keep` characters */
    if (keep && ws.length > 2) {
      var k = ws.length - 1, n = ws[k].length;
      do { n += 1 + ws[--k].length; } while (k > 1 && n < keep);
      out.splice(k, ws.length - k, '<span class="nw">' + out.slice(k).join(' ') + '</span>');
    }
    return out.join(' ');
  }
  /* the scheme's out-of-focus layers (FS.theme.src, which runs later, would fetch the violet one first) */
  var scheme = (window.FS_SCHEME && window.FS_SCHEME.id) || 'violet';
  var tint = function (p) { return scheme === 'violet' ? p : p.replace(/^assets\/([a-z]+-soft-moon\.webp)$/, 'assets/t/' + scheme + '/$1'); };
  var hue = function (h) { return '--h1:var(--' + h.h1 + ');--h2:var(--' + h.h2 + ');--ax:' + h.ax + ';--ay:' + h.ay; };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  /* every image: its intrinsic size (no reflow), async decoding, lazy unless it is above the fold */
  var img = function (m, alt, cls, o) {
    o = o || {};
    /* r6 review: the live images wider than 1400 have a 1200w twin (tools/live.py), so phones don't fetch desktop bytes */
    var ss = !o.src && /^assets\/work\/live\/.+\.webp$/.test(m.src) && m.w > 1400 ?
      ' srcset="' + m.src.replace(/\.webp$/, '-1200.webp') + ' 1200w, ' + m.src + ' ' + m.w + 'w" sizes="(max-width:767px) 100vw, 72vw"' :
      /* 2026-10-05: a render with a 2x twin (m.x2) for large and retina screens */
      !o.src && m.x2 ? ' srcset="' + m.src + ' ' + m.w + 'w, ' + m.x2 + ' ' + 2 * m.w + 'w" sizes="(max-width:767px) 100vw, 64vw"' : '';
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + (o.src || m.src) + '"' + ss + ' alt="' + esc(alt || '') + '" width="' + (o.w || m.w) + '" height="' + (o.h || m.h) + '" decoding="async"' +
      (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + (o.loupe ? ' data-loupe' : '') + '>';
  };
  WORK.util = { esc: esc, words: words, tint: tint, hue: hue, pad2: pad2, img: img, ARR: ARR, STOP: STOP };

  /* ── the plate: the gradient, edge to edge, and the media on it ─────────────────────────────────────────────────
     Round 6: a plate is filled by the light (.pl-lt: the scheme's --aurora-lit, the project's key --h1 at --ax/--ay and
     its fill --h2 from the opposite side, blend color), r28 (r24 on phones). No disc. What sits on it:
       device   the true-colour render straight on the light, with its shadow (the halo's silhouette in the night, a
                little below it) and, for the keyed renders, the scheme-tinted soft layer the focus racks from
       detail   a device render at 1:1, a close-up of its real pixels, cut by the plate's own edge
       screen   a flat screenshot in its glass frame (a translucent bezel, the site's rim)
       board    flat UI on transparency, on the light (its own shadows), or on a night board (ground 'night')
     A fit plate has its own aspect (the context's) and centres a device, a detail or a framed screen in it (container
     units, css/work.css); a hug plate is padded round its media at the media's own aspect (boards and screens in the
     new sections). */
  WORK.fit = function (m) {
    var b = m.box || [0, 0, m.w, m.h], bw = b[2] - b[0], bh = b[3] - b[1];
    return '--bwf:' + (bw / m.w).toFixed(4) + ';--bar:' + (bw / bh).toFixed(4) + ';--cxf:' + ((b[0] + b[2]) / 2 / m.w).toFixed(4) +
      ';--cyf:' + ((b[1] + b[3]) / 2 / m.h).toFixed(4) + ';--ar:' + (m.h / m.w).toFixed(4);
  };
  WORK.fx = function (m, alt, o) {
    o = o || {};
    var eager = o.eager, soft = '';
    if (m.kind === 'detail') {
      var r = WORK.media[m.of];
      return '<span class="st-det" style="--cx:' + m.cx + ';--cy:' + m.cy + (m.mcx != null ? ';--mcx:' + m.mcx + ';--mcy:' + m.mcy : '') + ';--rw:' + r.w + ';--ar:' + (r.h / r.w).toFixed(4) + '">' +
        '<i class="st-sh" aria-hidden="true" style="-webkit-mask-image:url(' + r.halo + ');mask-image:url(' + r.halo + ')"></i>' +
        img(r, '', 'st-img st-soft', { src: tint(r.soft), w: 800, h: Math.round(r.h / 2) }) +
        img(r, alt, 'st-img st-sharp', { loupe: true }) + '</span>';
    }
    if (m.kind === 'device') {
      if (m.soft) soft = img(m, '', 'st-img st-soft', { src: tint(m.soft), w: 800, h: Math.round(m.h / 2), eager: eager });
      return '<span class="st-dev' + (m.soft ? '' : ' st-dev--flat') + '" style="' + WORK.fit(m) + '">' +
        (m.halo ? '<i class="st-sh" aria-hidden="true" style="-webkit-mask-image:url(' + m.halo + ');mask-image:url(' + m.halo + ')"></i>' : '') +
        soft + img(m, alt, 'st-img st-sharp', { eager: eager, loupe: true }) + '</span>';
    }
    if (m.kind === 'board') {
      return '<span class="pl-bd' + (m.ground === 'night' ? ' pl-bd--night' : '') + (m.cap ? ' pl-bd--cap" style="--cap:' + m.cap + 'px' : '') + '">' + img(m, alt, '', { loupe: true }) + '</span>';
    }
    /* a flat screen: its glass frame, the screen at 1:1 at most; out of focus it blurs and takes the hue pair */
    return '<span class="scr" style="--nw:' + m.w + ';--nh:' + m.h + '">' + img(m, alt, '', { eager: eager, loupe: true }) + '<i class="scr-tint" aria-hidden="true"></i></span>';
  };
  /* o: fit (a fixed-aspect plate), cls, attrs (extra attributes), alt, lens (the loupe's ring text), eager */
  WORK.plate = function (m, o) {
    o = o || {};
    /* a detail has no src of its own: the loupe reads its source render (polish review: it requested "undefined") */
    var lsrc = m.x2 || m.src || (m.of && WORK.media[m.of] && WORK.media[m.of].src);   /* the loupe reads the 2x twin where there is one */
    var lens = o.lens && lsrc ? ' data-lens="media" data-src="' + lsrc + '" data-ring="' + esc(o.lens) + '"' : '';
    /* a device's content aspect on its plate (phones size the plate to it, css/work.css); a wide board (a strip wider
       than 2.5:1) pans sideways on phones instead of shrinking to a sliver */
    var b = m.box || [0, 0, m.w, m.h], st = m.kind === 'device' ? ' style="--pbar:' + ((b[2] - b[0]) / (b[3] - b[1])).toFixed(3) + '"' : '';
    var wide = m.kind === 'board' && !m.cap && m.w / m.h > 2.5;   /* a capped board shows whole (the Bandcamp bar) */
    /* on-night for its own tokens (the loupe's tone, a frame's rim), but no data-tone: the header over a plate keeps
       its section's tone, instead of flipping to the night scrim over every lit plate it crosses */
    return '<div class="pl ' + (o.fit ? 'pl--fit' : 'pl--hug') + (wide ? ' pl--pan' : '') + ' on-night' + (o.cls ? ' ' + o.cls : '') + '" data-kind="' + m.kind + '"' + st + lens + (o.attrs || '') + '>' +
      '<i class="pl-lt" aria-hidden="true"></i>' + (wide ? '<span class="pl-pan" tabindex="0" role="region" aria-label="' + esc((o.alt || '') + ', scrolls sideways') + '"' + (m.pan === 'end' ? ' data-pan="end"' : '') + '>' + WORK.fx(m, o.alt, o) + '</span>' : WORK.fx(m, o.alt, o)) + '</div>';
  };

  /* ── the page's sections ──────────────────────────────────────────────────────────────────────────────────────
     Every section after the hero gets its number, its tone and its readout stop from its place (render): the Brief is
     01 and night, then night and ice alternate, so the order can change without a section knowing where it is. */
  var backPill = function (label, cls) {
    return '<a class="pill pill--sm pill--back ' + (cls || '') + '" href="index.html#work" data-back>' +
      '<span class="chip"><i class="b-light lit"></i>' + ARR.replace('class="arr"', 'class="arr arr--back"') + '</span><span>' + esc(label) + '</span></a>';
  };
  WORK.backPill = backPill;
  var label = function (p) { return 'Nº ' + p.no + ' · ' + WORK.kinds[p.kind || p.type]; };
  /* a section's frame: its tone (the on-night / on-ice tokens and the header's probe), name (the pill), stop */
  var open = function (id, c, name, cls) {
    return '<section id="' + id + '" class="w-sec ' + (cls || '') + ' on-' + c.tone + '" data-tone="' + c.tone + '" data-name="' + esc(name) + '" data-f="' + c.f + '" aria-labelledby="' + id + '-h">';
  };
  /* section head: a mono label, an H2 in the homepage's --t-h2 (or a statement size for a sentence) with its stop */
  var head = function (id, c, lab, h2, size) {
    var t = String(h2).replace(/\.$/, '');
    return '<div class="w-head wrap"><p class="label">' + c.n + ' · ' + esc(lab) + '</p><h2 class="h2' + (size ? ' h2--' + size : '') + '" id="' + id + '-h" data-lens="text">' + esc(t).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>') + STOP + '</h2></div>';   /* compounds never break at their hyphen */
  };
  WORK.head = head;

  /* the lit light behind the hero and the Next band: the live field shows through (js/work.js light()); the still is
     the static fallback (and holds the light while the menu borrows the field); the veil is the night where text sits */
  var SKY = '<i class="w-sky" aria-hidden="true"></i><i class="w-veil" aria-hidden="true"></i>';

  function hero(p) {
    var m = WORK.media[p.card], meta = [['Company', p.company], ['Role', p.role], ['Year', p.year], ['Team', p.team]].filter(function (r) { return r[1]; });
    var link = p.links && p.links.length ? '<div class="wm wm--link"><dt>Link</dt><dd>' + p.links.map(function (l) {
      return '<a href="' + l.href + '" target="_blank" rel="noopener">' + esc(l.text) + '<span class="sr-only"> (opens in a new tab)</span></a>';
    }).join('<span class="wm-sep" aria-hidden="true"> · </span>') + '</dd></div>' : '';
    return '<section id="top" class="w-hero w-lit" data-tone="night" data-name="' + esc(p.name) + '" data-f="1.4" aria-labelledby="w-title" style="' + hue(p.hue) + '">' + SKY +
      /* the device, large, on the light: its stage is the hero's right-hand side (css/work.css), a size container */
      '<div class="wh-stage rack">' + WORK.fx(m, p.cardAlt, { eager: true }) + '</div>' +
      '<div class="wh-stack">' +
        backPill('Selected work', 'wh-back') +
        '<p class="label wh-label">' + esc(label(p)) + '</p>' +
        '<p class="wh-name">' + esc(p.name) + '</p>' +
        '<h1 class="wh-title" id="w-title" data-lens="text">' + words(p.headline) + '</h1>' +
        '<ul class="wh-tags" aria-label="Disciplines">' + p.tags.map(function (t) { return '<li class="tag"><i class="t-stop"><i class="lit"></i></i>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<dl class="wh-meta' + (link ? ' wh-meta--5' : meta.length === 3 ? ' wh-meta--3' : '') + '">' + meta.map(function (r) { return '<div class="wm"><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + link + '</dl>' +
    '</section>';
  }
  function brief(p, c) {
    return '<section id="brief" class="w-sec w-brief wrap on-night" data-tone="night" data-name="Brief" data-f="' + c.f + '" aria-labelledby="brief-h">' +
      '<h2 class="label" id="brief-h">' + c.n + ' · Brief</h2>' +
      '<p class="w-statement" data-lens="text">' + words(p.brief, 12) + '</p>' +
    '</section>';
  }
  function what(p, c) {
    return open('what', c, 'What I did', 'w-what') + head('what', c, 'What I did', 'What I did') +
      '<div class="what-cols wrap">' + p.whatIDid.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
    '</section>';
  }
  function decisions(p, c) {
    return open('decisions', c, 'Decisions', 'w-dec') + head('decisions', c, 'Key decisions', 'Key decisions') +
      '<ol class="dec-list wrap">' + p.decisions.map(function (d, i) {
        var n = i + 1, m = d.image && (WORK.decMedia[p.slug + '-' + n] || WORK.media[d.image]), fig;
        if (m) {
          fig = '<figure class="dec-fig">' + WORK.plate(m, { fit: true, cls: 'dm rack', alt: d.imageAlt }) +
            (d.imageCaption ? '<figcaption class="dec-cap">' + esc(d.imageCaption) + '</figcaption>' : '') + '</figure>';
        } else {
          /* no image in the data: an illustration slot (a circle diagram on its night card, which stays). js/work-illus.js
             fills it (data-state empty → ready); the box keeps its 4:3 either way, so the layout never depends on it */
          fig = '<figure class="dec-illus on-night" data-illus="' + p.slug + '-' + n + '" data-state="empty" aria-hidden="true"></figure>';
        }
        return '<li class="dec" data-i="' + n + '" data-side="' + (i % 2 ? 'left' : 'right') + '">' +
          '<div class="dec-text">' +
            '<span class="dec-idx glass g-l" aria-hidden="true"><i class="b-light lit"></i><span>' + pad2(n) + '</span></span>' +
            '<h3 class="dec-h" data-lens="text">' + esc(d.heading) + '</h3>' +
            '<p class="dec-body">' + esc(d.body) + '</p>' +
          '</div>' + fig + '</li>';
      }).join('') + '</ol>' +
    '</section>';
  }
  /* a Final designs card: the plate (16:9, the loupe on hover), then its mono label beside what the design is: the
     live site's title, the data's caption, the live site's text (each only where there is one) */
  WORK.fdCard = function (m, it, n, ring, lab) {
    return '<figure class="fd" data-i="' + n + '" data-kind="' + m.kind + '">' +
      WORK.plate(m, { fit: true, cls: 'fdc rack', alt: it.alt, lens: ring + ' · ' + pad2(n) + ' · ' }) +
      '<figcaption class="fd-cap">' + (lab ? '<span class="label">' + esc(lab) + ' ' + pad2(n) + '</span>' : '') +
        '<span class="fd-main">' + (it.title ? '<h3 class="fd-title">' + esc(it.title) + '</h3>' : '') +
        (it.caption && !it.title ? '<span class="fd-txt">' + esc(it.caption) + '</span>' : '') +
        (it.text ? it.text.map(function (t) { return '<span class="fd-p">' + esc(t) + '</span>'; }).join('') : '') +
        /* r6 review: a title and a caption that open with the same words read as a duplicate; the caption follows */
        (it.caption && it.title ? '<span class="fd-note">' + esc(it.caption) + '</span>' : '') + '</span>' +
      '</figcaption>' +
    '</figure>';
  };
  function finals(p, c) {
    var list = WORK.finals[p.slug] || p.finalDesigns, k = 0;
    return open('final', c, 'Final designs', 'w-final') + head('final', c, 'Final designs', 'Final designs') +
      '<div class="fd-list wrap">' + list.map(function (d) {
        if (d.group) return group(d);
        k++;
        return WORK.fdCard(d.m || WORK.media[d.src], d, k, 'FINAL DESIGN', 'Final design');
      }).join('') + '</div>' +
    '</section>';
  }
  /* a titled group inside Final designs (heycar's financing calculator): its H3, the devices on the light, then its
     screens as a stepped sequence */
  function group(g) {
    return '<div class="fd-group">' +
      '<h3 class="fd-gh" data-lens="text">' + esc(g.group) + '</h3>' +
      (g.lead ? '<figure class="fd fd--lead" data-kind="' + g.lead.m.kind + '">' + WORK.plate(g.lead.m, { fit: true, cls: 'fdc fdc--bleed rack', alt: g.lead.alt, lens: g.seq.ring + ' · ' }) + '</figure>' : '') +
      (g.seq ? seq(g.seq) : '') +
    '</div>';
  }
  function outcome(p, c) {
    var st = p.stats && p.stats.length ? '<ul class="stats" aria-hidden="true">' + p.stats.map(function (s) {
      var num = s.from ? '<span class="st-n st-n--w">' + esc(s.from) + '<span class="to">' + ARR + '</span>' + esc(s.to) + '</span>'
        : '<span class="st-n" data-count="' + esc(s.n) + '">' + esc(s.n) + '</span>';
      return '<li class="stat"><span class="st-disc glass"><i class="b-light lit"></i>' + num + '</span><span class="st-l">' + esc(s.label).replace(/(\S+-\S+)/g, '<span class="nw">$1</span>') + '</span></li>';
    }).join('') + '</ul>' : '';
    return open('outcome', c, 'Outcome', 'w-out wrap' + (p.stats && p.stats.length === 1 ? ' w-out--one' : '')) +
      '<h2 class="label" id="outcome-h">' + c.n + ' · Outcome</h2>' + st +
      '<p class="w-outcome" data-lens="text">' + words(p.outcome, 12) + '</p>' +
    '</section>';
  }
  /* the Next band: one link, named "Next project: <name>". The next project's hero in miniature, filled with the
     same light: its device large on the light, its number and headline, its name across the bottom as large as the
     width allows (js/work.js fits it), the night veil under the words. Its light grows to fill the viewport on click
     (js/handoff.js), and the next page opens on it. */
  function next(p, c) {
    var n = WORK.projects[p.nextSlug];
    if (!n) return '';
    var m = WORK.media[n.card], href = 'work.html?p=' + n.slug;
    return '<section id="next" class="w-next w-lit" data-tone="night" data-name="Next project" data-f="' + c.f + '" aria-labelledby="next-h" style="' + hue(n.hue) + '">' + SKY +
      /* the heading before the link it introduces (reading and heading order); both are placed absolutely */
      '<h2 class="label nx-label" id="next-h">Next project</h2>' +
      '<a class="nx-link" href="' + href + '" data-next="' + n.slug + '" aria-label="Next project: ' + esc(n.name) + '">' +
        '<span class="nx-stage rack" aria-hidden="true">' + WORK.fx(m, '') + '</span>' +
        '<span class="nx-copy" aria-hidden="true">' +
          '<span class="label nx-no">' + esc(label(n)) + '</span>' +
          '<span class="nx-title">' + words(n.headline) + '</span>' +
          '<span class="nx-name">' + esc(n.name) + '</span>' +
        '</span>' +
        '<span class="nx-go glass g-l" aria-hidden="true"><i class="b-light lit"></i>' + ARR + '</span>' +
      '</a>' +
      backPill('Back to all work', 'nx-back') +
    '</section>';
  }

  /* ── the live site's blocks ─────────────────────────────────────────────────────────────────────────────────── */
  /* a figure: its plate and, where the brief gives one, its mono label; else a mono index where the slot asks for it */
  function fig(f, ring, k, n) {
    var lab = f.label || (f.index ? pad2(k) + ' / ' + pad2(n) : '');
    return '<figure class="pf" style="--span:' + (f.span || 12) + '" data-kind="' + f.m.kind + '">' +
      WORK.plate(f.m, { alt: f.alt, lens: ring + (f.label ? ' · ' + f.label.toUpperCase() : '') + ' · ' }) +
      (lab ? '<figcaption class="label pf-cap">' + esc(lab) + '</figcaption>' : '') + '</figure>';
  }
  function figs(list, ring) {
    return '<div class="pf-grid">' + list.map(function (f, i) { return fig(f, ring, i + 1, list.length); }).join('') + '</div>';
  }
  /* the stepped sequence: every step a plate at the steps' shared aspect, labelled "01 / 07" (and the UI's own step
     tab, where the screen shows one). Live on wide screens it is a sticky stage that the scroll steps through, the
     step dots (full stops, the current one lit) and the label under it; on phones, in static and in reduced motion it
     is the stack of its steps (js/work.js sequences) */
  function seq(s) {
    var n = s.steps.length, m0 = s.steps[0].m;
    return '<div class="seq" style="--n:' + n + ';--sa:' + (m0.w / m0.h).toFixed(4) + '" data-n="' + n + '">' +
      '<div class="seq-stage">' +
        '<ol class="seq-list">' + s.steps.map(function (st, i) {
          var lab = pad2(i + 1) + ' / ' + pad2(n);
          return '<li class="seq-step" data-i="' + i + '"><figure class="pf">' + WORK.plate(st.m, { alt: st.alt, lens: s.ring + ' · ' + pad2(i + 1) + ' · ' }) +
            '<figcaption class="label pf-cap seq-cap"><span class="seq-no">' + lab + '</span>' + (st.tab ? '<span class="seq-tab">' + esc(st.tab) + '</span>' : '') + '</figcaption></figure></li>';
        }).join('') + '</ol>' +
        '<div class="seq-bar">' +
          '<span class="seq-dots">' + s.steps.map(function (st, i) { return '<button class="seq-dot" type="button" data-i="' + i + '" aria-label="Step ' + (i + 1) + ' of ' + n + '"><i class="lit"></i></button>'; }).join('') + '</span>' +
          '<span class="label seq-read" aria-hidden="true"><span class="seq-n"><span class="seq-at">01</span> / ' + pad2(n) + '</span><span class="seq-rt"></span></span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  /* heycar's ideation: five features, each its wireframe on the light, its index, title and line. Live on wide screens a
     horizontal sequence the scroll carries sideways (a sticky stage); a stack on phones, static and reduced motion */
  function features(list) {
    return '<div class="feat" style="--n:' + list.length + '"><div class="feat-pin"><ol class="feat-track">' + list.map(function (f, i) {
      return '<li class="feat-it">' + WORK.plate(f.m, { alt: f.alt, lens: 'IDEATION · ' + pad2(i + 1) + ' · ' }) +
        '<p class="label feat-no">' + pad2(i + 1) + ' / ' + pad2(list.length) + '</p>' +
        '<h3 class="feat-h">' + esc(f.name) + '</h3><p class="feat-p">' + esc(f.text) + '</p></li>';
    }).join('') + '</ol></div></div>';
  }
  /* the process: glass index discs (the decisions' own, lit in turn as the row comes into view) on one hairline */
  function steps(list) {
    return '<div class="w-b w-b--full"><ol class="stp-list">' + list.map(function (s, i) {
      return '<li class="stp" data-i="' + (i + 1) + '"><span class="stp-idx glass g-l" aria-hidden="true"><i class="b-light lit"></i><span>' + pad2(i + 1) + '</span></span>' +
        '<h3 class="stp-h">' + esc(s.name) + '</h3><p class="stp-p">' + esc(s.text) + '</p></li>';
    }).join('') + '</ol></div>';
  }
  /* the photo band: full bleed and full colour; its lead sits over the photo's foot on a night veil (on phones under
     it), the two columns of context beside it on the section's ground */
  function photo(b) {
    return '<div class="ph">' +
      '<div class="ph-band on-night" data-tone="night">' + img(b.m, b.alt, 'ph-img') + '<i class="ph-veil" aria-hidden="true"></i>' +
        '<p class="ph-lead wrap" data-lens="text">' + words(b.lead, 12) + '</p></div>' +
      '<div class="w-b ph-cols">' + b.cols.map(function (col) { return '<div class="ph-col">' + col.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>'; }).join('') + '</div>' +
    '</div>';
  }
  /* Affinidi's atomic design: the style guide (the foundation, a tall dark board given the full width), then the five
     stages beside a sticky rail of five discs growing from atom to page, each lit while its stage is in view (UI
     discs, not image circles); on phones a compact disc row stuck under the header */
  var DISC = [10, 15, 22, 31, 42];                              /* the rail's discs, atom to page (px, desktop) */
  function stages(s, slug) {
    var g = s.guide, ring = 'ATOMIC DESIGN';
    var rail = '<nav class="stg-rail" aria-label="The five stages"><ol>' + s.list.map(function (st, i) {
      return '<li><a class="stg-a" href="#stage-' + (i + 1) + '" data-i="' + i + '"><i class="stg-d" style="--d:' + DISC[i] + 'px" aria-hidden="true"><i class="lit"></i></i><span class="stg-n">' + esc(st.name) + '</span></a></li>';
    }).join('') + '</ol></nav>';
    return '<div class="w-b stg-guide"><p class="label stg-gl">' + esc(g.name) + '</p><p class="stg-gp">' + esc(g.text) + '</p>' +
        '<figure class="pf pf--guide" data-kind="board">' + WORK.plate(g.fig.m, { alt: g.fig.alt, lens: 'STYLE GUIDE · ' }) + '</figure></div>' +
      '<div class="w-b stg">' + rail + '<div class="stg-body">' + s.list.map(function (st, i) {
        return '<div class="stage" id="stage-' + (i + 1) + '" data-i="' + i + '">' +
          '<p class="label stage-no">' + pad2(i + 1) + ' / ' + pad2(s.list.length) + '</p>' +
          '<h3 class="stage-h" data-lens="text">' + esc(st.name) + '</h3>' +
          '<p class="stage-p">' + esc(st.text) + '</p>' +
          (st.figs ? figs(st.figs, ring + ' · ' + st.name.toUpperCase()) : '') + (st.seq ? seq(st.seq) : '') +
        '</div>';
      }).join('') + '</div></div>';
  }
  function list(items) {
    return '<div class="w-b"><ul class="w-list">' + items.map(function (t) { return '<li><i class="li-stop" aria-hidden="true"><i class="lit"></i></i><span>' + esc(t) + '</span></li>'; }).join('') + '</ul></div>';
  }
  function ia(b) {
    return '<div class="w-b w-ia"><p class="w-note">' + esc(b.note) + '</p>' +
      '<figure class="pf pf--ia" data-kind="board">' + WORK.plate(b.fig.m, { alt: b.fig.alt, lens: 'INFORMATION ARCHITECTURE · ' }) + '</figure>' +
      '<div class="w-ia-p">' + b.p.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div></div>';
  }
  function block(b, sec, slug) {
    if (b.lead) return '<div class="w-b"><p class="w-lead" data-lens="text">' + words(b.lead, 12) + '</p></div>';
    if (b.p) return '<div class="w-b"><div class="w-p' + (b.cols ? ' w-p--' + b.cols : '') + '">' + b.p.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div></div>';
    if (b.list) return list(b.list);
    if (b.note) return '<div class="w-b"><p class="w-note">' + esc(b.note) + '</p></div>';
    if (b.quote) return '<div class="w-b w-b--full"><blockquote class="w-quote"><p class="w-qt" data-lens="text">' + words(b.quote, 12) + '</p></blockquote></div>';
    if (b.figs) return '<div class="w-b w-b--full">' + figs(b.figs, sec.name.toUpperCase()) + '</div>';
    if (b.steps) return steps(b.steps);
    if (b.photo) return photo(b.photo);
    if (b.stages) return stages(b.stages, slug);
    if (b.features) return features(b.features);
    if (b.ia) return ia(b.ia);
    return '';
  }
  function story(p, c, key) {
    var s = WORK.sections[p.slug][key];
    return open(key, c, s.name, 'w-story w-story--' + key) + head(key, c, s.name, s.h2 || s.name, s.size) +
      s.blocks.map(function (b) { return block(b, s, p.slug); }).join('') + '</section>';
  }

  /* ── the eye-candy gallery: the one real render's screen, flat and whole, then details of it ─────────────────
     The hero shows the render (the MacBook the homepage card hands over), so the Gallery opens on its screen itself,
     rectified (WORK.screens), in a glass screen frame on the project's light; the loupe runs over it. Then the details.
     Each project has one real screen (its render). The data's other gallery entries describe screens we don't have
     ("Mobile view", "Settings"…), so their captions and alts never show: the details are pieces of that one screen,
     cut and rectified by tools/work.py (keep DETAILS there and here in step), labelled only "Detail 01"… Their alts
     are the first image's alt from the data, plus the detail's number.
     Every detail is a window on the one flat screen (1400 × 915) at one scale, 1 master px per reference px (u), so
     the UI's text is the same size in every frame. u is 1px at 1440 (the grid is 1344 wide); css/work.css .gd.
       src, w × h   the crop (master px)
       a            its anchor: the corner that sits inset in the frame (tl, tr, bl, br); the other two sides bleed
       span         the grid: wide 8, narrow 4, half 6, full 12 columns (the data's own spans for its gallery)
       fh           the frame's height (reference px); ix/iy the anchor's inset (60 unless set)
       mh, mt       the frame's height on phones (unless set, fh − 24: the phone's 36 inset shows the same rows as
                    the desktop's 60), and a drop from the row's top (desktop), so a row's two frames stagger instead
                    of reading as one screen cut by the gutter
       msx          phones: the window slides this far into the crop (its anchored corner leaves the frame), where
                    the phone's narrower window would otherwise miss what the detail is for
     Round 6: each frame is a plate, the project's light filled edge to edge behind its fragment (the disc that peeked
     round the fragment's corner is gone). Concept data, marked so; the frames are this concept's, the pixels the
     render's. */
  var det = function (slug, n, a, w, h, span, fh, o) {
    return Object.assign({ src: 'assets/work/' + slug + '-detail-' + pad2(n) + '.webp', a: a, w: w, h: h, span: span, fh: fh }, o || {});
  };
  WORK.details = {
  };
  function detail(d, n, p) {
    var st = '--cw:' + d.w + ';--ch:' + d.h + ';--fh:' + d.fh + (d.mh ? ';--mh:' + d.mh : '') + (d.mt ? ';--mt:' + d.mt : '') + (d.msx ? ';--msx:' + d.msx : '') + (d.ix != null ? ';--ixd:' + d.ix : '') + (d.iy != null ? ';--iyd:' + d.iy : '');
    return '<li class="gd" data-i="' + n + '" data-span="' + d.span + '" data-a="' + d.a + '" style="' + st + '">' +
      '<figure class="gd-fig">' +
        '<div class="gd-f pl on-night">' +
          '<i class="pl-lt" aria-hidden="true"></i>' +
          '<span class="gd-scr">' + img(d, p.images[0].alt + ', detail ' + pad2(n)) + '</span>' +
        '</div>' +
        '<figcaption class="label gd-cap">Detail ' + pad2(n) + '</figcaption>' +
      '</figure></li>';
  }
  function gallery(p, c) {
    var it = p.images[0], m = WORK.screens[p.slug] || WORK.media[it.src], ds = WORK.details[p.slug] || [];
    return open('gallery', c, 'Gallery', 'w-final w-gal') + head('gallery', c, 'Gallery', 'Gallery') +
      '<div class="fd-list wrap">' + WORK.fdCard(m, it, 1, WORK.kinds[p.kind || p.type].toUpperCase(), null) + '</div>' +
      (ds.length ? '<ul class="gal-grid wrap" aria-label="Details">' + ds.map(function (d, i) { return detail(d, i + 1, p); }).join('') + '</ul>' : '') +
    '</section>';
  }

  /* ── views: the body between the Brief and the Next band, per project type ──
     WORK.views[type](p) → the ordered list of section keys; WORK.part[key](p, c) writes one. Behaviour hooks in through
     FS.on('work:boot', ctx) in a deferred script (js/work.js emits it once the page's parts are wired). */
  WORK.part = { what: what, decisions: decisions, final: finals, outcome: outcome, gallery: gallery };
  WORK.views = {
    'case': function (p) { return p.order; },
    'eye-candy': function () { return ['gallery']; },
    'side-quest': function (p) { return p.order; },
  };

  function none() {
    return '<section id="top" class="w-hero w-hero--none" data-tone="night" data-name="Work" data-f="1.4" aria-labelledby="w-title">' +
      '<div class="wh-stack">' + backPill('Selected work', 'wh-back') +
        '<h1 class="wh-title" id="w-title">Project not found' + STOP + '</h1>' +
      '</div></section>';
  }

  /* ── render: before the first paint, from the inline script after <main> ──
     The sections after the hero take their numbers (01 the Brief), tones (the Brief night, then alternating) and
     readout stops (2, 3, …; the hero 1.4) from their places; js/work.js hands the stops to the readout (WORK.stops). */
  WORK.render = function () {
    var q = /[?&]p=([a-z0-9-]+)/.exec(location.search), slug = q ? q[1] : '', p = WORK.projects[slug] || null;
    var view = p && WORK.views[p.type];
    WORK.slug = p ? slug : null; WORK.p = p;
    var html = none();
    if (p && view) {
      var keys = ['brief'].concat(view(p)), parts = [];
      keys.forEach(function (k, i) {
        var c = { n: pad2(i + 1), tone: i % 2 ? 'ice' : 'night', f: i + 2 };
        parts.push(k === 'brief' ? brief(p, c) : WORK.part[k] ? WORK.part[k](p, c) : story(p, c, k));
      });
      WORK.count = keys.length;
      WORK.stops = [1.4].concat(keys.map(function (k, i) { return i + 2; }), [keys.length + 2, keys.length + 3]);
      html = hero(p) + parts.join('') + next(p, { f: keys.length + 2 });
    }
    var s = document.currentScript, main = (s && s.parentNode) || document.getElementById('main');
    if (s) s.insertAdjacentHTML('beforebegin', html); else main.insertAdjacentHTML('afterbegin', html);
    /* the project's hue pair lights every plate on the page (the Next band sets its own) */
    if (p && main) main.setAttribute('style', hue(p.hue));
    var d = document, h = d.documentElement;
    h.classList.add(p ? 'is-' + p.type : 'is-none');
    if (p) {
      d.title = p.name + ' · ' + p.headline.replace(/\.$/, '') + ' · Werner van Huffelen';
      var md = d.querySelector('meta[name=description]'); if (md) md.setAttribute('content', p.brief);
    } else d.title = 'Project not found · Werner van Huffelen';
    var pill = d.querySelector('[data-readout] .roll > span'); if (pill) pill.textContent = p ? p.name : 'Work';
  };
  /* the footer: its number follows the page's own sections, its readout stop comes after the Next band's */
  WORK.after = function () {
    var p = WORK.p, n = document.querySelector('[data-ft-n]'), f = document.getElementById('footer');
    if (n && p) n.textContent = pad2(WORK.count + 1);
    if (f && p) f.setAttribute('data-f', String(WORK.count + 3));
    if (!p && f) f.querySelector('.ft-kicker').style.display = 'none';
  };
})();
