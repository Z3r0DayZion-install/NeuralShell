function createRecoveryWindow(report) {
  console.error("[RECOVERY] Integrity verification failed.");
  if (report) {
    console.error(`[RECOVERY] details=${JSON.stringify(report)}`);
  }
}

module.exports = {
  createRecoveryWindow
};
