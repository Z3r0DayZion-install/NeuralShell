const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");

const repoRoot = path.resolve(__dirname, "..");
const inputHtml = path.join(repoRoot, "docs", "marketing-card.html");
const outputPath = path.join(repoRoot, "docs", "site-assets", "og-card.png");
const width = 1200;
const height = 630;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function capture() {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    frame: false,
    useContentSize: true,
    backgroundColor: "#06111b",
    paintWhenInitiallyHidden: true,
    webPreferences: {
      sandbox: true
    }
  });

  await win.loadFile(inputHtml);
  await win.webContents.executeJavaScript(
    "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : Promise.resolve(true)",
    true
  );
  await new Promise((resolve) => setTimeout(resolve, 350));

  const image = await win.webContents.capturePage();
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, image.toPNG());
  win.destroy();
}

app.commandLine.appendSwitch("force-color-profile", "srgb");
app.whenReady()
  .then(capture)
  .then(() => {
    console.log(JSON.stringify({
      ok: true,
      output: path.relative(repoRoot, outputPath).replace(/\\/g, "/")
    }, null, 2));
    app.quit();
  })
  .catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    app.exit(1);
  });
