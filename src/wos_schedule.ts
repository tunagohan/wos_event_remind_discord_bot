import { DateTime } from "luxon";

export type PhaseKind = "active" | "rest" | "blank";

export type Phase = {
  name: string; // フェーズ名
  days: number; // 期間（日数）
  kind: PhaseKind; // フェーズ種別
  note?: string; // 曜日制約など（計算には未使用）
};

export type EventDef = {
  category: string; // カテゴリ
  name: string;     // イベント名
  start: string;    // イベント始点日
  phases: Phase[];  // 周期
  previous_remind?: boolean; // 前回通知フラグ
};

export type Hit = {
  category: string;
  name: string;
  date: string;
  phaseName: string;
  phaseDay: number;
  phaseDays: number;
};

const ZONE = "Asia/Tokyo";
const mod = (n: number, m: number) => ((n % m) + m) % m;

const cycleLength = (e: EventDef) => e.phases.reduce((acc, p) => acc + p.days, 0);

function phaseOnDate(event: EventDef, dateISO: string) {
  const d = DateTime.fromISO(dateISO, { zone: ZONE }).startOf("day");
  const s = DateTime.fromISO(event.start, { zone: ZONE }).startOf("day");

  const delta = Math.floor(d.diff(s, "days").days);
  const len = cycleLength(event);
  const offset = mod(delta, len);

  let cursor = 0;
  for (const ph of event.phases) {
    const start = cursor;
    const end = cursor + ph.days - 1;
    if (offset >= start && offset <= end) {
      return {
        phaseName: ph.name,
        phaseDay: offset - start + 1,
        phaseDays: ph.days,
        kind: ph.kind,
      };
    }
    cursor += ph.days;
  }
  throw new Error(`phase not found: ${event.name} ${dateISO}`);
}

export function resolveDateISO(daysOffset: number): string {
  return DateTime.now().setZone(ZONE).plus({ days: daysOffset }).toISODate()!;
}

// 空白/休憩は表示しない → active のみ返す
export function eventsOnDateActiveOnly(events: EventDef[], dateISO: string): Hit[] {
  const hits: Hit[] = [];

  for (const e of events) {
    const p = phaseOnDate(e, dateISO);
    if (p.kind !== "active") continue;

    hits.push({
      category: e.category,
      name: e.name,
      date: dateISO,
      phaseName: p.phaseName,
      phaseDay: p.phaseDay,
      phaseDays: p.phaseDays,
    });
  }

  return hits;
}

export function formatBullets(hits: Hit[]): string {
  const byCat = new Map<string, Hit[]>();
  for (const h of hits) {
    const arr = byCat.get(h.category) ?? [];
    arr.push(h);
    byCat.set(h.category, arr);
  }

  const lines: string[] = [];
  for (const [cat, arr] of byCat) {
    lines.push(`■ ${cat}`);
    for (const h of arr) {
      lines.push(`- ${h.name}：${h.phaseName}（${h.phaseDay}/${h.phaseDays}日目）`);
    }
  }
  return lines.join("\n");
}

// 追加: ISO日付を基準に +n 日した ISO を返す
export function plusDaysISO(baseISO: string, days: number): string {
  return DateTime.fromISO(baseISO, { zone: ZONE }).plus({ days }).toISODate()!;
}

// 追加: yyyy/MM/dd の表示用
export function formatDateJP(dateISO: string): string {
  return DateTime.fromISO(dateISO, { zone: ZONE }).toFormat("yyyy/LL/dd");
}
