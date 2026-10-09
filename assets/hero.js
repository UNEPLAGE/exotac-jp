/* exotac.jp — トップパネルのスライド
 * 自動送り・矢印・ドット・スワイプ。prefers-reduced-motion では自動送りを止め、
 * 手動操作だけ残す。JS が動かないときは CSS 側で1枚目だけを表示する。
 */
(function () {
  'use strict';
  var root = document.querySelector('.hero');
  if (!root) return;
  var slides = [].slice.call(root.querySelectorAll('.hero__slide'));
  if (slides.length < 2) return;

  var dots = root.querySelector('.hero__dots');
  var prev = root.querySelector('.hero__arrow.prev');
  var next = root.querySelector('.hero__arrow.next');
  var i = 0, timer = null;
  var INTERVAL = 6500;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach(function (s, n) {
    s.classList.toggle('is-on', n === 0);
    s.classList.toggle('is-off', n !== 0);
    s.setAttribute('aria-hidden', n === 0 ? 'false' : 'true');
    if (n !== 0) s.setAttribute('tabindex', '-1');
    if (dots) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', n === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', (n + 1) + '枚目を表示');
      b.addEventListener('click', function () { go(n); stop(); });
      dots.appendChild(b);
    }
  });
  var btns = dots ? [].slice.call(dots.children) : [];

  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === i;
      s.classList.toggle('is-on', on);
      s.classList.toggle('is-off', !on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (on) s.removeAttribute('tabindex'); else s.setAttribute('tabindex', '-1');
    });
    btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
  }
  function start() { if (!reduce && !timer) timer = setInterval(function () { go(i + 1); }, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  if (prev) prev.addEventListener('click', function () { go(i - 1); stop(); });
  if (next) next.addEventListener('click', function () { go(i + 1); stop(); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('focusin', stop);
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { go(i - 1); stop(); }
    if (e.key === 'ArrowRight') { go(i + 1); stop(); }
  });
  // スワイプ
  var x0 = null;
  root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); stop(); }
    x0 = null;
  }, { passive: true });
  // 非表示タブでは送らない
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') stop(); else start();
  });
  start();
})();
