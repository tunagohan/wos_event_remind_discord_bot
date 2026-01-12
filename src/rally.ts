// src/rally.ts
import type { ChatInputCommandInteraction } from "discord.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

type Member = { name: string; marchSec: number };

// 全角数字→半角
function toHalfWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
}

/**
 * 新フォーマット:
 *   例) "ねく32 アスナ32 みるく34 兄貴31 のび34 5秒"
 * - メンバー: 「名前+秒数」(例: ねく32) を順番＝攻撃順で取得
 * - 間隔: 末尾の「N秒 / Ns」を最後の一致として取得（無ければ5）
 */
function parseArgs(text: string): { members: Member[]; intervalSec: number } {
  const normalized = toHalfWidthDigits(text).replace(/\s+/g, " ").trim();
  const tokens = normalized.split(" ").filter(Boolean);
  if (tokens.length === 0) throw new Error("入力が空です");

  // 末尾トークンを間隔に（「N秒」「Ns」「N」を許容）
  const last = tokens[tokens.length - 1];
  const intervalMatch = last.match(/^([0-9]{1,3})(?:秒|s)?$/);
  const intervalSec = intervalMatch ? parseInt(intervalMatch[1], 10) : 5;
  if (!Number.isFinite(intervalSec) || intervalSec < 0 || intervalSec > 300) {
    throw new Error("到着間隔は0〜300秒で指定してください（例: 0秒, 5秒）");
  }

  // 残りは全て「名前+数字」(例: ねく32 / アスナ31)
  const members: Member[] = [];
  const memberTokens = tokens.slice(0, -1);
  for (const t of memberTokens) {
    const m = t.match(/^([^\d]+)([0-9]{1,4})$/);
    if (!m) continue;
    const name = m[1].trim();
    const sec = parseInt(m[2], 10);
    if (name && Number.isFinite(sec)) members.push({ name, marchSec: sec });
  }

  if (members.length < 1) {
    throw new Error("メンバーを読み取れませんでした。例: ねく32 アスナ31 ちん30 5秒");
  }

  return { members, intervalSec };
}

// now(+60s)以降で最も近い 00/15/30/45（未来側限定）
function nextAnchor(nowUtc: dayjs.Dayjs): dayjs.Dayjs {
  const t = nowUtc.add(60, "second");
  const secs = [0, 15, 30, 45];
  let candidates = secs.map((s) => t.second(s).millisecond(0));
  candidates = candidates.filter((c) => c.isAfter(t) || c.isSame(t));
  if (candidates.length > 0) return candidates.sort((a, b) => a.diff(t)).at(0)!;
  return t.add(1, "minute").second(0).millisecond(0);
}

/**
 * 到着S秒刻みを保証するスケジュール（入力順＝攻撃順）
 * 到着_i - 到着_0 = S*i を満たすよう、集結開始のオフセットを決める。
 */
function schedule(members: Member[], intervalSec: number, nowUtc: dayjs.Dayjs) {
  const anchor = nextAnchor(nowUtc);
  const M0 = members[0].marchSec;

  // delta_i = S*i - (M_i - M0)
  const rawDeltas = members.map((m, i) => intervalSec * i - (m.marchSec - M0));
  const minDelta = Math.min(...rawDeltas);
  const shift = minDelta < 0 ? -minDelta : 0; // 誰も過去にしないよう全員に同じ遅延
  const startOffsets = rawDeltas.map((d) => d + shift);

  const rows = members.map((m, idx) => {
    const rally = anchor.add(startOffsets[idx], "second"); // 集結開始(UTC)
    const depart = rally.add(5, "minute"); // 出征
    const arrive = depart.add(m.marchSec, "second"); // 到着
    return { name: m.name, marchSec: m.marchSec, rally, depart, arrive };
  });

  return { anchor, rows };
}

// 出力: 「#<順> HH:MM:SS <名前>」(UTCの集結開始のみ)
function buildReplyMinimal(rows: ReturnType<typeof schedule>["rows"]): string {
  const body = rows
    .map((r, i) => `#${i + 1} ${r.rally.utc().format("HH:mm:ss")} ${r.name} (${r.marchSec}秒)`)
    .join("\n");
  return `UTC時刻\n${body}`;
}

export async function handleWosPing(i: ChatInputCommandInteraction) {
  await i.reply(`pong! now(UTC) = ${dayjs().utc().format("YYYY-MM-DD HH:mm:ss")} UTC`);
}

export async function handleWosRally(i: ChatInputCommandInteraction) {
  const raw = i.options.getString("text", true);
  await i.deferReply({ ephemeral: false });

  const { members, intervalSec } = parseArgs(raw);
  const nowUtc = dayjs().utc();
  const { rows } = schedule(members, intervalSec, nowUtc);
  const reply = buildReplyMinimal(rows);

  await i.editReply(reply);
}
