/* Full Stop · the scheme picker (moved out of index.html's head in round 5, verbatim; both pages load it synchronously
   in the head, after the icon link, so the favicon and html[data-theme] are set before the first paint).
   The scheme (round 4, Werner: "on refreshing the page the color scheme changes"). Only the light changes; the night
   stays. A reload (⌘R, F5, pull-to-refresh or the hero's own button) moves to the next scheme, any other visit keeps
   the last one, and a first visit starts on violet. ?theme=<id> picks one directly (except on a reload, which moves
   on). Stored in localStorage, else window.name. Colours: css/system.css §1b; headlines: the script under the hero.
   A click from one page to the other is a 'navigate', so the scheme carries across the site; the homepage's portrait
   preloads stay in index.html. */
(function(d){
  var T=['violet','ember','cobalt','sodium','borealis'],K='fs.scheme',q=/[?&]theme=([a-z]+)/.exec(location.search),prev=null,nav='navigate',i;
  try{prev=localStorage.getItem(K);}catch(e){}
  if(!prev){var w=/(?:^|;)fs\.scheme=([a-z]+)/.exec(window.name||'');prev=w&&w[1];}
  try{nav=performance.getEntriesByType('navigation')[0].type;}catch(e){}
  var p=T.indexOf(prev);
  if(nav==='reload'&&p>=0)i=(p+1)%T.length;
  else if(q&&T.indexOf(q[1])>=0)i=T.indexOf(q[1]);
  else i=p>=0?p:0;
  try{localStorage.setItem(K,T[i]);}catch(e){try{window.name='fs.scheme='+T[i];}catch(e2){}}
  var id=T[i],h=d.documentElement;
  h.setAttribute('data-theme',id);
  /* changed: this visit is a reload that moved the scheme on (round 7: the homepage plays its colour bleed then; a
     first visit and any other load keep the original pinhole loader, js/handoff.js) */
  window.FS_SCHEME={id:id,index:i,list:T,changed:nav==='reload'&&p>=0};
  /* the favicon is the scheme's lit disc */
  var C={violet:['F7F4FF','B3A8FF','7C6BFF'],ember:['FFF4EC','FFB894','FF6B2B'],cobalt:['F1F6FF','A6BDFF','3F6BFF'],sodium:['FFFBEE','FFE07A','FFC933'],borealis:['F0FFF8','A0F5D0','2EE59D']}[id];
  var ic=d.querySelector('link[rel=icon]');
  if(ic)ic.href="data:image/svg+xml,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><radialGradient id='g' cx='.4' cy='.36' r='.72'><stop offset='0' stop-color='#"+C[0]+"'/><stop offset='.42' stop-color='#"+C[1]+"'/><stop offset='1' stop-color='#"+C[2]+"'/></radialGradient></defs><circle cx='16' cy='16' r='14' fill='url(#g)'/></svg>");
  /* the keys in the hero's line: ⌘ R on Apple, Ctrl R elsewhere, a tap on touch screens */
  var mac=/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent),touch=false;
  try{touch=matchMedia('(hover: none) and (pointer: coarse)').matches;}catch(e){}
  h.classList.add(touch?'kbd-touch':mac?'kbd-mac':'kbd-pc');
})(document);
