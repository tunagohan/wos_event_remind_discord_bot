import "dotenv/config";
import { Client, GatewayIntentBits, Interaction } from "discord.js";
import { setupDailyPost } from "./daily_post.js";

import { EVENTS } from "./events.js";
import {
  eventsOnDateActiveOnly,
  formatBullets,
  resolveDateISO,
  formatDateJP,
  plusDaysISO,
} from "./wos_schedule.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Missing env: DISCORD_TOKEN");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const EVENT_BY_NAME = new Map(EVENTS.map((e) => [e.name, e]));

function buildReply(dateISO: string, opts?: { includeDayBeforeReminder?: boolean }): string {
  const hits = eventsOnDateActiveOnly(EVENTS, dateISO);
  const lines: string[] = [];

  if (opts?.includeDayBeforeReminder) {
    const tomorrowISO = plusDaysISO(dateISO, 1);
    const tomorrowHits = eventsOnDateActiveOnly(EVENTS, tomorrowISO);

    const reminders = tomorrowHits
      .filter((h) => h.phaseDay === 1)
      .filter((h) => EVENT_BY_NAME.get(h.name)?.previous_remind === true);

    if (reminders.length > 0) {
      lines.push("■ 注意イベント!!前日リマインダー");
      lines.push(`明日(${formatDateJP(tomorrowISO)})から以下のイベントです`);
      for (const r of reminders) lines.push(`- ${r.name}`);
      lines.push("");
    }
  }

  if (hits.length === 0) {
    lines.push(`${formatDateJP(dateISO)} の該当イベントはありません。`);
    return lines.join("\n");
  }

  lines.push(`${formatDateJP(dateISO)} のイベント`);
  lines.push(formatBullets(hits, EVENT_BY_NAME));
  return lines.join("\n");
}

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "wos_event") return;

  const sub = interaction.options.getSubcommand();
  let daysOffset = 0;

  if (sub === "today") {
    daysOffset = 0;
  } else if (sub === "add") {
    daysOffset = interaction.options.getInteger("days", true);
  } else {
    await interaction.reply({ content: "不明なサブコマンドです。", ephemeral: true });
    return;
  }

  const dateISO = resolveDateISO(daysOffset);

  // today のときだけ前日リマインダー込み
  const text =
    sub === "today"
      ? buildReply(dateISO, { includeDayBeforeReminder: true })
      : buildReply(dateISO);

  await interaction.reply({ content: text, ephemeral: false });
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);

  const dailyChannelId = process.env.DISCORD_DAILY_CHANNEL_ID;
  const prestartChannelId = process.env.DISCORD_PRESTART_CHANNEL_ID;

  if (!dailyChannelId) {
    console.log("DISCORD_DAILY_CHANNEL_ID is not set. Daily post is disabled.");
    return;
  }
  if (!prestartChannelId) {
    console.log("DISCORD_PRESTART_CHANNEL_ID is not set. Prestart post is disabled.");
    return;
  }

  setupDailyPost({
    client,
    dailyChannelId,
    prestartChannelId,
    events: EVENTS,
    eventByName: EVENT_BY_NAME,
    buildReply,
  });
});

client.login(token).catch((e) => {
  console.error(e);
  process.exit(1);
});
