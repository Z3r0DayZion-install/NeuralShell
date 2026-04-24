#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "release", "site-smoke");

const ROUTES = [
  "https://getneuralshell.com/",
  "https://getneuralshell.com/proof.html",
  "https://getneuralshell.com/onboarding.html",
  "https://getneuralshell.com/pricing.html",
  "https://getneuralshell.com/evaluator.html",
  "https://getneuralshell.com/partners.html",
  "https://getneuralshell.com/docs/",
  "https://getneuralshell.com/docs/PRIVACY_POLICY.md",
  "https://getneuralshell.com/og-image.png",
];

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function getRouteStatus(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    return {
      url,
      status: response.status,
      ok: response.status >= 200 && response.status < 300,
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      url,
      status: null,
      ok: false,
      finalUrl: null,
      error: String(error && error.message ? error.message : error),
    };
  }
}

async function getText(url) {
  const response = await fetch(url, { redirect: "follow" });
  return response.text();
}

async function run() {
  const startedAt = new Date().toISOString();
  const routeResults = [];

  for (const route of ROUTES) {
    // Sequential checks keep output stable and easier to diff in release logs.
    routeResults.push(await getRouteStatus(route));
  }

  const homeHtml = await getText("https://getneuralshell.com/");
  const docsHtml = await getText("https://getneuralshell.com/docs/");

  const assertions = {
    canonicalOnHome: /<link\s+rel="canonical"\s+href="https:\/\/getneuralshell\.com\/"/i.test(homeHtml),
    homeTitleOk: /<title>NeuralShell - Local-First AI Sessions That Survive Reinstalls<\/title>/i.test(homeHtml),
    watchDemoStillPlaceholder: /href="#demo"/i.test(homeHtml),
    docsProofRouteCorrect: /href="\.\.\/proof\.html"/i.test(docsHtml),
    docsLegacyLandingProofAbsent: !/landing\/proof\.html/i.test(docsHtml),
  };

  const allRoutesOk = routeResults.every((r) => r.ok);
  const allAssertionsOk = assertions.canonicalOnHome && assertions.homeTitleOk && assertions.docsProofRouteCorrect && assertions.docsLegacyLandingProofAbsent;

  const result = {
    generatedAt: startedAt,
    ok: allRoutesOk && allAssertionsOk,
    routes: routeResults,
    assertions,
    notes: [
      assertions.watchDemoStillPlaceholder
        ? "Watch Proof Demo CTA is still a placeholder (#demo). Update after publishing the final video URL."
        : "Watch Proof Demo CTA points to a non-placeholder target.",
    ],
  };

  const reportName = `site-smoke-${stamp()}.json`;
  const reportPath = path.join(OUT_DIR, reportName);
  const latestPath = path.join(OUT_DIR, "latest.json");

  writeJson(reportPath, result);
  writeJson(latestPath, result);

  process.stdout.write(`${JSON.stringify({ ok: result.ok, reportPath: path.relative(ROOT, reportPath), assertions: result.assertions }, null, 2)}\n`);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  process.stderr.write(`${error && error.stack ? error.stack : String(error)}\n`);
  process.exit(1);
});