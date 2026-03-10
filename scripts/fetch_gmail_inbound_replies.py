#!/usr/bin/env python3
"""
Fetch Gmail inbox replies and export normalized rows for beta triage.

Output columns:
  email,subject,body,received_at,from_name,message_id,in_reply_to
"""

from __future__ import annotations

import argparse
import csv
import imaplib
import json
import re
from datetime import datetime, timedelta, timezone
from email import message_from_bytes
from email.header import decode_header
from email.message import Message
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path
from typing import Dict, List


DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_v1.2.1-OMEGA.csv")
DEFAULT_OUTPUT = Path("release/inbound_replies.csv")
DEFAULT_STATE = Path("release/gmail-inbound-state.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--state-file", default=str(DEFAULT_STATE))
    parser.add_argument("--imap-host", default="imap.gmail.com")
    parser.add_argument("--imap-port", type=int, default=993)
    parser.add_argument("--mailbox", default="INBOX")
    parser.add_argument("--user", default="")
    parser.add_argument("--app-password", default="")
    parser.add_argument("--self-email", default="")
    parser.add_argument("--since-days", type=int, default=7)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--merge-existing", action="store_true")
    parser.add_argument("--ignore-state", action="store_true")
    parser.add_argument("--include-unmatched", action="store_true")
    parser.add_argument("--mark-seen", action="store_true")
    return parser.parse_args()


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def decode_mime(value: str) -> str:
    if not value:
        return ""
    chunks: List[str] = []
    for part, encoding in decode_header(value):
        if isinstance(part, bytes):
            chunks.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            chunks.append(str(part))
    return "".join(chunks).strip()


def html_to_text(html: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", html)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)</p>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()


def decode_payload(part: Message) -> str:
    payload = part.get_payload(decode=True) or b""
    charset = part.get_content_charset() or "utf-8"
    return payload.decode(charset, errors="replace")


def extract_text_body(msg: Message) -> str:
    plain_parts: List[str] = []
    html_parts: List[str] = []

    if msg.is_multipart():
        for part in msg.walk():
            disposition = (part.get("Content-Disposition") or "").lower()
            if "attachment" in disposition:
                continue
            content_type = (part.get_content_type() or "").lower()
            if content_type == "text/plain":
                plain_parts.append(decode_payload(part))
            elif content_type == "text/html":
                html_parts.append(decode_payload(part))
    else:
        content_type = (msg.get_content_type() or "").lower()
        if content_type == "text/plain":
            plain_parts.append(decode_payload(msg))
        elif content_type == "text/html":
            html_parts.append(decode_payload(msg))

    if plain_parts:
        text = "\n\n".join(part.strip() for part in plain_parts if part.strip())
    elif html_parts:
        text = "\n\n".join(html_to_text(part) for part in html_parts if part.strip())
    else:
        text = ""

    return re.sub(r"\r\n?", "\n", text).strip()


def load_tracker_contacts(path: Path) -> set[str]:
    contacts: set[str] = set()
    if not path.exists():
        return contacts
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            email = (row.get("email") or "").strip().lower()
            if email:
                contacts.add(email)
    return contacts


def load_state(path: Path) -> Dict[str, object]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_state(path: Path, state: Dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def parse_message_datetime(msg: Message) -> datetime:
    raw_date = decode_mime(msg.get("Date", ""))
    if raw_date:
        try:
            parsed = parsedate_to_datetime(raw_date)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except (TypeError, ValueError):
            pass
    return now_utc()


def read_existing_rows(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def dedupe_rows(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    seen: set[str] = set()
    deduped: List[Dict[str, str]] = []
    for row in rows:
        message_id = (row.get("message_id") or "").strip()
        if message_id:
            key = f"mid:{message_id}"
        else:
            key = "row:{email}|{subject}|{received_at}".format(
                email=(row.get("email") or "").strip().lower(),
                subject=(row.get("subject") or "").strip().lower(),
                received_at=(row.get("received_at") or "").strip(),
            )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    return deduped


def sort_rows(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    def key(row: Dict[str, str]) -> tuple[str, str]:
        return ((row.get("received_at") or "").strip(), (row.get("email") or "").strip().lower())

    return sorted(rows, key=key)


def write_rows(path: Path, rows: List[Dict[str, str]]) -> None:
    fieldnames = ["email", "subject", "body", "received_at", "from_name", "message_id", "in_reply_to"]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def fetch_rows(args: argparse.Namespace, known_contacts: set[str]) -> tuple[List[Dict[str, str]], Dict[str, object]]:
    user = (args.user or "").strip()
    password = (args.app_password or "").strip().replace(" ", "")
    if not user:
        raise RuntimeError("Missing --user (Gmail address).")
    if not password:
        raise RuntimeError("Missing --app-password (Google app password).")

    self_email = ((args.self_email or user) or "").strip().lower()
    state = load_state(Path(args.state_file))
    last_uid = int(state.get("last_uid", 0) or 0)

    client = imaplib.IMAP4_SSL(args.imap_host, args.imap_port)
    try:
        client.login(user, password)
        status, _ = client.select(args.mailbox, readonly=not args.mark_seen)
        if status != "OK":
            raise RuntimeError(f"Unable to select mailbox: {args.mailbox}")

        if last_uid > 0 and not args.ignore_state:
            criteria = f"(UID {last_uid + 1}:*)"
        else:
            since_date = (now_utc() - timedelta(days=max(args.since_days, 0))).strftime("%d-%b-%Y")
            criteria = f"(SINCE {since_date})"

        status, data = client.uid("search", None, criteria)
        if status != "OK":
            raise RuntimeError(f"UID search failed for criteria: {criteria}")
        raw_uids = data[0].split() if data and data[0] else []
        if not raw_uids:
            meta = {
                "criteria": criteria,
                "last_uid_before": last_uid,
                "last_uid_after": last_uid,
                "searched_count": 0,
                "processed_count": 0,
            }
            return [], meta

        if args.limit > 0:
            selected_uids = raw_uids[-args.limit :]
        else:
            selected_uids = raw_uids

        rows: List[Dict[str, str]] = []
        for uid in selected_uids:
            status, msg_data = client.uid("fetch", uid, "(BODY.PEEK[] FLAGS)")
            if status != "OK":
                continue
            raw_bytes = b""
            for part in msg_data:
                if isinstance(part, tuple) and len(part) >= 2 and isinstance(part[1], (bytes, bytearray)):
                    raw_bytes = bytes(part[1])
                    break
            if not raw_bytes:
                continue

            msg = message_from_bytes(raw_bytes)
            from_name, from_email = parseaddr(decode_mime(msg.get("From", "")))
            from_email = (from_email or "").strip().lower()
            if not from_email:
                continue
            if self_email and from_email == self_email:
                continue

            subject = decode_mime(msg.get("Subject", ""))
            body = extract_text_body(msg)
            lowered = f"{subject}\n{body}".lower()
            is_known_contact = from_email in known_contacts
            is_neuralshell_related = "neuralshell" in lowered
            if not args.include_unmatched and not is_known_contact and not is_neuralshell_related:
                continue

            received_at = iso_utc(parse_message_datetime(msg))
            message_id = decode_mime(msg.get("Message-ID", ""))
            in_reply_to = decode_mime(msg.get("In-Reply-To", ""))

            rows.append(
                {
                    "email": from_email,
                    "subject": subject,
                    "body": body,
                    "received_at": received_at,
                    "from_name": from_name.strip(),
                    "message_id": message_id,
                    "in_reply_to": in_reply_to,
                }
            )

            if args.mark_seen:
                client.uid("store", uid, "+FLAGS", "(\\Seen)")

        searched_uids = [int(uid.decode("utf-8", errors="ignore") or "0") for uid in raw_uids]
        selected_uid_numbers = [int(uid.decode("utf-8", errors="ignore") or "0") for uid in selected_uids]
        max_seen_uid = max(selected_uid_numbers) if selected_uid_numbers else last_uid
        max_search_uid = max(searched_uids) if searched_uids else last_uid
        meta = {
            "criteria": criteria,
            "last_uid_before": last_uid,
            "last_uid_after": max(max_seen_uid, max_search_uid),
            "searched_count": len(raw_uids),
            "processed_count": len(rows),
        }
        return rows, meta
    finally:
        try:
            client.logout()
        except Exception:
            pass


def main() -> int:
    args = parse_args()
    tracker_path = Path(args.tracker)
    output_path = Path(args.output)
    state_path = Path(args.state_file)

    known_contacts = load_tracker_contacts(tracker_path)
    rows, meta = fetch_rows(args, known_contacts)

    if args.merge_existing:
        rows = read_existing_rows(output_path) + rows
    rows = sort_rows(dedupe_rows(rows))
    write_rows(output_path, rows)

    state = load_state(state_path)
    state.update(
        {
            "updated_at": iso_utc(now_utc()),
            "mailbox": args.mailbox,
            "imap_host": args.imap_host,
            "last_uid": meta.get("last_uid_after", state.get("last_uid", 0)),
            "criteria": meta.get("criteria", ""),
        }
    )
    save_state(state_path, state)

    print(
        "[SUMMARY] exported={exported} fetched_now={fetched_now} searched={searched} criteria={criteria}".format(
            exported=len(rows),
            fetched_now=meta.get("processed_count", 0),
            searched=meta.get("searched_count", 0),
            criteria=meta.get("criteria", ""),
        )
    )
    print(f"[OUTPUT] {output_path.resolve()}")
    print(f"[STATE]  {state_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

