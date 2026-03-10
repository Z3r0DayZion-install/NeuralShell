#!/usr/bin/env python3
"""
Generate status snapshot from beta outreach tracker.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List


DEFAULT_TRACKER = Path("docs/pilots/BETA_OUTREACH_TRACKER_v1.2.1-OMEGA.csv")
DEFAULT_MD = Path("release/beta-outreach-status.md")
DEFAULT_JSON = Path("release/beta-outreach-status.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tracker", default=str(DEFAULT_TRACKER))
    parser.add_argument("--md", default=str(DEFAULT_MD))
    parser.add_argument("--json", default=str(DEFAULT_JSON))
    return parser.parse_args()


def parse_iso(raw: str) -> datetime | None:
    value = (raw or "").strip()
    if not value:
        return None
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_rows(path: Path) -> List[Dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def build_markdown(summary: Dict[str, object]) -> str:
    state_counts = summary["stateCounts"]
    lines = [
        "# Beta Outreach Status",
        "",
        f"Generated: {summary['generatedAt']}",
        "",
        "## Totals",
        f"- Total contacts: {summary['totalContacts']}",
        f"- Follow-up due now: {summary['followupDueNow']}",
        f"- Priority reply due now: {summary['priorityReplyDueNow']}",
        "",
        "## State Counts",
    ]
    for state, count in state_counts.items():
        lines.append(f"- {state}: {count}")

    lines.extend(
        [
            "",
            "## Due Follow-ups",
            "| Email | Next Action | Due At | State |",
            "|---|---|---|---|",
        ]
    )
    due_followups = summary["dueFollowups"]
    if due_followups:
        for row in due_followups:
            lines.append(
                f"| {row['email']} | {row['next_action']} | {row['next_action_at']} | {row['response_state']} |"
            )
    else:
        lines.append("| (none) |  |  |  |")

    lines.extend(
        [
            "",
            "## Priority Replies Due",
            "| Email | State | Next Action | Due At |",
            "|---|---|---|---|",
        ]
    )
    due_replies = summary["priorityRepliesDue"]
    if due_replies:
        for row in due_replies:
            lines.append(
                f"| {row['email']} | {row['response_state']} | {row['next_action']} | {row['next_action_at']} |"
            )
    else:
        lines.append("| (none) |  |  |  |")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    tracker_path = Path(args.tracker)
    if not tracker_path.exists():
        raise FileNotFoundError(f"Tracker not found: {tracker_path}")

    rows = load_rows(tracker_path)
    now = datetime.now(timezone.utc)
    states = Counter((row.get("response_state") or "unknown").strip() or "unknown" for row in rows)

    due_followups: List[Dict[str, str]] = []
    due_replies: List[Dict[str, str]] = []

    for row in rows:
        next_action = (row.get("next_action") or "").strip()
        due_at = parse_iso(row.get("next_action_at", ""))
        if not due_at:
            continue
        if due_at > now:
            continue

        state = (row.get("response_state") or "").strip()
        item = {
            "email": row.get("email", ""),
            "response_state": state,
            "next_action": next_action,
            "next_action_at": row.get("next_action_at", ""),
        }
        if next_action == "follow_up_72h":
            due_followups.append(item)
        if state in {"interested", "routed", "replied"}:
            due_replies.append(item)

    summary = {
        "generatedAt": iso_utc(now),
        "totalContacts": len(rows),
        "stateCounts": dict(sorted(states.items(), key=lambda x: x[0])),
        "followupDueNow": len(due_followups),
        "priorityReplyDueNow": len(due_replies),
        "dueFollowups": due_followups,
        "priorityRepliesDue": due_replies,
    }

    md_path = Path(args.md)
    json_path = Path(args.json)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.parent.mkdir(parents=True, exist_ok=True)

    md_path.write_text(build_markdown(summary), encoding="utf-8")
    json_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(
        "[SUMMARY] contacts={contacts} due_followups={fup} due_priority_replies={rep}".format(
            contacts=summary["totalContacts"],
            fup=summary["followupDueNow"],
            rep=summary["priorityReplyDueNow"],
        )
    )
    print(f"[MD]   {md_path.resolve()}")
    print(f"[JSON] {json_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

