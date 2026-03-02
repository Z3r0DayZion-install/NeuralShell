import glob
import hashlib
import json
import os
import struct
import sys


def scan_pngs(folder: str):
    rows = []
    dupes = {}
    for path in sorted(glob.glob(os.path.join(folder, "*.png"))):
        with open(path, "rb") as f:
            data = f.read()
        width = height = None
        if data[:8] == b"\x89PNG\r\n\x1a\n" and len(data) >= 24:
            width, height = struct.unpack(">II", data[16:24])
        digest = hashlib.sha256(data).hexdigest()
        name = os.path.basename(path)
        rows.append(
            {
                "file": name,
                "width": width,
                "height": height,
                "bytes": len(data),
                "sha256": digest,
            }
        )
        dupes.setdefault(digest, []).append(name)

    return {
        "count": len(rows),
        "files": rows,
        "duplicates": [group for group in dupes.values() if len(group) > 1],
    }


def main():
    folder = (
        sys.argv[1]
        if len(sys.argv) > 1
        else r"C:\Users\KickA\Downloads\New Folder"
    )
    report = scan_pngs(folder)
    out_path = os.path.join(os.getcwd(), "neuralshell_screenshot_scan.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(out_path)
    print(f"count={report['count']}")
    print(f"duplicate_groups={len(report['duplicates'])}")


if __name__ == "__main__":
    main()
