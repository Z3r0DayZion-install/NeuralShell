#!/usr/bin/env python3
"""
Mark a manual outreach task as completed and schedule the next action.

Example:
  python scripts/mark_beta_manual_task_done.py \
    --email vendors@capterra.com \
    --completed-action submit_listing_form \
    --next-action await_listing_confirmation \
    --next-in-hours 72 \
    --note gartner_digital_markets
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple


DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_V2.0-RC-Final.csv")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--email", required=True)
    parser.add_argument("--completed-action", required=True)
    parser.add_argument("--next-action", default="await_listing_confirmation")
    parser.add_argument("--next-in-hours", type=int, default=72)
    parser.add_argument("--note", default="")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()


def load_tracker(path: Path) -> Tuple[List[Dict[str, str]], List[str]]:
    if not path.exists():
        raise FileNotFoundError(f"Tracker not found: {path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
        fields = list(reader.fieldnames or [])
    if not fields:
        raise RuntimeError(f"Tracker has no header: {path}")
    for row in rows:
        row.setdefault("notes", "")
        row.setdefault("touch_count", "0")
        row.setdefault("last_touch_at", "")
        row.setdefault("next_action", "")
        row.setdefault("next_action_at", "")
    return rows, fields


def write_tracker(path: Path, rows: List[Dict[str, str]], fields: List[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def bump_touch_count(raw: str) -> str:
    try:
        return str(max(int((raw or "0").strip() or "0"), 0) + 1)
    except ValueError:
        return "1"


def append_note(row: Dict[str, str], note: str) -> None:
    existing = (row.get("notes") or "").strip()
    row["notes"] = note if not existing else f"{existing}; {note}"


def main() -> int:
    args = parse_args()
    tracker_path = Path(args.tracker)
    target_email = normalize_email(args.email)

    rows, fields = load_tracker(tracker_path)
    target = None
    for row in rows:
        if normalize_email(row.get("email", "")) == target_email:
            target = row
            break

    if not target:
        raise RuntimeError(f"No tracker row found for email: {target_email}")

    now = now_utc()
    done_action = (args.completed_action or "").strip().lower()
    next_action = (args.next_action or "").strip().lower()
    next_due = iso_utc(now + timedelta(hours=max(args.next_in_hours, 0))) if next_action else ""

    target["last_touch_at"] = iso_utc(now)
    target["touch_count"] = bump_touch_count(target.get("touch_count", "0"))
    target["next_action"] = next_action
    target["next_action_at"] = next_due

    detail = (args.note or "").strip() or "none"
    append_note(target, f"MANUAL_DONE:{iso_utc(now)}:{done_action}:{detail}")

    if not args.dry_run:
        write_tracker(tracker_path, rows, fields)

    print(
        "[SUMMARY] email={email} completed_action={done} next_action={next_action} next_action_at={next_due} dry_run={dry}".format(
            email=target_email,
            done=done_action,
            next_action=next_action or "(none)",
            next_due=next_due or "(none)",
            dry=args.dry_run,
        )
    )
    print(f"[TRACKER] {tracker_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

