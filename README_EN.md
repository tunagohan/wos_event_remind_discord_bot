````md
# Whiteout Survival Event Reminder Discord Bot

A Discord bot that calculates Whiteout Survival event schedules from a rule set (“start date + repeating phase cycle”) and notifies via Slash Commands and scheduled posts (cron).

- Slash Commands
  - `/wos_event today`: Today’s events (JST). Also includes “day-before” alerts for flagged events (`previous_remind`).
  - `/wos_event add <n>`: Events for `n` days from today (JST)
- Scheduled posts
  - Posts the “today’s event list” every day at **09:00 JST** (includes day-before alerts)
  - Posts “pre-start reminders” every day at **21:30 JST** to a separate channel (e.g., Bear Trap)

Phases marked as “blank/rest” are not displayed (but are used for schedule calculations).

---

## Requirements

- Node.js 20+ (recommended)
- npm
- Discord server admin permissions (to invite the bot and grant channel permissions)

---

## Create and Invite the Discord Bot

### 1) Create an application in the Developer Portal
1. Create a **New Application** in the Discord Developer Portal
2. Go to **Bot** → **Add Bot**
3. Generate a **Token** (set it in `.env`)

> Never commit the token to a public repository.

### 2) Invite the bot to your server
1. Go to **OAuth2 → URL Generator**
2. Scopes
   - `bot`
   - `applications.commands` (required for Slash Commands)
3. Bot Permissions (minimum)
   - `View Channels`
   - `Send Messages`
4. Use the generated URL to invite the bot to your server

### 3) Collect required IDs
- `DISCORD_APP_ID`: Application ID in the Developer Portal
- `DISCORD_GUILD_ID`: Guild (server) ID where the bot is installed (for registering guild commands)
- Channel IDs for posting (see below)
  - Enable Developer Mode in Discord → right-click a channel → **Copy ID**

---

## Local Setup

### 1) Install dependencies
```bash
npm install
````

### 2) Create `.env`

Create a `.env` file at the project root:

```env
DISCORD_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DISCORD_APP_ID=123456789012345678
DISCORD_GUILD_ID=123456789012345678

# 09:00 post destination (daily event list)
DISCORD_DAILY_CHANNEL_ID=123456789012345678

# 21:30 post destination (pre-start reminders)
DISCORD_PRESTART_CHANNEL_ID=234567890123456789
```

### 3) Register Slash Commands (first time / when command definitions change)

```bash
npm run deploy
```

> If you change `src/commands.ts`, you must run `npm run deploy` again.
> If you only change event rules in `src/events.ts`, deploy is not required.

### 4) Start the bot

```bash
npm run start
```

---

## Usage (in Discord)

* `/wos_event today`

  * Today’s event list (JST)
  * If there are flagged events that start tomorrow (`previous_remind: true`), a day-before alert is shown at the top
* `/wos_event add <n>`

  * Event list for `n` days from now (JST)

---

## Scheduled Posts (cron)

### 09:00 JST — Daily “Today’s Events” post

* Posts to `DISCORD_DAILY_CHANNEL_ID`
* Same content as `/wos_event today` (includes day-before alerts)

### 21:30 JST — Pre-start reminder post

* Posts to `DISCORD_PRESTART_CHANNEL_ID`
* Only posts if there are events today with `prestart_remind_time: "21:30"`

#### Permissions (important)

The bot must have channel-level permissions (channel overrides take precedence):

* `View Channel`
* `Send Messages`
* (If posting to threads) `Send Messages in Threads`

If you see `DiscordAPIError[50013]: Missing Permissions`, it is almost always a channel permission issue.

---

## Event Rules (Add / Update / Remove)

Event rules live in `src/events.ts` under the `EVENTS` array.
The bot treats `start` as the base date and repeats the cycle with the sum of `phases[].days`.

### EventDef shape (example)

```ts
{
  category: "Other",              // Display category (rendered as Discord h3: ###)
  name: "Blazing Fire and Fangs", // Event name
  start: "2025-10-06",            // Base start date (YYYY-MM-DD)
  phases: [
    { name: "Event Phase", days: 3, kind: "active" },
    { name: "Rest Phase",  days: 11, kind: "rest" }
  ],

  // Optional: day-before alert (shown at the top of /today output)
  previous_remind: true,

  // Optional: start time (display only)
  start_time: "22:00",

  // Optional: pre-start reminder scheduling (used by 21:30 post)
  prestart_remind_time: "21:30",

  // Optional: “copy link” items (e.g., Discord message links)
  links: [
    { label: "Copy Link", url: "https://discord.com/channels/.../.../..." }
  ]
}
```

* `phases[].kind`

  * `"active"`: displayed (included in output)
  * `"rest"` / `"blank"`: not displayed (used only for cycle calculation)

### Add an event

1. Add a new event entry to `src/events.ts`
2. Restart the bot (`npm run start`)
3. No need to redeploy commands unless `src/commands.ts` changed

### Update an event

* If the base date changes → update `start`
* If phase structure changes → update `phases[].days / kind / name`
* Update `previous_remind / prestart_remind_time / links` as needed
* Restart the bot to apply changes

### Remove an event

* Delete the event entry from `src/events.ts`
* Restart the bot

---

## Adding the “Bear Trap” (always-on) event

Bear Trap requirements:

* Occurs every 2 days
* Starts at 22:00
* Pre-start reminder at 21:30 (to the prestart channel)

Add this to `src/events.ts`:

```ts
{
  category: "Always-on",
  name: "Bear Trap",
  start: "YYYY-MM-DD", // IMPORTANT: pick a real date when Bear Trap actually occurs
  start_time: "22:00",
  prestart_remind_time: "21:30",
  phases: [
    { name: "Bear Trap", days: 1, kind: "active" },
    { name: "Blank",     days: 1, kind: "blank" }
  ],
  links: [
    { label: "Copy Link", url: "https://discord.com/channels/.../.../..." }
  ]
}
```

> `start` must be a real day when Bear Trap occurs. If it’s off, the 2-day cycle will be off.

---

## Output Format

### Categories are rendered as Discord headings (h3)

Example: `### Weekly Events`

### Per-event “Copy Link” display

Links are displayed as nested bullets:

```text
### Weekly Events
- Tundra Dominator: Event Phase (1/7)
  - Copy Link: <https://discord.com/channels/.../.../...>
```

URLs are wrapped with `<...>` to suppress previews and keep them easy to copy/paste.

---

## Troubleshooting

### Slash Commands do not appear

* Did you invite the bot with `applications.commands` scope?
* Did you run `npm run deploy` (required for first registration / changes to `src/commands.ts`)?
* Is `DISCORD_GUILD_ID` correct?

### Scheduled posts do not happen

* Is the bot process running continuously? (If the process stops, posts stop.)
* Are `DISCORD_DAILY_CHANNEL_ID` / `DISCORD_PRESTART_CHANNEL_ID` correct channel IDs?
* Does the bot have `View Channel` and `Send Messages` permissions in those channels?

### `DiscordAPIError[50013]: Missing Permissions`

* Almost always channel permission overrides.
* Ensure the bot (or its role) explicitly has permission to view and send messages in the target channel.
