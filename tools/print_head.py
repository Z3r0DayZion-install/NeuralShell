#!/usr/bin/env python3
"""
print_head.py

Cross-platform, no-shell-deps way to print the first N lines of a text file.
"""

from __future__ import annotations

import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python tools/print_head.py <path> <lines>", file=sys.stderr)
        return 2

    path = Path(argv[1])
    try:
        n = int(argv[2])
    except Exception:
        print("ERROR: <lines> must be an integer", file=sys.stderr)
        return 2

    if n < 0:
        print("ERROR: <lines> must be >= 0", file=sys.stderr)
        return 2

    with open(path, "r", encoding="utf-8", errors="replace") as f:
        enc = sys.stdout.encoding or "utf-8"
        for i in range(n):
            line = f.readline()
            if not line:
                break
            sys.stdout.buffer.write(line.encode(enc, errors="replace"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
