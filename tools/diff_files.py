#!/usr/bin/env python3
"""
diff_files.py

Print a unified diff between two text files (stdlib only).
Usage:
  python tools/diff_files.py <old_path> <new_path>
"""

from __future__ import annotations

import difflib
import sys
from pathlib import Path


def _safe_write(line: str) -> None:
    enc = getattr(sys.stdout, "encoding", None) or "utf-8"
    data = line.encode(enc, errors="replace")
    buf = getattr(sys.stdout, "buffer", None)
    if buf is not None:
        buf.write(data)
    else:
        sys.stdout.write(data.decode(enc, errors="replace"))


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("Usage: python tools/diff_files.py <old_path> <new_path>", file=sys.stderr)
        return 2

    old_path = Path(argv[1])
    new_path = Path(argv[2])
    old_text = old_path.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
    new_text = new_path.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)

    diff = difflib.unified_diff(
        old_text,
        new_text,
        fromfile=str(old_path).replace("\\", "/"),
        tofile=str(new_path).replace("\\", "/"),
        lineterm="",
    )
    printed = False
    for line in diff:
        printed = True
        _safe_write(line + "\n")
    if not printed:
        print("(no diff)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
