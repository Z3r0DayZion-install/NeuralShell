#!/usr/bin/env python3
"""
index_keywords.py

Reads out/all_messages.jsonl and produces:
- out/kw_hits.json    (keyword -> {count, samples})
- out/path_hits.json  (path -> {count, samples})
- out/cmd_hits.json   (kind -> {count, samples})

Python stdlib only; deterministic output.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"
IN_JSONL = OUT_DIR / "all_messages.jsonl"
KW_OUT = OUT_DIR / "kw_hits.json"
PATH_OUT = OUT_DIR / "path_hits.json"
CMD_OUT = OUT_DIR / "cmd_hits.json"


DEFAULT_KEYWORDS = [
    # Track A focused
    "NeuralShell",
    "TEAR",
    ".tear",
    "tear_runtime",
    "runtime_proof",
    "proof:runtime",
    "proof:spawn",
    "production-server.js",
    "/metrics",
    "metrics",
    "spawnProductionServer",
    "shutdown",
    "restart",
    "Electron",
    ".exe",
    "win-x64",
    "127.0.0.1",
    "localhost",
    # Track B seeds
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
]


CMD_LINE_RE = re.compile(
    r"^\s*(npm|node|python|py|git|curl|powershell|pwsh|cmd\.exe)\b(.*)$",
    re.IGNORECASE,
)


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


def _sample_append(samples: List[Dict[str, Any]], sample: Dict[str, Any], cap: int) -> None:
    if len(samples) >= cap:
        return
    samples.append(sample)


def main(argv: List[str]) -> int:
    if not IN_JSONL.exists():
        print(f"ERROR: missing {IN_JSONL}. Run tools/scan_archive.py first.", file=sys.stderr)
        return 2

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    kw_hits: Dict[str, Dict[str, Any]] = {k: {"count": 0, "samples": []} for k in DEFAULT_KEYWORDS}
    path_hits: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "samples": []})
    cmd_hits: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"count": 0, "samples": []})

    for rec in _read_jsonl(IN_JSONL):
        msg_id = rec.get("msg_id")
        ts = rec.get("timestamp")
        thread = rec.get("thread_title")
        speaker = rec.get("speaker")
        text = rec.get("text") or ""
        paths = rec.get("paths") or []

        sample = {"msg_id": msg_id, "timestamp": ts, "speaker": speaker, "thread_title": thread}

        text_l = text.lower()
        for kw in DEFAULT_KEYWORDS:
            if kw.lower() in text_l:
                kw_hits[kw]["count"] += 1
                _sample_append(kw_hits[kw]["samples"], sample, cap=200)

        if isinstance(paths, list):
            for p in paths:
                if not isinstance(p, str) or not p:
                    continue
                path_hits[p]["count"] += 1
                _sample_append(path_hits[p]["samples"], sample, cap=50)

        # Command lines.
        for line in text.splitlines():
            m = CMD_LINE_RE.match(line)
            if not m:
                continue
            kind = m.group(1).lower()
            cmd = (m.group(1) + m.group(2)).strip()
            cmd_hits[kind]["count"] += 1
            _sample_append(cmd_hits[kind]["samples"], {**sample, "cmd": cmd}, cap=200)

    # Deterministic ordering: sort paths by count desc then key.
    path_items = sorted(path_hits.items(), key=lambda kv: (-kv[1]["count"], kv[0].lower()))
    path_hits_sorted = {k: v for k, v in path_items}

    cmd_items = sorted(cmd_hits.items(), key=lambda kv: (-kv[1]["count"], kv[0].lower()))
    cmd_hits_sorted = {k: v for k, v in cmd_items}

    with open(KW_OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(kw_hits, f, ensure_ascii=False, sort_keys=True, indent=2)
        f.write("\n")
    with open(PATH_OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(path_hits_sorted, f, ensure_ascii=False, sort_keys=True, indent=2)
        f.write("\n")
    with open(CMD_OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(cmd_hits_sorted, f, ensure_ascii=False, sort_keys=True, indent=2)
        f.write("\n")

    nonzero_kw = sum(1 for k in DEFAULT_KEYWORDS if kw_hits[k]["count"] > 0)
    print("INDEX_KEYWORDS: OK")
    print(f"input: {IN_JSONL}")
    print(f"output: {KW_OUT}")
    print(f"output: {PATH_OUT}")
    print(f"output: {CMD_OUT}")
    print(f"keywords_total: {len(DEFAULT_KEYWORDS)}")
    print(f"keywords_nonzero: {nonzero_kw}")
    print(f"paths_unique: {len(path_hits_sorted)}")
    print(f"cmd_kinds: {len(cmd_hits_sorted)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

