# Pilot Program Kit

Generate a ready-to-send enterprise pilot bundle with one command.

## Command
```bash
node scripts/gen_pilot_pack.cjs --customer "Acme Security Group" --industry "critical-infrastructure" --use-case "secure release verification" --logo "assets/pilot_kit/demo_customer_logo.txt"
```

## Output
The command creates a timestamped folder under `release/pilot-pack/` containing:
- Security overview
- Deployment guide
- Proof checklist
- ROI worksheet
- Support contact sheet
- Source docs (SOC2 prep, deployment, pilot checklist)
- Manifest

## Inputs
- `--customer`: customer/org name
- `--industry`: target industry
- `--use-case`: pilot objective
- `--logo`: local asset path
- `--output-root`: optional output base directory

## Source Assets
- Templates: `assets/pilot_kit/`
- Reused docs: `SOC2_PREP_REPORT.md`, `docs/deployment/enterprise.md`, `docs/pilots/PILOT_TESTER_CHECKLIST.md`
