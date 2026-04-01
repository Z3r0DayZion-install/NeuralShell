# Board Reporting Pack

Generate a board/investor-ready operating report from local metrics bundles.

## Command
```bash
node scripts/gen_board_pack.cjs --input analytics/board/sample_metrics_bundle.json
```

Optional:
- `--previous <path>` to compare against a specific prior bundle.
- `--output-root <dir>` to control output path.

## Output
A timestamped folder under `release/board-pack/`:
- `board-report.md`
- `board-report.json`
- `board-report.html`
- `board-report.pdf` (or `board-report.pdf.fallback.txt` if PDF engine unavailable)
- `manifest.json`
- `<folder>.zip`
