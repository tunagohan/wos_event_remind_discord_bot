import { SlashCommandBuilder } from "discord.js";

export const wosEventCommand = new SlashCommandBuilder()
  .setName("wos_event")
  .setDescription("Whiteout Survival event calculator")
  .addSubcommand((sub) =>
    sub.setName("today").setDescription("今日のイベント（空白/休憩は除外）")
  )
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("n日後のイベント（空白/休憩は除外）")
      // 入力体験は /wos_event add 3 で運用できます（UI上は days オプション）
      .addIntegerOption((opt) =>
        opt
          .setName("days")
          .setDescription("何日後（0以上）")
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(365)
      )
  );
