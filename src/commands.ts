import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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
  )
  .addSubcommand((sub) =>
    sub
      .setName("next")
      .setDescription("指定イベントの次回開始日を表示")
      .addStringOption((opt) =>
        opt
          .setName("event")
          .setDescription("イベント名（候補から選択）")
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

export const wosPingCommand = new SlashCommandBuilder()
  .setName("wos_ping")
  .setDescription("疎通確認（UTC時刻を返す）");

export const wosAttackCommand = new SlashCommandBuilder()
  .setName("wos_attack")
  .setDescription("ホワイトアウトサバイバル 連撃スケジューラ (UTC)")
  .addStringOption((opt) =>
    opt
      .setName("text")
      .setDescription("例: ねく32 アスナ32 みるく34 兄貴31 のび34 5秒")
      .setRequired(true)
  );

export const wosReminderCommand = new SlashCommandBuilder()
  .setName("wos_reminder")
  .setDescription("定期投稿リマインダーのON/OFFを切り替える")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("定期投稿リマインダーの状態を確認")
  )
  .addSubcommand((sub) =>
    sub.setName("on").setDescription("定期投稿リマインダーを有効化")
  )
  .addSubcommand((sub) =>
    sub.setName("off").setDescription("定期投稿リマインダーを無効化")
  );

export const transferCommand = new SlashCommandBuilder()
  .setName("transfer")
  .setDescription("移民管理シートを操作する")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub
      .setName("sheets")
      .setDescription("利用可能なシート一覧を表示")
  )
  .addSubcommand((sub) =>
    sub
      .setName("new")
      .setDescription("テンプレートをコピーして新しいシートを作成")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("作成するシート名")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("指定シートにメンバーを追加")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("対象のシート名")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("category")
          .setDescription("ジャンル")
          .setRequired(true)
          .addChoices(
            { name: "特別枠", value: "特別枠" },
            { name: "普通枠", value: "普通枠" }
          )
      )
      .addStringOption((opt) =>
        opt
          .setName("user_name")
          .setDescription("ユーザー名")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("user_id")
          .setDescription("ユーザーID")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("server_id")
          .setDescription("サーバーID")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("note")
          .setDescription("備考")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("check")
      .setDescription("指定シートの集計とユーザー一覧を確認")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("対象のシート名")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("invited")
      .setDescription("ユーザーIDで指定シートの招待済み状態を更新")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("対象のシート名")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("user_id")
          .setDescription("招待済みにするユーザーID")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("uninvited")
      .setDescription("指定シートの未招待ユーザー一覧を表示")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("対象のシート名")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("ユーザーIDで指定シートのメンバーを削除")
      .addStringOption((opt) =>
        opt
          .setName("sheet_name")
          .setDescription("対象のシート名")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("user_id")
          .setDescription("削除対象のユーザーID")
          .setRequired(true)
      )
  );
