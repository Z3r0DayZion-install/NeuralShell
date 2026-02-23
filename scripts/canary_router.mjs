const baseUrl = process.env.CANARY_BASE_URL || 'http://127.0.0.1:3000';
const timeoutMs = Number(process.env.CANARY_TIMEOUT_MS || 5000);

const controller = new AbortController();
setTimeout(() => controller.abort(), timeoutMs);

const res = await fetch(`${baseUrl}/health?details=1`, { signal: controller.signal });
if (!res.ok) {
  console.error(`Canary failed: status ${res.status}`);
  process.exit(1);
}
const payload = await res.json();
if (!payload.ok) {
  console.error('Canary failed: health not ok');
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, degraded: payload.degraded ?? null, uptimeSec: payload.uptimeSec ?? null }));
