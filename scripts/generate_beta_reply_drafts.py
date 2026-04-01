#!/usr/bin/env python3
"""
Generate reply drafts and outbox CSV from inbound triage report.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple


DEFAULT_REPORT = Path("release/beta-inbound-triage-report.json")
DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_V2.0-RC-Final.csv")
DEFAULT_INBOUND = Path("release/inbound_replies.csv")
DEFAULT_DRAFTS_MD = Path("release/beta-reply-drafts.md")
DEFAULT_OUTBOX_CSV = Path("release/beta-reply-outbox.csv")

RELEASE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v2.1.28"
CHECKLIST_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/blob/master/docs/pilots/BETA_TESTER_CHECKLIST_V2.0-RC-Final.md"
INTAKE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose"
REPO_URL = "https://github.com/Z3r0DayZion-install/NeuralShell"
BETA_ISSUE_URL = "https://github.com/Z3r0DayZion-install/NeuralShell/issues/34"
SUBJECT_PREFIX_RE = re.compile(r"^(re|fw|fwd)\s*:\s*", re.IGNORECASE)
URL_RE = re.compile(r"https?://[^\s>)]+")
ACTIONABLE_TRACKER_NEXT_ACTIONS = {
    "manual_review",
    "respond_to_route",
    "submit_listing_form",
    "send_tester_packet",
    "collect_feedback",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--inbound", default=str(DEFAULT_INBOUND))
    parser.add_argument("--drafts-md", default=str(DEFAULT_DRAFTS_MD))
    parser.add_argument("--outbox-csv", default=str(DEFAULT_OUTBOX_CSV))
    parser.add_argument("--include-declines", action="store_true")
    parser.add_argument("--include-low-confidence", action="store_true")
    parser.add_argument("--include-tracker-actions", action="store_true")
    parser.add_argument("--tracker-window-hours", type=int, default=24)
    return parser.parse_args()


def reply_subject(original: str) -> str:
    text = (original or "NeuralShell beta").strip()
    if text.lower().startswith("re:"):
        return text
    return f"Re: {text}"


def parse_iso(raw: str) -> datetime | None:
    text = (raw or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()


def canonical_email(raw: str) -> str:
    email = normalize_email(raw)
    if "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if "+" in local:
        local = local.split("+", 1)[0]
    return f"{local}@{domain}"


def normalize_subject(raw: str) -> str:
    subject = (raw or "").strip().lower()
    while True:
        updated = SUBJECT_PREFIX_RE.sub("", subject).strip()
        if updated == subject:
            break
        subject = updated
    return re.sub(r"\s+", " ", subject)


def parse_note_fields(notes: str) -> Tuple[str, str]:
    source = ""
    confidence = ""
    for chunk in (notes or "").split(";"):
        item = chunk.strip()
        if item.startswith("INBOUND_SOURCE:"):
            tail = item[len("INBOUND_SOURCE:") :]
            parts = tail.rsplit(":", 1)
            if len(parts) == 2:
                source = normalize_email(parts[1])
        if item.startswith("INBOUND_TRIAGE:"):
            tail = item[len("INBOUND_TRIAGE:") :]
            parts = tail.rsplit(":", 3)
            if len(parts) == 4:
                confidence = parts[2].strip().lower()
    return source, confidence


def load_inbound_rows(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def latest_matching_inbound(
    inbound_rows: List[Dict[str, str]],
    reply_to: str,
    subject: str,
) -> Dict[str, str] | None:
    if not inbound_rows:
        return None
    target_email = canonical_email(reply_to)
    target_subject = normalize_subject(subject)
    best: Dict[str, str] | None = None
    best_dt: datetime | None = None
    for row in inbound_rows:
        row_email = canonical_email(row.get("email", ""))
        row_subject = normalize_subject(row.get("subject", ""))
        if target_email and row_email and target_email != row_email:
            continue
        if target_subject and row_subject and target_subject != row_subject:
            continue
        received = parse_iso(row.get("received_at", "")) or datetime.min.replace(tzinfo=timezone.utc)
        if best is None or received > (best_dt or datetime.min.replace(tzinfo=timezone.utc)):
            best = row
            best_dt = received
    return best


def first_url(text: str) -> str:
    match = URL_RE.search(text or "")
    return match.group(0) if match else ""


def build_body(action: Dict[str, str]) -> str:
    state = (action.get("state") or "").strip().lower()
    next_action = (action.get("next_action") or "").strip().lower()
    reply_to = normalize_email(action.get("reply_to", ""))
    contact = normalize_email(action.get("contact_email", ""))

    if next_action == "manual_review":
        if "producthunt" in reply_to or "producthunt" in contact:
            return (
                "Hi,\n\n"
                "Thanks for the quick response.\n\n"
                "Yes, please connect me with a human launch/listing contact for Product Hunt routing.\n\n"
                "Context + links:\n"
                f"- Repo: {REPO_URL}\n"
                f"- Release: {RELEASE_URL}\n"
                f"- Beta thread: {BETA_ISSUE_URL}\n"
                f"- Intake: {INTAKE_URL}\n\n"
                "If there is a preferred submission path for launch listing and tester feedback, I can follow it immediately.\n\n"
                "Thanks,\n"
                "NeuralShell Founder\n"
            )
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
        if "noreply@" in reply_to or "+noreply@" in reply_to:
            return ""
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


def load_tracker_actions(
    tracker_path: Path,
    inbound_path: Path,
    window_hours: int,
) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    if not tracker_path.exists():
        return [], []

    now = datetime.now(timezone.utc)
    horizon = now + timedelta(hours=max(window_hours, 0))
    inbound_rows = load_inbound_rows(inbound_path)

    actions: List[Dict[str, str]] = []
    manual_tasks: List[Dict[str, str]] = []
    with tracker_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            state = (row.get("response_state") or "").strip().lower()
            next_action = (row.get("next_action") or "").strip().lower()
            if next_action not in ACTIONABLE_TRACKER_NEXT_ACTIONS:
                continue
            due_at = parse_iso(row.get("next_action_at", ""))
            if due_at and due_at > horizon:
                continue

            source_email, confidence = parse_note_fields(row.get("notes", ""))
            reply_to = source_email or normalize_email(row.get("email", ""))
            subject = reply_subject(row.get("subject", ""))
            inbound = latest_matching_inbound(inbound_rows, reply_to, subject)
            route_url = first_url((inbound or {}).get("body", ""))

            action = {
                "reply_to": reply_to,
                "contact_email": normalize_email(row.get("email", "")),
                "state": state or "replied",
                "confidence": confidence or "medium",
                "match_mode": "tracker_due",
                "subject": subject,
                "next_action": next_action,
                "next_action_at": row.get("next_action_at", ""),
            }

            if "noreply@" in reply_to or "+noreply@" in reply_to:
                manual_tasks.append(
                    {
                        "contact_email": normalize_email(row.get("email", "")),
                        "reply_to": reply_to,
                        "state": state or "replied",
                        "next_action": next_action,
                        "next_action_at": row.get("next_action_at", ""),
                        "subject": subject,
                        "route_url": route_url,
                        "instruction": (
                            "Submit via routed form link and record submission timestamp in tracker notes."
                            if route_url
                            else "Manual follow-up required. No valid reply destination."
                        ),
                    }
                )
                continue

            actions.append(action)
    return actions, manual_tasks


def dedupe_actions(actions: List[Dict[str, str]]) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    seen = set()
    for action in actions:
        key = (
            normalize_email(action.get("reply_to", "")),
            normalize_subject(action.get("subject", "")),
            (action.get("state") or "").strip().lower(),
            (action.get("next_action") or "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(action)
    return out


def build_markdown(drafts: List[Dict[str, str]], manual_tasks: List[Dict[str, str]]) -> str:
    lines = [
        "# Beta Reply Drafts",
        "",
        "Generated from triage report and optional tracker actions.",
        "",
    ]
    if not drafts:
        lines.append("No drafts generated.")
        lines.append("")
    else:
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

    lines.extend(
        [
            "## Manual Tasks",
            "",
            "| Contact | Reply Source | Next Action | Due At | Route URL | Instruction |",
            "|---|---|---|---|---|---|",
        ]
    )
    if manual_tasks:
        for task in manual_tasks:
            lines.append(
                "| {contact_email} | {reply_to} | {next_action} | {next_action_at} | {route_url} | {instruction} |".format(
                    contact_email=task.get("contact_email", ""),
                    reply_to=task.get("reply_to", ""),
                    next_action=task.get("next_action", ""),
                    next_action_at=task.get("next_action_at", ""),
                    route_url=(task.get("route_url", "") or "(none)").replace("|", "/"),
                    instruction=(task.get("instruction", "") or "").replace("|", "/"),
                )
            )
    else:
        lines.append("| (none) |  |  |  |  |  |")
    lines.append("")
    return "\n".join(lines)


def write_outbox(path: Path, drafts: List[Dict[str, str]]) -> None:
    fieldnames = [
        "reply_to",
        "contact_email",
        "state",
        "confidence",
        "match_mode",
        "next_action",
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
    tracker_path = Path(args.tracker)
    inbound_path = Path(args.inbound)
    drafts_md_path = Path(args.drafts_md)
    outbox_path = Path(args.outbox_csv)

    actions = load_actions(report_path)
    manual_tasks: List[Dict[str, str]] = []
    if args.include_tracker_actions:
        tracker_actions, tracker_manual_tasks = load_tracker_actions(
            tracker_path,
            inbound_path,
            args.tracker_window_hours,
        )
        actions.extend(tracker_actions)
        manual_tasks.extend(tracker_manual_tasks)
    actions = dedupe_actions(actions)
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
                "next_action": (action.get("next_action") or "").strip().lower(),
            }
        )

    drafts_md_path.parent.mkdir(parents=True, exist_ok=True)
    drafts_md_path.write_text(build_markdown(drafts, manual_tasks), encoding="utf-8")
    write_outbox(outbox_path, drafts)

    print(
        "[SUMMARY] actions={actions} drafts={drafts} manual_tasks={manual}".format(
            actions=len(actions),
            drafts=len(drafts),
            manual=len(manual_tasks),
        )
    )
    print(f"[DRAFTS] {drafts_md_path.resolve()}")
    print(f"[OUTBOX] {outbox_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
