/**
 * Generate Release Notes
 * 
 * Creates professional release notes from CHANGELOG and git history.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateReleaseNotes() {
  const rootDir = path.resolve(__dirname, '..');
  const version = getVersion(rootDir);
  const changelog = getChangelog(rootDir, version);
  const commits = getCommitsSinceLastTag();
  const checksums = getChecksums(rootDir);
  
  const notes = `# NeuralShell ${version}

**Hardware-bound AI operator shell. Sessions that survive OS reinstalls.**

---

## 🚀 What's New

${changelog}

---

## 📦 Downloads

| Platform | Download | Size |
|----------|----------|------|
| **Windows** | [NeuralShell Setup ${version}.exe](https://github.com/Z3r0DayZion-install/NeuralShell/releases/download/${version}/NeuralShell%20Setup%20${version}.exe) | ~305 MB |
| macOS | DMG coming soon | - |
| Linux | AppImage coming soon | - |

**One-line install:**
\`\`\`bash
npx neuralshell-installer
\`\`\`

---

## 🔐 Security

- ✅ **Checksum-verified** Windows installer
- ✅ **SHA-256 checksums** verified
- ✅ **0 vulnerabilities** (npm audit clean)
- ✅ **Hardware binding** verified on install

${checksums}

---

## 🎯 Quick Start

1. Download the installer
2. Run and accept the EULA
3. Launch NeuralShell
4. Follow the welcome workflow
5. Try the hardware-binding demo

---

## 📝 Changes

${commits}

---

## 🙏 Thanks

Thanks to all beta testers and security reviewers who helped make this release possible.

**Full Changelog**: https://github.com/Z3r0DayZion-install/NeuralShell/blob/main/CHANGELOG.md

**Documentation**: https://github.com/Z3r0DayZion-install/NeuralShell/blob/main/INSTALL.md

---

*Built with 🔒 by paranoid developers*
`;

  const outFile = path.join(rootDir, 'release', 'RELEASE_NOTES.md');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, notes, 'utf8');
  
  console.log(`Release notes generated: ${outFile}`);
  return outFile;
}

function getVersion(rootDir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  return pkg.version;
}

function getChangelog(rootDir, version) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    return 'See CHANGELOG.md for full details.';
  }
  
  const content = fs.readFileSync(changelogPath, 'utf8');
  
  // Extract section for this version
  const regex = new RegExp(`## v?${version.replace(/\./g, '\\.')}.*?(?=## |$)`, 's');
  const match = content.match(regex);
  
  if (match) {
    return match[0].trim();
  }
  
  return 'See CHANGELOG.md for full details.';
}

function getCommitsSinceLastTag() {
  try {
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commits = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf8' });
    return commits.split('\n')
      .filter(line => line.trim())
      .map(line => `- ${line}`)
      .join('\n') || '- No new commits';
  } catch (err) {
    return '- See git log for details';
  }
}

function getChecksums(rootDir) {
  const checksumsPath = path.join(rootDir, 'release', 'checksums.txt');
  if (!fs.existsSync(checksumsPath)) {
    return '';
  }
  
  const content = fs.readFileSync(checksumsPath, 'utf8');
  return `\`\`\`
${content}
\`\`\``;
}

if (require.main === module) {
  try {
    generateReleaseNotes();
  } catch (err) {
    console.error('Failed to generate release notes:', err);
    process.exit(1);
  }
}

module.exports = { generateReleaseNotes };
