const fs = require("node:fs");
const path = require("node:path");
const icongen = require("icon-gen");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
const svgPath = path.join(assetsDir, "icon-source.svg");

function ensureAssetsDir() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
}

function writeSourceSvg() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">',
    "  <defs>",
    '    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">',
    '      <stop offset="0%" stop-color="#1DD3B0"/>',
    '      <stop offset="100%" stop-color="#FF8A3D"/>',
    "    </linearGradient>",
    '    <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">',
    '      <stop offset="0%" stop-color="#091320"/>',
    '      <stop offset="100%" stop-color="#152844"/>',
    "    </linearGradient>",
    "  </defs>",
    '  <rect width="1024" height="1024" rx="220" fill="url(#g2)"/>',
    '  <circle cx="266" cy="260" r="170" fill="#1DD3B0" fill-opacity="0.22"/>',
    '  <circle cx="792" cy="756" r="190" fill="#FF8A3D" fill-opacity="0.22"/>',
    '  <rect x="212" y="212" width="600" height="600" rx="112" fill="url(#g1)"/>',
    '  <path d="M330 684V340h108l148 194V340h108v344H586L438 490v194z" fill="#0D1E35"/>',
    '  <rect x="330" y="726" width="364" height="42" rx="21" fill="#0D1E35" fill-opacity="0.78"/>',
    "</svg>"
  ].join("\n");
  fs.writeFileSync(svgPath, svg, "utf8");
}

async function generate() {
  ensureAssetsDir();
  writeSourceSvg();

  await icongen(svgPath, assetsDir, {
    report: true,
    ico: { name: "icon" },
    icns: { name: "icon" },
    favicon: {
      name: "icon-",
      pngSizes: [512],
      icoSizes: [64]
    }
  });

  const generatedPng = path.join(assetsDir, "icon-512.png");
  const targetPng = path.join(assetsDir, "icon.png");
  if (fs.existsSync(generatedPng)) {
    fs.copyFileSync(generatedPng, targetPng);
  }
  console.log("Icon generation completed.");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
