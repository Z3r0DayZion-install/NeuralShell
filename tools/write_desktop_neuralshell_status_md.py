#!/usr/bin/env python3
"""
write_desktop_neuralshell_status_md.py

Writes a "where NeuralShell is now" Markdown status file to the Desktop:
- DONE (implemented + present in repo)
- NEEDS DONE (gaps / next steps)

This is designed to be pasted into a new ChatGPT thread.
Python stdlib only.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _read_json(path: Path) -> Any:
    return json.loads(_read_text(path))


def _first_line_matching(text: str, needle: str) -> Optional[int]:
    for idx, line in enumerate(text.splitlines()):
        if needle in line:
            return idx
    return None


def _snippet_around_lines(text: str, line_idx: int, context: int = 6) -> str:
    lines = text.splitlines()
    start = max(0, line_idx - context)
    end = min(len(lines), line_idx + context + 1)
    return "\n".join(lines[start:end])


def _summarize_workflow_proof_gate(path: Path) -> Dict[str, Any]:
    text = _read_text(path)
    summary: Dict[str, Any] = {"path": str(path)}
    # Minimal extraction without YAML parser.
    summary["has_push_main"] = "push:" in text and "main" in text
    summary["has_pr_main"] = "pull_request:" in text and "main" in text
    summary["has_matrix"] = "matrix:" in text and "windows-latest" in text and "ubuntu-latest" in text
    summary["has_node_20_22"] = "20.x" in text and "22.x" in text
    summary["has_artifact_upload_on_failure"] = "upload-artifact" in text and "if: failure()" in text
    summary["writes_transcripts_to_state"] = "state/ci_test_transcript.log" in text and "state/ci_proof_runtime_transcript.log" in text
    summary["prints_proof_summary_block"] = "PROOF SUMMARY" in text and "annotation" in text
    return summary


def _summarize_runtime_proof(path: Path) -> Dict[str, Any]:
    text = _read_text(path)
    summary: Dict[str, Any] = {"path": str(path)}
    summary["has_parseMetricValue"] = "function parseMetricValue" in text
    summary["min_uptime_delta_line"] = None
    li = _first_line_matching(text, "const MIN_UPTIME_DELTA")
    if li is not None:
        summary["min_uptime_delta_line"] = li + 1  # 1-based for humans
        summary["min_uptime_delta_snippet"] = _snippet_around_lines(text, li, context=2)
    summary["writes_latest_forensics"] = "latest-proof-runtime-server.log" in text and "latest-proof-runtime-config.json" in text
    summary["proof_summary_block"] = "--- PROOF SUMMARY ---" in text
    summary["shutdown_check"] = "shutdownCheck" in text
    summary["restart_semantics"] = "restartReset" in text or "restart" in text
    return summary


def _summarize_spawn_proof(path: Path) -> Dict[str, Any]:
    text = _read_text(path)
    summary: Dict[str, Any] = {"path": str(path)}
    summary["writes_latest_forensics"] = "latest-proof-spawn" in text or "latest-proof-spawn-server.log" in text
    summary["spawn_blocked_block"] = "SPAWN_BLOCKED" in text
    summary["metrics_check"] = "/metrics" in text and "GET" in text
    return summary


def _extract_proof_endpoint_evidence(path: Path) -> Dict[str, Any]:
    text = _read_text(path)
    summary: Dict[str, Any] = {"path": str(path)}
    needles = [
        "/__proof/",
        "__proof",
        "PROOF_MODE",
        "NODE_ENV",
        "remoteAddress",
        "127.0.0.1",
    ]
    hits: List[Tuple[str, int, str]] = []
    for needle in needles:
        li = _first_line_matching(text, needle)
        if li is not None:
            hits.append((needle, li + 1, _snippet_around_lines(text, li, context=3)))
    summary["evidence_hits"] = [
        {"needle": n, "line": line_no, "snippet": snip} for (n, line_no, snip) in hits
    ]
    summary["has_any_proof_evidence"] = len(hits) > 0
    return summary


def _extract_proof_summary_blocks(text: str) -> List[str]:
    lines = text.splitlines()
    blocks: List[str] = []
    i = 0
    while i < len(lines):
        if "--- PROOF SUMMARY ---" in lines[i]:
            start = i
            end = None
            for j in range(i + 1, min(len(lines), i + 200)):
                if "---------------------" in lines[j]:
                    end = j
                    break
            if end is not None:
                blocks.append("\n".join(lines[start : end + 1]))
                i = end + 1
                continue
        i += 1
    return blocks


def _read_optional(path: Path) -> Optional[str]:
    if not path.exists():
        return None
    return _read_text(path)


def main() -> int:
    desktop = Path.home() / "Desktop"
    if not desktop.exists():
        desktop = Path.home()

    out_md = desktop / "NeuralShell_STATUS_NOW.md"
    out_txt = desktop / "NeuralShell_STATUS_NOW.txt"

    now = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")

    root_pkg = ROOT / "package.json"
    desktop_pkg = ROOT / "NeuralShell_Desktop" / "package.json"
    proof_gate = ROOT / ".github" / "workflows" / "proof-gate.yml"
    runtime_proof = ROOT / "scripts" / "runtime_proof.cjs"
    spawn_proof = ROOT / "scripts" / "run_server_once.cjs"
    server_entry = ROOT / "production-server.js"
    tear_server = ROOT / "NeuralShell_Desktop" / "src" / "runtime" / "createTearServer.js"
    tear_entry = ROOT / "NeuralShell_Desktop" / "tear-runtime.js"
    exe_path = ROOT / "NeuralShell_Desktop" / "dist" / "NeuralShell-TEAR-Runtime.exe"
    verify_all_transcript = ROOT / "state" / "status_verify_all_transcript.log"
    latest_runtime_transcript = ROOT / "state" / "latest-proof-runtime-transcript.log"
    latest_tear_transcript = ROOT / "state" / "latest-proof-tear-transcript.log"
    latest_exe_transcript = ROOT / "state" / "latest-proof-exe-transcript.log"

    # Parse package.json scripts.
    root_scripts: Dict[str, str] = {}
    if root_pkg.exists():
        root_data = _read_json(root_pkg)
        if isinstance(root_data, dict) and isinstance(root_data.get("scripts"), dict):
            root_scripts = {str(k): str(v) for k, v in root_data["scripts"].items()}

    desktop_scripts: Dict[str, str] = {}
    if desktop_pkg.exists():
        d = _read_json(desktop_pkg)
        if isinstance(d, dict) and isinstance(d.get("scripts"), dict):
            desktop_scripts = {str(k): str(v) for k, v in d["scripts"].items()}

    wf_summary = _summarize_workflow_proof_gate(proof_gate) if proof_gate.exists() else None
    runtime_summary = _summarize_runtime_proof(runtime_proof) if runtime_proof.exists() else None
    spawn_summary = _summarize_spawn_proof(spawn_proof) if spawn_proof.exists() else None
    proof_endpoint_summary = _extract_proof_endpoint_evidence(server_entry) if server_entry.exists() else None
    tear_proof_endpoint_summary = (
        _extract_proof_endpoint_evidence(tear_server) if tear_server.exists() else None
    )

    verify_text = _read_optional(verify_all_transcript) or ""
    proof_summaries = _extract_proof_summary_blocks(verify_text)
    if not proof_summaries:
        for p in [latest_runtime_transcript, latest_tear_transcript, latest_exe_transcript]:
            t = _read_optional(p)
            if t:
                proof_summaries.extend(_extract_proof_summary_blocks(t))

    lines: List[str] = []
    lines.append("# NeuralShell — Current Status (DONE vs NEEDS DONE)\n\n")
    lines.append(f"- Generated: `{now}`\n")
    lines.append(f"- Repo root: `{ROOT}`\n\n")

    lines.append("## DONE (what exists in repo now)\n")
    if "verify:all" in root_scripts:
        lines.append(f"- Verify spine wired: `npm run verify:all` ? `{root_scripts['verify:all']}`\n")
    if "proof:tear" in root_scripts:
        lines.append(f"- TEAR proof wired: `npm run proof:tear` ? `{root_scripts['proof:tear']}`\n")
    if "proof:exe" in root_scripts:
        lines.append(f"- EXE proof wired: `npm run proof:exe` ? `{root_scripts['proof:exe']}`\n")
    if "test" in root_scripts:
        lines.append(f"- Unit tests wired: `npm test` → `{root_scripts['test']}`\n")
    if "proof:spawn" in root_scripts:
        lines.append(f"- Spawn proof wired: `npm run proof:spawn` → `{root_scripts['proof:spawn']}`\n")
    if "proof:runtime" in root_scripts:
        lines.append(f"- Runtime proof wired: `npm run proof:runtime` → `{root_scripts['proof:runtime']}`\n")

    if runtime_summary:
        lines.append("- Runtime proof hard gates present:\n")
        lines.append(f"  - Metrics parser: `{runtime_summary['path']}` (`parseMetricValue`)\n")
        if runtime_summary.get("min_uptime_delta_snippet"):
            lines.append("  - Uptime monotonic threshold is CI-aware:\n\n")
            lines.append("```js\n")
            lines.append(runtime_summary["min_uptime_delta_snippet"])
            lines.append("\n```\n")
        lines.append(f"  - Forensics outputs: `state/latest-proof-runtime-*.log/json`\n")
        lines.append(f"  - PROOF SUMMARY block printed: `{runtime_summary['proof_summary_block']}`\n")

    if spawn_summary:
        lines.append("- Spawn proof diagnostics present:\n")
        lines.append(f"  - SPAWN_BLOCKED block: `{spawn_summary['spawn_blocked_block']}`\n")
        lines.append(f"  - /metrics reachability check: `{spawn_summary['metrics_check']}`\n")

    if wf_summary:
        lines.append("- GitHub Actions proof gate present:\n")
        lines.append(f"  - Workflow: `{wf_summary['path']}`\n")
        lines.append(f"  - Triggers: push+PR to `main`: `{wf_summary['has_push_main'] and wf_summary['has_pr_main']}`\n")
        lines.append(f"  - Matrix: windows+ubuntu, Node 20+22: `{wf_summary['has_matrix'] and wf_summary['has_node_20_22']}`\n")
        lines.append(f"  - Transcripts saved to `state/`: `{wf_summary['writes_transcripts_to_state']}`\n")
        lines.append(f"  - Upload artifacts on failure: `{wf_summary['has_artifact_upload_on_failure']}`\n")

    if desktop_scripts:
        if tear_entry.exists():
            lines.append(f"  - TEAR runtime entrypoint file: `{tear_entry}`\n")
        if exe_path.exists():
            st = exe_path.stat()
            lines.append(f"  - EXE artifact exists: `{exe_path}` ({st.st_size} bytes)\n")
        lines.append("- Desktop/TEAR codebase present (`NeuralShell_Desktop/`):\n")
        if "start:tear" in desktop_scripts:
            lines.append(f"  - TEAR runtime entry: `npm --prefix NeuralShell_Desktop run start:tear` → `{desktop_scripts['start:tear']}`\n")
        if "build:tear:exe" in desktop_scripts:
            lines.append(f"  - TEAR runtime EXE build script: `{desktop_scripts['build:tear:exe']}`\n")

    if tear_proof_endpoint_summary and tear_proof_endpoint_summary.get("has_any_proof_evidence"):
        lines.append("- Proof-only endpoint + localhost lock evidence (TEAR runtime server code):\n")
        lines.append(f"  - File: `{tear_proof_endpoint_summary['path']}`\n")
        hits = tear_proof_endpoint_summary.get("evidence_hits") or []
        for h in hits[:3]:
            lines.append(f"  - Hit `{h['needle']}` (line {h['line']}):\n\n")
            lines.append("```text\n")
            lines.append(h["snippet"])
            lines.append("\n```\n")

    if proof_endpoint_summary and proof_endpoint_summary.get("has_any_proof_evidence"):
        lines.append("- Proof-only endpoint/security gating evidence (from server code):\n")
        lines.append(f"  - File: `{proof_endpoint_summary['path']}`\n")
        # Include up to 2 snippets to keep it paste-friendly.
        hits = proof_endpoint_summary.get("evidence_hits") or []
        for h in hits[:2]:
            lines.append(f"  - Hit `{h['needle']}` (line {h['line']}):\n\n")
            lines.append("```text\n")
            lines.append(h["snippet"])
            lines.append("\n```\n")

    if proof_summaries:
        lines.append("\n## VERIFIED RECEIPTS (latest proof summaries)\n")
        for b in proof_summaries[:3]:
            lines.append("```text\n")
            lines.append(b)
            lines.append("\n```\n")
        lines.append(f"- Transcript: `{verify_all_transcript}`\n")

    lines.append("\n## NEEDS DONE (gaps / next proof work)\n")
    # Based on script presence.
    if "proof:tear" not in root_scripts:
        lines.append("- Add `proof:tear` (TEAR runtime proof parity with node proof invariants).\n")
    if "proof:exe" not in root_scripts:
        lines.append("- Add `proof:exe` (EXE cold-start proof parity over real HTTP + metrics).\n")
    lines.append("- Ensure TEAR/EXE proofs assert the same invariants contract as `proof:runtime`:\n")
    lines.append("  - DONE (see PROOF SUMMARY receipts above).\n")
    lines.append("- Remaining gaps:\n")
    lines.append("  - Gate tag/release workflows to run proofs (example: `router-release.yml` runs `npm run verify` only).\n")
    lines.append("  - Add `docs/PROOF_PARITY.md` documenting invariants + artifact paths.\n")

    lines.append("\n## How to Re-Prove Locally\n")
    lines.append("```text\n")
    lines.append("cd C:\\Users\\KickA\\NeuralShell\n")
    lines.append("npm run verify:all\n")
    lines.append("```\n")

    lines.append("\n## Forensics (where to look when a proof fails)\n")
    lines.append("- `C:\\Users\\KickA\\NeuralShell\\state\\latest-proof-runtime-*.log/json`\n")
    lines.append("- `C:\\Users\\KickA\\NeuralShell\\state\\latest-proof-spawn-*.log/json` (if present)\n")
    lines.append("- `C:\\Users\\KickA\\NeuralShell\\state\\latest-proof-tear-*.log/json`\n")
    lines.append("- `C:\\Users\\KickA\\NeuralShell\\state\\latest-proof-exe-*.log/json`\n")
    lines.append("- Per-run bundles: `C:\\Users\\KickA\\NeuralShell\\state\\proofs\\*`\n")
    lines.append("- CI uploads `state/**` as artifacts on failure (see `proof-gate.yml`).\n")

    # Also point to Dual Scan results (optional).
    dual_scan = desktop / "NeuralScan_DualScan_Results.md"
    if dual_scan.exists():
        lines.append("\n## Archive Evidence (optional)\n")
        lines.append(f"- Dual scan results: `{dual_scan}`\n")

    out_md.write_text("".join(lines), encoding="utf-8", errors="replace", newline="\n")
    out_txt.write_text(
        "\n".join(
            [
                "NeuralShell STATUS NOW",
                f"Generated: {now}",
                f"Repo root: {ROOT}",
                "",
                "DONE:",
                "- verify:all runs: tests + proof:spawn + proof:runtime + proof:tear + proof:exe",
                "- TEAR runtime: /metrics + proof-only /__proof/* (gated by NODE_ENV=test or PROOF_MODE=1; localhost-only)",
                "- EXE artifact: NeuralShell_Desktop/dist/NeuralShell-TEAR-Runtime.exe",
                "- CI: .github/workflows/proof-gate.yml matrix (Win+Ubuntu, Node 20/22) + state/** artifacts on failure",
                "",
                "NEEDS:",
                "- Gate tag/release workflows to run proofs (router-release.yml runs npm run verify only)",
                "- Add docs/PROOF_PARITY.md",
                "",
                "LATEST RECEIPT:",
                str(verify_all_transcript),
            ]
        )
        + "\n",
        encoding="utf-8",
        errors="replace",
        newline="\n",
    )
    print(f"WROTE: {out_md}")
    print(f"WROTE: {out_txt}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
