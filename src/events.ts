import { EventDef } from "./wos_schedule";

export const EVENTS: EventDef[] = [
  {
    category: "週間イベント",
    name: "最強王国(SvS)",
    start: "2025-10-04",
    phases: [
      { name: "マッチングフェーズ", days: 2, kind: "active", note: "土日" },
      { name: "イベントフェーズ", days: 5, kind: "active", note: "月〜金" },
      { name: "戦争フェーズ", days: 1, kind: "active", note: "土" },
      { name: "戦地救急フェーズ", days: 2, kind: "active", note: "日月" },
      { name: "空白期間", days: 18, kind: "blank" },
    ],
  },
  {
    category: "週間イベント",
    name: "同盟大作戦",
    start: "2025-10-13",
    phases: [
      { name: "イベントフェーズ", days: 7, kind: "active", note: "月〜日" },
      { name: "空白期間", days: 21, kind: "blank" },
    ],
  },
  {
    category: "週間イベント",
    name: "氷原支配者",
    start: "2025-10-20",
    phases: [
      { name: "イベントフェーズ", days: 7, kind: "active", note: "月〜日" },
      { name: "空白期間", days: 21, kind: "blank" },
    ],
  },
  {
    category: "週間イベント",
    name: "同盟総動員",
    start: "2025-10-27",
    phases: [
      { name: "イベントフェーズ", days: 6, kind: "active", note: "月〜土" },
      { name: "空白期間", days: 22, kind: "blank" },
    ],
  },

  {
    category: "砦王城",
    name: "王城決戦",
    start: "2025-10-11",
    phases: [
      { name: "戦争フェーズ", days: 1, kind: "active", note: "土" },
      { name: "空白期間", days: 13, kind: "blank" },
    ],
  },
  {
    category: "砦王城",
    name: "砦争奪戦",
    start: "2025-10-07",
    phases: [
      { name: "準備フェーズ", days: 1, kind: "active", note: "火" },
      { name: "エントリーフェーズ", days: 2, kind: "active", note: "水〜木" },
      { name: "イベントフェーズ", days: 1, kind: "active", note: "金" },
      { name: "空白期間", days: 3, kind: "blank" },
    ],
  },

  {
    category: "別マップイベント",
    name: "兵器工場争奪戦",
    start: "2025-10-02",
    phases: [
      { name: "エントリーフェーズ", days: 2, kind: "active", note: "木〜金" },
      { name: "マッチングフェーズ", days: 1, kind: "active" },
      { name: "イベントフェーズ", days: 1, kind: "active", note: "日" },
      { name: "空白期間", days: 10, kind: "blank" },
    ],
  },
  {
    category: "別マップイベント",
    name: "峡谷合戦",
    start: "2025-10-02",
    phases: [
      { name: "エントリーフェーズ", days: 2, kind: "active", note: "木〜金" },
      { name: "イベントフェーズ", days: 1, kind: "active", note: "土" },
      { name: "空白期間", days: 25, kind: "blank" },
    ],
  },
  {
    category: "別マップイベント",
    name: "燃霜鉱区",
    start: "2025-10-07",
    phases: [
      { name: "イベントフェーズ", days: 1, kind: "active", note: "火" },
      { name: "空白期間", days: 13, kind: "blank" },
    ],
  },

  {
    category: "単体イベント",
    name: "軍備競技",
    start: "2025-10-13",
    phases: [
      { name: "第1イベントフェーズ", days: 2, kind: "active", note: "月〜火" },
      { name: "休憩フェーズ", days: 2, kind: "rest", note: "水〜木" },
      { name: "第2イベントフェーズ", days: 2, kind: "active", note: "金〜土" },
      { name: "空白期間", days: 8, kind: "blank" },
    ],
  },
  {
    category: "単体イベント",
    name: "士官計画",
    start: "2025-10-15",
    phases: [
      { name: "第1イベントフェーズ", days: 2, kind: "active", note: "水〜木" },
      { name: "休憩フェーズ", days: 2, kind: "rest", note: "金〜土" },
      { name: "第2イベントフェーズ", days: 2, kind: "active", note: "日〜月" },
      { name: "空白期間", days: 8, kind: "blank" },
    ],
  },
  {
    category: "単体イベント",
    name: "野獣駆逐",
    start: "2025-10-07",
    phases: [
      { name: "イベントフェーズ", days: 2, kind: "active", note: "火〜水" },
      { name: "空白期間", days: 12, kind: "blank" },
    ],
  },
  {
    category: "単体イベント",
    name: "全軍参戦",
    start: "2025-10-24",
    phases: [
      { name: "イベントフェーズ", days: 2, kind: "active", note: "金〜土" },
      { name: "空白期間", days: 26, kind: "blank" },
    ],
    previous_remind: true,
  },

  {
    category: "同盟イベント",
    name: "同盟争覇戦",
    start: "2025-10-06",
    phases: [
      { name: "エントリーフェーズ", days: 2, kind: "active", note: "月〜火" },
      { name: "イベントフェーズ", days: 3, kind: "active", note: "水〜金" },
      { name: "空白期間", days: 2, kind: "blank" },
    ],
  },
  {
    category: "同盟イベント",
    name: "クレイジー･ジョイ",
    start: "2025-10-07",
    phases: [
      { name: "第1イベントフェーズ", days: 1, kind: "active", note: "火" },
      { name: "休憩フェーズ", days: 1, kind: "rest", note: "水" },
      { name: "第2イベントフェーズ", days: 1, kind: "active", note: "木" },
      { name: "空白期間", days: 11, kind: "blank" },
    ],
  },

  {
    category: "その他",
    name: "英雄殿堂",
    start: "2025-10-05",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "日〜火" },
      { name: "休憩フェーズ", days: 4, kind: "rest" },
    ],
  },
  {
    category: "その他",
    name: "ラッキールーレット",
    start: "2025-10-07",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "火〜木" },
      { name: "休憩フェーズ", days: 11, kind: "rest" },
    ],
  },
  {
    category: "その他",
    name: "雪原行商",
    start: "2025-10-13",
    phases: [
      { name: "イベントフェーズ", days: 7, kind: "active", note: "月〜日" },
      { name: "休憩フェーズ", days: 21, kind: "rest" },
    ],
  },
  {
    category: "その他",
    name: "英雄の役目",
    start: "2025-10-01",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "水〜金" },
      { name: "休憩フェーズ", days: 11, kind: "rest" },
    ],
  },
  {
    category: "その他",
    name: "烈火と牙",
    start: "2025-10-06",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "月〜水" },
      { name: "休憩フェーズ", days: 11, kind: "rest" },
    ],
    previous_remind: true,
  },
  {
    category: "その他",
    name: "火晶有効化計画",
    start: "2025-10-10",
    phases: [
      { name: "イベントフェーズ", days: 2, kind: "active", note: "金〜土" },
      { name: "休憩フェーズ", days: 12, kind: "rest" },
    ],
  },

  {
    category: "3週周期",
    name: "傭兵の名誉",
    start: "2025-10-11",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "土〜月" },
      { name: "休憩フェーズ", days: 18, kind: "rest" },
    ],
  },

  {
    category: "4週周期",
    name: "雪原貿易所",
    start: "2025-10-13",
    phases: [
      { name: "イベントフェーズ", days: 2, kind: "active", note: "月〜火" },
      { name: "休憩フェーズ", days: 26, kind: "rest" },
    ],
  },
  {
    category: "4週周期",
    name: "穴釣り選手権",
    start: "2025-10-14",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "火〜木" },
      { name: "休憩フェーズ", days: 25, kind: "rest" },
    ],
  },
  {
    category: "4週周期",
    name: "暁の展望",
    start: "2025-10-28",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "火〜木" },
      { name: "休憩フェーズ", days: 25, kind: "rest" },
    ],
  },
  {
    category: "4週周期",
    name: "除雪隊",
    start: "2025-10-28",
    phases: [
      { name: "イベントフェーズ", days: 3, kind: "active", note: "火〜木" },
      { name: "休憩フェーズ", days: 25, kind: "rest" },
    ],
  },
  {
    category: "4週周期",
    name: "ミアの占い屋",
    start: "2025-10-31",
    phases: [
      { name: "イベントフェーズ", days: 2, kind: "active", note: "金〜土" },
      { name: "休憩フェーズ", days: 26, kind: "rest" },
    ],
  },

  {
    category: "12週周期",
    name: "氷結の秘宝",
    start: "2025-10-22",
    phases: [
      { name: "イベントフェーズ", days: 8, kind: "active" },
      { name: "休憩フェーズ", days: 43, kind: "rest" },
    ],
  },
];
