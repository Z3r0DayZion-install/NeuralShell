#!/usr/bin/env python3
"""
tap_failures.py

Extract failing TAP lines (`not ok`) and a few surrounding lines.
Usage:
  python tools/tap_failures.py <tap_log_path>
"""

from __future__ import annotations

import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: python tools/tap_failures.py <tap_log_path>", file=sys.stderr)
        return 2

    path = Path(argv[1])
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    hit = False
    for i, line in enumerate(lines):
        if line.startswith("not ok "):
            hit = True
            start = max(0, i - 6)
            end = min(len(lines), i + 20)
            for j in range(start, end):
                prefix = ">" if j == i else " "
                print(f"{prefix}{j+1:6d}: {lines[j]}")
            print()
    if not hit:
        print("NO_TAP_FAILURES_FOUND")
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

