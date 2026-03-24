#!/usr/bin/env python3
"""
Classify inbound beta outreach replies and update tracker rows.

Input file format (.csv or .jsonl):
  email,subject,body,received_at,from_name

Examples:
  python scripts/triage_beta_inbound_replies.py --input release/inbound_replies.csv
  python scripts/triage_beta_inbound_replies.py --input release/inbound_replies.csv --apply
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Tuple


DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_V2.0-RC-Final.csv")
DEFAULT_INPUT = Path("release/inbound_replies.csv")
DEFAULT_REPORT = Path("release/beta-inbound-triage-report.json")
DEFAULT_QUEUE = Path("release/beta-inbound-action-queue.md")

FINAL_STATES = {"completed", "declined", "bounced"}

STATE_RULES = {
    "bounced": {
        "keywords": [
            "mailer-daemon",
            "delivery status notification",
            "delivery failed",
            "undeliverable",
            "address not found",
            "mailbox unavailable",
            "returned mail",
            "recipient address rejected",
        ],
        "template": "none",
        "next_action": "replace_contact",
        "hours": 0,
    },
    "declined": {
        "keywords": [
            "not interested",
            "no thanks",
            "pass",
            "remove me",
            "unsubscribe",
            "do not contact",
            "dont contact",
            "can't help",
            "cannot help",
            "not a fit",
            "not relevant",
        ],
        "template": "6) Decline/Close Loop",
        "next_action": "closed",
        "hours": 0,
    },
    "completed": {
        "keywords": [
            "completed checklist",
            "finished checklist",
            "completed testing",
            "finished testing",
            "done testing",
            "done with the checklist",
        ],
        "template": "1) Positive Response (Tester Ready)",
        "next_action": "collect_feedback",
        "hours": 6,
    },
    "interested": {
        "keywords": [
            "interested",
            "sounds good",
            "happy to test",
            "would love to test",
            "count me in",
            "send details",
            "where can i download",
            "i can test",
            "i'll test",
            "lets do it",
            "let's do it",
        ],
        "template": "1) Positive Response (Tester Ready)",
        "next_action": "send_tester_packet",
        "hours": 1,
    },
    "routed": {
        "keywords": [
            "forwarded",
            "looping in",
            "please contact",
            "reach out to",
            "talk to",
            "connect with",
            "cc",
            "copied",
            "routing this",
            "submission form",
            "fill out this form",
            "create a free account",
            "being listed",
            "our team will reach out",
        ],
        "template": "3) Listing/Directory Routing",
        "next_action": "respond_to_route",
        "hours": 2,
    },
    "replied": {
        "keywords": [],
        "template": "2) Needs More Details (Security/Trust)",
        "next_action": "manual_review",
        "hours": 4,
    },
}

SUBJECT_PREFIX_RE = re.compile(r"^(re|fw|fwd)\s*:\s*", re.IGNORECASE)
GOOGLE_SECURITY_SENDERS = {
    "no-reply@accounts.google.com",
    "account-noreply@google.com",
}
GOOGLE_SECURITY_KEYWORDS = {
    "security alert",
    "app password created",
    "important changes to your google account",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default=str(DEFAULT_INPUT))
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--report", default=str(DEFAULT_REPORT))
    parser.add_argument("--queue", default=str(DEFAULT_QUEUE))
    parser.add_argument("--apply", action="store_true")
    return parser.parse_args()


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(raw: str) -> datetime | None:
    val = (raw or "").strip()
    if not val:
        return None
    if val.endswith("Z"):
        val = val[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(val)
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


def read_csv_rows(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def load_replies(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Reply input file not found: {path}")
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return read_csv_rows(path)
    if suffix == ".jsonl":
        rows: List[Dict[str, str]] = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                text = line.strip()
                if not text:
                    continue
                rows.append(json.loads(text))
        return rows
    raise RuntimeError(f"Unsupported input type: {suffix}. Use .csv or .jsonl")


def load_tracker(path: Path) -> Tuple[List[Dict[str, str]], List[str]]:
    if not path.exists():
        raise FileNotFoundError(f"Tracker not found: {path}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
        fieldnames = list(reader.fieldnames or [])
    if not fieldnames:
        raise RuntimeError(f"Tracker has no header: {path}")
    for row in rows:
        row.setdefault("response_state", "")
        row.setdefault("response_at", "")
        row.setdefault("last_touch_at", "")
        row.setdefault("next_action", "")
        row.setdefault("next_action_at", "")
        row.setdefault("touch_count", "0")
        row.setdefault("notes", "")
    return rows, fieldnames


def write_tracker(path: Path, rows: List[Dict[str, str]], fieldnames: List[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def append_note(row: Dict[str, str], note: str) -> None:
    existing = (row.get("notes") or "").strip()
    row["notes"] = note if not existing else f"{existing}; {note}"


def classify_reply(subject: str, body: str, email: str) -> Dict[str, str]:
    haystack = " ".join(
        [
            normalize_email(email),
            (subject or "").strip().lower(),
            (body or "").strip().lower(),
        ]
    )
    haystack = re.sub(r"\s+", " ", haystack)

    # Deterministic route for directory/vendor gatekeeper auto-replies.
    if normalize_email(email).endswith("@capterra.com") and (
        "gartner digital markets" in haystack
        or "create a free account" in haystack
        or "fill out this form" in haystack
    ):
        rule = STATE_RULES["routed"]
        return {
            "state": "routed",
            "confidence": "high",
            "matched": "directory_route_autoreply",
            "template": str(rule["template"]),
            "next_action": str(rule["next_action"]),
            "next_in_hours": str(rule["hours"]),
        }

    score: Dict[str, int] = {}
    matched: Dict[str, List[str]] = {}
    for state, rule in STATE_RULES.items():
        if not rule["keywords"]:
            continue
        for kw in rule["keywords"]:
            if kw in haystack:
                score[state] = score.get(state, 0) + 1
                matched.setdefault(state, []).append(kw)

    priority = ["bounced", "declined", "completed", "interested", "routed"]
    winner = ""
    winner_score = 0
    for state in priority:
        s = score.get(state, 0)
        if s > winner_score:
            winner = state
            winner_score = s
    if not winner:
        winner = "replied"

    rule = STATE_RULES[winner]
    return {
        "state": winner,
        "confidence": "high" if winner_score >= 2 else ("medium" if winner_score == 1 else "low"),
        "matched": ", ".join(matched.get(winner, [])),
        "template": str(rule["template"]),
        "next_action": str(rule["next_action"]),
        "next_in_hours": str(rule["hours"]),
    }


def bump_touch_count(raw: str) -> str:
    try:
        return str(max(int((raw or "0").strip() or "0"), 0) + 1)
    except ValueError:
        return "1"


def clip(text: str, length: int = 140) -> str:
    clean = re.sub(r"\s+", " ", (text or "").strip())
    return clean if len(clean) <= length else clean[: length - 3] + "..."


def is_operational_notice(email: str, subject: str, body: str) -> bool:
    sender = normalize_email(email)
    if sender not in GOOGLE_SECURITY_SENDERS:
        return False
    haystack = f"{subject} {body}".lower()
    return any(keyword in haystack for keyword in GOOGLE_SECURITY_KEYWORDS)


def build_queue_markdown(
    actions: List[Dict[str, str]],
    unmatched: List[Dict[str, str]],
    ignored: List[Dict[str, str]],
    duplicates: List[Dict[str, str]],
) -> str:
    lines = [
        "# Beta Inbound Action Queue",
        "",
        "Generated from inbound triage run.",
        "",
        "## Matched Replies",
        "| Contact | Reply To | Match Mode | State | Confidence | Recommended Template | Next Action | Excerpt |",
        "|---|---|---|---|---|---|---|---|",
    ]
    if actions:
        for item in actions:
            lines.append(
                "| {contact_email} | {reply_to} | {match_mode} | {state} | {confidence} | {template} | {next_action} | {excerpt} |".format(
                    contact_email=item.get("contact_email", ""),
                    reply_to=item.get("reply_to", ""),
                    match_mode=item.get("match_mode", ""),
                    state=item.get("state", ""),
                    confidence=item.get("confidence", ""),
                    template=item.get("template", ""),
                    next_action=item.get("next_action", ""),
                    excerpt=item.get("excerpt", "").replace("|", "/"),
                )
            )
    else:
        lines.append("| (none) |  |  |  |  |  |  |  |")

    lines.extend(
        [
            "",
            "## Unmatched Replies",
            "| Email | Subject | Excerpt |",
            "|---|---|---|",
        ]
    )
    if unmatched:
        for item in unmatched:
            lines.append(
                "| {email} | {subject} | {excerpt} |".format(
                    email=item.get("email", ""),
                    subject=clip(item.get("subject", "")).replace("|", "/"),
                    excerpt=clip(item.get("body", "")).replace("|", "/"),
                )
            )
    else:
        lines.append("| (none) |  |  |")

    lines.extend(
        [
            "",
            "## Ignored Operational Notices",
            "| Email | Subject | Excerpt |",
            "|---|---|---|",
        ]
    )
    if ignored:
        for item in ignored:
            lines.append(
                "| {email} | {subject} | {excerpt} |".format(
                    email=item.get("email", ""),
                    subject=clip(item.get("subject", "")).replace("|", "/"),
                    excerpt=clip(item.get("body", "")).replace("|", "/"),
                )
            )
    else:
        lines.append("| (none) |  |  |")

    lines.extend(
        [
            "",
            "## Duplicate Replies Skipped",
            "| Email | Subject | Message ID |",
            "|---|---|---|",
        ]
    )
    if duplicates:
        for item in duplicates:
            lines.append(
                "| {email} | {subject} | {message_id} |".format(
                    email=item.get("email", ""),
                    subject=clip(item.get("subject", "")).replace("|", "/"),
                    message_id=clip(item.get("message_id", ""), 160).replace("|", "/"),
                )
            )
    else:
        lines.append("| (none) |  |  |")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    tracker_path = Path(args.tracker)
    report_path = Path(args.report)
    queue_path = Path(args.queue)

    try:
        replies = load_replies(input_path)
    except FileNotFoundError:
        print(
            f"[ERROR] inbound reply file not found: {input_path}. "
            "Create it from docs/pilots/BETA_INBOUND_REPLY_IMPORT_TEMPLATE.csv",
            file=sys.stderr,
        )
        return 2

    tracker_rows, tracker_fields = load_tracker(tracker_path)
    tracker_by_email = {normalize_email(row.get("email", "")): row for row in tracker_rows}
    tracker_by_canonical_email: Dict[str, List[Dict[str, str]]] = {}
    for row in tracker_rows:
        key = canonical_email(row.get("email", ""))
        if key:
            tracker_by_canonical_email.setdefault(key, []).append(row)
    tracker_by_subject: Dict[str, List[Dict[str, str]]] = {}
    for row in tracker_rows:
        key = normalize_subject(row.get("subject", ""))
        if key:
            tracker_by_subject.setdefault(key, []).append(row)

    action_items: List[Dict[str, str]] = []
    unmatched: List[Dict[str, str]] = []
    ignored: List[Dict[str, str]] = []
    duplicates: List[Dict[str, str]] = []

    for idx, reply in enumerate(replies, start=1):
        email = normalize_email(str(reply.get("email", "")))
        subject = str(reply.get("subject", ""))
        body = str(reply.get("body", ""))
        message_id = str(reply.get("message_id", "")).strip()
        received_at = parse_iso(str(reply.get("received_at", ""))) or now_utc()

        if not email:
            unmatched.append({"email": "", "subject": subject, "body": body})
            continue

        if is_operational_notice(email, subject, body):
            ignored.append({"email": email, "subject": subject, "body": body})
            continue

        row = tracker_by_email.get(email)
        match_mode = "email"
        if not row:
            canonical_key = canonical_email(email)
            canonical_candidates = tracker_by_canonical_email.get(canonical_key, [])
            if len(canonical_candidates) == 1:
                row = canonical_candidates[0]
                match_mode = "canonical_email"
        if not row:
            subject_key = normalize_subject(subject)
            subject_candidates = tracker_by_subject.get(subject_key, [])
            if len(subject_candidates) == 1:
                row = subject_candidates[0]
                match_mode = "subject"
        if not row:
            unmatched.append({"email": email, "subject": subject, "body": body})
            continue

        if message_id and f"INBOUND_MSG:{message_id}" in (row.get("notes") or ""):
            duplicates.append(
                {
                    "email": email,
                    "subject": subject,
                    "message_id": message_id,
                }
            )
            continue

        classification = classify_reply(subject, body, email)
        state = classification["state"]
        next_action = classification["next_action"]
        next_hours = int(classification["next_in_hours"])

        if state in FINAL_STATES:
            next_action_at = ""
        else:
            next_action_at = iso_utc(received_at + timedelta(hours=next_hours))

        if args.apply:
            row["response_state"] = state
            row["response_at"] = iso_utc(received_at)
            row["last_touch_at"] = iso_utc(received_at)
            row["next_action"] = next_action
            row["next_action_at"] = next_action_at
            row["touch_count"] = bump_touch_count(row.get("touch_count", "0"))
            append_note(
                row,
                "INBOUND_TRIAGE:{at}:{state}:{confidence}:{matched}".format(
                    at=iso_utc(now_utc()),
                    state=state,
                    confidence=classification["confidence"],
                    matched=classification["matched"] or "none",
                ),
            )
            if email and email != normalize_email(row.get("email", "")):
                append_note(row, f"INBOUND_SOURCE:{iso_utc(now_utc())}:{email}")
            if message_id:
                append_note(row, f"INBOUND_MSG:{message_id}")

        action_items.append(
            {
                "index": str(idx),
                "email": email,
                "contact_email": normalize_email(row.get("email", "")),
                "reply_to": email,
                "match_mode": match_mode,
                "state": state,
                "confidence": classification["confidence"],
                "matched": classification["matched"],
                "template": classification["template"],
                "next_action": next_action,
                "next_action_at": next_action_at,
                "subject": subject,
                "excerpt": clip(body),
            }
        )

    if args.apply:
        write_tracker(tracker_path, tracker_rows, tracker_fields)

    queue_path.parent.mkdir(parents=True, exist_ok=True)
    queue_path.write_text(
        build_queue_markdown(action_items, unmatched, ignored, duplicates),
        encoding="utf-8",
    )

    report = {
        "generatedAt": iso_utc(now_utc()),
        "apply": bool(args.apply),
        "input": str(input_path),
        "tracker": str(tracker_path),
        "processed": len(replies),
        "matched": len(action_items),
        "unmatched": len(unmatched),
        "ignored": len(ignored),
        "duplicates": len(duplicates),
        "actions": action_items,
        "unmatchedItems": unmatched,
        "ignoredItems": ignored,
        "duplicateItems": duplicates,
        "queuePath": str(queue_path),
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(
        "[SUMMARY] processed={processed} matched={matched} unmatched={unmatched} apply={apply}".format(
            processed=len(replies),
            matched=len(action_items),
            unmatched=len(unmatched),
            apply=args.apply,
        )
    )
    print(f"[REPORT] {report_path.resolve()}")
    print(f"[QUEUE]  {queue_path.resolve()}")

    if unmatched:
        print(f"[WARN] unmatched_replies={len(unmatched)}")
    if ignored:
        print(f"[INFO] ignored_operational={len(ignored)}")
    if duplicates:
        print(f"[INFO] duplicate_replies_skipped={len(duplicates)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
