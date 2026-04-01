#!/usr/bin/env node
const { execSync } = require("child_process");

const REQUIRED_SECRETS = [
  { name: "NPM_TOKEN", note: "npm publish automation token" },
  { name: "DISCORD_BOT_TOKEN", note: "Discord bot token for proof-drop bot" },
  { name: "DISCORD_WEBHOOK", note: "Discord webhook URL for release notifications" },
  { name: "GH_PAT_PAGES", note: "GitHub token with pages:write" },
];

const OPTIONAL_SECRETS = [
  { name: "AC_USERNAME", note: "Apple ID email for notarization" },
  { name: "AC_PASSWORD", note: "Apple app-specific password / notary profile" },
  { name: "AC_TEAM_ID", note: "Apple developer team ID" },
  { name: "VSIX_SIGNING_CERT_CHAIN", note: "VSIX certificate chain PEM" },
  { name: "VSIX_SIGNING_PRIVATE_KEY", note: "VSIX signing key PEM" },
  { name: "VSIX_SIGNING_PRIVATE_KEY_PASSWORD", note: "VSIX key passphrase" },
  { name: "JB_CERT_CHAIN", note: "JetBrains cert chain PEM" },
  { name: "JB_PRIVATE_KEY", note: "JetBrains signing key PEM" },
  { name: "JB_PRIVATE_KEY_PASSWORD", note: "JetBrains key passphrase" },
  { name: "TWITTER_BEARER_TOKEN", note: "Twitter v2 bearer token for auto_tweet" },
];

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function hasFlag(args, flag) {
  return args.includes(flag);
}

function getArgValue(args, key) {
  const match = args.find((entry) => entry.startsWith(`${key}=`));
  if (!match) return "";
  return match.slice(key.length + 1).trim();
}

function printCommands(scopeFlag) {
  const all = [...REQUIRED_SECRETS, ...OPTIONAL_SECRETS];
  console.log(`${COLORS.cyan}NeuralShell CI Secret Bootstrap${COLORS.reset}`);
  console.log(`${COLORS.green}Required${COLORS.reset}: release and bot pipelines`);
  console.log(`${COLORS.yellow}Optional${COLORS.reset}: notarization/signing/marketing automation`);
  console.log("");
  for (const secret of all) {
    const level = REQUIRED_SECRETS.some((item) => item.name === secret.name) ? "required" : "optional";
    const marker = level === "required" ? `${COLORS.green}[required]${COLORS.reset}` : `${COLORS.yellow}[optional]${COLORS.reset}`;
    console.log(`${marker} ${secret.name}  # ${secret.note}`);
    console.log(`gh secret set ${secret.name} -b"<${secret.name.toLowerCase()}>"${scopeFlag}`);
    console.log("");
  }
}

function getSecretNames(scopeFlag) {
  try {
    const output = execSync(`gh secret list --json name${scopeFlag}`, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    const parsed = JSON.parse(output);
    return new Set(
      (Array.isArray(parsed) ? parsed : [])
        .map((entry) => String(entry && entry.name ? entry.name : "").trim())
        .filter(Boolean)
    );
  } catch (error) {
    const message = error && error.stderr ? String(error.stderr) : String(error.message || error);
    console.error(`${COLORS.red}Unable to query gh secrets: ${message}${COLORS.reset}`);
    process.exit(2);
  }
}

function checkSecrets(scopeFlag) {
  const existing = getSecretNames(scopeFlag);
  const missingRequired = REQUIRED_SECRETS
    .map((entry) => entry.name)
    .filter((name) => !existing.has(name));
  const missingOptional = OPTIONAL_SECRETS
    .map((entry) => entry.name)
    .filter((name) => !existing.has(name));

  if (missingRequired.length) {
    console.error(`${COLORS.red}Missing required secrets:${COLORS.reset} ${missingRequired.join(", ")}`);
    if (missingOptional.length) {
      console.error(`${COLORS.yellow}Missing optional secrets:${COLORS.reset} ${missingOptional.join(", ")}`);
    }
    process.exit(1);
  }

  console.log(`${COLORS.green}Required secrets are present.${COLORS.reset}`);
  if (missingOptional.length) {
    console.log(`${COLORS.yellow}Optional secrets missing:${COLORS.reset} ${missingOptional.join(", ")}`);
  } else {
    console.log(`${COLORS.green}Optional secrets are present.${COLORS.reset}`);
  }
  process.exit(0);
}

function main() {
  const args = process.argv.slice(2);
  const org = getArgValue(args, "--org");
  const repo = getArgValue(args, "--repo");
  const check = hasFlag(args, "--check");
  const scopeFlag = org ? ` --org ${org}` : repo ? ` --repo ${repo}` : "";

  if (check) {
    checkSecrets(scopeFlag);
    return;
  }

  printCommands(scopeFlag);
}

main();
