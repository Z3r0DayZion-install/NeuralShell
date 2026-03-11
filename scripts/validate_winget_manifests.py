#!/usr/bin/env python3
"""
Validate the generated WinGet manifests for the current package version.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


DEFAULT_PACKAGE_JSON = Path("package.json")
DEFAULT_MANIFEST_ROOT = Path("release/winget/manifests")
DEFAULT_PACKAGE_ID = "NeuralShellTeam.NeuralShell"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-json", default=str(DEFAULT_PACKAGE_JSON))
    parser.add_argument("--manifest-root", default=str(DEFAULT_MANIFEST_ROOT))
    parser.add_argument("--package-id", default=DEFAULT_PACKAGE_ID)
    return parser.parse_args()


def load_version(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    version = str(data.get("version", "")).strip()
    if not version:
        raise RuntimeError(f"Missing version in {path}")
    return version


def manifest_dir(root: Path, package_id: str, version: str) -> Path:
    publisher, package_name = package_id.split(".", 1)
    return root / package_id[0].lower() / publisher / package_name / version


def main() -> int:
    args = parse_args()
    version = load_version(Path(args.package_json))
    target = manifest_dir(Path(args.manifest_root), args.package_id, version)
    if not target.exists():
        raise FileNotFoundError(f"Manifest directory not found: {target}")

    command = ["winget", "validate", "--manifest", str(target), "--disable-interactivity"]
    completed = subprocess.run(command, text=True, capture_output=True)
    if completed.stdout.strip():
        print(completed.stdout.rstrip())
    if completed.stderr.strip():
        print(completed.stderr.rstrip(), file=sys.stderr)
    print(f"[MANIFEST_DIR] {target.resolve()}")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
