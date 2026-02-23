#!/usr/bin/env python3
"""
extract_track_a.py

Track A (Surgical): NeuralShell + TEAR + EXE only.

Reads out/all_messages.jsonl and writes:
- out/track_a_raw.jsonl
- out/track_a_dossier.md
- out/tear_exe_parity_checklist.md

Rules:
- Every Track A claim must reference msg_id + timestamp and/or concrete file paths/commands present.
- Split VERIFIED vs INTENT clearly.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"
IN_JSONL = OUT_DIR / "all_messages.jsonl"

RAW_OUT = OUT_DIR / "track_a_raw.jsonl"
DOSSIER_OUT = OUT_DIR / "track_a_dossier.md"
PARITY_OUT = OUT_DIR / "tear_exe_parity_checklist.md"


@dataclass(frozen=True)
class KeywordSpec:
    label: str
    pattern: re.Pattern[str]
    anchor: bool = False


KEYWORD_SPECS: List[KeywordSpec] = [
    # Strong anchors (used to include message at all)
    KeywordSpec("NeuralShell", re.compile(r"\bNeuralShell\b", re.IGNORECASE), anchor=True),
    KeywordSpec("production-server.js", re.compile(r"\bproduction-server\.js\b", re.IGNORECASE), anchor=True),
    KeywordSpec("runtime_proof", re.compile(r"\bruntime_proof\b", re.IGNORECASE), anchor=True),
    KeywordSpec("proof:runtime", re.compile(r"\bproof:runtime\b", re.IGNORECASE), anchor=True),
    KeywordSpec("proof:spawn", re.compile(r"\bproof:spawn\b", re.IGNORECASE), anchor=True),
    KeywordSpec("spawnProductionServer", re.compile(r"\bspawnProductionServer\b", re.IGNORECASE), anchor=True),
    KeywordSpec("/metrics", re.compile(r"(^|[\s\"'])/metrics\b", re.IGNORECASE), anchor=True),
    KeywordSpec("neuralshell_* metric", re.compile(r"\bneuralshell_[a-z0-9_]+\b", re.IGNORECASE), anchor=True),
    KeywordSpec("PROOF_MODE", re.compile(r"\bPROOF_MODE\b", re.IGNORECASE), anchor=True),
    KeywordSpec(".tear", re.compile(r"\.tear\b", re.IGNORECASE), anchor=True),
    KeywordSpec("tear_runtime", re.compile(r"\btear_runtime\b", re.IGNORECASE), anchor=True),
    KeywordSpec("Electron", re.compile(r"\bElectron\b", re.IGNORECASE), anchor=True),
    KeywordSpec(".exe", re.compile(r"\.exe\b", re.IGNORECASE), anchor=True),
    KeywordSpec("win-x64", re.compile(r"\bwin-x64\b", re.IGNORECASE), anchor=True),
    # Non-anchor context keywords (only meaningful when an anchor hit exists)
    KeywordSpec("TEAR", re.compile(r"\bTEAR\b")),  # case-sensitive to avoid common-verb "tear"
    KeywordSpec("metrics", re.compile(r"\bmetrics\b", re.IGNORECASE)),
    KeywordSpec("runtime dir", re.compile(r"\bruntime dir\b", re.IGNORECASE)),
    KeywordSpec("launcher", re.compile(r"\blauncher\b", re.IGNORECASE)),
    KeywordSpec("HTML Kings", re.compile(r"\bHTML Kings\b", re.IGNORECASE)),
    KeywordSpec("hybrid", re.compile(r"\bhybrid\b", re.IGNORECASE)),
    KeywordSpec("local server", re.compile(r"\blocal server\b", re.IGNORECASE)),
    KeywordSpec("127.0.0.1", re.compile(r"\b127\.0\.0\.1\b")),
    KeywordSpec("localhost", re.compile(r"\blocalhost\b", re.IGNORECASE)),
    KeywordSpec("shutdown", re.compile(r"\bshutdown\b", re.IGNORECASE)),
    KeywordSpec("restart", re.compile(r"\brestart\b", re.IGNORECASE)),
    KeywordSpec("dry-run", re.compile(r"\bdry-?run\b", re.IGNORECASE)),
]

CMD_LINE_RE = re.compile(r"^\s*(npm|node|python|py|git|curl|powershell|pwsh|cmd\.exe)\b.*$", re.IGNORECASE)

# "VERIFIED_IMPL" markers: command output, logs, test results, explicit PASS/FAIL blocks.
EVIDENCE_MARKERS = [
    "Exit code:",
    "RESULT: PASS",
    "RESULT: FAIL",
    "84/84",
    "npm test",
    "proof:spawn",
    "proof:runtime",
    "GET /metrics",
    "PROOF SUMMARY",
    "*** Begin Patch",
    "diff --git",
    "uploaded artifact",
]


def _read_jsonl(path: Path) -> Iterable[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue


def _extract_commands(text: str) -> List[str]:
    out: List[str] = []
    for line in text.splitlines():
        if CMD_LINE_RE.match(line):
            out.append(line.strip())
    # cap & dedupe
    seen = set()
    dedup: List[str] = []
    for c in out:
        if c in seen:
            continue
        seen.add(c)
        dedup.append(c)
    return dedup[:25]


def _matches_keywords(text: str) -> List[str]:
    if not text:
        return []
    hits: List[str] = []
    for spec in KEYWORD_SPECS:
        if spec.pattern.search(text):
            hits.append(spec.label)
    return hits


def _has_anchor(text: str) -> bool:
    for spec in KEYWORD_SPECS:
        if spec.anchor and spec.pattern.search(text):
            return True
    return False


def _classify(text: str, paths: List[str], commands: List[str]) -> Tuple[str, List[str]]:
    markers: List[str] = []
    for m in EVIDENCE_MARKERS:
        if m.lower() in text.lower():
            markers.append(m)
    if markers:
        return "VERIFIED_IMPL", markers
    if paths or commands:
        return "VERIFIED_REF", markers
    return "INTENT", markers


def _snippet(text: str, max_len: int = 280) -> str:
    t = (text or "").replace("\n", " ").strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"


def _topic_bucket(hits: List[str], text: str) -> str:
    tl = text.lower()
    if "tear" in tl or ".tear" in tl or "tear_runtime" in tl:
        return "TEAR"
    if ".exe" in tl or "electron" in tl or "launcher" in tl or "win-x64" in tl:
        return "EXE"
    if "proof:runtime" in tl or "runtime_proof" in tl:
        return "RUNTIME_PROOF"
    if "proof:spawn" in tl or "spawnproductionserver" in tl:
        return "SPAWN"
    if "/metrics" in tl or "metrics" in tl:
        return "METRICS"
    if "shutdown" in tl or "ipc" in tl:
        return "SHUTDOWN"
    if "restart" in tl:
        return "RESTART"
    return "GENERAL"


def _write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> int:
    n = 0
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n")
            n += 1
    return n


def _format_ref(row: Dict[str, Any]) -> str:
    ts = row.get("timestamp") or "NO_TS"
    msg_id = row.get("msg_id") or "NO_ID"
    thread = row.get("thread_title") or ""
    return f"{ts} | {msg_id} | {thread}".strip()


def _collect_sections(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    """
    Returns: section_key -> {"VERIFIED": [...], "INTENT": [...]}
    """
    sections: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        "A": {"VERIFIED": [], "INTENT": []},
        "B": {"VERIFIED": [], "INTENT": []},
        "C": {"VERIFIED": [], "INTENT": []},
        "D": {"VERIFIED": [], "INTENT": []},
        "E": {"VERIFIED": [], "INTENT": []},
        "F": {"VERIFIED": [], "INTENT": []},
        "G": {"VERIFIED": [], "INTENT": []},
        "H": {"VERIFIED": [], "INTENT": []},
    }

    for r in rows:
        tag = r.get("tag")
        bucket = r.get("bucket")
        verified = tag in ("VERIFIED_IMPL", "VERIFIED_REF")
        key = "VERIFIED" if verified else "INTENT"

        if bucket == "GENERAL":
            sections["A"][key].append(r)
        elif bucket == "RUNTIME_PROOF":
            sections["B"][key].append(r)
        elif bucket == "METRICS":
            sections["C"][key].append(r)
        elif bucket in ("SPAWN", "SHUTDOWN", "RESTART"):
            sections["D"][key].append(r)
        elif bucket == "TEAR":
            sections["E"][key].append(r)
        elif bucket == "EXE":
            sections["F"][key].append(r)
        else:
            sections["A"][key].append(r)

    return sections


def _render_rows_md(rows: List[Dict[str, Any]], limit: int = 120) -> str:
    out_lines: List[str] = []
    for r in rows[:limit]:
        ref = _format_ref(r)
        snip = r.get("snippet") or ""
        paths = r.get("paths") or []
        cmds = r.get("commands") or []
        extra = []
        if paths:
            extra.append("paths=" + ", ".join(paths[:5]))
        if cmds:
            extra.append("cmds=" + "; ".join(cmds[:2]))
        extra_s = (" | " + " | ".join(extra)) if extra else ""
        out_lines.append(f"- {ref} :: {snip}{extra_s}")
    if len(rows) > limit:
        out_lines.append(f"- … ({len(rows) - limit} more)")
    return "\n".join(out_lines) + ("\n" if out_lines else "")


def _render_parity_checklist() -> str:
    return """# TEAR + EXE Proof Parity Checklist

This checklist is generated from the Track A invariants contract.

## Proof Targets
- `proof:node` (existing baseline)
- `proof:tear` (TEAR runtime proof must exist)
- `proof:exe` (EXE cold-start proof must exist)

## Required Invariants (same gates for all)
- Server listens on localhost and is reachable over real HTTP.
- `GET /metrics` returns `200` and `text/plain` (parseable Prometheus text format).
- `neuralshell_uptime_seconds` is monotonically increasing between two reads.
- Normal mode: `neuralshell_requests_total` exact delta matches deterministic request count.
- Normal mode: `neuralshell_failures_total` exact delta is `+1` (forced failure injection).
- Dry-run mode: `neuralshell_failures_total` exact delta is `+0` (even if requests move).
- Shutdown: after shutdown, `GET /metrics` becomes unreachable (connection refused / fetch error).
- Restart semantics: one hard-gated truth (preferred: counters reset to 0 on restart).
"""


def main(argv: List[str]) -> int:
    if not IN_JSONL.exists():
        print(f"ERROR: missing {IN_JSONL}. Run tools/scan_archive.py first.", file=sys.stderr)
        return 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    hits: List[Dict[str, Any]] = []
    for rec in _read_jsonl(IN_JSONL):
        text = rec.get("text") or ""
        if not _has_anchor(text):
            continue
        kw_hits = _matches_keywords(text)
        if not kw_hits:
            # Should be rare because anchors are also keywords; keep as guardrail.
            continue

        paths = rec.get("paths") or []
        if not isinstance(paths, list):
            paths = []

        commands = _extract_commands(text)
        tag, markers = _classify(text, paths, commands)
        bucket = _topic_bucket(kw_hits, text)

        row = {
            "msg_id": rec.get("msg_id"),
            "timestamp": rec.get("timestamp"),
            "thread_id": rec.get("thread_id"),
            "thread_title": rec.get("thread_title"),
            "speaker": rec.get("speaker"),
            "tag": tag,
            "bucket": bucket,
            "matched_keywords": kw_hits,
            "evidence_markers": markers,
            "paths": paths[:25],
            "commands": commands,
            "snippet": _snippet(text),
        }
        hits.append(row)

    # Deterministic ordering: by timestamp (None last), then seq-ish by msg_id.
    def _sort_key(r: Dict[str, Any]) -> Tuple[int, str, str]:
        ts = r.get("timestamp")
        ts_key = ts if isinstance(ts, str) else "9999-99-99T99:99:99Z"
        return (0, ts_key, r.get("msg_id") or "")

    hits_sorted = sorted(hits, key=_sort_key)
    _write_jsonl(RAW_OUT, hits_sorted)

    sections = _collect_sections(hits_sorted)

    # Hard gaps: derived only from missing VERIFIED evidence in TEAR/EXE buckets.
    gaps: List[str] = []
    if not sections["E"]["VERIFIED"]:
        gaps.append("No VERIFIED evidence found for TEAR runtime/proof artifacts in the archive.")
    if not sections["F"]["VERIFIED"]:
        gaps.append("No VERIFIED evidence found for EXE/Electron/launcher proof artifacts in the archive.")
    if not sections["B"]["VERIFIED"]:
        gaps.append("No VERIFIED evidence found for runtime proof execution/output in the archive.")

    dossier_lines: List[str] = []
    dossier_lines.append("# Track A Dossier (NeuralShell + TEAR + EXE)\n")
    dossier_lines.append("Legend: `VERIFIED` = evidence exists in archive text; `INTENT` = plan/narrative without evidence.\n")

    dossier_lines.append("## A) What NeuralShell is TODAY (VERIFIED)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["A"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["A"]["INTENT"]))

    dossier_lines.append("## B) Runtime Proof System (VERIFIED)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["B"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["B"]["INTENT"]))

    dossier_lines.append("## C) Metrics Contract & Invariants (VERIFIED)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["C"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["C"]["INTENT"]))

    dossier_lines.append("## D) Spawn/Windows Constraints (VERIFIED)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["D"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["D"]["INTENT"]))

    dossier_lines.append("## E) TEAR Format (VERIFIED vs INTENT)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["E"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["E"]["INTENT"]))

    dossier_lines.append("## F) Custom EXE Hybrid (VERIFIED vs INTENT)\n")
    dossier_lines.append("### VERIFIED\n")
    dossier_lines.append(_render_rows_md(sections["F"]["VERIFIED"]))
    dossier_lines.append("### INTENT\n")
    dossier_lines.append(_render_rows_md(sections["F"]["INTENT"]))

    dossier_lines.append("## G) Hard Gaps (evidence missing but required)\n")
    if gaps:
        for g in gaps:
            dossier_lines.append(f"- {g}\n")
    else:
        dossier_lines.append("- No hard gaps detected by evidence-density checks.\n")

    dossier_lines.append("## H) Next 10 build steps (TEAR + EXE proof parity)\n")
    next_steps = [
        "Define TEAR runtime entrypoint and start/stop contract.",
        "Implement `proof:tear runtime` to start TEAR runner and assert all invariants.",
        "Bundle EXE/Electron launcher that cold-starts the local server.",
        "Implement `proof:exe` to cold-start EXE and assert all invariants over HTTP.",
        "Ensure proof-only endpoints remain gated (env + localhost-only) across all targets.",
        "Ensure deterministic port selection (request port 0; parse bound port from logs).",
        "Standardize artifact paths for all proofs (config, server log, transcript).",
        "Add CI jobs to run TEAR+EXE proofs in matrix (OS x Node where applicable).",
        "Add failure forensics: last 120 lines + config dump on assertion failures.",
        "Add restart semantics gate (reset vs persistent) across all proof targets.",
    ]
    for i, step in enumerate(next_steps, start=1):
        dossier_lines.append(f"- {i}. {step}\n")

    with open(DOSSIER_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(dossier_lines))

    with open(PARITY_OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(_render_parity_checklist())

    print("EXTRACT_TRACK_A: OK")
    print(f"input: {IN_JSONL}")
    print(f"output: {RAW_OUT}")
    print(f"output: {DOSSIER_OUT}")
    print(f"output: {PARITY_OUT}")
    print(f"hits_total: {len(hits_sorted)}")
    print(f"hard_gaps: {len(gaps)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
