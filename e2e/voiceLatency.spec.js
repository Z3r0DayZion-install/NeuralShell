const { test, expect } = require("@playwright/test");
const { runBench } = require("../collab/voice/benchLat.js");

test("Voice latency benchmark median RTT stays under 200ms on LAN harness", async () => {
  test.skip(process.env.VOICE_BENCH !== "1", "VOICE_BENCH!=1; skipping LAN latency gate.");

  const result = await runBench({
    port: Number(process.env.VOICE_BENCH_PORT || 57123),
    pingCount: 20
  });
  await test.info().attach("voice-latency-report.json", {
    body: Buffer.from(JSON.stringify(result, null, 2), "utf8"),
    contentType: "application/json"
  });
  expect(result.medianRttMs).toBeLessThan(200);
});
