# wos_event_remind_discord_bot
Whiteout Survival 2843 Event Remind Discord Bot
````md
# Whiteout Survival Event Reminder Discord Bot

Whiteout Survival（ホワイトアウトサバイバル）のイベントを「開始日＋周期ルール」から計算し、Discord の Slash Command で当日のイベント一覧を返す Bot です。
空白期間・休憩フェーズは表示しません（`kind: "active"` のみを出力）。

- `/wos_event today` : 今日のイベント（JST）
- `/wos_event add <n>` : n日後のイベント（JST）
- （任意）`previous_remind: true` のイベントは、**開始前日に注意リマインダー**を先頭に出します

---

## 前提

- Node.js 20 以上（推奨）
- npm
- Discord サーバーの管理権限（Bot招待・権限付与が必要）

---

## セットアップ手順（Discord Bot 作成〜招待）

### 1. Discord Developer Portal でアプリ作成
1. Discord Developer Portal にアクセスし、**New Application** を作成
2. 左メニュー **Bot** → **Add Bot**
3. **Token** を発行（後で `.env` に設定します）

> トークンは漏洩すると第三者に Bot を操作されます。公開リポジトリにコミットしないでください。

### 2. Bot をサーバーに招待
1. 左メニュー **OAuth2** → **URL Generator**
2. **Scopes** を選択
   - `bot`
   - `applications.commands`（Slash Command 必須）
3. **Bot Permissions** を選択（最低限）
   - `View Channels`
   - `Send Messages`
4. 生成された URL で Bot をサーバーへ招待

### 3. ID を取得
以下が必要です。

- `DISCORD_APP_ID` : Developer Portal の Application ID
- `DISCORD_GUILD_ID` : Bot を入れるサーバー（Guild）ID（開発用に Guild コマンド登録するため）
  - Discord の「開発者モード」ON → サーバー右クリック → 「IDをコピー」

---

## ローカル起動手順

### 1. インストール
```bash
npm install
````

### 2. .env を作成

プロジェクト直下に `.env` を作成し、以下を設定します。

```env
DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_APP_ID=123456789012345678
DISCORD_GUILD_ID=123456789012345678
```

### 3. Slash Command を登録（初回・定義変更時）

```bash
npm run deploy
```

> コマンド定義（`src/commands.ts`）を変更した場合は、必ず再度 `npm run deploy` を実行してください。

### 4. Bot 起動

```bash
npm run start
```

コンソールに `Logged in as ...` が出れば起動成功です。

---

## 使い方（Discord 側）

* `/wos_event today`
* `/wos_event add 3`

いずれも **JST（Asia/Tokyo）** で日付計算します。

---

## イベント定義（ルールセット）の修正方法

イベント定義は `src/events.ts` にあります。
Bot は「開始日 + フェーズ日数の合計」を周期としてループ計算し、指定日のフェーズを決定します。

### EventDef の構造

```ts
{
  category: "その他",              // 表示カテゴリ（h2相当）
  name: "烈火と牙",                // イベント名（h3相当）
  start: "2025-10-06",            // 開始日（YYYY-MM-DD）
  phases: [
    { name: "イベントフェーズ", days: 3, kind: "active" },
    { name: "休憩フェーズ", days: 11, kind: "rest" }
  ],
  previous_remind: true           // 任意：開始前日に注意リマインダー対象
}
```

* `phases[].kind`

  * `"active"` : 出力対象（表示される）
  * `"rest"` / `"blank"` : 出力対象外（計算には使われるが表示されない）

### 1) イベントを追加する

1. `src/events.ts` の配列 `EVENTS` に新しい定義を追加
2. `start` と `phases` を正しく設定
3. コマンド定義は変更不要（イベント定義の追加だけ）
4. 起動中なら再起動（`npm run start` を再実行）

### 2) イベントを変更する（開始日・日数・名称など）

* 開始日が変わった場合：`start` を更新
* フェーズ構成が変わった場合：`phases` の `days` / `kind` / `name` を更新
* イベント名が変わった場合：`name` を更新

変更後は Bot を再起動すれば反映されます。

> 注意：`previous_remind` 判定は `name` で紐付けしています。
> `name` を変更した場合、前日リマインダー対象にもしたいなら新しい `name` の定義に `previous_remind: true` を付け直してください。

### 3) イベントを削除する

`src/events.ts` から該当イベント定義を削除して Bot を再起動すれば反映されます。

---

## 前日リマインダー（previous_remind）の仕様

* `/wos_event today` 実行時に限り、先頭に「注意前日リマインダー」を表示します
* 表示条件：

  * **明日**のイベント一覧の中に
  * `previous_remind: true` のイベントがあり
  * そのイベントが **開始日（フェーズ1日目）** であること

対象にしたいイベントは `src/events.ts` の該当定義に以下を追加してください。

```ts
previous_remind: true
```

---

## トラブルシューティング

### コマンドが Discord に出ない

* Bot 招待時に `applications.commands` を付けたか確認
* `npm run deploy` を実行したか確認（定義変更時も必要）
* `DISCORD_GUILD_ID` が正しいサーバーIDか確認

### コマンドは出るが反応しない

* `npm run start` で Bot が起動しているか確認
* `.env` の `DISCORD_TOKEN` が正しいか確認
* Bot に `View Channels` / `Send Messages` 権限があるか確認

---

## 開発メモ

* 時刻と日付は `Asia/Tokyo` を固定で使用します（Luxon）
* 出力は `kind: "active"` のみ（休憩/空白は非表示）
* Slash Command の定義を変えたら `npm run deploy` を再実行してください
