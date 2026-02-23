#!/usr/bin/env python3
"""
print_lines.py

Print a line range from a text file with 1-based line numbers.
Usage:
  python tools/print_lines.py <path> <start_line> <end_line>
"""

from __future__ import annotations

import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) != 4:
        print("Usage: python tools/print_lines.py <path> <start_line> <end_line>", file=sys.stderr)
        return 2

    path = Path(argv[1])
    try:
        start = int(argv[2])
        end = int(argv[3])
    except Exception:
        print("ERROR: start_line and end_line must be integers", file=sys.stderr)
        return 2

    if start < 1 or end < start:
        print("ERROR: invalid range", file=sys.stderr)
        return 2

    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    end = min(end, len(lines))
    enc = sys.stdout.encoding or "utf-8"
    for i in range(start - 1, end):
        s = f"{i+1:6d}: {lines[i]}\n"
        sys.stdout.buffer.write(s.encode(enc, errors="replace"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

