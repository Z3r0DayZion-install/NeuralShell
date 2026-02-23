#!/usr/bin/env python3
"""
print_tail.py

Print the last N lines of a text file (stdlib only).
Usage:
  python tools/print_tail.py <path> <lines>
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python tools/print_tail.py <path> <lines>", file=sys.stderr)
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

    buf: deque[str] = deque(maxlen=n)
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            buf.append(line)

    enc = sys.stdout.encoding or "utf-8"
    for line in buf:
        sys.stdout.buffer.write(line.encode(enc, errors="replace"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

