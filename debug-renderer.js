const { _electron: electron } = require('playwright');

(async () => {
    try {
        console.log('Launching Electron...');
        const app = await electron.launch({ args: ['.'] });
        const page = await app.firstWindow();

        console.log('Window attached. Listening for console and errors...');
        page.on('console', msg => console.log('[CONSOLE]', msg.type(), msg.text()));
        page.on('pageerror', err => {
            console.error('\n*** PAGE EXCEPTION ***');
            console.error(err.message);
            console.error(err.stack);
            console.error('**********************\n');
        });

        // Wait a few seconds to let React boot and crash
        await page.waitForTimeout(5000);

        console.log('Closing app...');
        await app.close();
    } catch (err) {
        console.error('Plawright script failed:', err);
    }
})();
