const path = require('path');
const { verifyIntegrity: omegaVerify } = require('@neural/omega-core');

/**
 * NeuralShell Boot Integrity Verifier
 * Plugs NeuralShell paths into OMEGA Core verifier.
 */

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAxCLxxWH21Kr0ndpZnNWK
DCNOlPRbMrDGO23aJLxCgRRVunKUEXTtJI+fXhCGDhOnQXEFI9r2TvvlQNJIex6P
FJtwUph4JnJ6rHxvwNaENCucaeJayAXJe/1flwPnmGVjLmSiptXKX4vJ2tXk0aU7
BP8d3NFwNjSpH0CiMfxeqCIFdjO4+aC1Yvl7knMMRrLtrk9puNjCFxuvChJgIexA
n5cdgRXvwAvdgl/VqkflEu3JAmAnpuifpj+vdRno1Z1kcjdnWXG1s22HIpK3Seav
LRiD7UFcDcT1etJgh7V2qKHW+y0khhan6/selQP4FRlRDVxqDyxQi7a/ILyiRc20
npkLNNdEXuY2hE5ySietIwm6ERc7Xl8tRAhU87T67HtTHblnAfo2GPbAM3QJ2OAF
3EUEwkDuzbOcjCcPuYGDHp7Eua26sAbDXBFljIz3a/E4N1SbmH4CcqvLIvifpAne
MzR2EKjJFLW7Yf/v2N+TYGoJ7YjAlDW0j4ruBkXGMO+Z70yJyT8yuFkT6/uq7WwJ
qmsPw22GVC+jy6Arswtlm6s+G4K137g8aRxOKYkLcojVtDfWGS4LeBHKLIb4wGvK
weNBZ3z/4+8/13qF1F1hNTccPExMA5kFyzJ4FG2P5YLx5f2a6QIpDmF+3BbCqOQn
8Qrs68XsYpauHHtyho2XweUCAwEAAQ==
-----END PUBLIC KEY-----`;

const ROOT = path.join(__dirname, '../../../');
const MANIFEST_PATH = path.join(ROOT, 'dist/seal.manifest.json');
const SIG_PATH = path.join(ROOT, 'dist/seal.manifest.sig');

async function verifyIntegrity() {
  const { app } = require('electron');
  return await omegaVerify({
    pubKey: PUB_KEY,
    manifestPath: MANIFEST_PATH,
    sigPath: SIG_PATH,
    rootDir: ROOT,
    isPackaged: app.isPackaged,
    appPath: app.getAppPath()
  });
}

module.exports = { verifyIntegrity };
