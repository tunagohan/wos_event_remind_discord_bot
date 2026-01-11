````md
# Whiteout Survival Event Reminder Discord Bot

Whiteout Survival（ホワイトアウトサバイバル）のイベントを「開始日 + 周期ルール」から計算し、Discord の Slash Command と定期投稿（cron）で通知する Bot です。

- Slash Command
  - `/wos_event today` : 今日のイベント（JST）。前日注意リマインダー（`previous_remind`）も表示
  - `/wos_event add <n>` : n日後のイベント（JST）
- 定期投稿
  - 毎日 **09:00** に「当日イベント一覧」を投稿（前日注意リマインダー込み）
    - イベントリストリマインダー
  - 毎日 **21:30** に「開始前リマインダー」を別チャンネルへ投稿（例：熊罠）
    - 定常イベントの発生前アナウンス

空白期間・休憩フェーズ（`kind: "blank" / "rest"`）は表示しません（計算には使用します）。

---

## 前提

- Node.js 20+ 推奨
- npm
- Discord サーバーの管理権限（Bot 招待とチャンネル権限の付与）

---

## Discord Bot の作成・招待

### 1) Developer Portal でアプリ作成
1. Discord Developer Portal で **New Application**
2. 左メニュー **Bot** → **Add Bot**
3. **Token** を発行（`.env` に設定）

> Token は漏洩すると Bot が乗っ取られます。公開リポジトリに絶対にコミットしないでください。

### 2) Bot をサーバーに招待
1. **OAuth2 → URL Generator**
2. Scopes
   - `bot`
   - `applications.commands`（Slash Command 必須）
3. Bot Permissions（最低限）
   - `View Channels`
   - `Send Messages`
4. 生成 URL でサーバーに招待

### 3) ID の取得
- `DISCORD_APP_ID` : Developer Portal の Application ID
- `DISCORD_GUILD_ID` : Bot を導入したサーバー（Guild）の ID
- 投稿先チャンネル ID（後述）
  - Discord「開発者モード」ON → チャンネル右クリック → 「IDをコピー」

---

## セットアップ（ローカル）

### 1) インストール
```bash
npm install
````

### 2) .env を作成

プロジェクト直下に `.env` を作成し、以下を設定します。

```env
DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_APP_ID=123456789012345678
DISCORD_GUILD_ID=123456789012345678

# 09:00 投稿先（当日イベント一覧）
DISCORD_DAILY_CHANNEL_ID=123456789012345678

# 21:30 投稿先（開始前リマインダー）
DISCORD_PRESTART_CHANNEL_ID=234567890123456789
```

### 3) Slash Command を登録（初回・コマンド定義変更時のみ）

```bash
npm run deploy
```

> `src/commands.ts` を変更した場合は必ず再度 `npm run deploy` を実行してください。
> イベント定義（`src/events.ts`）の変更だけなら deploy は不要です。

### 4) Bot 起動

```bash
npm run start
```

---

## 使い方（Discord）

* `/wos_event today`

  * 今日のイベント一覧（JST）
  * 明日開始の「注意イベント（previous_remind）」があれば先頭にリマインダーを表示
* `/wos_event add <n>`

  * n日後のイベント一覧（JST）

---

## 自動投稿（cron）

### 09:00（JST）当日イベント一覧の投稿

* `.env` の `DISCORD_DAILY_CHANNEL_ID` に投稿
* `/wos_event today` と同等の内容（前日注意リマインダー込み）

### 21:30（JST）開始前リマインダー

* `.env` の `DISCORD_PRESTART_CHANNEL_ID` に投稿
* 当日「開始前通知対象（`prestart_remind_time: "21:30"`）」のイベントがある場合のみ投稿

#### 権限（重要）

Bot に以下権限が必要です（チャンネル単位の上書きが最優先されます）。

* `View Channel`
* `Send Messages`
* （スレッドに投稿するなら）`Send Messages in Threads`

`DiscordAPIError[50013]: Missing Permissions` が出る場合、ほぼ確実にチャンネル権限不足です。

---

## イベント定義（追加・変更・削除）

イベント定義は `src/events.ts` の `EVENTS` 配列にあります。
Bot は `start` を基準に `phases[].days` の合計を周期としてループ計算します。

### EventDef の構造（例）

```ts
{
  category: "その他",              // カテゴリ（Discord 見出し ### で表示）
  name: "烈火と牙",                // イベント名
  start: "2025-10-06",             // 開始日（YYYY-MM-DD）
  phases: [
    { name: "イベントフェーズ", days: 3, kind: "active" },
    { name: "休憩フェーズ", days: 11, kind: "rest" }
  ],

  // 任意：開始前日注意（/today の先頭に出す）
  previous_remind: true,

  // 任意：開始時刻（表示用）
  start_time: "22:00",

  // 任意：開始前リマインド投稿対象（21:30 投稿で使用）
  prestart_remind_time: "21:30",

  // 任意：コピペ用リンク（Discord メッセージリンク等）
  // 主にヒントなどで活用
  links: [
    { label: "コピペ用リンク", url: "https://discord.com/channels/.../.../..." }
  ]
}
```

* `phases[].kind`

  * `"active"` : 表示対象（イベントとして出力される）
  * `"rest"` / `"blank"` : 表示対象外（計算には含まれるが表示されない）

### 追加

1. `src/events.ts` に定義を追加
2. Bot を再起動（`npm run start`）
3. コマンド定義を変えていない限り `npm run deploy` は不要

### 変更

* 開始日が変わる → `start` を更新
* フェーズ日数が変わる → `phases` の `days` を更新
* 休憩/空白の扱いが変わる → `kind` を更新
* `previous_remind` / `prestart_remind_time` / `links` は必要に応じて更新
* Bot を再起動で反映

### 削除

* `src/events.ts` から該当イベント定義を削除
* Bot を再起動で反映

---

## 熊罠（常設イベント）の追加方法

熊罠は「2日周期」「発生日は 22:00 開始」「開始前 21:30 通知」が要件です。
`src/events.ts` に以下を追加します。

```ts
{
  category: "常設イベント",
  name: "熊罠",
  start: "YYYY-MM-DD", // 熊罠が発生する実日を基準に設定（重要）
  start_time: "22:00", // 開始時刻
  prestart_remind_time: "21:30", // 実施前にアナウンスしたい場合に使用
  phases: [
    { name: "熊罠", days: 1, kind: "active" }, // 何日間行われるのか
    { name: "空白", days: 1, kind: "blank" } // 何日空くのか
  ],
  links: [ // ヒントになるリンクなどがあれば
    { label: "コピペ用リンク", url: "https://discord.com/channels/.../.../..." }
  ]
}
```

> `start` は「熊罠が発生する日」を 1日指定してください。これがズレると 2日周期もズレます。

---

## 出力フォーマット

### カテゴリは Discord 見出し（h3）で表示

例：`### 週間イベント`

### イベントごとのリンク表示（コピペ用リンク）

以下の形でネスト表示されます。

```text
### 週間イベント
- 氷原支配者：イベントフェーズ（1/7日目）
  - コピペ用リンク: <https://discord.com/channels/.../.../...>
```

`<...>` で囲むことでプレビューを抑止しつつコピペしやすくしています。

---

## トラブルシューティング

### コマンドが表示されない

* Bot 招待時に `applications.commands` を付けたか
* `npm run deploy` を実行したか（コマンド定義変更時も必要）
* `DISCORD_GUILD_ID` が正しいか

### 自動投稿されない

* Bot が起動し続けているか（プロセスが落ちると投稿されません）
* `DISCORD_DAILY_CHANNEL_ID` / `DISCORD_PRESTART_CHANNEL_ID` が正しいチャンネルIDか
* Bot に チャンネルで `View Channel` / `Send Messages` 権限があるか

### `DiscordAPIError[50013]: Missing Permissions`

* ほぼ確実にチャンネル権限不足です（チャンネル権限上書きが優先）
* Bot ロールが書き込み許可されているか確認してください
