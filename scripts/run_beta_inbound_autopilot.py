#!/usr/bin/env python3
"""
Run end-to-end inbound outreach operations.

Pipeline:
  1) Fetch Gmail replies -> release/inbound_replies.csv
  2) Triage replies (and optionally apply updates to tracker)
  3) Generate outreach status snapshot
  4) Generate reply drafts + outbox
  5) Optionally send drafts
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


DEFAULT_INPUT = Path("release/inbound_replies.csv")
DEFAULT_SUMMARY = Path("release/beta-inbound-autopilot-summary.json")
REDACTED = "***REDACTED***"
SECRET_FLAGS = {
    "--app-password",
    "--gmail-app-password",
    "--password",
    "--smtp-pass",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--summary", default=str(DEFAULT_SUMMARY))
    parser.add_argument("--skip-fetch", action="store_true")
    parser.add_argument("--no-apply", action="store_true")
    parser.add_argument("--include-declines", action="store_true")
    parser.add_argument("--include-low-confidence", action="store_true")
    parser.add_argument("--tracker-window-hours", type=int, default=24)
    parser.add_argument("--skip-tracker-actions", action="store_true")
    parser.add_argument("--send-drafts", action="store_true")
    parser.add_argument("--send-drafts-dry-run", action="store_true")
    parser.add_argument("--fetch-limit", type=int, default=200)
    parser.add_argument("--fetch-since-days", type=int, default=7)
    parser.add_argument("--gmail-user", default=os.getenv("GMAIL_USER", os.getenv("SMTP_USER", "")))
    parser.add_argument("--gmail-app-password", default=os.getenv("GMAIL_APP_PASSWORD", os.getenv("SMTP_PASS", "")))
    parser.add_argument("--self-email", default=os.getenv("SMTP_FROM", ""))
    return parser.parse_args()


def now_utc_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def sanitize_command(command: List[str]) -> List[str]:
    sanitized: List[str] = []
    expect_secret_value = False
    for token in command:
        if expect_secret_value:
            sanitized.append(REDACTED)
            expect_secret_value = False
            continue

        key, sep, _value = token.partition("=")
        if key in SECRET_FLAGS and sep:
            sanitized.append(f"{key}={REDACTED}")
            continue
        if token in SECRET_FLAGS:
            sanitized.append(token)
            expect_secret_value = True
            continue

        sanitized.append(token)
    return sanitized


def run_step(name: str, command: List[str]) -> Dict[str, object]:
    completed = subprocess.run(command, text=True, capture_output=True)
    result = {
        "name": name,
        "command": sanitize_command(command),
        "exit_code": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }
    print(f"[STEP] {name} exit={completed.returncode}")
    if completed.stdout.strip():
        print(completed.stdout.rstrip())
    if completed.stderr.strip():
        print(completed.stderr.rstrip(), file=sys.stderr)
    return result


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    summary_path = Path(args.summary)

    steps: List[Dict[str, object]] = []
    ok = True

    if not args.skip_fetch:
        if not args.gmail_user.strip() or not args.gmail_app_password.strip():
            print(
                "[ERROR] fetch enabled but Gmail credentials missing. "
                "Provide --gmail-user and --gmail-app-password, or use --skip-fetch.",
                file=sys.stderr,
            )
            return 2

        fetch_cmd = [
            sys.executable,
            "scripts/fetch_gmail_inbound_replies.py",
            "--output",
            str(input_path),
            "--user",
            args.gmail_user.strip(),
            "--app-password",
            args.gmail_app_password.strip(),
            "--self-email",
            (args.self_email or args.gmail_user).strip(),
            "--since-days",
            str(args.fetch_since_days),
            "--limit",
            str(args.fetch_limit),
            "--merge-existing",
        ]
        steps.append(run_step("fetch_gmail_inbound_replies", fetch_cmd))
        if steps[-1]["exit_code"] != 0:
            ok = False

    triage_cmd = [sys.executable, "scripts/triage_beta_inbound_replies.py", "--input", str(input_path)]
    if not args.no_apply:
        triage_cmd.append("--apply")
    steps.append(run_step("triage_beta_inbound_replies", triage_cmd))
    if steps[-1]["exit_code"] != 0:
        ok = False

    steps.append(run_step("beta_outreach_status_report", [sys.executable, "scripts/beta_outreach_status_report.py"]))
    if steps[-1]["exit_code"] != 0:
        ok = False

    drafts_cmd = [sys.executable, "scripts/generate_beta_reply_drafts.py"]
    if not args.skip_tracker_actions:
        drafts_cmd.extend(
            [
                "--include-tracker-actions",
                "--tracker-window-hours",
                str(args.tracker_window_hours),
            ]
        )
    if args.include_declines:
        drafts_cmd.append("--include-declines")
    if args.include_low_confidence:
        drafts_cmd.append("--include-low-confidence")
    steps.append(run_step("generate_beta_reply_drafts", drafts_cmd))
    if steps[-1]["exit_code"] != 0:
        ok = False

    if args.send_drafts or args.send_drafts_dry_run:
        send_cmd = [sys.executable, "scripts/send_beta_reply_outbox.py"]
        if args.send_drafts_dry_run and not args.send_drafts:
            send_cmd.append("--dry-run")
        steps.append(run_step("send_beta_reply_outbox", send_cmd))
        if steps[-1]["exit_code"] != 0:
            ok = False

    summary = {
        "generatedAt": now_utc_iso(),
        "ok": ok,
        "input": str(input_path),
        "steps": steps,
    }
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"[SUMMARY_FILE] {summary_path.resolve()}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
