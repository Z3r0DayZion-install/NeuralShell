#!/usr/bin/env python3
"""
Send 72-hour follow-up emails for outreach contacts tracked in CSV.

Required env vars (unless passed via args):
  SMTP_HOST (default: smtp.gmail.com)
  SMTP_PORT (default: 587)
  SMTP_USER
  SMTP_PASS
  SMTP_FROM (defaults to SMTP_USER)
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import smtplib
import ssl
import sys
import time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, List


DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_v1.2.1-OMEGA.csv")
DEFAULT_REPORT = Path("release/beta-followup-send-report.json")
RELEASE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.2.1-OMEGA"
BETA_ISSUE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/34"
INTAKE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose"

FINAL_STATES = {"interested", "started", "completed", "declined", "bounced", "replied"}
FOLLOWUP_STATES = {"sent", "no_response", "followup_due", "followup_sent"}


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(value: str) -> datetime | None:
    raw = (value or "").strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    parser.add_argument("--min-age-hours", type=float, default=72.0)
    parser.add_argument("--cooldown-hours", type=float, default=72.0)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--delay-seconds", type=float, default=2.0)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--smtp-host", default=os.getenv("SMTP_HOST", "smtp.gmail.com"))
    parser.add_argument("--smtp-port", type=int, default=int(os.getenv("SMTP_PORT", "587")))
    parser.add_argument("--smtp-user", default=os.getenv("SMTP_USER", ""))
    parser.add_argument("--smtp-pass", default=os.getenv("SMTP_PASS", ""))
    parser.add_argument("--smtp-from", dest="smtp_from", default=os.getenv("SMTP_FROM", ""))
    return parser.parse_args()


def load_tracker(path: Path) -> tuple[List[Dict[str, str]], List[str]]:
    if not path.exists():
        raise FileNotFoundError(f"Tracker not found: {path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
        fieldnames = list(reader.fieldnames or [])
    if not fieldnames:
        raise RuntimeError(f"Tracker has no header: {path}")
    return rows, fieldnames


def ensure_columns(rows: List[Dict[str, str]], fieldnames: List[str]) -> List[str]:
    required = [
        "index",
        "email",
        "subject",
        "first_sent_at",
        "last_touch_at",
        "touch_count",
        "response_state",
        "response_at",
        "next_action",
        "next_action_at",
        "notes",
    ]
    updated = list(fieldnames)
    for column in required:
        if column not in updated:
            updated.append(column)
    for row in rows:
        for column in updated:
            row.setdefault(column, "")
    return updated


def eligible_for_followup(row: Dict[str, str], now: datetime, min_age_hours: float) -> bool:
    state = (row.get("response_state") or "").strip().lower()
    if state in FINAL_STATES:
        return False
    if state and state not in FOLLOWUP_STATES:
        return False

    next_action_at = parse_iso(row.get("next_action_at", ""))
    if next_action_at and next_action_at <= now:
        return True

    anchor = parse_iso(row.get("last_touch_at", "")) or parse_iso(row.get("first_sent_at", ""))
    if not anchor:
        return False
    return (now - anchor) >= timedelta(hours=min_age_hours)


def followup_subject(original: str) -> str:
    base = (original or "NeuralShell beta").strip()
    if base.lower().startswith("follow-up:"):
        return base
    return f"Follow-up: {base}"


def followup_body() -> str:
    return (
        "Hi Team,\n\n"
        "Quick follow-up on my earlier note about NeuralShell beta.\n\n"
        "If this is relevant for your queue, links are below:\n"
        f"- Release: {RELEASE_URL}\n"
        f"- Beta thread: {BETA_ISSUE_URL}\n"
        f"- Intake forms: {INTAKE_URL}\n\n"
        "If this is not a fit right now, no problem and thanks for your time.\n\n"
        "Best,\n"
        "NeuralShell Founder\n"
    )


def smtp_connect(host: str, port: int, user: str, password: str) -> smtplib.SMTP:
    client = smtplib.SMTP(host, port, timeout=30)
    client.ehlo()
    client.starttls(context=ssl.create_default_context())
    client.ehlo()
    client.login(user, password)
    return client


def append_note(row: Dict[str, str], note: str) -> None:
    existing = (row.get("notes") or "").strip()
    if not existing:
        row["notes"] = note
        return
    row["notes"] = f"{existing}; {note}"


def write_tracker(path: Path, rows: List[Dict[str, str]], fieldnames: List[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_report(path: Path, results: List[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(results, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    tracker_path = Path(args.tracker)
    report_path = Path(args.report)
    now = now_utc()

    rows, fieldnames = load_tracker(tracker_path)
    fieldnames = ensure_columns(rows, fieldnames)

    candidates = [row for row in rows if eligible_for_followup(row, now, args.min_age_hours)]
    candidates = candidates[: max(args.limit, 0)]
    if not candidates:
        print("[INFO] No follow-up candidates found.")
        write_report(report_path, [])
        print(f"[REPORT] {report_path.resolve()}")
        return 0

    smtp_user = args.smtp_user.strip()
    smtp_pass = args.smtp_pass.strip().replace(" ", "")
    smtp_from = (args.smtp_from or smtp_user).strip()
    if not args.dry_run and (not smtp_user or not smtp_pass or not smtp_from):
        print("Missing SMTP_USER/SMTP_PASS/SMTP_FROM.", file=sys.stderr)
        return 2

    results: List[Dict[str, str]] = []
    ok_count = 0
    fail_count = 0
    body = followup_body()
    client = None

    try:
        if not args.dry_run:
            client = smtp_connect(args.smtp_host, args.smtp_port, smtp_user, smtp_pass)

        for row in candidates:
            idx = (row.get("index") or "").strip()
            to_addr = (row.get("email") or "").strip()
            subj = followup_subject(row.get("subject", ""))
            if not to_addr:
                fail_count += 1
                err = "missing email"
                append_note(row, f"FOLLOWUP_FAIL:{iso_utc(now)}:{err}")
                results.append({"index": idx, "email": "", "status": "fail", "error": err})
                continue

            try:
                if args.dry_run:
                    print(f"[DRY-RUN] #{idx} to={to_addr} subject={subj}")
                else:
                    msg = EmailMessage()
                    msg["From"] = smtp_from
                    msg["To"] = to_addr
                    msg["Subject"] = subj
                    msg.set_content(body)
                    client.send_message(msg)
                    print(f"[SENT] #{idx} to={to_addr}")
                    time.sleep(max(args.delay_seconds, 0.0))

                ok_count += 1
                new_touch = now_utc()
                row["last_touch_at"] = iso_utc(new_touch)
                row["response_state"] = "followup_sent"
                row["next_action"] = "await_response"
                row["next_action_at"] = iso_utc(new_touch + timedelta(hours=args.cooldown_hours))
                row["touch_count"] = str(max(int((row.get("touch_count") or "0").strip() or "0"), 0) + 1)
                append_note(row, f"FOLLOWUP_SENT:{iso_utc(new_touch)}")
                results.append({"index": idx, "email": to_addr, "status": "ok"})
            except Exception as send_err:  # noqa: BLE001
                fail_count += 1
                err = str(send_err)
                print(f"[FAIL] #{idx} to={to_addr} error={err}")
                append_note(row, f"FOLLOWUP_FAIL:{iso_utc(now_utc())}:{err}")
                results.append({"index": idx, "email": to_addr, "status": "fail", "error": err})
    finally:
        if client is not None:
            try:
                client.quit()
            except Exception:  # noqa: BLE001
                pass

    if not args.dry_run:
        write_tracker(tracker_path, rows, fieldnames)
    write_report(report_path, results)

    print(
        f"[SUMMARY] candidates={len(candidates)} ok={ok_count} failed={fail_count} dry_run={args.dry_run}"
    )
    print(f"[REPORT] {report_path.resolve()}")
    return 1 if (fail_count > 0 and not args.dry_run) else 0


if __name__ == "__main__":
    raise SystemExit(main())

