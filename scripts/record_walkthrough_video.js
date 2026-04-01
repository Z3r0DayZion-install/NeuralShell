/* global window */
const { chromium } = require("playwright");
const path = require('path');
const fs = require('fs');

(async () => {
    // 1. Setup
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        recordVideo: {
            dir: 'videos/',
            size: { width: 1280, height: 720 }
        },
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // 2. Navigate and Record
    console.log('Navigating to local NeuralShell landing page...');
    const url = 'file://' + path.resolve(__dirname, '../docs/index.html');
    await page.goto(url);

    console.log('Wait for UI to stabilize...');
    await page.waitForTimeout(3000);

    console.log('Starting 60-second walkthrough sequence...');

    // Auto-scroll Down
    await page.evaluate(async () => {
        for (let i = 0; i < 4; i++) {
            window.scrollBy(0, 400);
            await new Promise(r => setTimeout(r, 2000));
        }
    });

    // Cycle through feature dots if they exist
    const dots = await page.$$('.p-dot');
    for (let i = 0; i < dots.length; i++) {
        console.log(`Clicking feature dot ${i}...`);
        await dots[i].click();
        await page.waitForTimeout(8000); // Give time for each 'proof' slide
    }

    // Scroll back up and stay on hero
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(10000);

    console.log('Walkthrough complete. Closing browser...');
    await context.close();
    await browser.close();

    // 3. Move and rename the video
    const videoFiles = fs.readdirSync('videos/').filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
        const latestVideo = videoFiles[0]; // Playwright generates a random hash name
        const finalPath = path.resolve(__dirname, '../release/proof-video-walkthrough.webm');
        fs.mkdirSync(path.dirname(finalPath), { recursive: true });
        fs.renameSync(path.join('videos/', latestVideo), finalPath);
        console.log(`Video saved to: ${finalPath}`);

        // Cleanup the temp dir
        fs.rmSync('videos/', { recursive: true, force: true });
    } else {
        console.error('Failed to capture video.');
    }
})();
