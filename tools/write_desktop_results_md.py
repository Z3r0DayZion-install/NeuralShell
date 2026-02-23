#!/usr/bin/env python3
"""
write_desktop_results_md.py

Creates a Markdown summary of the Dual Scan Extractor outputs on the Desktop.
Python stdlib only.
"""

from __future__ import annotations

import json
import os
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"


def _read_first_lines(path: Path, n: int) -> str:
    lines = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for _ in range(n):
            line = f.readline()
            if not line:
                break
            lines.append(line.rstrip("\n"))
    return "\n".join(lines)


def _scan_all_messages_jsonl(path: Path) -> Dict[str, Any]:
    total = 0
    speaker_counts = Counter()
    earliest: Optional[str] = None
    latest: Optional[str] = None
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            total += 1
            speaker = rec.get("speaker") or "unknown"
            speaker_counts[speaker] += 1
            ts = rec.get("timestamp")
            if isinstance(ts, str) and ts:
                if earliest is None or ts < earliest:
                    earliest = ts
                if latest is None or ts > latest:
                    latest = ts
    return {
        "total_messages": total,
        "speaker_counts": dict(speaker_counts),
        "earliest_timestamp": earliest,
        "latest_timestamp": latest,
    }


def _count_jsonl_rows(path: Path) -> int:
    n = 0
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.strip():
                n += 1
    return n


def _track_a_tag_counts(path: Path) -> Dict[str, int]:
    c = Counter()
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            tag = rec.get("tag") or "UNKNOWN"
            c[tag] += 1
    return dict(c)


def _read_modules(path: Path) -> Tuple[int, list[tuple[str, int]]]:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        data = json.load(f)
    items = []
    if isinstance(data, dict):
        for name, meta in data.items():
            mentions = 0
            if isinstance(meta, dict):
                mentions = int(meta.get("mentions", 0) or 0)
            items.append((name, mentions))
    items.sort(key=lambda kv: (-kv[1], kv[0].lower()))
    return len(items), items[:15]


def _count_edges_csv_rows(path: Path) -> int:
    # header + rows
    n = 0
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if line.strip():
                n += 1
    return max(0, n - 1)


def main() -> int:
    desktop = Path.home() / "Desktop"
    if not desktop.exists():
        desktop = Path.home()

    out_md = desktop / "NeuralScan_DualScan_Results.md"

    required = {
        "all_messages.jsonl": OUT_DIR / "all_messages.jsonl",
        "kw_hits.json": OUT_DIR / "kw_hits.json",
        "path_hits.json": OUT_DIR / "path_hits.json",
        "cmd_hits.json": OUT_DIR / "cmd_hits.json",
        "track_a_raw.jsonl": OUT_DIR / "track_a_raw.jsonl",
        "track_a_dossier.md": OUT_DIR / "track_a_dossier.md",
        "tear_exe_parity_checklist.md": OUT_DIR / "tear_exe_parity_checklist.md",
        "empire_modules.json": OUT_DIR / "empire_modules.json",
        "empire_edges.csv": OUT_DIR / "empire_edges.csv",
        "empire_map.md": OUT_DIR / "empire_map.md",
        "REALITY_SPLIT_SUMMARY.md": OUT_DIR / "REALITY_SPLIT_SUMMARY.md",
        "README_RERUN.md": OUT_DIR / "README_RERUN.md",
        "NeuralScan_Package.zip": OUT_DIR / "NeuralScan_Package.zip",
    }

    missing = [name for name, path in required.items() if not path.exists()]
    if missing:
        raise SystemExit(f"ERROR: missing outputs: {', '.join(missing)}")

    scan_stats = _scan_all_messages_jsonl(required["all_messages.jsonl"])
    track_a_hits = _count_jsonl_rows(required["track_a_raw.jsonl"])
    track_a_tags = _track_a_tag_counts(required["track_a_raw.jsonl"])
    module_count, top_modules = _read_modules(required["empire_modules.json"])
    edge_count = _count_edges_csv_rows(required["empire_edges.csv"])

    now = datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")

    out_lines: list[str] = []
    out_lines.append("# NeuralScan Dual Scan Extractor — Results\n")
    out_lines.append(f"- Generated: `{now}`\n")
    out_lines.append(f"- Repo: `{ROOT}`\n")
    out_lines.append(f"- Input archive: `C:\\\\mnt\\\\data\\\\merged_conversations.json.gz` (aka `/mnt/data/merged_conversations.json.gz`)\n")
    out_lines.append("\n")

    out_lines.append("## Commands Run\n")
    out_lines.append("```text\n")
    out_lines.append("python tools\\scan_archive.py /mnt/data/merged_conversations.json.gz\n")
    out_lines.append("python tools\\index_keywords.py\n")
    out_lines.append("python tools\\extract_track_a.py\n")
    out_lines.append("python tools\\extract_track_b.py\n")
    out_lines.append("```\n\n")

    out_lines.append("## Key Stats\n")
    out_lines.append(f"- total_messages: `{scan_stats['total_messages']}`\n")
    out_lines.append(f"- speaker_counts: `{scan_stats['speaker_counts']}`\n")
    out_lines.append(f"- earliest_timestamp: `{scan_stats['earliest_timestamp']}`\n")
    out_lines.append(f"- latest_timestamp: `{scan_stats['latest_timestamp']}`\n")
    out_lines.append(f"- track_a_hits_total: `{track_a_hits}`\n")
    out_lines.append(f"- track_a_tag_counts: `{track_a_tags}`\n")
    out_lines.append(f"- modules_detected: `{module_count}`\n")
    out_lines.append(f"- edges_detected: `{edge_count}`\n")
    out_lines.append("\n")

    out_lines.append("## Top Modules (by mentions)\n")
    for name, mentions in top_modules:
        out_lines.append(f"- {name}: `{mentions}`\n")
    out_lines.append("\n")

    out_lines.append("## Output Files (`out/`)\n")
    for name, path in required.items():
        if path.suffix.lower() == ".zip":
            size = path.stat().st_size
            out_lines.append(f"- `{path}` ({size} bytes)\n")
        else:
            out_lines.append(f"- `{path}`\n")
    out_lines.append("\n")

    out_lines.append("## Track A Dossier (first 20 lines)\n")
    out_lines.append("```md\n")
    out_lines.append(_read_first_lines(required["track_a_dossier.md"], 20))
    out_lines.append("\n```\n\n")

    out_lines.append("## Empire Map (first 20 lines)\n")
    out_lines.append("```md\n")
    out_lines.append(_read_first_lines(required["empire_map.md"], 20))
    out_lines.append("\n```\n\n")

    out_lines.append("## Re-run Instructions\n")
    out_lines.append(_read_first_lines(required["README_RERUN.md"], 200))
    out_lines.append("\n")

    with open(out_md, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(out_lines))

    print(f"WROTE: {out_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

