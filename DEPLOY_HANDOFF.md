# NeuralShell Deploy Handoff (2026-04-23)

## Current State

- **Branch:** `synced/master-2026-04-03` (HEAD: `ee52cce`)
- **`master` is branch-protected** — requires 4 CI status checks to pass before merge
- **Live site:** `https://getneuralshell.com/` is serving the current landing page over HTTPS
- **Pages deploy mode:** GitHub Actions deploys from `_site/` root with `CNAME=getneuralshell.com`

---

## What Is Already Done

| Item | Status |
|------|--------|
| `landing/index.html` — new dark-theme marketing landing page | ✅ committed |
| `landing/proof.html` — 7 hardware-binding verification scenarios | ✅ committed |
| `landing/pricing.html` — rebuilt with dark theme + nav + FAQ | ✅ committed |
| `landing/onboarding.html` — post-download setup guide | ✅ committed |
| `landing/evaluator.html` — 30-min institutional evaluation guide | ✅ committed |
| `landing/partners.html` — rebuilt with dark theme + nav | ✅ committed |
| `landing/og-image.png` — OG social share image | ✅ committed |
| `.github/workflows/pages.yml` — rewritten to inject landing pages at deploy time | ✅ committed |
| Dead `/privacy` link fixed → `docs/PRIVACY_POLICY.md` | ✅ committed |
| Dead `/docs` links fixed across all landing pages | ✅ committed |
| Dead `proof_walkthrough.webm` in `docs/index.html` replaced | ✅ committed |
| `landing/ab-test-variations.json` deleted | ✅ committed |
| `GETTING_STARTED.md` rewritten with proof flow | ✅ committed |
| `README.md` — false npx claim and dead video link removed | ✅ committed |

---

## What Still Needs To Be Done

### 1. Record and publish the proof demo video

Use:
```
docs/DEMO_VIDEO_STORYBOARD.md
```

Target: 3-5 minute screencast showing setup, backup export, app-data wipe, restore, and hardware-signature verification.

### 2. Update "Watch Proof Demo" CTA after upload

File:
```
landing/index.html
```

Replace the current placeholder `#demo` link with the final hosted video URL.

### 3. Merge branch to master (after CI passes)

`master` is protected and requires 4 status checks. Open a PR:
```
https://github.com/Z3r0DayZion-install/NeuralShell/compare/master...synced/master-2026-04-03
```

Wait for CI to pass, then merge. This is for long-term hygiene.

### 4. (Optional) Archive or trim this handoff doc

Most deployment steps in this file are complete; keep only ongoing operational notes if needed.

---

### 5. DNS records in Namecheap (reference)

The user is on Namecheap with `getneuralshell.com` active.

**In Namecheap → Advanced DNS:**

Delete these if they still exist:
- CNAME `www` → `parkingpage.namecheap.com`
- URL Redirect `@` → `http://www.getneuralshell.com`

Add these (keep the existing TXT record — it's domain verification):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME Record | `www` | `z3r0dayzion-install.github.io.` | Automatic |

Save all changes. Propagation is typically 5–30 minutes.

---

## How the Deploy Pipeline Works

```
landing/*.html    ──┐
landing/og-image.png │
proof/ dir           │  pages.yml build step
screenshots/ dir  ───┤  (sed rewrites ../docs/ → absolute paths)
docs/ (existing)  ───┘
        │
        ▼
  _site/ folder (in CI, deploy root)
        │
        ├── index.html          ← landing/index.html (rewritten)
        ├── proof.html          ← landing/proof.html (rewritten)
        ├── pricing.html        ← landing/pricing.html (rewritten)
        ├── onboarding.html     ← landing/onboarding.html (rewritten)
        ├── evaluator.html      ← landing/evaluator.html (rewritten)
        ├── partners.html       ← landing/partners.html (rewritten)
        ├── og-image.png
        ├── CNAME               ← "getneuralshell.com" injected at build time
        ├── proof/              ← copied from repo root
        ├── screenshots/        ← copied from repo root
          └── docs/*              ← copied from repo docs/
        │
        ▼
  GitHub Pages artifact upload → deploy
        │
        ▼
        getneuralshell.com  (live)
```

---

## URL Map (post-deploy)

| URL | Source file |
|-----|-------------|
| `getneuralshell.com/` | `landing/index.html` |
| `getneuralshell.com/proof.html` | `landing/proof.html` |
| `getneuralshell.com/pricing` | `landing/pricing.html` |
| `getneuralshell.com/onboarding` | `landing/onboarding.html` |
| `getneuralshell.com/evaluator` | `landing/evaluator.html` |
| `getneuralshell.com/partners` | `landing/partners.html` |
| `getneuralshell.com/docs/` | `docs/index.html` (operator docs) |
| `getneuralshell.com/docs/PRIVACY_POLICY.md` | `docs/PRIVACY_POLICY.md` |

---

## Key Files Reference

```
.github/workflows/pages.yml     ← deploy pipeline (modified)
landing/index.html              ← primary marketing landing page
landing/proof.html              ← hardware-binding verification scenarios
landing/pricing.html            ← pricing page
landing/onboarding.html         ← getting started / setup guide
landing/evaluator.html          ← 30-min institutional eval guide
landing/partners.html           ← partner program page
docs/index.html                 ← operator docs hub (served at /docs/)
docs/PRIVACY_POLICY.md          ← privacy policy (linked from footer)
docs/outreach-tracker.csv       ← Wave 1 outreach contacts tracker
GETTING_STARTED.md              ← updated with proof flow step
README.md                       ← updated, false claims removed
INSTALL.md                      ← updated trust artifact links
```

---

## Guardrails

- **Do not edit outreach sequences, copy, or targeting** — Wave 1 outreach is frozen
- **Do not revert the landing page copy** — reliability/hardware-binding positioning is intentional
- **Do not touch `docs/outreach-tracker.csv`** — active campaign tracking
- The pre-push gate can be bypassed with `$env:NEURAL_SKIP_PREPUSH="1"` — use only for non-src commits (docs, landing, CI)

---

## One Remaining Manual Item (not code)

**Record the demo video** per `docs/DEMO_VIDEO_STORYBOARD.md`. Once uploaded, update the `Watch Demo` button in `landing/index.html` with the real URL. The button currently points to `#demo` as a placeholder.
