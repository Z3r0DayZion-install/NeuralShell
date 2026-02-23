#!/usr/bin/env python3
"""
print_grep.py

Minimal grep-like helper (no external tools required).
Prints matching lines with line numbers and optional context.

Usage:
  python tools/print_grep.py <path> <substring> [context_lines]
"""

from __future__ import annotations

import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("Usage: python tools/print_grep.py <path> <substring...> [context_lines]", file=sys.stderr)
        return 2

    path = Path(argv[1])
    ctx = 0
    # Allow substring to include spaces: treat last arg as context if it's an int.
    if len(argv) >= 4:
        try:
            ctx = int(argv[-1])
            needle_parts = argv[2:-1]
        except Exception:
            needle_parts = argv[2:]
            ctx = 0
        if ctx < 0:
            ctx = 0
    else:
        needle_parts = argv[2:]

    needle = " ".join(needle_parts)

    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    hits = []
    for i, line in enumerate(lines):
        if needle in line:
            hits.append(i)

    printed = set()
    enc = sys.stdout.encoding or "utf-8"
    for hi in hits:
        start = max(0, hi - ctx)
        end = min(len(lines), hi + ctx + 1)
        for i in range(start, end):
            if i in printed:
                continue
            printed.add(i)
            prefix = ">" if i == hi else " "
            s = f"{prefix}{i+1:6d}: {lines[i]}\n"
            sys.stdout.buffer.write(s.encode(enc, errors="replace"))
        sys.stdout.buffer.write("\n".encode(enc, errors="replace"))

    if not hits:
        print("NO_MATCH")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
