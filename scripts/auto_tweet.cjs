#!/usr/bin/env node
const process = require("process");

function hasFlag(args, flag) {
  return args.includes(flag);
}

function getArgValue(args, key) {
  const direct = args.find((item) => item.startsWith(`${key}=`));
  if (direct) return direct.slice(key.length + 1).trim();
  const index = args.indexOf(key);
  if (index >= 0 && args[index + 1]) {
    return String(args[index + 1]).trim();
  }
  return "";
}

function buildReleaseUrl(args) {
  const explicit = getArgValue(args, "--release-url");
  if (explicit) return explicit;
  const repo = process.env.GITHUB_REPOSITORY;
  const tag = process.env.GITHUB_REF_NAME;
  if (repo && tag) {
    return `https://github.com/${repo}/releases/tag/${tag}`;
  }
  return "https://github.com/Z3r0DayZion-install/NeuralShell/releases/latest";
}

function buildTweetText(args) {
  const releaseUrl = buildReleaseUrl(args);
  const shareUrl = getArgValue(args, "--share-url")
    || process.env.NS_SHARE_BLOB_URL
    || "https://github.com/Z3r0DayZion-install/NeuralShell";
  const ogUrl = getArgValue(args, "--og-url")
    || process.env.NS_OG_CARD_URL
    || "https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/main/static/video/proof_walkthrough.gif";

  return [
    "NeuralShell release is live.",
    "",
    "Signed + notarized builds, SOC2 prep evidence, and proof-first local AI workflows.",
    "",
    `Release: ${releaseUrl}`,
    `Share blob: ${shareUrl}`,
    `OG card: ${ogUrl}`,
    "",
    "#NeuralShell #LocalAI #DevTools"
  ].join("\n");
}

async function postTweet(text, token) {
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body && body.detail ? body.detail : `HTTP ${response.status}`;
    throw new Error(`Twitter post failed: ${message}`);
  }
  return body;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = hasFlag(args, "--dry");
  const text = buildTweetText(args);

  if (dryRun) {
    process.stdout.write(`${JSON.stringify({ dryRun: true, text }, null, 2)}\n`);
    return;
  }

  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    throw new Error("TWITTER_BEARER_TOKEN is required for live tweet mode. Use --dry for CI.");
  }

  const result = await postTweet(text, token);
  process.stdout.write(`${JSON.stringify({ dryRun: false, result }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`[auto_tweet] ${error && error.message ? error.message : String(error)}\n`);
  process.exit(1);
});
