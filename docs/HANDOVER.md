# exotac.jp 引き継ぎ書

- 作成: SORAH Inc. 釜田俊介（2026-10-09）
- 宛先: UPI（株式会社アンプラージュインターナショナル）／ドメイン・Vercel・GA ご担当の Uneplage 様
- 内容: 2026-10-08 時点の確定版（溜池さん・Neil さんのご指摘反映済み、トップパネル1枚目は焚き火の titanLIGHT）

---

## 0. このパッケージの中身

```
exotac-jp_handover/
├─ README.md        この引き継ぎ書
├─ site/            本番用の公開ファイル一式（exotac.jp のドキュメントルートにそのまま置く）
└─ spare-assets/    サイトでは使っていない予備素材（過去版の写真・媒体ロゴ）。公開には不要
```

`site/` は、テスト公開版から次の4点だけを変えたものです。文言・デザイン・写真はテスト公開版と同一です。

| 変更 | 理由 |
|---|---|
| パスワード画面を削除 | テスト公開用のため |
| `noindex` を削除（404ページだけ残す） | 検索エンジンに載せるため |
| パスの前置 `/project/upi/exotac-jp/` を `/` に置換 | ドメイン直下で動かすため |
| `vercel.json` を追加 | URL の末尾スラッシュを canonical（`https://exotac.jp/products/` 形式）に揃えるだけの設定 |

比較用のテスト公開版: [sorah.io/project/upi/exotac-jp](https://sorah.io/project/upi/exotac-jp/)
パスワードは `exotac-jp-b6ff2f` です。

### ページ構成（5ページ＋404）

| URL | ファイル | 内容 |
|---|---|---|
| `/` | `index.html` | トップパネル（スライド5枚）→ 掲載媒体 → ラインナップ（カテゴリごとの帯とカード）→ 防災 → ブランド（MADE IN USA・保証マークと注記）→ お知らせ・読みもの |
| `/products/` | `products/index.html` | 全製品。カテゴリ別のカード（仕様・カラー付き）と交換キット |
| `/story/` | `story/index.html` | ブランド。着火へのこだわり、家族経営・米国製、設計・加工・仕上げ、Gear for life |
| `/bousai/` | `bousai/index.html` | 防災。置き場所別のおすすめ製品 |
| `/care/` | `care/index.html` | メンテナンス。本体ごとの交換キット表、手入れ、FAQ |
| — | `404.html` | ページが見つからないとき |

製品の詳細ページは持たず、製品に関するリンクはすべて UPI ONLINE STORE の商品ページへ送ります。

---

## 1. 公開手順（Vercel）

ビルド工程はありません。静的な HTML / CSS / JS / 画像だけです。

1. UNEPLAGE の GitHub に新しいリポジトリ（例: `exotac-jp`）を作り、**`site/` の中身をリポジトリ直下に**置いて push する
   - `site/` フォルダごと置く場合は、Vercel 側で Root Directory を `site` にする
2. Vercel で Import する。Framework Preset は「Other」、Build Command と Output Directory は空欄のまま
3. Domains に `exotac.jp` を追加し、DNS を設定する（`www.exotac.jp` を使う場合は `exotac.jp` へリダイレクト）
4. 公開後に確かめること
   - `/` `/products/` `/story/` `/bousai/` `/care/` の5ページが開く
   - 存在しない URL（例 `/xxx`）で Exotac の 404 ページが出る（Vercel は直下の `404.html` を自動で使います）
   - `/robots.txt` と `/sitemap.xml` が開く
   - 製品カードの価格・在庫、トップの「お知らせ」「読みもの」が表示される（§3 の自動反映）

以後は、リポジトリに push するたびに Vercel が自動で公開します。

---

## 2. 公開と同時に設定していただきたいこと（計測）

このサイトには製品の詳細ページがなく、**ストアへの送客数が唯一の効果指標**です。HTML にはまだ GA のタグを入れていません。

1. **GA4 タグ**: 6ファイル（`index.html` `products/index.html` `story/index.html` `bousai/index.html` `care/index.html` `404.html`）すべての `</head>` の直前に gtag スニペットを入れる
2. **キーイベント**: GA4 の拡張計測「離脱クリック」を有効にすると、外部リンクのクリックが `click` イベント（`link_url` などのパラメータ付き）として取れます。管理画面の「イベントを作成」で、`event_name = click` かつ `link_url` に `store.upioutdoor.com` を含むものを `store_click` などの名前で作り、キーイベントに指定してください
3. **UTM**: ストアへのリンクにはすべて `utm_source=exotac.jp&utm_medium=referral&utm_campaign=brand_portal` が付いています。Shopify 側の集計でも exotac.jp 経由の売上を突き合わせられます
4. **Search Console**: ドメインを登録し、`https://exotac.jp/sitemap.xml` を送信する
5. （任意）**OGP 画像**: 現在 `og:image` が無いため、SNS で共有したときに画像が出ません。1200×630 の画像を用意し、各ページの `<head>` に `<meta property="og:image" content="https://exotac.jp/assets/…">` を足すことをおすすめします

---

## 3. 自動で反映されるもの（.jp 側の更新は不要）

`assets/sync.js` が、ページを開いたときに一次ソースから最新の情報を取りにいきます。

| 表示されるもの | 一次ソース | 取得先 |
|---|---|---|
| 製品の価格・在庫・写真・カラー、新商品、取扱終了 | UPI ONLINE STORE（Shopify） | コレクション `exotac` の `products.json` |
| トップの「お知らせ」（最新6件） | upioutdoor.com（WordPress） | 投稿のうち、ブランド「EXOTAC」（ID 24）が付いたもの |
| トップの「読みもの」（最新4件） | 同上 | 「Stories」のうち、ブランド「EXOTAC」が付いたもの |

運用上のポイント:

- **Shopify のコレクション `exotac` が、そのまま .jp のラインナップです。** 新商品は必ずこのコレクションに入れてください
- 新商品は、ハンドル名からカテゴリを判定して該当する棚の末尾に**簡易カード**（名前・写真・カラー・価格）で自動で並びます。紹介文・仕様・2枚目の写真まで出したい場合は §4-2 の手順で HTML にカードを書き足してください
  - 判定ルール（ハンドルに含まれる語）: `refill` `flint-kit` `wick` `flameguard` → 交換キット ／ `candletin` → キャンドル ／ `matchcap` → マッチケース ／ `tinderzip` `quicklight` → ティンダー ／ `ripspool` `tool-roll` → その他 ／ `titanlight` `nanospark` `firesleeve` → ライター ／ `striker` `firerod` → ファイヤースターター ／ どれにも当てはまらない → 「Other / その他」棚
  - 交換キットの棚は製品ページにだけあります（トップには出しません）。メンテナンスページの交換キット表には自動で行が増えないので、§4-4 の手順で足してください
- コレクションから外れた商品は、カードごと表示されなくなります。在庫が無い商品には「在庫なし」が出ます
- 取得に失敗した場合（6秒でタイムアウト）は、HTML に書かれている価格・写真がそのまま表示されます。**価格改定のたびに HTML を直す必要はありません**が、HTML 側の価格は控えとして年に1回程度合わせておくと安心です
- 通信の許可（CORS）は、Shopify・WordPress とも exotac.jp から読めることを 10/9 に確認済みです。ドメインを変えても設定変更は不要です
- 取扱店舗はサイト内に持たず、upioutdoor.com の Exotac 取扱店舗ページへリンクしています

---

## 4. よくある修正のしかた

HTML を直接編集して push するだけです。共通の決まりは3つです。

- **パスは必ず `/` から始める**（例: `/assets/products/titanlight-1.jpg`）。相対パスは使わない
- **ヘッダとフッターは6ファイルそれぞれに書かれています**（部品化していません）。ナビや会社表記を直すときは6ファイルすべてを直す
- **製品名は大文字に変換しない**（titanLIGHT™、nanoSTRIKER XL® など本国表記のまま）。CSS でも `text-transform` をかけない

### 4-1. 文言を直す

該当の HTML をテキスト検索して書き換えます。`<title>` と `<meta name="description">`（`og:` 系も同じ文）もページごとにあります。

### 4-2. 製品カードを足す・直す

トップ（`index.html`）と製品ページ（`products/index.html`）にある `<a class="pcard" data-handle="…">` が1枚のカードです。既存のカードをコピーして、次を書き換えます。

- `data-handle` と `href` のハンドル（**Shopify の商品ハンドルと完全に一致させる**。価格・在庫の自動反映の鍵です）
- 写真（`.p1` が製品写真、`.p2` がホバーで出るシーン写真）、名前、読み、説明、仕様、価格

```html
<a class="pcard reveal" data-handle="exotac-nanostriker-xl" href="https://store.upioutdoor.com/products/exotac-nanostriker-xl?utm_source=exotac.jp&amp;utm_medium=referral&amp;utm_campaign=brand_portal" rel="noopener">
  <div class="pcard__media"><img class="p1" src="/assets/products/nanostriker-xl-1.jpg" …><img class="p2" src="/assets/lifestyle/nanostriker-xl.jpg" …></div>
  <h3 class="pcard__name">nanoSTRIKER XL®</h3>
  <p class="pcard__kana">ナノストライカー XL</p>
  <p class="pcard__desc">（説明）</p>
  <ul class="pcard__specs"><li>全長 9.3cm</li><li>27g</li></ul>
  <p class="pcard__colors">（カラーは自動で上書きされます）</p>
  <div class="pcard__foot">
    <span class="pcard__buy">ストアで見る</span>
    <p class="pcard__price">¥5,500<small>税込</small></p>
  </div>
</a>
```

防災ページ（`bousai/index.html`）のカードも同じ形です（写真はシーン写真のまま固定）。

### 4-3. トップパネル（スライド）

`index.html` の `.hero__slide` が1枚ずつのスライドです。1枚目はブランド（焚き火の titanLIGHT）、2〜5枚目は製品で、`<a class="hero__slide" data-handle="…">` の価格は自動で更新されます。6.5秒ごとに自動で送り、端末で「動きを減らす」を設定している人には自動送りをしません。

写真は横 1200px 以上（できれば 2000px 以上）を使ってください。

### 4-4. 交換キット（メンテナンスページ）

`care/index.html` の `<a class="kit__row" data-kit="ハンドル">` が1行です。価格と在庫は自動で更新されます。

### 4-5. 写真を差し替える

**同じファイル名で上書きするのが最も安全です**（HTML の変更が要りません）。

| 置き場所 | 用途 | 現在の寸法 |
|---|---|---|
| `assets/products/` | 製品写真（カード・交換キット） | 900×600（3:2） |
| `assets/lifestyle/` | カードのホバー写真 | 1600×1141 前後 |
| `assets/scene/` | トップパネル・帯・ページ内の写真 | 1200〜1600px 幅 |
| `assets/press/` | 掲載媒体ロゴ（透過 PNG、高さ 120px） | — |
| `assets/craft/` | ブランドページの設計・加工・仕上げ（写真と動画） | 800×450 |
| `assets/img/` | ロゴ・ファビコン・保証マーク | — |

### 4-6. デザインの決まり（崩さないために）

- 色: 文字と主ボタンは `#212121`。オリーブ `#708662` は**線だけ**に使い、面や文字には使わない
- 書体: Karla（欧文見出し）／ Roboto（欧文本文）／ Noto Sans JP（和文）。太さは 400 と 700 だけ
- 余白: CSS 変数 `--s1`〜`--s6`（6 / 12 / 24 / 42 / 66 / 96px）と、節の上下 `--sec-y` だけを使う。HTML に `style="margin-…"` を書かない
- 角丸と影は使わない
- CSS は `assets/site.css` の1本だけです

---

## 5. 表記の決まり（10/8 確認済み）

| 項目 | 表記 |
|---|---|
| ブランド名 | Exotac（エクソタック） |
| 代理店 | 正規輸入代理店：株式会社アンプラージュインターナショナル（UPI） |
| 保証 | 日本では**初期不良のみ交換対応**。Lifetime Warranty（生涯保証）は**米国本国のみ**。「生涯保証が付きます」とは書かない |
| 素材 | 本体は「アルミの削り出し」。チタンとは書かない（titanLIGHT もアルミ製） |
| 製品の点数 | 「23種類」のような点数は書かない（商品の増減で事実と食い違うため） |
| 自動反映 | 「ストアから自動で反映しています」のような仕組みの説明はサイトに書かない |

---

## 6. ローンチ前にご確認いただきたいこと（未了）

1. **書き下ろし文章の確認** — 特に**防災ページ**。SORAH が本国の一次情報なしに書いた部分が残っている可能性があります（ブランドページの「How to read」は根拠が無かったため削除済み）
2. **掲載媒体ロゴの使用可否** — BE-PAL / POPEYE / CAMP HACK / The Wall Street Journal / Outside / Backpacker。あわせて、リード文「アウトドア誌からデザイン誌、経済紙まで」の「デザイン誌」にあたる媒体がこの6誌の中にあるかのご確認
3. **トップパネル1枚目の写真の高解像度版**（現在 1200×857。2000px 以上が望ましい）
4. **ロゴのベクター原版**（現在は PNG から作っています）
5. GA4・Search Console の設定（§2）

---

## 7. 既知の事項

- スマートフォンのトップパネル2〜5枚目は、文字が写真の縦中央に乗ります（下寄せにするつもりの指定が効いていません）。表示が崩れているわけではありませんが、製品写真に文字がかかって気になる場合は `site.css` の `.hero__panel` を調整してください。1枚目は写真と文字を縦に積む形にしてあります
- JavaScript が動かない環境でも、HTML に書かれた内容（価格の控えを含む）ですべて読めます。トップパネルは1枚目だけが表示されます
- 外部への依存は Google Fonts（Karla / Roboto / Noto Sans JP）と、§3 の Shopify・WordPress だけです
- `spare-assets/` には、過去版で使っていた写真と、本国サイトに掲載のある媒体ロゴ（Cool Hunting / Men's Journal / Popular Mechanics）を入れています。差し替え候補としてお使いください
