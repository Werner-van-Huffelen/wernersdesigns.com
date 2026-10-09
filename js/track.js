/* Full Stop · visit counting (2026-10-09, Werner: "a little dashboard to track some metrics on how it performs").
 * GoatCounter, cookieless (no consent banner): count.js counts each page, and these events:
 *   refresh-<scheme>   a reload that moved the colour scheme on (the post's "refresh the page a few times" tip)
 *   cv-download, contact-me, contact-email, linkedin, instagram   clicks, from data-goatcounter-click in the HTML
 * Pages count as / and /work/<slug>, whatever else the address carries (?theme=, a #section).
 * Counts only on the live domain, and never in ?static / ?notrack / automated (headless) visits, so QA renders and
 * the preview copy stay out of the numbers. Werner's own browsers skip counting after one visit to
 * /#toggle-goatcounter (count.js keeps that flag in localStorage).
 * The numbers reach his Portfolio Launch Tracker through the launch-tracker project (its goatcounter_pull.py). */
(function () {
  var GC_CODE = 'wernersdesigns';   // https://wernersdesigns.goatcounter.com (Werner's account, 2026-10-09)
  if (!GC_CODE || location.hostname !== 'www.wernersdesigns.com') return;
  if (/[?&](static|notrack)(=|&|$)/.test(location.search) || navigator.webdriver) return;
  var m = /[?&]p=([a-z0-9-]+)/.exec(location.search), slug = m ? m[1] : '';
  slug = { 'galvany-os': 'galvany', 'sales-portal': 'galvany' }[slug] || slug;   // the merged case's old links, as work-data.js
  var work = /\/work(\.html)?$/.test(location.pathname);   // GitHub Pages also serves work.html as /work
  window.goatcounter = {
    path: function () { return work ? '/work/' + slug : '/'; },
    /* a fixed title per page: the homepage's <title> changes with the scheme */
    title: function () { return work ? 'Case study: ' + slug : 'Homepage'; },
  };
  var S = window.FS_SCHEME;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + GC_CODE + '.goatcounter.com/count');
  s.addEventListener('load', function () {
    var gc = window.goatcounter;
    /* count.js has just flipped the skip flag for #toggle-goatcounter: drop the hash, or the next reload (which this
       site invites) flips it straight back */
    if (location.hash === '#toggle-goatcounter') {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
    /* the refresh tip: js/scheme.js marks a reload that moved the scheme */
    if (S && S.changed && gc && gc.count) gc.count({ path: 'refresh-' + S.id, title: 'Refresh to ' + S.id, event: true });
  });
  document.head.appendChild(s);
  /* count.js binds clicks once, to the links that exist when it runs; when it arrives from cache before the page has
     finished parsing, the later links would be missed, so bind again once the page is parsed (it skips bound links) */
  document.addEventListener('DOMContentLoaded', function () {
    var gc = window.goatcounter;
    if (gc && gc.bind_events) gc.bind_events();
  });
})();
