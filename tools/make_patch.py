import difflib
import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def read_text_or_empty(p: Path) -> list[str]:
    try:
        return p.read_text(encoding="utf-8", errors="replace").splitlines(keepends=True)
    except OSError:
        return []


def unified_diff(old: list[str], new: list[str], fromfile: str, tofile: str) -> str:
    return "".join(
        difflib.unified_diff(
            old,
            new,
            fromfile=fromfile,
            tofile=tofile,
            lineterm="",
        )
    )


def main() -> int:
    targets = [
        {
            "rel": "scripts/runtime_proof.cjs",
            "base": "local/archive/authority-upgrade/runtime_proof.cjs.bak",
        },
        {
            "rel": "scripts/tear_proof.cjs",
            "base": "local/archive/authority-upgrade/tear_proof.cjs.bak",
        },
        {
            "rel": "scripts/exe_proof.cjs",
            "base": "local/archive/authority-upgrade/exe_proof.cjs.bak",
        },
        {
            "rel": "scripts/proof_all.cjs",
            "base": None,  # treat as new if no baseline
        },
        {
            "rel": "scripts/verify_runner.cjs",
            "base": None,  # treat as new if no baseline
        },
        {
            "rel": ".github/workflows/proof-gate.yml",
            "base": "local/archive/authority-upgrade/proof-gate.yml.bak",
        },
        {
            "rel": ".github/workflows/ci.yml",
            "base": "local/archive/2026-02-23T18-46-06-652Z/%BK%/ci.yml.bak",
        },
        {
            "rel": "proof/PROOF_UPDATE.md",
            "base": None,  # treat as new if no baseline
        },
    ]

    out_dir = REPO_ROOT / "proof" / "patches"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "shipped_artifact_proof_v2.patch"

    chunks: list[str] = []
    for t in targets:
        rel = t["rel"]
        new_path = REPO_ROOT / rel
        if not new_path.exists():
            chunks.append(f"# MISSING: {rel}\n")
            continue

        base = t["base"]
        if base:
            base_path = REPO_ROOT / base
            old = read_text_or_empty(base_path)
            fromfile = str(base_path)
        else:
            old = []
            fromfile = "/dev/null"

        new = read_text_or_empty(new_path)
        tofile = str(new_path)

        d = unified_diff(old, new, fromfile, tofile)
        if not d.strip():
            chunks.append(f"# NO_CHANGES: {rel}\n")
        else:
            chunks.append(d + "\n")

    out_path.write_text("".join(chunks), encoding="utf-8")
    print(str(out_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

