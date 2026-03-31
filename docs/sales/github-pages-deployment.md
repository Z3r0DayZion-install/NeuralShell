# GitHub Pages Deployment (All-Out Fast Path)

**Goal:** Publish a stable, asset-complete sales page with one primary checkout CTA.

**Primary checkout URL:** https://gumroad.com/l/neuralshell-operator  
**Support inbox:** support@neuralshell.app

---

## 1) Build Publish Package Locally

Run from repo root:

```powershell
powershell -ExecutionPolicy Bypass -File docs/sales/build-sales-site.ps1
```

One-command build + publish to `docs/`:

```powershell
powershell -ExecutionPolicy Bypass -File docs/sales/publish-pages-docs.ps1
```

This creates:

- `release/site/neuralshell-operator/index.html`
- `release/site/neuralshell-operator/assets/*`
- `release/site/neuralshell-operator/build-manifest.json`

Why this matters:

- avoids broken image paths
- ensures one publish-ready folder
- gives you a manifest for verification

---

## 2) Copy Build to GitHub Pages Source

### Option A: `/docs` Pages source (recommended)

```powershell
Copy-Item -Path release/site/neuralshell-operator/index.html -Destination docs/index.html -Force
Remove-Item -Path docs/assets -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path release/site/neuralshell-operator/assets -Destination docs/assets -Recurse -Force
```

Then commit and push:

```bash
git add docs/index.html docs/assets
git commit -m "Publish all-out sales page build"
git push
```

### Option B: root Pages source

```powershell
Copy-Item -Path release/site/neuralshell-operator/index.html -Destination index.html -Force
Remove-Item -Path assets -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path release/site/neuralshell-operator/assets -Destination assets -Recurse -Force
```

Then commit and push:

```bash
git add index.html assets
git commit -m "Publish all-out sales page build"
git push
```

---

## 3) Enable / Verify GitHub Pages

1. Repo Settings -> Pages
2. Source: `Deploy from a branch`
3. Branch: `main`
4. Folder: `/docs` or `/` (match what you used above)
5. Save and wait for deployment

Verify page and CTA:

- page loads with screenshot tiles visible
- Buy button opens Gumroad URL
- support email link opens mail client

---

## 4) Final Pre-Launch Verification

Run this checklist before traffic:

- `docs/sales/checkout-verification-checklist.md`
- `docs/sales/launch-checklist.md`
- `docs/sales/launch-command-center.md`

---

## 5) Optional Custom Domain (After First Sales)

If you add a custom domain later:

- set DNS records
- set Pages custom domain
- enforce HTTPS
- retest checkout + support links

Do not block first revenue on custom domain work.

---

## Launch Rule

Keep one primary checkout path live:

- Product: NeuralShell Operator
- Price: $149
- URL: https://gumroad.com/l/neuralshell-operator

No split-CTA experimentation until baseline conversion data exists.
