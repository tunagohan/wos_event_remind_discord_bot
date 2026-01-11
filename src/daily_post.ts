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

function parseHHmm(hhmm: string): { hour: number; minute: number } {
  // "H:MM" / "HH:MM" を許容
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) throw new Error(`Invalid prestart_remind_time: ${hhmm} (expected HH:MM)`);

  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) throw new Error(`Invalid time: ${hhmm}`);
  if (hour < 0 || hour > 23) throw new Error(`Invalid hour: ${hhmm}`);
  if (minute < 0 || minute > 59) throw new Error(`Invalid minute: ${hhmm}`);

  return { hour, minute };
}

function buildPrestartText(
  dateISO: string,
  hhmm: string,
  hits: Hit[],
  eventByName: Map<string, EventDef>
): string {
  const lines: string[] = [];
  lines.push("■ 開始前リマインダー");
  lines.push(`本日(${formatDateJP(dateISO)}) ${hhmm} に開始するイベントです`);

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

  // 投稿先を分離
  dailyChannelId: string; // 09:00
  prestartChannelId: string; // 開始前（時刻は events から動的）

  events: EventDef[];
  eventByName: Map<string, EventDef>;
  buildReply: (dateISO: string, opts?: { includeDayBeforeReminder?: boolean }) => string;
}) {
  const { client, dailyChannelId, prestartChannelId, events, eventByName, buildReply } = params;

  // 09:00 JST（当日一覧）
  cron.schedule(
    "0 0 9 * * *",
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

  // 開始前リマインド（events.ts の prestart_remind_time から動的生成）
  const times = Array.from(
    new Set(events.map((e) => e.prestart_remind_time).filter((t): t is string => !!t))
  );

  for (const hhmm of times) {
    const { hour, minute } = parseHHmm(hhmm);
    const expr = `0 ${minute} ${hour} * * *`; // 秒 分 時 日 月 曜日

    cron.schedule(
      expr,
      async () => {
        try {
          const dateISO = resolveDateISO(0);
          const hits = eventsOnDateActiveOnly(events, dateISO);

          const target = hits
            .filter((h) => h.phaseDay === 1)
            .filter((h) => eventByName.get(h.name)?.prestart_remind_time === hhmm);

          if (target.length === 0) return;

          const text = buildPrestartText(dateISO, hhmm, target, eventByName);
          await sendToChannel(client, prestartChannelId, text);
          console.log("Prestart post sent:", dateISO, hhmm);
        } catch (e) {
          console.error("Prestart post failed:", hhmm, e);
        }
      },
      { timezone: "Asia/Tokyo" }
    );

    console.log("Prestart scheduler registered:", hhmm, "->", expr);
  }

  console.log("Schedulers registered: 09:00 daily + dynamic prestart times (JST).");
}
