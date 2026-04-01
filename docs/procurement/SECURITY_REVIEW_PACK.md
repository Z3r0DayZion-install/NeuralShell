# SECURITY_REVIEW_PACK

## Purpose

Generate a buyer-ready, security-review bundle from current local runtime truth.

## Outputs

- security questionnaire
- architecture one-pager
- deployment topology sheet
- data-flow declaration
- artifact inventory (hashes)
- compliance posture summary
- procurement FAQ
- delta since prior review

## Generator

```bash
npm run procurement:security-pack
```

Optional:

```bash
npm run procurement:security-pack -- --previous release/security-review-pack/<prev>/manifest.json
```

## Quality Rules

- no placeholder claims
- no secret exposure
- explicit artifact references and hashes
- version delta included for review continuity
