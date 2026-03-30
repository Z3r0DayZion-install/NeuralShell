# NeuralShell Storefront Sync Package

Generated: 2026-03-30 (America/Los_Angeles)  
Scope: Align Gumroad storefront with upgraded landing page tone, UI maturity, and proof-first trust flow.

## 1) Gumroad Screenshot Replacement Map
Current live Gumroad image inventory source:
- `docs/sales/gumroad-sync/gumroad-current-image-inventory.json`
- Product URL at capture time: `https://cashdominion.gumroad.com/l/neuralshell-operator`

| Existing Gumroad Image | Keep/Replace | Why | Replacement Asset | Source | Buyer-Flow Role |
|---|---|---|---|---|---|
| `https://public-files.gumroad.com/wskr9j9jk0ia896wvn62dlrgq62n` | Replace | Single legacy hero image is not enough for proof-first flow and does not show full launch-grade sequence. | `docs/sales/gumroad-sync/screenshots/gumroad-shot-01-hero-overview.png` | Fresh packaged UI capture (`screenshots/ui_sales_quickstart_packaged.png`) | Top-of-page premium overview |

## 2) Required New Gumroad Screenshot Set (Upload Order)
Use this exact order in Gumroad image carousel:

1. `docs/sales/gumroad-sync/screenshots/gumroad-shot-01-hero-overview.png`  
Job: premium product overview, first impression, interface quality signal.

2. `docs/sales/gumroad-sync/screenshots/gumroad-shot-02-main-workspace.png`  
Job: show active core workspace, not just a static product shot.

3. `docs/sales/gumroad-sync/screenshots/gumroad-shot-03-proof-verification.png`  
Job: show proof/verification surface to support evidence-first positioning.

4. `docs/sales/gumroad-sync/screenshots/gumroad-shot-04-lock-continuity.png`  
Job: show continuity/lock state and operational security posture.

5. `docs/sales/gumroad-sync/screenshots/gumroad-shot-05-operator-controls.png`  
Job: show operator-grade control surface and session-state restoration.

6. `docs/sales/gumroad-sync/screenshots/gumroad-shot-06-delivery-support-trust.png`  
Job: show delivery/support trust framing tied to post-purchase clarity.

## 3) Legacy Asset Kill List
Delete from Gumroad product media:

1. `https://public-files.gumroad.com/wskr9j9jk0ia896wvn62dlrgq62n`

If the Gumroad dashboard contains additional hidden/older images not currently rendered in live DOM, remove all non-`gumroad-shot-0X-*.png` assets during upload.

## 4) Gumroad Copy Revision Pack
Use this copy exactly (or verbatim with only markdown formatting changes).

### Title
`NeuralShell Operator`

### Subtitle / One-line Description
`Local-first AI operator shell with hardware-bound licensing, encrypted session continuity, and proof-linked checkout.`

### Short Description
`One one-time Operator license for one primary device. Built for users who verify runtime behavior before they trust a tool.`

### Long Description (Recommended Layout)
#### What this is
NeuralShell Operator is a local-first AI shell for users who need deterministic control over workflow execution and session continuity.

#### What you get
- Operator package access after purchase
- Install and activation guidance
- Proof and continuity flow access (proof/ROI + lock/unlock path)
- Support contact and refund route

#### Who this is for
- Users who evaluate software by observable runtime behavior
- Privacy-focused builders and operators
- Buyers who want one clear offer instead of pricing-tier noise

#### Who this is not for
- Casual cloud-chat-only usage
- Buyers expecting zero setup

#### After payment
1. Receive Gumroad receipt and access route
2. Install desktop build
3. Activate on one primary device
4. Run proof and continuity checks
5. Use support path if needed

#### Truth boundary
- Core operator paths are implementation-complete and test-backed
- Real-device verification is still in progress in some broader areas
- No certification claims are made

#### Support / refund
Support and refund handling: `support@neuralshell.app`

## 5) Manual Upload / Execution Instructions
1. Open Gumroad product editor for `neuralshell-operator`.
2. Delete all existing product images.
3. Upload the 6 screenshots from `docs/sales/gumroad-sync/screenshots/` in the exact order listed above.
4. Replace title/subtitle/description using section 4 copy.
5. Save and preview on desktop + mobile.
6. Confirm no old UI screenshots remain.

## 6) Storefront Parity Checklist
- [ ] Landing page uses upgraded premium UI hierarchy and polish
- [ ] Landing page has no public unfinished-state language
- [ ] Landing page proof section is curated and sequential
- [ ] Gumroad image carousel uses only the 6 new synced screenshots
- [ ] Gumroad copy matches landing page offer framing and truth boundary
- [ ] Both storefronts feel like the same product/version
- [ ] No unsupported claims appear in either storefront

## 7) Truth Audit (Landing + Gumroad)
- Pricing unchanged: `$149 one-time`
- Offer scope unchanged: single-device Operator framing
- Local-first, hardware-bound licensing, encrypted continuity language preserved
- No fake testimonials, no fake urgency, no certification claims added
- Proof-first claims only reference available report/screenshot assets
