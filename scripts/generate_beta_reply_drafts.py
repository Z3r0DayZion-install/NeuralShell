#!/usr/bin/env python3
"""
Generate reply drafts and outbox CSV from inbound triage report.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, List


DEFAULT_REPORT = Path("release/beta-inbound-triage-report.json")
DEFAULT_DRAFTS_MD = Path("release/beta-reply-drafts.md")
DEFAULT_OUTBOX_CSV = Path("release/beta-reply-outbox.csv")

RELEASE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.2.1-OMEGA"
CHECKLIST_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/blob/master/docs/pilots/BETA_TESTER_CHECKLIST_v1.2.1-OMEGA.md"
INTAKE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose"
REPO_URL = "https://github.com/Z3r0DayZion-install/NeuralShell"
BETA_ISSUE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/34"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    parser.add_argument("--drafts-md", default=str(DEFAULT_DRAFTS_MD))
    parser.add_argument("--outbox-csv", default=str(DEFAULT_OUTBOX_CSV))
    parser.add_argument("--include-declines", action="store_true")
    parser.add_argument("--include-low-confidence", action="store_true")
    return parser.parse_args()


def reply_subject(original: str) -> str:
    text = (original or "NeuralShell beta").strip()
    if text.lower().startswith("re:"):
        return text
    return f"Re: {text}"


def build_body(action: Dict[str, str]) -> str:
    state = (action.get("state") or "").strip().lower()

    if state == "interested":
        return (
            "Hi,\n\n"
            "Great, thanks for joining the NeuralShell beta.\n\n"
            "Start here:\n"
            f"- Release: {RELEASE_URL}\n"
            f"- Checklist: {CHECKLIST_URL}\n"
            f"- Issue intake: {INTAKE_URL}\n\n"
            "Core pass is about 20-30 minutes. If you hit any blocker, send exact step + screenshot/log.\n\n"
            "Thanks,\n"
            "NeuralShell Founder\n"
        )

    if state == "routed":
        return (
            "Hi,\n\n"
            "Thanks for routing this. Can you point me to the correct submission path/contact for listing and beta distribution?\n\n"
            "Quick links:\n"
            f"- Repo: {REPO_URL}\n"
            f"- Beta thread: {BETA_ISSUE_URL}\n"
            f"- Release: {RELEASE_URL}\n\n"
            "I can provide any additional metadata needed.\n\n"
            "Thanks,\n"
            "NeuralShell Founder\n"
        )

    if state == "completed":
        return (
            "Hi,\n\n"
            "Excellent, thank you for completing the beta pass.\n\n"
            "If you have notes or bugs, please drop them into intake so I can triage quickly:\n"
            f"- Intake: {INTAKE_URL}\n\n"
            "Appreciate the time and signal.\n\n"
            "Thanks,\n"
            "NeuralShell Founder\n"
        )

    if state == "declined":
        return (
            "Hi,\n\n"
            "Understood, thanks for the quick reply.\n\n"
            "I will close this loop on my side. If timing changes later, I can resend the current build and checklist.\n\n"
            "Thanks again,\n"
            "NeuralShell Founder\n"
        )

    if state == "bounced":
        return ""

    return (
        "Hi,\n\n"
        "Thanks for the response. Sharing quick details below:\n"
        f"- Repo: {REPO_URL}\n"
        f"- Release: {RELEASE_URL}\n"
        f"- Security summary: {REPO_URL}#security-gates\n"
        f"- Beta issue/intake: {INTAKE_URL}\n\n"
        "If helpful, I can send a short test scope tailored to your environment.\n\n"
        "Thanks,\n"
        "NeuralShell Founder\n"
    )


def should_include(action: Dict[str, str], include_declines: bool, include_low_confidence: bool) -> bool:
    state = (action.get("state") or "").strip().lower()
    confidence = (action.get("confidence") or "").strip().lower()
    if state == "bounced":
        return False
    if state == "declined" and not include_declines:
        return False
    if confidence == "low" and not include_low_confidence:
        return False
    return True


def load_actions(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Triage report not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    actions = data.get("actions", [])
    return [dict(item) for item in actions]


def build_markdown(drafts: List[Dict[str, str]]) -> str:
    lines = [
        "# Beta Reply Drafts",
        "",
        "Generated from triage report.",
        "",
    ]
    if not drafts:
        lines.append("No drafts generated.")
        lines.append("")
        return "\n".join(lines)

    for idx, draft in enumerate(drafts, start=1):
        lines.extend(
            [
                f"## Draft {idx}",
                f"- Reply To: `{draft['reply_to']}`",
                f"- Contact: `{draft['contact_email']}`",
                f"- State: `{draft['state']}`",
                f"- Confidence: `{draft['confidence']}`",
                f"- Match Mode: `{draft['match_mode']}`",
                f"- Subject: `{draft['subject']}`",
                "",
                "```text",
                draft["body"].rstrip(),
                "```",
                "",
            ]
        )
    return "\n".join(lines)


def write_outbox(path: Path, drafts: List[Dict[str, str]]) -> None:
    fieldnames = [
        "reply_to",
        "contact_email",
        "state",
        "confidence",
        "match_mode",
        "subject",
        "body",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(drafts)


def main() -> int:
    args = parse_args()
    report_path = Path(args.report)
    drafts_md_path = Path(args.drafts_md)
    outbox_path = Path(args.outbox_csv)

    actions = load_actions(report_path)
    drafts: List[Dict[str, str]] = []
    for action in actions:
        if not should_include(action, args.include_declines, args.include_low_confidence):
            continue

        reply_to = (action.get("reply_to") or action.get("email") or "").strip().lower()
        if not reply_to:
            continue
        subject = reply_subject(action.get("subject", ""))
        body = build_body(action)
        if not body.strip():
            continue

        drafts.append(
            {
                "reply_to": reply_to,
                "contact_email": (action.get("contact_email") or "").strip().lower(),
                "state": (action.get("state") or "").strip().lower(),
                "confidence": (action.get("confidence") or "").strip().lower(),
                "match_mode": (action.get("match_mode") or "").strip().lower(),
                "subject": subject,
                "body": body,
            }
        )

    drafts_md_path.parent.mkdir(parents=True, exist_ok=True)
    drafts_md_path.write_text(build_markdown(drafts), encoding="utf-8")
    write_outbox(outbox_path, drafts)

    print(f"[SUMMARY] actions={len(actions)} drafts={len(drafts)}")
    print(f"[DRAFTS] {drafts_md_path.resolve()}")
    print(f"[OUTBOX] {outbox_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

