#!/usr/bin/env python3
"""
extract_track_b.py

Track B (Wide): Neural Empire map (lightweight).

Reads out/all_messages.jsonl and writes:
- out/empire_modules.json
- out/empire_map.md
- out/empire_edges.csv

Also writes:
- out/REALITY_SPLIT_SUMMARY.md
- out/NeuralScan_Package.zip

Python stdlib only; deterministic outputs.
"""

from __future__ import annotations

import csv
import json
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"
IN_JSONL = OUT_DIR / "all_messages.jsonl"

MODULES_JSON = OUT_DIR / "empire_modules.json"
EDGES_CSV = OUT_DIR / "empire_edges.csv"
MAP_MD = OUT_DIR / "empire_map.md"
REALITY_MD = OUT_DIR / "REALITY_SPLIT_SUMMARY.md"
ZIP_OUT = OUT_DIR / "NeuralScan_Package.zip"
README_RERUN = OUT_DIR / "README_RERUN.md"

TRACK_A_RAW = OUT_DIR / "track_a_raw.jsonl"


SEED_MODULES = [
    "NeuralShell",
    "NeuralOS",
    "WinShadow",
    "NeuralTube",
    "HyperSnatch",
    "Mind Unset",
    "Obey",
    "Scamazon",
    "Snoozurp",
    "XXXplorer",
    "VIPN",
    "Neural Empire",
    "TEAR",
]

CAMEL_RE = re.compile(r"\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b")
NEURAL_TOKEN_RE = re.compile(r"\bNeural[A-Za-z0-9]+\b")


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


def _snippet(text: str, max_len: int = 180) -> str:
    t = (text or "").replace("\n", " ").strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"


def _normalize_module_name(name: str) -> str:
    name = name.strip()
    # collapse internal whitespace
    name = " ".join(name.split())
    return name


def _detect_modules(text: str) -> Set[str]:
    tl = text.lower()
    found: Set[str] = set()

    for seed in SEED_MODULES:
        if seed.lower() in tl:
            found.add(_normalize_module_name(seed))

    # Heuristics: Neural* tokens and CamelCase tokens containing "Neural".
    for m in NEURAL_TOKEN_RE.findall(text):
        found.add(_normalize_module_name(m))
    for m in CAMEL_RE.findall(text):
        if "neural" in m.lower():
            found.add(_normalize_module_name(m))

    # Safety: keep a reasonable cap (deterministic) to prevent runaway token capture.
    if len(found) > 50:
        found = set(sorted(found)[:50])
    return found


def _write_edges_csv(path: Path, edges: Dict[Tuple[str, str], int]) -> None:
    rows = sorted(((a, b, w) for (a, b), w in edges.items()), key=lambda r: (-r[2], r[0].lower(), r[1].lower()))
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source", "target", "weight"])
        for a, b, weight in rows:
            w.writerow([a, b, weight])


def _read_track_a_summary() -> Dict[str, Any]:
    """
    Minimal, evidence-backed summary from Track A raw hits if present.
    """
    if not TRACK_A_RAW.exists():
        return {"available": False}

    counts = defaultdict(int)
    topics = defaultdict(lambda: {"VERIFIED": [], "INTENT": []})
    for rec in _read_jsonl(TRACK_A_RAW):
        tag = rec.get("tag") or "INTENT"
        bucket = rec.get("bucket") or "GENERAL"
        counts[f"tag:{tag}"] += 1
        counts[f"bucket:{bucket}"] += 1
        ref = {
            "timestamp": rec.get("timestamp"),
            "msg_id": rec.get("msg_id"),
            "thread_title": rec.get("thread_title"),
            "snippet": rec.get("snippet"),
            "paths": rec.get("paths") or [],
        }
        if tag in ("VERIFIED_IMPL", "VERIFIED_REF"):
            if len(topics[bucket]["VERIFIED"]) < 8:
                topics[bucket]["VERIFIED"].append(ref)
        else:
            if len(topics[bucket]["INTENT"]) < 8:
                topics[bucket]["INTENT"].append(ref)

    return {"available": True, "counts": dict(counts), "topics": topics}


def _render_reality_split(modules_json: Dict[str, Any], track_a: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append("# REALITY SPLIT SUMMARY\n\n")
    lines.append("This file is generated from `out/all_messages.jsonl` (and Track A raw hits if available).\n\n")

    if track_a.get("available"):
        lines.append("## NeuralShell / TEAR / EXE (evidence density)\n")
        counts = track_a.get("counts", {})
        lines.append(f"- TrackA tags: { {k: v for k, v in sorted(counts.items()) if k.startswith('tag:')} }\n")
        lines.append(f"- TrackA buckets: { {k: v for k, v in sorted(counts.items()) if k.startswith('bucket:')} }\n\n")
        topics = track_a.get("topics", {})
        for bucket in ("GENERAL", "RUNTIME_PROOF", "METRICS", "SPAWN", "SHUTDOWN", "RESTART", "TEAR", "EXE"):
            if bucket not in topics:
                continue
            lines.append(f"### {bucket}\n")
            v = topics[bucket]["VERIFIED"]
            i = topics[bucket]["INTENT"]
            lines.append(f"- VERIFIED refs: {len(v)}\n")
            for r in v:
                lines.append(f"  - {r.get('timestamp') or 'NO_TS'} | {r.get('msg_id')} | {r.get('thread_title') or ''} :: {r.get('snippet')}\n")
            lines.append(f"- INTENT refs: {len(i)}\n")
            for r in i:
                lines.append(f"  - {r.get('timestamp') or 'NO_TS'} | {r.get('msg_id')} | {r.get('thread_title') or ''} :: {r.get('snippet')}\n")
            lines.append("\n")
    else:
        lines.append("## NeuralShell / TEAR / EXE\n")
        lines.append("- Track A raw evidence not found (`out/track_a_raw.jsonl` missing). Run `python tools/extract_track_a.py`.\n\n")

    lines.append("## Empire (top modules by mentions)\n")
    module_items = sorted(
        ((name, data.get("mentions", 0)) for name, data in modules_json.items()),
        key=lambda kv: (-kv[1], kv[0].lower()),
    )
    for name, mentions in module_items[:15]:
        lines.append(f"- {name}: mentions={mentions}\n")
    lines.append("\n")
    return "".join(lines)


def _render_empire_map(modules: Dict[str, Any], edges: Dict[Tuple[str, str], int]) -> str:
    lines: List[str] = []
    lines.append("# Neural Empire Wide Map (lightweight)\n\n")
    lines.append("Generated from message co-mentions; this is a mention graph, not a truth claim.\n\n")

    module_items = sorted(modules.items(), key=lambda kv: (-kv[1]["mentions"], kv[0].lower()))
    lines.append("## Modules (top by mentions)\n")
    for name, data in module_items[:50]:
        lines.append(f"- {name} :: mentions={data['mentions']}\n")
        for ref in data.get("recent_refs", [])[:3]:
            lines.append(
                f"  - {ref.get('timestamp') or 'NO_TS'} | {ref.get('msg_id')} | {ref.get('thread_title') or ''} :: {ref.get('snippet')}\n"
            )
    lines.append("\n")

    lines.append("## Edges (top co-mentions)\n")
    edge_rows = sorted(((a, b, w) for (a, b), w in edges.items()), key=lambda r: (-r[2], r[0].lower(), r[1].lower()))
    for a, b, w in edge_rows[:50]:
        lines.append(f"- {a} <-> {b} :: weight={w}\n")
    lines.append("\n")
    return "".join(lines)


def _write_readme() -> None:
    text = """# NeuralScan Package

Re-run steps (deterministic; Python stdlib only):

1) Normalize archive to JSONL:
   python tools/scan_archive.py /path/to/merged_conversations.json.gz

2) Build indexes:
   python tools/index_keywords.py

3) Track A dossier:
   python tools/extract_track_a.py

4) Track B empire map + package:
   python tools/extract_track_b.py
"""
    with open(README_RERUN, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def _write_zip() -> int:
    files: List[Path] = []
    # Include scripts.
    for p in sorted((ROOT / "tools").glob("*.py"), key=lambda x: x.name.lower()):
        files.append(p)
    # Include out/ artifacts.
    for p in sorted(OUT_DIR.glob("*"), key=lambda x: x.name.lower()):
        if p.name.lower().endswith(".zip"):
            continue
        files.append(p)

    count = 0
    with zipfile.ZipFile(ZIP_OUT, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for p in files:
            if not p.is_file():
                continue
            arc = str(p.relative_to(ROOT)).replace("\\", "/")
            z.write(p, arcname=arc)
            count += 1
    return count


def main() -> int:
    if not IN_JSONL.exists():
        print(f"ERROR: missing {IN_JSONL}. Run tools/scan_archive.py first.")
        return 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    modules: Dict[str, Dict[str, Any]] = {}
    edges: Dict[Tuple[str, str], int] = defaultdict(int)

    for rec in _read_jsonl(IN_JSONL):
        text = rec.get("text") or ""
        found = sorted(_detect_modules(text))
        if not found:
            continue

        ref = {
            "msg_id": rec.get("msg_id"),
            "timestamp": rec.get("timestamp"),
            "speaker": rec.get("speaker"),
            "thread_title": rec.get("thread_title"),
            "snippet": _snippet(text),
        }

        for name in found:
            if name not in modules:
                modules[name] = {"mentions": 0, "recent_refs": []}
            modules[name]["mentions"] += 1
            # Keep up to 10 most recent refs; deterministic by timestamp then msg_id.
            modules[name]["recent_refs"].append(ref)
            modules[name]["recent_refs"] = sorted(
                modules[name]["recent_refs"],
                key=lambda r: ((r.get("timestamp") or "0000"), r.get("msg_id") or ""),
                reverse=True,
            )[:10]

        # Co-mention edges within message.
        for i in range(len(found)):
            for j in range(i + 1, len(found)):
                a, b = found[i], found[j]
                if a == b:
                    continue
                key = (a, b) if a.lower() <= b.lower() else (b, a)
                edges[key] += 1

    # Deterministic module output ordering.
    modules_sorted = dict(sorted(modules.items(), key=lambda kv: (-kv[1]["mentions"], kv[0].lower())))
    with open(MODULES_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(modules_sorted, f, ensure_ascii=False, sort_keys=True, indent=2)
        f.write("\n")

    _write_edges_csv(EDGES_CSV, edges)
    with open(MAP_MD, "w", encoding="utf-8", newline="\n") as f:
        f.write(_render_empire_map(modules_sorted, edges))

    track_a = _read_track_a_summary()
    with open(REALITY_MD, "w", encoding="utf-8", newline="\n") as f:
        f.write(_render_reality_split(modules_sorted, track_a))

    _write_readme()
    zip_count = _write_zip()

    print("EXTRACT_TRACK_B: OK")
    print(f"input: {IN_JSONL}")
    print(f"output: {MODULES_JSON}")
    print(f"output: {EDGES_CSV}")
    print(f"output: {MAP_MD}")
    print(f"output: {REALITY_MD}")
    print(f"output: {README_RERUN}")
    print(f"output: {ZIP_OUT}")
    print(f"modules: {len(modules_sorted)}")
    print(f"edges: {len(edges)}")
    print(f"zip_files: {zip_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

