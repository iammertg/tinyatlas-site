/* The landing (/ and /tr/): the world in the hero and the twelve windows that open it. The chosen world's clip loads
   only when it is on screen and plays through twice, then rests on its last picture (nothing on the page keeps moving);
   the button plays it again. Under reduced motion nothing plays and the stills stay. Each world throws its own light on
   the night around it. */
(function () {
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // each world's light: its own colour, a little deeper than the picture's paper so it reads as light on the night
  var tints = { pond: 'rgba(112,196,124,.3)', farm: 'rgba(236,186,108,.28)', music: 'rgba(238,150,92,.28)', board: 'rgba(232,180,98,.26)',
    garden: 'rgba(168,212,98,.28)', reef: 'rgba(72,198,196,.3)', kitchen: 'rgba(118,188,228,.28)', studio: 'rgba(238,212,168,.24)',
    street: 'rgba(238,150,118,.28)', winter: 'rgba(178,162,238,.32)', space: 'rgba(104,132,236,.32)', dino: 'rgba(168,208,92,.28)' };
  function btnOf(v) { return v.closest('.screen').querySelector('.play'); }
  function mark(b, playing) {
    if (!b) return;
    b.classList.toggle('paused', !playing);
    b.setAttribute('aria-label', playing ? b.dataset.pause : b.dataset.play);
  }
  function start(v) {
    var p = v.play();
    mark(btnOf(v), true);
    if (p && p.catch) p.catch(function () { mark(btnOf(v), false); });
  }
  function wire(v, load) {
    var b = btnOf(v);
    if (!b) return;
    b.hidden = false;
    v.userPaused = still;
    mark(b, !still);
    b.addEventListener('click', function () {
      if (v.paused) { v.userPaused = false; v.runs = 0; v.rested = false; load(); start(v); }
      else { v.userPaused = true; v.pause(); mark(b, false); }
    });
    v.runs = 0;
    v.addEventListener('ended', function () {
      if (++v.runs < 2) { v.play(); return; }
      v.rested = true;
      mark(b, false);
    });
    if (!('IntersectionObserver' in window)) { if (!still) { load(); start(v); } return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!v.userPaused && !v.rested) { load(); start(v); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: '150px 0px' }).observe(v);
  }

  var v = document.querySelector('video[data-stage]');
  if (!v) return;
  var dir = '/assets/home/stage/';
  var screen = v.closest('.screen');
  var lit = screen.closest('.hero') || screen;
  var inner = screen.querySelector('.screen-in');
  var nm = screen.querySelector('.nm');
  var act = screen.querySelector('.act');
  var picks = [].slice.call(document.querySelectorAll('.pick'));
  var world = v.dataset.stage;
  // Two layers, so a switch never shows a glimpse of the world before: the screen keeps the old world's still behind,
  // and the new world opens on top with its own still already loaded; its clip fades in only once it plays.
  var top = document.createElement('div');
  top.className = 'screen-top';
  var still0 = new Image();
  still0.className = 'screen-still';
  still0.alt = '';
  still0.src = dir + world + '.jpg';
  inner.appendChild(top);
  top.appendChild(still0);
  top.appendChild(v);
  v.addEventListener('playing', function () { v.classList.add('on'); });
  var seq = 0, warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    picks.forEach(function (b) { new Image().src = dir + b.dataset.world + '.jpg'; });
  }
  // the other stills are fetched ahead on a wide screen once the page has settled, or as soon as a hand nears the
  // windows; a phone fetches each on the tap
  var picker = document.querySelector('.picker');
  if (picker) picker.addEventListener('pointerenter', warm, { once: true });
  if (!window.matchMedia || matchMedia('(min-width: 960px)').matches) {
    window.addEventListener('load', function () { setTimeout(warm, 2500); });
  }
  function loadWorld() {
    var want = dir + world + '.mp4';
    if (v.getAttribute('src') !== want) { v.setAttribute('src', want); v.load(); }
  }
  wire(v, loadWorld);
  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.world === world) return;
      var was = world;
      world = b.dataset.world;
      var mine = ++seq;
      picks.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      nm.textContent = b.dataset.name;
      act.textContent = b.dataset.act;
      lit.style.setProperty('--tint', tints[world] || tints.pond);
      // behind: the world being left, as a still; on top: nothing of it is left playing
      inner.style.backgroundImage = 'url(' + dir + was + '.jpg)';
      v.classList.remove('on');
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.setAttribute('poster', dir + world + '.jpg');
      var next = new Image();
      function reveal() {
        if (mine !== seq) return;
        still0.src = next.src;
        if (still) return;
        // the world opens out of its window, as it does in the app
        var r = b.getBoundingClientRect(), s = inner.getBoundingClientRect();
        var x = Math.max(0, Math.min(100, (r.left + r.width / 2 - s.left) / s.width * 100));
        var y = Math.max(0, Math.min(100, (r.top + r.height / 2 - s.top) / s.height * 100));
        if (top.animate) top.animate(
          [{ clipPath: 'circle(8% at ' + x + '% ' + y + '%)' }, { clipPath: 'circle(150% at ' + x + '% ' + y + '%)' }],
          { duration: 650, easing: 'cubic-bezier(.3,.7,.2,1)' });
        v.runs = 0;
        v.rested = false;
        if (!v.userPaused) { loadWorld(); start(v); }
      }
      next.onload = next.onerror = reveal;
      next.src = dir + world + '.jpg';
      if (next.complete) reveal();
    });
  });
})();
