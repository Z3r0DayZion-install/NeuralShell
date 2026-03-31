# Pre-Checkout Fixes — Current State

**Date:** 2026-03-30  
**Status:** Active baseline locked

---

## Price Consistency

**Locked value:** $149

Verified in key buyer-facing surfaces:

- `docs/sales/pricing-page.html`
- `docs/sales/operator-offer-page.md`
- `docs/sales/operator-buyer-faq.md`
- `docs/sales/post-purchase-instructions.md`
- launch and checkout checklists

Rule: do not change one surface without updating all sales surfaces.

---

## Checkout Strategy

**Primary checkout:** Gumroad  
**URL:** https://gumroad.com/l/neuralshell-operator

Rationale:

- one clear path reduces launch friction
- cleaner operational support loop for first sales
- faster issue triage during early adopter window

Stripe is deferred until baseline conversion and support flow stabilize.

---

## Delivery and Support Baseline

- Post-purchase instructions now use Gumroad-first flow
- Support path is explicit on all core pages: support@neuralshell.app
- Refund path language is present in core buyer docs

---

## What To Re-Verify Before Each Traffic Push

1. Pricing page CTA opens Gumroad URL
2. Product still shows $149
3. Receipt and next-step delivery are clear
4. Support inbox is monitored
5. Refund path remains explicit

Use: `docs/sales/checkout-verification-checklist.md`

---

## Operational Guardrail

No split primary checkout paths during first-launch window.

Hold this line until you have real buyer data to justify experiments.
