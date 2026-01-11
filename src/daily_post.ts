import cron from "node-cron";
import type { Client } from "discord.js";
import { eventsOnDateActiveOnly, formatDateJP, resolveDateISO } from "./wos_schedule.js";
import type { EventDef, Hit } from "./wos_schedule.js";

function isSendableTextChannel(
  ch: unknown
): ch is { isTextBased: () => boolean; send: (text: string) => Promise<unknown> } {
  return (
    !!ch &&
    typeof ch === "object" &&
    "isTextBased" in ch &&
    typeof (ch as any).isTextBased === "function" &&
    (ch as any).isTextBased() === true &&
    "send" in ch &&
    typeof (ch as any).send === "function"
  );
}

async function sendToChannel(client: Client, channelId: string, text: string) {
  const ch = await client.channels.fetch(channelId);
  if (!isSendableTextChannel(ch)) {
    console.error("Channel is not sendable:", channelId, (ch as any)?.type);
    return;
  }
  await ch.send(text);
}

function buildPrestartText(dateISO: string, hits: Hit[], eventByName: Map<string, EventDef>): string {
  const lines: string[] = [];
  lines.push("■ 開始前リマインダー");
  lines.push(`本日(${formatDateJP(dateISO)})まもなく開始のイベントです`);

  for (const h of hits) {
    const def = eventByName.get(h.name);
    const t = def?.start_time ? `（${def.start_time}開始）` : "";
    lines.push(`- ${h.name}${t}`);

    if (def?.links) {
      for (const link of def.links) {
        lines.push(`  - ${link.label}: <${link.url}>`);
      }
    }
  }

  return lines.join("\n");
}

export function setupDailyPost(params: {
  client: Client;

  dailyChannelId: string;
  prestartChannelId: string;

  events: EventDef[];
  eventByName: Map<string, EventDef>;
  buildReply: (dateISO: string, opts?: { includeDayBeforeReminder?: boolean }) => string;
}) {
  const { client, dailyChannelId, prestartChannelId, events, eventByName, buildReply } = params;

  // 09:00 JST（当日一覧）
  cron.schedule(
    "0 0 9 * * *", // 09:00
    // "0 * * * * *", // TEST: every minute
    async () => {
      try {
        const dateISO = resolveDateISO(0);
        const text = buildReply(dateISO, { includeDayBeforeReminder: true });
        await sendToChannel(client, dailyChannelId, text);
        console.log("Daily post sent:", dateISO);
      } catch (e) {
        console.error("Daily post failed:", e);
      }
    },
    { timezone: "Asia/Tokyo" }
  );

  // 21:30 JST（前日リマインダー）
  // TODO: ここはeventsのみで指定できるようにしたい...。
  cron.schedule(
    "0 30 21 * * *", // 21:30
    // "0 * * * * *", // TEST: every minute
    async () => {
      try {
        const dateISO = resolveDateISO(0);
        const hits = eventsOnDateActiveOnly(events, dateISO);

        const target = hits.filter((h) => eventByName.get(h.name)?.prestart_remind_time === "21:30");
        if (target.length === 0) return;

        const text = buildPrestartText(dateISO, target, eventByName);
        await sendToChannel(client, prestartChannelId, text);
        console.log("Prestart post sent:", dateISO);
      } catch (e) {
        console.error("Prestart post failed:", e);
      }
    },
    { timezone: "Asia/Tokyo" }
  );

  console.log("Schedulers registered: 09:00 -> dailyChannel, 21:30 -> prestartChannel (JST).");
}
