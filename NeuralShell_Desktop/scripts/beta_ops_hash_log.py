from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def folder_manifest_sha256(root: Path) -> str:
    files = [p for p in root.rglob("*") if p.is_file()]
    files.sort(key=lambda p: p.relative_to(root).as_posix().lower())
    h = hashlib.sha256()
    for p in files:
        rel = p.relative_to(root).as_posix()
        size = p.stat().st_size
        file_sha = sha256_file(p)
        h.update(f"{rel}|{size}|{file_sha}\n".encode("utf-8"))
    return h.hexdigest().upper()


def git_head(repo_root: Path) -> str:
    return subprocess.check_output(["git", "-C", str(repo_root), "rev-parse", "HEAD"], text=True).strip()


def append_log_entry(log_path: Path, entry: str) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    existing = ""
    if log_path.exists():
        existing = log_path.read_text(encoding="utf-8", errors="replace")
    if existing and not existing.endswith("\n"):
        existing += "\n"
    log_path.write_text(existing + entry, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Append zip + folder manifest hashes to STABILITY_HASH_LOG.md.")
    parser.add_argument("--out", type=Path, help="Beta pack folder path.")
    parser.add_argument("--zip", type=Path, help="Beta pack zip path.")
    parser.add_argument("--latest", action="store_true", help="Auto-select the latest pack from release/beta/.")
    parser.add_argument("--log", required=True, type=Path, help="Path to STABILITY_HASH_LOG.md.")
    parser.add_argument("--label", default="ship:beta run", help="Entry label.")
    args = parser.parse_args()

    desktop_root = Path(__file__).resolve().parent.parent
    beta_root = desktop_root / "release" / "beta"

    if args.latest:
        candidates = [p for p in beta_root.glob("beta_pack_*") if p.is_dir()]
        if not candidates:
            raise SystemExit(f"no beta packs found under: {beta_root}")
        candidates.sort(key=lambda p: p.name)
        pack_root = candidates[-1].resolve()
        zip_path = (beta_root / f"{pack_root.name}.zip").resolve()
    else:
        if not args.out or not args.zip:
            raise SystemExit("must provide --out and --zip (or use --latest)")
        pack_root = args.out.resolve()
        zip_path = args.zip.resolve()

    log_path = args.log.resolve()

    if not pack_root.exists() or not pack_root.is_dir():
        raise SystemExit(f"missing out dir: {pack_root}")
    if not zip_path.exists() or not zip_path.is_file():
        raise SystemExit(f"missing zip file: {zip_path}")

    parent_root = desktop_root.parent

    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    zip_sha = sha256_file(zip_path)
    folder_sha = folder_manifest_sha256(pack_root)
    desktop_commit = ""
    parent_commit = ""
    manifest_path = pack_root / "RELEASE_MANIFEST.json"
    if manifest_path.exists():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8", errors="replace"))
            if isinstance(manifest, dict):
                desktop_commit = str(manifest.get("desktopCommit") or "").strip()
                parent_commit = str(manifest.get("parentCommit") or "").strip()
        except Exception:
            desktop_commit = ""
            parent_commit = ""
    if not desktop_commit:
        desktop_commit = git_head(desktop_root)
    if not parent_commit:
        parent_commit = git_head(parent_root)

    entry = (
        f"\n## {args.label} @ {ts}\n"
        f"out={pack_root}\n"
        f"zip={zip_path}\n"
        f"zip.sha256={zip_sha}\n"
        f"folder.manifest.sha256={folder_sha}\n"
        f"desktop.commit={desktop_commit}\n"
        f"parent.commit={parent_commit}\n"
    )

    append_log_entry(log_path, entry)
    print(entry)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
