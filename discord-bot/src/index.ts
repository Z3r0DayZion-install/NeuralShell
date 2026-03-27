import fs from "node:fs";
import path from "node:path";
import { AttachmentBuilder, Client, GatewayIntentBits, Message } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN || "";
const manifestPath = path.resolve(process.cwd(), process.env.NS_MANIFEST_PATH || "dist/SHA256SUMS.txt");
const command = "!drop";

function parseHashes(text: string): number {
  return String(text || "")
    .split(/\r?\n/)
    .filter((line) => /^[a-fA-F0-9]{64}\s+/.test(line.trim()) || /^@\{Hash=[A-Fa-f0-9]{64};/.test(line.trim()))
    .length;
}

function sovereignScore(hashCount: number): number {
  if (!Number.isFinite(hashCount) || hashCount <= 0) return 0;
  const raw = 25 + hashCount * 5;
  return Math.max(0, Math.min(100, raw));
}

function buildReply(count: number): string {
  const score = sovereignScore(count);
  return [
    "NeuralShell Proof-Drop Report",
    `Hash Entries: ${count}`,
    `Sovereign Score: ${score}/100`,
    "Source: dist/SHA256SUMS.txt",
  ].join("\n");
}

async function handleDrop(message: Message): Promise<void> {
  if (!fs.existsSync(manifestPath)) {
    await message.reply(`Manifest missing: ${manifestPath}`);
    return;
  }
  const text = fs.readFileSync(manifestPath, "utf8");
  const count = parseHashes(text);
  const reply = buildReply(count);
  const attachment = new AttachmentBuilder(Buffer.from(text, "utf8"), { name: "SHA256SUMS.txt" });
  await message.reply({ content: reply, files: [attachment] });
}

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("ready", () => {
  console.log(`NeuralShell Proof-Drop bot online as ${client.user?.tag || "unknown"}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.trim().toLowerCase().startsWith(command)) return;
  try {
    await handleDrop(message);
  } catch (error) {
    await message.reply(`Proof drop failed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

client.login(token);
