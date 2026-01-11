import cron from "node-cron";
import type { Client } from "discord.js";
import { resolveDateISO } from "./wos_schedule.js";

// 送信可能判定（TSの型ガードも兼ねる）
function isSendableTextChannel(ch: unknown): ch is { isTextBased: () => boolean; send: (text: string) => Promise<unknown> } {
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

export function setupDailyPost(params: {
  client: Client;
  channelId: string;
  buildReply: (dateISO: string, opts?: { includeDayBeforeReminder?: boolean }) => string;
}) {
  const { client, channelId, buildReply } = params;

  cron.schedule(
    // "0 0 9 * * *", // 秒 分 時 日 月 曜日  (毎日09:00 JST)
    "0 * * * * *", // テスト用: 毎分0秒
    async () => {
      try {
        const dateISO = resolveDateISO(0);
        const text = buildReply(dateISO, { includeDayBeforeReminder: true });

        const ch = await client.channels.fetch(channelId);
        if (!isSendableTextChannel(ch)) {
          console.error("Post channel is not sendable:", channelId, (ch as any)?.type);
          return;
        }

        await ch.send(text);
        console.log("Daily post sent:", dateISO);
      } catch (e) {
        console.error("Daily post failed:", e);
      }
    },
    { timezone: "Asia/Tokyo" }
  );

  console.log("Daily post scheduler registered (09:00 JST).");
}
