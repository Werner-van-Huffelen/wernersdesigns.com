/* Full Stop · visit counting (2026-10-09, Werner: "a little dashboard to track some metrics on how it performs").
 * GoatCounter, cookieless (no consent banner): count.js counts each page, and these events:
 *   refresh-<scheme>   a reload that moved the colour scheme on (the post's "refresh the page a few times" tip)
 *   cv-download, contact-me, contact-email, linkedin, instagram   clicks, from data-goatcounter-click in the HTML
 * Pages count as / and /work/<slug>, whatever else the address carries (?theme=, a #section).
 * Counts only on the live domain, and never in ?static=1 / ?notrack=1 / automated (headless) visits, so QA renders and
 * the preview copy stay out of the numbers. Off until GC_CODE holds Werner's GoatCounter code (<code>.goatcounter.com).
 * The numbers reach his Portfolio Launch Tracker through tools/goatcounter_pull.py. */
(function () {
  var GC_CODE = 'wernersdesigns';   // https://wernersdesigns.goatcounter.com (Werner's account, 2026-10-09)
  if (!GC_CODE || location.hostname !== 'www.wernersdesigns.com') return;
  if (/[?&](static|notrack)=/.test(location.search) || navigator.webdriver) return;
  var m = /[?&]p=([a-z0-9-]+)/.exec(location.search), slug = m ? m[1] : '';
  slug = { 'galvany-os': 'galvany', 'sales-portal': 'galvany' }[slug] || slug;   // the merged case's old links, as work-data.js
  window.goatcounter = {
    path: function () { return /work\.html$/.test(location.pathname) ? '/work/' + slug : '/'; },
  };
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + GC_CODE + '.goatcounter.com/count');
  document.head.appendChild(s);
  /* the refresh tip: js/scheme.js marks a reload that moved the scheme (FS_SCHEME.changed) */
  var S = window.FS_SCHEME;
  if (!S || !S.changed) return;
  var tries = 0, t = setInterval(function () {
    var gc = window.goatcounter;
    if (gc && gc.count) { clearInterval(t); gc.count({ path: 'refresh-' + S.id, title: 'Refresh to ' + S.id, event: true }); }
    else if (++tries > 50) clearInterval(t);
  }, 200);
})();
