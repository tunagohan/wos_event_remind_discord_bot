import "dotenv/config";
import { REST, Routes } from "discord.js";
import { wosEventCommand } from "./commands.js";

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_APP_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !appId || !guildId) {
  throw new Error("Missing env: DISCORD_TOKEN / DISCORD_APP_ID / DISCORD_GUILD_ID");
}

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  await rest.put(Routes.applicationGuildCommands(appId!, guildId!), {
    body: [wosEventCommand.toJSON()],
  });

  console.log("Guild commands deployed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
