# NeuralShell Channel Submission Playbook (V2.0-RC-Final)

Current as of `2026-03-10`.

This is the operator plan for listing `NeuralShell` on software directories, launch platforms, and package channels without inventing assets that do not exist.

## Current Asset Inventory

Existing assets:
- Product name: `NeuralShell`
- Publisher string in package metadata: `NeuralShell Team`
- Version: `V2.0-RC-Final`
- Core description: `NeuralShell is an Electron workstation with strict IPC validation, offline-first defaults, and release provenance gates.`
- Repo / product page: `https://github.com/Z3r0DayZion-install/NeuralShell`
- Release page: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/V2.0-RC-Final`
- Beta thread: `https://github.com/Z3r0DayZion-install/NeuralShell/issues/34`
- Intake / support: `https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose`
- Published Windows installer: `https://github.com/Z3r0DayZion-install/NeuralShell/releases/download/V2.0-RC-Final/NeuralShell.Setup.V2.0-RC-Final.exe`
- Published installer SHA-256: `BE174A1C14B0FF0CDEA85AE865DD020CEAEE359903073FDBD723AF22ED560E61`
- Local Windows build artifact: `dist/NeuralShell Setup V2.0-RC-Final.exe`
- App icons:
  - `assets/icon.ico`
  - `assets/icon.png`
  - `assets/icon-512.png`
  - `assets/icon.icns`
- Microsoft Store screenshot set:
  - `release/store-assets/microsoft-store/V2.0-RC-Final/`
  - `release/store-assets/microsoft-store/V2.0-RC-Final/manifest.json`
- Public launch site source:
  - `docs/index.html`
  - `docs/site.css`
  - `.github/workflows/pages.yml`
- Press/social assets:
  - `docs/site-assets/og-card.png`
  - `docs/site-assets/asset-manifest.json`
- Release proof files:
  - `release/checksums.txt`
  - `release/status.json`
  - `release/manifest.json`
  - `release/signature-verification.json`
- License file:
  - `LICENSE`
- Privacy policy:
  - `docs/PRIVACY_POLICY.md`

Missing assets:
- No standalone landing page on a custom domain.
- No promo video.
- No Linux packaging metadata for `Flathub` or `Snap`.

## Priority Order

| Priority | Channel | Status | Main blocker | Submit path |
|---|---|---|---|---|
| 1 | WinGet | Submitted | Await maintainer review on PR `#346920` | `https://learn.microsoft.com/en-us/windows/package-manager/package/repository` |
| 2 | Microsoft Store | Ready for manual submission | Need Partner Center account / reserved name / manual submit | `https://learn.microsoft.com/en-us/windows/apps/publish/faq/submit-your-app` |
| 3 | Uneed | Ready once account exists | Need account and manual listing submit | `https://www.uneed.best/submit-a-tool` |
| 4 | Peerlist Launchpad | Partially ready | Need verified Peerlist profile and launch-day prep | `https://help.peerlist.io/individual/launchpad/how-to-launch-a-project-on-peerlist-launchpad` |
| 5 | SourceForge | Ready if positioned as open source | Need project page setup | `https://sourceforge.net/create/` |
| 6 | GetApp / Capterra | Weak-fit but possible | B2B positioning and stronger public website help | `https://www.getapp.com/listing_guidelines/` |
| 7 | BetaList | Blocked | Requires own domain landing page | `https://betalist.com/criteria` |
| 8 | Flathub | Blocked | Need Flatpak packaging | `https://docs.flathub.org/docs/for-app-authors/submission` |
| 9 | Snap Store | Blocked | Need Snap packaging | `https://documentation.ubuntu.com/snapcraft/stable/how-to/publishing/register-a-snap/` |
| Skip | G2 | Do not submit yet | G2 does not accept beta products | `https://help.g2.com/hc/en-us/articles/4409279459348-How-do-I-add-a-product-on-the-G2-site` |

## Channel Checklists

### 1. WinGet

Current status:
- Generated manifest set exists and passes local `winget validate`.
- Published asset name is `NeuralShell.Setup.V2.0-RC-Final.exe`.
- Local install test from manifest passed.
- Upstream PR is open: `https://github.com/microsoft/winget-pkgs/pull/346920`

Next step:
1. Watch the PR for bot or maintainer comments.
2. Apply any schema or metadata changes requested during review.

Use:
- Copy bank section: `WinGet`
- Proof artifacts: `release/checksums.txt`, `release/status.json`

### 2. Microsoft Store

Use when:
- You want Windows discovery and a cleaner install surface.

Before submitting:
1. Reserve the app name.
2. Choose the `EXE/MSI` submission path.
3. Upload at least 4 screenshots.
4. Add support URL and privacy text or privacy URL.
5. Use the long description from the copy bank.

Current status:
- Screenshot set generated in `release/store-assets/microsoft-store/V2.0-RC-Final/`
- Public privacy policy URL is available through the GitHub repo.
- Submission copy packet is ready.

Current blocker:
- Manual Partner Center submission still needs to be completed.

Use:
- Copy bank section: `Microsoft Store`
- Icons: `assets/icon.ico`, `assets/icon-512.png`
- Screenshot set: `release/store-assets/microsoft-store/V2.0-RC-Final/`
- Submission packet: `docs/pilots/MICROSOFT_STORE_SUBMISSION_PACKET_V2.0-RC-Final.md`

### 3. Peerlist Launchpad

Use when:
- You want builder and dev audience attention.

Before submitting:
1. Verify the Peerlist profile.
2. Prepare launch copy and comments in advance.
3. Launch on Monday.

Current blocker:
- Verified profile required.

Use:
- Copy bank section: `Peerlist`
- Launch packet: `docs/pilots/PEERLIST_LAUNCH_PACKET_V2.0-RC-Final.md`

### 4. Uneed

Use when:
- You want indie-product discovery and a simple launch loop.

Before submitting:
1. Create an account.
2. Upload logo and screenshots.
3. Paste the one-line and long description from the copy bank.

Current blocker:
- Need account and manual listing submission.

Use:
- Copy bank section: `Uneed`
- Submission packet: `docs/pilots/UNEED_SUBMISSION_PACKET_V2.0-RC-Final.md`

### 5. SourceForge

Use when:
- You want an open-source directory and download page.

Before submitting:
1. Confirm the project is positioned as open source.
2. Create the project.
3. Use the repo, release, and support links from the copy bank.

Current blocker:
- No dedicated SourceForge project page exists yet.

Use:
- Copy bank section: `SourceForge`
- License file: `LICENSE`
- Submission packet: `docs/pilots/SOURCEFORGE_SUBMISSION_PACKET_V2.0-RC-Final.md`

### 6. GetApp / Capterra

Use when:
- You are willing to frame the product as B2B software for technical teams.

Current state:
- `Capterra` manual packet already exists:
  - `docs/pilots/CAPTERRA_LISTING_SUBMISSION_PACKET_V2.0-RC-Final.md`

Before submitting:
1. Use the B2B short and long descriptions from the copy bank.
2. Keep category language focused on developer teams and operators.
3. Expect better results once there is a standalone site with a public CTA.

Current blocker:
- GitHub repo works as a public page, but a custom-domain landing page would materially improve acceptance.

### 7. BetaList

Do not spend time here yet.

Blocker:
- BetaList requires a proper website and rejects free-hosting style setups and direct app-store-only submissions.

Unlock condition:
- Ship a real landing page on a custom domain first.

### 8. Flathub

Do later if Linux distribution matters.

Blocker:
- No Flatpak packaging or Flathub submission repo exists yet.

### 9. Snap Store

Do later if Linux distribution matters.

Blocker:
- No Snap packaging exists yet.

## Screenshot Shot List

Generated screenshot set:
1. `01-onboarding-safe-defaults.png`
2. `02-main-workspace.png`
3. `03-session-management.png`
4. `04-settings-and-profiles.png`
5. `05-runtime-and-integrity.png`
6. `06-command-palette.png`

Recommended upload order for store-style channels:
1. `02-main-workspace.png`
2. `03-session-management.png`
3. `04-settings-and-profiles.png`
4. `05-runtime-and-integrity.png`
5. `01-onboarding-safe-defaults.png`
6. `06-command-palette.png`

Recommended sizes:
- Square logo: use `assets/icon-512.png`
- Windows icon: use `assets/icon.ico`
- Social/share card: use `docs/site-assets/og-card.png`

## Recommended Sequence

1. Submit to `Microsoft Store` with the generated screenshot set.
2. Monitor `WinGet` PR `#346920` and respond to review comments.
3. Submit to `Uneed` using the same screenshot set and copy bank.
4. Finish the `Capterra` form if it is still incomplete.
5. Launch on `Peerlist`.
6. Prepare a lightweight landing page on a custom domain.
7. Revisit `BetaList` only after the landing page is live.

## Official Sources

- WinGet repository: `https://learn.microsoft.com/en-us/windows/package-manager/package/repository`
- WinGet manifest docs: `https://learn.microsoft.com/en-us/windows/package-manager/package/manifest`
- Microsoft Store submission FAQ: `https://learn.microsoft.com/en-us/windows/apps/publish/faq/submit-your-app`
- Microsoft Store listing docs: `https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-store-listing`
- Peerlist Launchpad guide: `https://help.peerlist.io/individual/launchpad/how-to-launch-a-project-on-peerlist-launchpad`
- Peerlist Launchpad FAQ: `https://help.peerlist.io/individual/launchpad/guidelines-faqs`
- Uneed submit page: `https://www.uneed.best/submit-a-tool`
- BetaList criteria: `https://betalist.com/criteria`
- BetaList submit page: `https://betalist.com/submit`
- GetApp listing guidelines: `https://www.getapp.com/listing_guidelines/`
- Flathub submission docs: `https://docs.flathub.org/docs/for-app-authors/submission`
- Snapcraft publish docs: `https://documentation.ubuntu.com/snapcraft/stable/how-to/publishing/register-a-snap/`
- SourceForge project creation: `https://sourceforge.net/create/`
- G2 add-product policy: `https://help.g2.com/hc/en-us/articles/4409279459348-How-do-I-add-a-product-on-the-G2-site`
