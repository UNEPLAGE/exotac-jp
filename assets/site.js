(function(){
  var d=document;

  // 動きを減らす設定なら工程動画は自動再生しない
  var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(rm){ d.querySelectorAll('video[autoplay]').forEach(function(v){ v.removeAttribute('autoplay'); v.pause(); v.setAttribute('controls',''); }); }

  // スクロール連動の出現
  var els=d.querySelectorAll('.reveal');
  if(!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce || !('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('is-in'); }); return;
  }
  var fired=false;
  var io=new IntersectionObserver(function(es){
    // 同時に入ってきた要素は 70ms ずつずらして出す（最大 5 段）
    var n=0;
    es.forEach(function(en){
      if(!en.isIntersecting) return;
      fired=true;
      var el=en.target;
      el.style.transitionDelay=(Math.min(n,5)*70)+'ms'; n++;
      el.classList.add('is-in');
      el.addEventListener('transitionend', function f(){ el.style.transitionDelay=''; el.removeEventListener('transitionend', f); });
      io.unobserve(el);
    });
  },{rootMargin:'0px 0px -6% 0px',threshold:0.06});
  els.forEach(function(el){ io.observe(el); });
  // 保険: バックグラウンドタブでは IntersectionObserver がまったく発火しない。
  // .reveal は opacity:0 なので、放置するとページ全体が白紙に見える。
  // 観測が一度も走っていなければ全部出す。
  // （他のスクリプトが個別に is-in を付けることがあるので、
  //   「is-in が1つでもあるか」ではなく観測が発火したかで判定する）
  function unhide(){ if(!fired){ els.forEach(function(el){ el.classList.add('is-in'); }); } }
  setTimeout(unhide, 3000);
  d.addEventListener('visibilitychange', function(){ if(d.visibilityState==='hidden') setTimeout(unhide, 100); });
})();
