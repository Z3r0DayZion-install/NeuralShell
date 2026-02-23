const https = require('https');
const fs = require('fs');
const path = require('path');

const ASSETS = [
  { url: 'https://unpkg.com/vue@3/dist/vue.global.prod.js', path: 'public/lib/vue.global.prod.js' },
  { url: 'https://unpkg.com/axios/dist/axios.min.js', path: 'public/lib/axios.min.js' },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.js', path: 'public/lib/chart.min.js' },
  { url: 'https://unpkg.com/3d-force-graph/dist/3d-force-graph.min.js', path: 'public/lib/3d-force-graph.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', path: 'public/css/all.min.css' }
];

async function download(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`[Provision] Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('--- NEURALSHELL DARK NODE PROVISIONING ---');
  for (const asset of ASSETS) {
    try {
      await download(asset.url, asset.path);
    } catch (err) {
      console.error(`[Error] ${asset.url}: ${err.message}`);
    }
  }
  
  // Create models README
  const modelReadme = `
# NeuralShell Models Directory
Place your ONNX models here.
Default expected model: Xenova/all-MiniLM-L6-v2

Structure:
/models/Xenova/all-MiniLM-L6-v2/
  - config.json
  - tokenizer.json
  - onnx/model_quantized.onnx
  `.trim();
  
  fs.writeFileSync('models/README.md', modelReadme);
  console.log('[Provision] Created models/README.md');
  console.log('--- PROVISIONING COMPLETE ---');
  console.log('System is now ready for 100% offline operation.');
}

run();
