#!/usr/bin/env python3
"""
Send NeuralShell beta outreach emails through SMTP.

Required env vars:
  SMTP_HOST (default: smtp.gmail.com)
  SMTP_PORT (default: 587)
  SMTP_USER
  SMTP_PASS
  SMTP_FROM (defaults to SMTP_USER)
"""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import sys
import time
from dataclasses import dataclass
from email.message import EmailMessage
from pathlib import Path


@dataclass(frozen=True)
class Contact:
    index: int
    email: str
    subject: str
    why: str


CONTACTS = [
    Contact(1, "hello@producthunt.com", "NeuralShell beta listing + feedback request", "your launch community and distribution path are relevant to this beta round"),
    Contact(2, "ios-feedback@producthunt.co", "Feedback request: NeuralShell launch prep", "your team handles Product Hunt app feedback and launch UX signals"),
    Contact(3, "android-feedback@producthunt.co", "Feedback request: NeuralShell launch prep", "your team handles Product Hunt app feedback and launch UX signals"),
    Contact(4, "hello@alternativeto.net", "Add NeuralShell to AlternativeTo + early user feedback", "users discover and compare desktop tools through your directory"),
    Contact(5, "hello@startupstash.com", "NeuralShell listing request for startup audience", "startup builders in your audience are strong early testers"),
    Contact(6, "support@dev.to", "NeuralShell beta post + developer feedback request", "your developer community can provide practical implementation feedback"),
    Contact(7, "hello@startupbos.org", "Request: share NeuralShell beta with startup community", "your founder/operator network is a fit for practical beta passes"),
    Contact(8, "sales@cooperpress.com", "Sponsor inquiry: NeuralShell beta testers from dev newsletters", "your newsletters reach active software builders quickly"),
    Contact(9, "editor@cooperpress.com", "Editorial submission: NeuralShell beta for developer readers", "your editorial channels surface useful tools for engineers"),
    Contact(10, "tips@techcrunch.com", "Startup beta tip: NeuralShell v1.2.1-OMEGA", "you review concise startup product tips and launch updates"),
    Contact(11, "tips@venturebeat.com", "Beta launch tip: NeuralShell workstation for secure local workflows", "you cover product launches and technical startup traction"),
    Contact(12, "sales@venturebeat.com", "Sponsored placement inquiry: NeuralShell beta launch", "you offer paid channels for focused launch visibility"),
    Contact(13, "events@venturebeat.com", "Event/community slot inquiry: NeuralShell beta", "your event/community routes can surface real-world testers"),
    Contact(14, "tips@engadget.com", "Product tip: NeuralShell beta open for testers", "you accept concise product tips from builders"),
    Contact(15, "press@wired.com", "Press note: NeuralShell beta and security-first workstation", "your press desk routes product and security-focused launches"),
    Contact(16, "vendors@getapp.com", "Vendor listing request: NeuralShell", "your marketplace supports software vendor discovery"),
    Contact(17, "support@getapp.com", "Help with listing NeuralShell on GetApp", "you route listing and submission support requests"),
    Contact(18, "marketing@getapp.com", "Marketing inquiry: NeuralShell listing visibility", "you handle visibility and co-marketing pathways"),
    Contact(19, "vendors@capterra.com", "Vendor listing request: NeuralShell", "your catalog is used by software evaluators and buyers"),
    Contact(20, "reviews@capterra.com", "Help request: NeuralShell listing and review enablement", "you handle review/listing workflow questions"),
]

RELEASE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.2.1-OMEGA"
BETA_ISSUE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/34"
INTAKE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--start-at", type=int, default=1)
    p.add_argument("--limit", type=int, default=20)
    p.add_argument("--delay-seconds", type=float, default=2.0)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--report", default=str(Path("release") / "beta-outreach-send-report.json"))
    p.add_argument("--smtp-host", default=os.getenv("SMTP_HOST", "smtp.gmail.com"))
    p.add_argument("--smtp-port", type=int, default=int(os.getenv("SMTP_PORT", "587")))
    p.add_argument("--smtp-user", default=os.getenv("SMTP_USER", ""))
    p.add_argument("--smtp-pass", default=os.getenv("SMTP_PASS", ""))
    p.add_argument("--smtp-from", dest="smtp_from", default=os.getenv("SMTP_FROM", ""))
    return p.parse_args()


def select_contacts(start_at: int, limit: int) -> list[Contact]:
    filtered = [c for c in CONTACTS if c.index >= start_at]
    return filtered[: max(limit, 0)]


def build_body(contact: Contact) -> str:
    return (
        "Hi Team,\n\n"
        "I am running a live beta for NeuralShell (v1.2.1-OMEGA), an Electron workstation focused on strict IPC validation, offline-first behavior, and release provenance gates.\n\n"
        f"I am reaching out because {contact.why}. If this fits your process, I would like to request routing for listing/coverage/community sharing and tester feedback.\n\n"
        f"Release: {RELEASE_URL}\n"
        f"Beta thread: {BETA_ISSUE_URL}\n"
        f"Intake forms: {INTAKE_URL}\n\n"
        "Thanks,\n"
        "NeuralShell Founder\n"
    )


def smtp_connect(host: str, port: int, user: str, password: str) -> smtplib.SMTP:
    client = smtplib.SMTP(host, port, local_hostname="localhost", timeout=30)
    client.ehlo()
    if port == 465:
        # Caller should use SMTP_SSL for port 465; fallback handled below.
        client.quit()
        raise RuntimeError("Use STARTTLS port (e.g. 587) with this sender.")
    client.starttls(context=ssl.create_default_context())
    client.ehlo()
    client.login(user, password)
    return client


def main() -> int:
    args = parse_args()
    targets = select_contacts(args.start_at, args.limit)
    if not targets:
        print("No recipients selected. Adjust --start-at/--limit.", file=sys.stderr)
        return 2

    smtp_user = args.smtp_user.strip()
    smtp_pass = args.smtp_pass.strip().replace(" ", "")
    smtp_from = (args.smtp_from or smtp_user).strip()
    if not args.dry_run:
        if not smtp_user or not smtp_pass or not smtp_from:
            print("Missing SMTP_USER/SMTP_PASS/SMTP_FROM.", file=sys.stderr)
            return 2

    results: list[dict[str, object]] = []
    ok = 0
    fail = 0

    if args.dry_run:
        for c in targets:
            print(f"[DRY-RUN] #{c.index} to={c.email} subject={c.subject}")
            ok += 1
            results.append({"index": c.index, "email": c.email, "status": "ok", "dry_run": True})
    else:
        client = None
        try:
            client = smtp_connect(args.smtp_host, args.smtp_port, smtp_user, smtp_pass)
            for c in targets:
                msg = EmailMessage()
                msg["From"] = smtp_from
                msg["To"] = c.email
                msg["Subject"] = c.subject
                msg.set_content(build_body(c))
                try:
                    client.send_message(msg)
                    ok += 1
                    print(f"[SENT] #{c.index} to={c.email}")
                    results.append({"index": c.index, "email": c.email, "status": "ok"})
                except Exception as send_err:  # noqa: BLE001
                    fail += 1
                    msg_txt = str(send_err)
                    print(f"[FAIL] #{c.index} to={c.email} error={msg_txt}")
                    results.append({"index": c.index, "email": c.email, "status": "fail", "error": msg_txt})
                time.sleep(max(args.delay_seconds, 0.0))
        except Exception as conn_err:  # noqa: BLE001
            fail = len(targets)
            msg_txt = str(conn_err)
            print(f"[FAIL] smtp-connect error={msg_txt}")
            for c in targets:
                results.append({"index": c.index, "email": c.email, "status": "fail", "error": msg_txt})
        finally:
            if client is not None:
                try:
                    client.quit()
                except Exception:  # noqa: BLE001
                    pass

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"[SUMMARY] attempted={len(targets)} ok={ok} failed={fail} dry_run={args.dry_run}")
    print(f"[REPORT] {report_path.resolve()}")
    return 1 if (fail > 0 and not args.dry_run) else 0


if __name__ == "__main__":
    raise SystemExit(main())

