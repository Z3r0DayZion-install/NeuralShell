# NeuralShell CLI Usage

## `npx neuralshell-installer`

Install the latest tagged build for your OS:

```bash
npx neuralshell-installer
```

Install with operator mode enabled:

```bash
npx neuralshell-installer --license-key YOUR_KEY
```

Metadata-only dry run:

```bash
npx neuralshell-installer --dry-run
```

## `npx neuralshell-badge`

Generate a locked proof badge from your checksum manifest:

```bash
npx neuralshell-badge --manifest dist/SHA256SUMS.txt --svg-output release/proof_badge.svg
```

Append the badge markdown block to a README:

```bash
npx neuralshell-badge --manifest dist/SHA256SUMS.txt --output readme --readme README.md --badge-url https://raw.githubusercontent.com/<owner>/<repo>/badges/proof_badge.svg
```

Default behavior:

- `--manifest` defaults to `dist/SHA256SUMS.txt`
- `--svg-output` defaults to `release/proof_badge.svg`
- `--output readme` updates README instead of writing an SVG

## Founder teaser GIF

Generate GIF derivatives from the walkthrough video:

```bash
npm run record:demo:gif:copy
```

This writes:

- `static/video/proof_walkthrough.gif`
- `docs/static/video/proof_walkthrough.gif`

## Package publish tags

Git tags that trigger package publishing workflow:

- `installer/<any>` publishes `neuralshell-installer`
- `badge/<any>` publishes `neuralshell-badge`
