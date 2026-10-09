/* exotac.jp — 外部連携レイヤー
 *
 * このサイトは .jp 側を更新しない設計です。可変情報はすべて外部の一次ソースから
 * 取得し、DOM を差し替えます。取得できなかった場合はビルド時に埋め込んだ
 * スナップショットがそのまま残るので、表示が壊れることはありません。
 *
 *   商品（価格・在庫・写真・カラー・新商品・廃番）  Shopify  store.upioutdoor.com
 *   News / Stories                                  WordPress upioutdoor.com
 *   （取扱店舗は自前で持たず upioutdoor.com へ送る。#storeList がある場合だけ描画）
 *
 * morakniv.jp / orukayak.jp と同じ方式。
 */
(function () {
  'use strict';

  var STORE = 'https://store.upioutdoor.com';
  var COLLECTION = 'exotac';
  var WP = 'https://upioutdoor.com/wp-json/wp/v2/';
  var BRAND = 24;                 // brand タクソノミー: EXOTAC
  var UTM = 'utm_source=exotac.jp&utm_medium=referral&utm_campaign=brand_portal';
  var TIMEOUT = 6000;

  function get(url) {
    var ac = ('AbortController' in window) ? new AbortController() : null;
    var t = ac ? setTimeout(function () { ac.abort(); }, TIMEOUT) : null;
    return fetch(url, ac ? { signal: ac.signal } : {})
      .then(function (r) { if (t) clearTimeout(t); if (!r.ok) throw 0; return r.json(); })
      .catch(function () { if (t) clearTimeout(t); return null; });
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function strip(s) { var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); }
  function yen(v) { return '¥' + Math.round(Number(v)).toLocaleString('ja-JP'); }
  function fdate(s) { return s ? s.slice(0, 10).replace(/-/g, '.') : ''; }
  function storeUrl(handle) { return STORE + '/products/' + handle + '?' + UTM; }
  function img(u, w) { return u ? (u.split('?')[0] + '?width=' + w) : ''; }

  /* ---------------------------------------------------------------- 商品
   * カテゴリはハンドル/商品名から判定する。新しい SKU が増えても
   * 既存のルールで大半は正しい棚に入り、外れたものは「その他」に出る。
   * 取りこぼしが一覧から消えることはない。
   */
  var CATRULES = [
    ['refill',      /(refill|flint-kit|wick|flameguard|-kit\b)/],
    ['candle',      /candletin/],
    ['matchcase',   /matchcap/],
    ['tinder',      /(tinderzip|quicklight|tinder)/],
    ['repair',      /(ripspool|tool-roll|toolroll)/],
    ['lighter',     /(titanlight|nanospark|firesleeve)/],
    ['firestarter', /(striker|firerod|ferro)/]
  ];
  function catOf(handle, title) {
    var s = (handle + ' ' + title).toLowerCase();
    for (var i = 0; i < CATRULES.length; i++) if (CATRULES[i][1].test(s)) return CATRULES[i][0];
    return 'other';
  }

  var SW = {
    'オリーブ': '#708662', 'オリーブドラブ': '#708662', 'olive': '#708662',
    'オレンジ': '#E4551B', 'ブレイズオレンジ': '#E4551B', 'orange': '#E4551B',
    'ガンメタル': '#5A6068', 'gunmetal': '#5A6068',
    'ブラック': '#212121', 'ブラック系': '#212121', 'black': '#212121',
    'グレー': '#8A8A8A', 'gray': '#8A8A8A', 'grey': '#8A8A8A',
    'シルバー': '#B9BCC0', 'チタン': '#8E9297', 'レッド': '#9E2A24', 'グリーン': '#4B5D3A'
  };
  function swatch(name) {
    var k = String(name || '').trim();
    if (SW[k]) return SW[k];
    for (var s in SW) if (k.indexOf(s) >= 0) return SW[s];
    return null;
  }

  function colorHtml(p) {
    var seen = {}, out = '', n = 0, last = '';
    (p.variants || []).forEach(function (v) {
      [v.option1, v.option2, v.option3].forEach(function (o) {
        var c = swatch(o);
        if (!c || seen[c]) return;
        seen[c] = 1; n++; last = o;
        out += '<i style="background:' + c + '" title="' + esc(o) + '"></i>';
      });
    });
    if (n === 1) out += '<em>' + esc(last) + '</em>';
    else if (n > 1) out += '<em>' + n + '色</em>';
    return out;
  }

  /* 差し替えは「新しい写真が実際に読めたとき」だけ。読めなければローカルの
     フォールバック写真がそのまま残る（CDN が落ちても空欄にならない）。 */
  function swapImage(el, url) {
    if (!url || !el) return;
    var pre = new Image();
    pre.onload = function () { el.src = url; el.removeAttribute('srcset'); };
    pre.src = url;
  }

  /* Shopify に増えた新商品用のカード。ローカルに紹介文が無いので
     名前・写真・カラー・価格だけの簡素な形にする。 */
  function cardHtml(p) {
    var im = (p.images || [])[0];
    var avail = (p.variants || []).some(function (x) { return x.available; });
    var prices = (p.variants || []).map(function (x) { return Number(x.price); }).filter(Boolean);
    var lo = prices.length ? Math.min.apply(null, prices) : 0;
    var hi = prices.length ? Math.max.apply(null, prices) : lo;
    return '<a class="pcard" data-handle="' + esc(p.handle) + '" href="' + esc(storeUrl(p.handle)) + '" rel="noopener">'
      + '<div class="pcard__media">'
      + (im ? '<img class="p1" src="' + esc(img(im.src, 640)) + '" alt="' + esc(p.title) + '" width="900" height="675" loading="lazy" decoding="async">' : '')
      + (avail ? '' : '<span class="pcard__out">在庫なし</span>')
      + '</div>'
      + '<h3 class="pcard__name">' + esc(nameEn(p.title)) + '</h3>'
      + '<p class="pcard__kana">' + esc(nameJa(p.title)) + '</p>'
      + '<p class="pcard__desc"></p>'
      + '<ul class="pcard__specs"></ul>'
      + '<p class="pcard__colors">' + colorHtml(p) + '</p>'
      + '<div class="pcard__foot">'
      + '<span class="pcard__buy">ストアで見る</span>'
      + '<p class="pcard__price">' + yen(lo) + (hi > lo ? '<small>から</small>' : '<small>税込</small>') + '</p></div>'
      + '</a>';
  }
  /* UPI の商品名は "EXOTAC NANOSTRIKER XL / エクソタック ナノストライカーXL" 形式。
     .jp では英字と和文を分けて出す。原表記の大小文字は加工しない。 */
  function nameEn(t) {
    var en = String(t).split('/')[0].trim();
    return en.replace(/^EXOTAC\s+/i, '').trim() || en;
  }
  function nameJa(t) {
    var parts = String(t).split('/');
    var ja = parts.length > 1 ? parts.slice(1).join('/').trim() : '';
    return ja.replace(/^エクソタック\s*/, '').trim();
  }

  function syncProducts() {
    return get(STORE + '/collections/' + COLLECTION + '/products.json?limit=250').then(function (d) {
      if (!d || !Array.isArray(d.products) || !d.products.length) return;
      var live = d.products;
      var byHandle = {};
      live.forEach(function (p) { byHandle[p.handle] = p; });

      /* 1. 既存カードを更新（価格・在庫・写真・カラー） */
      document.querySelectorAll('.pcard[data-handle]').forEach(function (a) {
        var p = byHandle[a.getAttribute('data-handle')];
        if (!p) { a.remove(); return; }          // Shopify から消えた = 取扱終了
        var im = (p.images || [])[0], el;
        /* シーン写真のカード（防災の置き場所）は写真を差し替えない */
        if (im && !a.classList.contains('pcard--scene') && (el = a.querySelector('.pcard__media img.p1'))) swapImage(el, img(im.src, 640));
        var prices = (p.variants || []).map(function (x) { return Number(x.price); }).filter(Boolean);
        if (prices.length && (el = a.querySelector('.pcard__price'))) {
          var lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
          el.innerHTML = yen(lo) + (hi > lo ? '<small>から</small>' : '<small>税込</small>');
        }
        if ((el = a.querySelector('.pcard__colors'))) el.innerHTML = colorHtml(p);
        var avail = (p.variants || []).some(function (x) { return x.available; });
        var flag = a.querySelector('.pcard__out');
        if (avail && flag) flag.remove();
        if (!avail && !flag) {
          var m = a.querySelector('.pcard__media');
          if (m) m.insertAdjacentHTML('beforeend', '<span class="pcard__out">在庫なし</span>');
        }
      });

      /* 2. スナップショットに無い商品を、その棚の末尾に足す */
      var known = {};
      document.querySelectorAll('.pcard[data-handle]').forEach(function (a) { known[a.getAttribute('data-handle')] = 1; });
      live.forEach(function (p) {
        if (known[p.handle]) return;
        var cat = catOf(p.handle, p.title);
        var grid = document.querySelector('.pgroup[data-cat="' + cat + '"] .pgroup__grid')
                /* 未分類の新商品は「Other / その他」棚（旧リペア棚）に入れる */
                || (cat === 'other' ? document.querySelector('.pgroup[data-cat="repair"] .pgroup__grid') : null);
        if (!grid) return;
        grid.insertAdjacentHTML('beforeend', cardHtml(p));
        var sec = grid.closest('.pgroup');
        if (sec) sec.hidden = false;
      });

      /* 3. 空になった棚を隠す（点数は表示しない） */
      document.querySelectorAll('.pgroup').forEach(function (sec) {
        sec.hidden = sec.querySelectorAll('.pcard').length === 0;
      });

      /* 4. 交換キットの行（メンテナンスページ）: 価格と在庫 */
      document.querySelectorAll('.kit__row[data-kit]').forEach(function (row) {
        var kp = byHandle[row.getAttribute('data-kit')];
        var pe = row.querySelector('.kit__price');
        if (!pe) return;
        if (!kp) { row.remove(); return; }
        var kpr = (kp.variants || []).map(function (x) { return Number(x.price); }).filter(Boolean);
        var kav = (kp.variants || []).some(function (x) { return x.available; });
        row.classList.toggle('is-out', !kav);
        if (!kav) pe.textContent = '在庫なし';
        else if (kpr.length) {
          var klo = Math.min.apply(null, kpr), khi = Math.max.apply(null, kpr);
          pe.innerHTML = yen(klo) + (khi > klo ? '<small>から</small>' : '<small>税込</small>');
        }
      });

      /* 5. トップパネル（スライド）の価格 */
      document.querySelectorAll('.hero__slide[data-handle]').forEach(function (sl) {
        var fp = byHandle[sl.getAttribute('data-handle')];
        if (!fp) return;
        var pr = (fp.variants || []).map(function (x) { return Number(x.price); }).filter(Boolean);
        var pe = sl.querySelector('.hero__price');
        if (pr.length && pe) {
          var plo = Math.min.apply(null, pr), phi = Math.max.apply(null, pr);
          pe.innerHTML = yen(plo) + (phi > plo ? '<small>から</small>' : '<small>税込</small>');
        }
      });
      document.documentElement.setAttribute('data-shopify', 'live');
    });
  }

  /* ------------------------------------------------------------ WordPress */
  function syncNews() {
    return get(WP + 'posts?brand=' + BRAND + '&per_page=6&orderby=date&order=desc&_embed').then(function (posts) {
      var list = document.getElementById('newsList');
      if (!list || !Array.isArray(posts) || !posts.length) return;
      list.innerHTML = posts.map(function (p) {
        return '<a class="news-row" href="' + esc(p.link) + '" rel="noopener">'
          + '<span class="n-date">' + fdate(p.date) + '</span>'
          + '<span class="n-title">' + esc(strip(p.title.rendered)) + '</span>'
          + '<span class="n-ar" aria-hidden="true">→</span></a>';
      }).join('');
    });
  }

  function syncStories() {
    return get(WP + 'story?brand=' + BRAND + '&per_page=4&orderby=date&order=desc&_embed').then(function (posts) {
      var grid = document.getElementById('storyGrid');
      if (!grid || !Array.isArray(posts) || !posts.length) return;
      grid.innerHTML = posts.map(function (p) {
        var fm = (p._embedded && p._embedded['wp:featuredmedia'] || [])[0];
        var src = fm && fm.source_url;
        return '<a class="story" href="' + esc(p.link) + '" rel="noopener">'
          + '<div class="story__ph">' + (src ? '<img src="' + esc(src) + '" alt="' + esc(strip(p.title.rendered)) + '" width="800" height="600" loading="lazy" decoding="async">' : '') + '</div>'
          + '<span class="story__cat">UPI Stories</span>'
          + '<h3>' + esc(strip(p.title.rendered)) + '</h3>'
          + '<span class="story__date">' + fdate(p.date) + '</span></a>';
      }).join('');
      grid.querySelectorAll('.story').forEach(function (el) { el.classList.add('reveal', 'is-in'); });
    });
  }

  var AREA_ORDER = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
  function renderStores(rows) {
    var wrap = document.getElementById('storeList');
    if (!wrap || !rows.length) return;
    var byArea = {};
    rows.forEach(function (r) { (byArea[r.area] = byArea[r.area] || []).push(r); });
    var order = Object.keys(byArea).sort(function (a, b) {
      var ia = AREA_ORDER.indexOf(a), ib = AREA_ORDER.indexOf(b);
      if (ia < 0) ia = 99; if (ib < 0) ib = 99;
      return ia - ib || (a < b ? -1 : 1);
    });
    wrap.innerHTML = order.map(function (a) {
      return '<div class="shops__area"><h3>' + esc(a) + '<span>' + byArea[a].length + '</span></h3><ul>'
        + byArea[a].map(function (r) {
            return '<li><a href="' + esc(r.link) + '" rel="noopener"><span class="u">' + esc(r.name) + '</span></a>'
              + (r.addr ? '<span>' + esc(r.addr) + '</span>' : '') + '</li>';
          }).join('')
        + '</ul></div>';
    }).join('');
    var n = document.getElementById('storeCount');
    if (n) n.textContent = rows.length;
  }

  function syncStores() {
    var wrap = document.getElementById('storeList');
    if (!wrap) return Promise.resolve();
    return get(WP + 'store_area?per_page=100&_fields=id,name').then(function (areas) {
      if (!Array.isArray(areas)) return;
      var name = {};
      areas.forEach(function (t) { name[t.id] = t.name; });
      var pages = [1, 2];
      return Promise.all(pages.map(function (pg) {
        return get(WP + 'stores?brand=' + BRAND + '&per_page=50&page=' + pg + '&orderby=title&order=asc&_fields=id,link,title,excerpt,store_area');
      })).then(function (batches) {
        var seen = {}, rows = [];
        batches.forEach(function (b) {
          (Array.isArray(b) ? b : []).forEach(function (s) {
            if (seen[s.id]) return;
            seen[s.id] = 1;
            rows.push({
              name: strip(s.title.rendered),
              link: s.link,
              area: name[(s.store_area || [])[0]] || 'その他',
              addr: strip(s.excerpt && s.excerpt.rendered).replace(/\s+/g, ' ')
            });
          });
        });
        if (rows.length) renderStores(rows);
      });
    });
  }

  function run() {
    syncProducts();
    syncNews();
    syncStories();
    syncStores();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
