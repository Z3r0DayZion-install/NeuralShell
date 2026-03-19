const fs = require("node:fs");
const path = require("node:path");
const icongen = require("icon-gen");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");
const svgPath = path.join(assetsDir, "logo-mark.svg");

function ensureAssetsDir() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
}

async function generate() {
  ensureAssetsDir();

  if (!fs.existsSync(svgPath)) {
    console.error(`Source SVG not found: ${svgPath}`);
    process.exit(1);
  }

  console.log(`Generating icons from: ${svgPath}`);

  await icongen(svgPath, assetsDir, {
    report: true,
    ico: { name: "icon" },
    icns: { name: "icon" },
    favicon: {
      name: "icon-",
      pngSizes: [16, 32, 64, 128, 256, 512],
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
