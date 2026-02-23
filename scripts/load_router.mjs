const baseUrl = process.env.LOAD_BASE_URL || 'http://127.0.0.1:3000';
const requests = Number(process.env.LOAD_REQUESTS || 100);
const concurrency = Number(process.env.LOAD_CONCURRENCY || 10);

let inFlight = 0;
let sent = 0;
let ok = 0;
let fail = 0;

async function one(i) {
  try {
    const res = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: `load-${i}` }] })
    });
    if (res.ok) {
      ok += 1;
    } else {
      fail += 1;
    }
  } catch {
    fail += 1;
  }
}

await new Promise((resolve) => {
  const tick = () => {
    while (inFlight < concurrency && sent < requests) {
      const i = sent;
      sent += 1;
      inFlight += 1;
      one(i).finally(() => {
        inFlight -= 1;
        if (sent >= requests && inFlight === 0) {
          resolve();
        } else {
          tick();
        }
      });
    }
  };
  tick();
});

console.log(JSON.stringify({ requests, concurrency, ok, fail }));
if (ok === 0) {
  process.exit(1);
}
