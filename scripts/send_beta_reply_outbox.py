#!/usr/bin/env python3
"""
Send reply drafts from beta outbox CSV over SMTP.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import smtplib
import ssl
import time
from email.message import EmailMessage
from pathlib import Path
from typing import Dict, List


DEFAULT_INPUT = Path("release/beta-reply-outbox.csv")
DEFAULT_REPORT = Path("release/beta-reply-send-report.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    parser.add_argument("--start-at", type=int, default=1)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--delay-seconds", type=float, default=2.0)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--smtp-host", default=os.getenv("SMTP_HOST", "smtp.gmail.com"))
    parser.add_argument("--smtp-port", type=int, default=int(os.getenv("SMTP_PORT", "587")))
    parser.add_argument("--smtp-user", default=os.getenv("SMTP_USER", ""))
    parser.add_argument("--smtp-pass", default=os.getenv("SMTP_PASS", ""))
    parser.add_argument("--smtp-from", dest="smtp_from", default=os.getenv("SMTP_FROM", ""))
    return parser.parse_args()


def load_outbox(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Outbox file not found: {path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def smtp_connect(host: str, port: int, user: str, password: str) -> smtplib.SMTP:
    client = smtplib.SMTP(host, port, timeout=30)
    client.ehlo()
    client.starttls(context=ssl.create_default_context())
    client.ehlo()
    client.login(user, password)
    return client


def write_report(path: Path, rows: List[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(rows, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    outbox_rows = load_outbox(Path(args.input))
    selected = [row for idx, row in enumerate(outbox_rows, start=1) if idx >= args.start_at]
    if args.limit > 0:
        selected = selected[: args.limit]

    results: List[Dict[str, str]] = []
    if not selected:
        write_report(Path(args.report), results)
        print("[SUMMARY] queued=0 sent=0 failed=0")
        print(f"[REPORT] {Path(args.report).resolve()}")
        return 0

    smtp_user = args.smtp_user.strip()
    smtp_pass = args.smtp_pass.strip().replace(" ", "")
    smtp_from = (args.smtp_from or smtp_user).strip()
    if not args.dry_run and (not smtp_user or not smtp_pass or not smtp_from):
        raise RuntimeError("Missing SMTP_USER/SMTP_PASS/SMTP_FROM for send mode.")

    sent = 0
    failed = 0
    client = None
    try:
        if not args.dry_run:
            client = smtp_connect(args.smtp_host, args.smtp_port, smtp_user, smtp_pass)

        for idx, row in enumerate(selected, start=1):
            to_addr = (row.get("reply_to") or "").strip().lower()
            subject = (row.get("subject") or "").strip()
            body = (row.get("body") or "").strip()
            if not to_addr or not subject or not body:
                failed += 1
                err = "missing reply_to/subject/body"
                print(f"[FAIL] #{idx} to={to_addr or '(missing)'} error={err}")
                results.append({"index": str(idx), "to": to_addr, "status": "fail", "error": err})
                continue

            if args.dry_run:
                print(f"[DRY-RUN] #{idx} to={to_addr} subject={subject}")
                sent += 1
                results.append({"index": str(idx), "to": to_addr, "status": "ok", "dry_run": True})
                continue

            try:
                msg = EmailMessage()
                msg["From"] = smtp_from
                msg["To"] = to_addr
                msg["Subject"] = subject
                msg.set_content(body)
                client.send_message(msg)
                print(f"[SENT] #{idx} to={to_addr}")
                sent += 1
                results.append({"index": str(idx), "to": to_addr, "status": "ok"})
                time.sleep(max(args.delay_seconds, 0.0))
            except Exception as send_err:  # noqa: BLE001
                failed += 1
                err = str(send_err)
                print(f"[FAIL] #{idx} to={to_addr} error={err}")
                results.append({"index": str(idx), "to": to_addr, "status": "fail", "error": err})
    finally:
        if client is not None:
            try:
                client.quit()
            except Exception:
                pass

    write_report(Path(args.report), results)
    print(f"[SUMMARY] queued={len(selected)} sent={sent} failed={failed} dry_run={args.dry_run}")
    print(f"[REPORT] {Path(args.report).resolve()}")
    return 1 if (failed > 0 and not args.dry_run) else 0


if __name__ == "__main__":
    raise SystemExit(main())

