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
      .addIntegerOption((opt) =>
        opt
          .setName("days")
          .setDescription("何日後（0以上）")
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(365)
      )
  );
