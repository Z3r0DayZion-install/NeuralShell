import argparse
import os
import sys


TEXT_EXTS = {
    ".cjs",
    ".js",
    ".mjs",
    ".json",
    ".md",
    ".yml",
    ".yaml",
}


def is_text_file(path: str) -> bool:
    _, ext = os.path.splitext(path.lower())
    return ext in TEXT_EXTS


def iter_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        # prune noisy dirs
        dirnames[:] = [
            d
            for d in dirnames
            if d not in ("node_modules", ".git", ".next", "dist", "build", ".cache")
        ]
        for name in filenames:
            p = os.path.join(dirpath, name)
            if is_text_file(p):
                yield p


def read_text(path: str) -> str | None:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError:
        return None


def find_first_line_index(lines: list[str], terms: list[str]) -> int | None:
    for i, line in enumerate(lines):
        for term in terms:
            if term in line:
                return i
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".", help="repo root (default: .)")
    ap.add_argument("--lines", type=int, default=20, help="context lines total (default: 20)")
    ap.add_argument(
        "terms",
        nargs="*",
        default=["coldStart", "purged"],
        help="terms to search for (default: coldStart purged)",
    )
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    terms = list(args.terms)
    ctx_total = max(1, int(args.lines))
    ctx_before = ctx_total // 2
    ctx_after = ctx_total - ctx_before

    hits: list[tuple[str, int]] = []
    if os.path.isfile(root):
        t = read_text(root) or ""
        if any(term in t for term in terms):
            lines = t.splitlines()
            idx = find_first_line_index(lines, terms)
            if idx is not None:
                hits.append((os.path.basename(root), idx))
        root_dir = os.path.dirname(root)
        root = root_dir if root_dir else os.path.abspath(".")
    else:
        for p in iter_files(root):
            t = read_text(p)
            if not t:
                continue
            if not any(term in t for term in terms):
                continue
            rel = os.path.relpath(p, root)
            lines = t.splitlines()
            idx = find_first_line_index(lines, terms)
            if idx is None:
                continue
            hits.append((rel, idx))

    if not hits:
        print("NO_HITS")
        return 1

    # Make stdout utf-8 to avoid Windows cp1252 crashes.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    for rel, idx in sorted(hits, key=lambda x: x[0]):
        abs_path = os.path.join(root, rel)
        t = read_text(abs_path) or ""
        lines = t.splitlines()
        start = max(0, idx - ctx_before)
        end = min(len(lines), idx + ctx_after)
        print(f"\n=== {rel}:{idx+1} ===")
        for i in range(start, end):
            print(f"{i+1:5d} | {lines[i]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
