import type { ChatInputCommandInteraction } from "discord.js";
import {
  addTransferMember,
  createTransferSheet,
  deleteTransferMember,
  getTransferSheetSummary,
  isTransferCategory,
  listTransferSheets,
} from "./transfer_sheet.js";

const MAX_MESSAGE_LENGTH = 1900;

function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const chunks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > MAX_MESSAGE_LENGTH) {
      if (current) chunks.push(current);
      current = line;
      continue;
    }
    current = next;
  }

  if (current) chunks.push(current);
  return chunks;
}

async function replyWithChunks(interaction: ChatInputCommandInteraction, text: string) {
  const chunks = splitMessage(text);
  await interaction.editReply(chunks[0] ?? "");

  for (let i = 1; i < chunks.length; i += 1) {
    await interaction.followUp({ content: chunks[i] });
  }
}

function formatTransferSummary(summary: Awaited<ReturnType<typeof getTransferSheetSummary>>): string {
  const lines: string[] = [];
  lines.push(`特別枠合計： ${summary.specialCount}人`);
  lines.push(`普通枠合計： ${summary.normalCount}人`);
  lines.push("");
  lines.push("ユーザーリスト");

  if (summary.users.length === 0) {
    lines.push("登録ユーザーはいません。");
    return lines.join("\n");
  }

  for (const user of summary.users) {
    lines.push(`${user.category}, ${user.userName}, ${user.userId || "-"}, ${user.serverId}`);
  }

  return lines.join("\n");
}

export async function handleTransfer(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  await interaction.deferReply();

  if (sub === "sheets") {
    const sheetNames = await listTransferSheets();
    const lines = ["シート一覧"];

    if (sheetNames.length === 0) {
      lines.push("利用可能なシートはありません。");
    } else {
      for (const sheetName of sheetNames) {
        lines.push(`- ${sheetName}`);
      }
    }

    await interaction.editReply(lines.join("\n"));
    return;
  }

  if (sub === "new") {
    const sheetName = interaction.options.getString("sheet_name", true);
    const created = await createTransferSheet(sheetName);
    await interaction.editReply(`テンプレートをコピーしてシート「${created}」を作成しました。`);
    return;
  }

  if (sub === "add") {
    const sheetName = interaction.options.getString("sheet_name", true);
    const category = interaction.options.getString("category", true);
    const userName = interaction.options.getString("user_name", true);
    const userId = interaction.options.getString("user_id") ?? "";
    const serverId = interaction.options.getString("server_id", true);

    if (!isTransferCategory(category)) {
      throw new Error("不正なジャンルです。");
    }

    const row = await addTransferMember({
      sheetName,
      category,
      userName,
      userId,
      serverId,
    });

    await interaction.editReply(`シート「${sheetName}」の ${row} 行目にメンバーを追加しました。`);
    return;
  }

  if (sub === "check") {
    const sheetName = interaction.options.getString("sheet_name", true);
    const summary = await getTransferSheetSummary(sheetName);
    await replyWithChunks(interaction, formatTransferSummary(summary));
    return;
  }

  if (sub === "delete") {
    const sheetName = interaction.options.getString("sheet_name", true);
    const userId = interaction.options.getString("user_id", true);
    const row = await deleteTransferMember(sheetName, userId);
    await interaction.editReply(`シート「${sheetName}」の ${row} 行目を削除しました。`);
    return;
  }

  throw new Error("不明なサブコマンドです。");
}
