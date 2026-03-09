const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function parseArg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!hit) return fallback;
  return String(hit).slice(prefix.length).trim() || fallback;
}

function run(cmd) {
  return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trim();
}

function normalizePath(value, fallback) {
  if (!value) return fallback;
  if (path.isAbsolute(value)) return value;
  return path.join(root, value);
}

function readChecksums(filePath) {
  if (!fs.existsSync(filePath)) return "(checksums unavailable)";
  return fs.readFileSync(filePath, "utf8").trim() || "(checksums unavailable)";
}

function listReleaseTags() {
  const output = run('git tag --list "v*-OMEGA*" --sort=-creatordate');
  if (!output) return [];
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function inferPreviousTag(currentTag) {
  const tags = listReleaseTags();
  const previousFromList = tags.find((item) => item !== currentTag) || null;
  if (previousFromList) return previousFromList;

  try {
    // Fallback for shallow checkouts where tag listing can be incomplete.
    return run("git describe --tags --abbrev=0 HEAD^");
  } catch {
    return null;
  }
}

function commitLines(range) {
  const output = run(`git log --pretty=format:%h%x09%s ${range}`);
  if (!output) return [];
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t+/);
      if (parts.length < 2) return `- ${line}`;
      return `- ${parts[0]} ${parts.slice(1).join(" ")}`;
    });
}

function buildNotes(tag, previousTag, commits, checksums, dateStamp) {
  const summary = commits.length > 0 ? commits.join("\n") : "- No new commits detected in range.";
  const prevLine = previousTag ? `- Previous stable tag: ${previousTag}` : "- Previous stable tag: none";

  return [
    `## NeuralShell ${tag}`,
    "",
    `- Release date: ${dateStamp}`,
    prevLine,
    "",
    "### Change Summary",
    summary,
    "",
    "### Artifact SHA-256",
    "```text",
    checksums,
    "```",
    ""
  ].join("\n");
}

function updateChangelog(changelogPath, tag, commits, dateStamp) {
  const heading = `## ${tag} (${dateStamp})`;
  const lines = commits.length > 0 ? commits : ["- No new commits detected in range."];
  const section = [
    heading,
    "",
    "### Highlights",
    ...lines,
    ""
  ].join("\n");

  let source = "# NeuralShell Change Log\n\n";
  if (fs.existsSync(changelogPath)) {
    source = fs.readFileSync(changelogPath, "utf8");
  }

  if (source.includes(heading)) {
    return false;
  }

  if (source.startsWith("#")) {
    const split = source.split(/\r?\n\r?\n/, 2);
    if (split.length === 2) {
      source = `${split[0]}\n\n${section}${split[1]}`;
    } else {
      source = `${source.trim()}\n\n${section}`;
    }
  } else {
    source = `# NeuralShell Change Log\n\n${section}${source}`;
  }

  fs.writeFileSync(changelogPath, source.endsWith("\n") ? source : `${source}\n`, "utf8");
  return true;
}

function main() {
  const tag = parseArg("tag", process.env.GITHUB_REF_NAME || run("git describe --tags --exact-match"));
  const outFile = normalizePath(parseArg("out"), path.join(root, "release", "RELEASE_NOTES.md"));
  const checksumsPath = normalizePath(parseArg("checksums"), path.join(root, "release", "checksums.txt"));
  const changelogPath = normalizePath(parseArg("changelog"), path.join(root, "CHANGELOG.md"));
  const skipChangelog =
    process.argv.includes("--skip-changelog") ||
    process.env.RELEASE_NOTES_SKIP_CHANGELOG === "1" ||
    process.env.npm_config_skip_changelog === "true";
  const writeChangelog = !skipChangelog;

  if (!tag) {
    throw new Error("Release tag is required (--tag=... or GITHUB_REF_NAME).\n");
  }

  const previousTag = inferPreviousTag(tag);
  const range = previousTag ? `${previousTag}..HEAD` : "HEAD";
  const commits = commitLines(range);
  const checksums = readChecksums(checksumsPath);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const notes = buildNotes(tag, previousTag, commits, checksums, dateStamp);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, notes, "utf8");

  let changed = false;
  if (writeChangelog) {
    changed = updateChangelog(changelogPath, tag, commits, dateStamp);
  }

  console.log(`Release notes written: ${outFile}`);
  if (writeChangelog) {
    console.log(changed ? `Changelog updated: ${changelogPath}` : `Changelog already up-to-date: ${changelogPath}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
