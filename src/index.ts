import "dotenv/config";
import { Client, GatewayIntentBits, Interaction } from "discord.js";
import { setupDailyPost } from "./daily_post.js";
import { handleWosPing, handleWosRally } from "./rally.js";

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

  try {
    // --- /wos_event (today/add) ---
    if (interaction.commandName === "wos_event") {
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

      // today のときだけ前日注意リマインダーを含める（add は通常含めない）
      const includeDayBeforeReminder = sub === "today";
      const text = buildReply(dateISO, { includeDayBeforeReminder });

      await interaction.reply({ content: text, ephemeral: false });
      return;
    }

    // --- /wos_ping ---
    if (interaction.commandName === "wos_ping") {
      await handleWosPing(interaction);
      return;
    }

    // --- /wos_attack (連撃スケジューラ) ---
    if (interaction.commandName === "wos_attack") {
      await handleWosRally(interaction);
      return;
    }

    // unknown command
    return;
  } catch (e) {
    console.error("[interactionCreate][error]", e);

    const msg = e instanceof Error ? e.message : String(e);
    if (!interaction.isRepliable()) return;

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`エラー: ${msg}`);
    } else {
      await interaction.reply({ content: `エラー: ${msg}`, ephemeral: true });
    }
  }
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
