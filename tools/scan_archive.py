#!/usr/bin/env python3
"""
scan_archive.py

Reads a .json.gz archive of conversations/messages, normalizes message records,
and writes JSONL to out/all_messages.jsonl.

Design goals:
- Python stdlib only
- Robust to schema variance
- Deterministic output (stable msg_id hashing; stable field ordering)
"""

from __future__ import annotations

import datetime as _dt
import gzip
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, Iterator, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"
OUT_JSONL = OUT_DIR / "all_messages.jsonl"


WIN_PATH_RE = re.compile(r"\b[A-Za-z]:\\[^\r\n\t\"<>|?*]+")
UNIX_PATH_RE = re.compile(r"(?<![A-Za-z0-9_])/(?:[^ \r\n\t\"']+/)*[^ \r\n\t\"']+")
FILE_REF_RE = re.compile(
    r"\b[\w.\-\\/]+?\.(?:js|cjs|mjs|ts|tsx|yml|yaml|md|json|gz|zip|bat|ps1|sh|txt|html|css|log)\b",
    re.IGNORECASE,
)


def _iso_utc_from_unix_seconds(value: float) -> str:
    dt = _dt.datetime.fromtimestamp(value, tz=_dt.timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def _parse_timestamp(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        try:
            return _iso_utc_from_unix_seconds(float(value))
        except Exception:
            return None
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        # Common: ISO 8601, sometimes with Z.
        try:
            if s.endswith("Z"):
                # Python fromisoformat doesn't accept "Z" directly in all versions.
                dt = _dt.datetime.fromisoformat(s[:-1]).replace(tzinfo=_dt.timezone.utc)
                return dt.isoformat().replace("+00:00", "Z")
            dt = _dt.datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=_dt.timezone.utc)
            return dt.astimezone(_dt.timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception:
            return None
    return None


def _stable_msg_id(*parts: str) -> str:
    h = hashlib.sha256()
    for part in parts:
        h.update(part.encode("utf-8", errors="replace"))
        h.update(b"\n")
    return h.hexdigest()[:32]


def _stringify_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(_stringify_content(p) for p in content).strip()
    if isinstance(content, dict):
        # Common export shapes:
        # {"content_type":"text","parts":[...]}
        if "parts" in content and isinstance(content.get("parts"), list):
            return "\n".join(_stringify_content(p) for p in content["parts"]).strip()
        if "text" in content and isinstance(content.get("text"), str):
            return content["text"]
        if "value" in content and isinstance(content.get("value"), str):
            return content["value"]
        # Fallback: best-effort serialize small dicts.
        try:
            return json.dumps(content, ensure_ascii=False, sort_keys=True)
        except Exception:
            return str(content)
    return str(content)


def _extract_speaker(message: Dict[str, Any]) -> str:
    # Try common shapes first.
    author = message.get("author")
    if isinstance(author, dict):
        role = author.get("role")
        if isinstance(role, str) and role.strip():
            return role.strip()
    role = message.get("role")
    if isinstance(role, str) and role.strip():
        return role.strip()
    sender = message.get("sender")
    if isinstance(sender, str) and sender.strip():
        return sender.strip()
    return "unknown"


def _extract_text(message: Dict[str, Any]) -> str:
    if "text" in message and isinstance(message.get("text"), str):
        return message["text"]
    content = message.get("content")
    text = _stringify_content(content)
    if not text and "message" in message and isinstance(message.get("message"), str):
        return message["message"]
    return text


def _extract_paths(text: str) -> List[str]:
    if not text:
        return []
    hits: List[str] = []
    for m in WIN_PATH_RE.finditer(text):
        hits.append(m.group(0).rstrip(").,;:'\""))
    for m in UNIX_PATH_RE.finditer(text):
        hits.append(m.group(0).rstrip(").,;:'\""))
    for m in FILE_REF_RE.finditer(text):
        hits.append(m.group(0).rstrip(").,;:'\""))
    # Deduplicate while preserving order.
    seen = set()
    out: List[str] = []
    for h in hits:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return out


def _json_stream_read(stream, chunk_size: int = 65536) -> Iterator[str]:
    while True:
        chunk = stream.read(chunk_size)
        if not chunk:
            break
        yield chunk


def _iter_top_level_array(stream) -> Iterator[Any]:
    """
    Incrementally parse a top-level JSON array from a text stream and yield items.
    """
    decoder = json.JSONDecoder()
    buf = ""
    idx = 0
    # Fill until we see '['
    for chunk in _json_stream_read(stream):
        buf += chunk
        while True:
            while idx < len(buf) and buf[idx].isspace():
                idx += 1
            if idx >= len(buf):
                break
            if buf[idx] == "[":
                idx += 1
                break
            # Not an array; bail to caller.
            raise ValueError("Top-level JSON is not an array.")
        if idx > 0:
            break

    while True:
        # Ensure we have enough buffer.
        if idx >= len(buf):
            try:
                buf += next(_json_stream_read(stream))
            except StopIteration:
                break

        # Skip whitespace/commas.
        while True:
            while idx < len(buf) and buf[idx].isspace():
                idx += 1
            if idx < len(buf) and buf[idx] == ",":
                idx += 1
                continue
            break

        if idx >= len(buf):
            chunk = stream.read(65536)
            if not chunk:
                break
            buf += chunk
            continue

        if buf[idx] == "]":
            return

        # Parse one value.
        try:
            value, end = decoder.raw_decode(buf, idx)
        except json.JSONDecodeError:
            chunk = stream.read(65536)
            if not chunk:
                raise
            buf += chunk
            continue

        yield value
        idx = end

        # Trim buffer periodically.
        if idx > 1_000_000:
            buf = buf[idx:]
            idx = 0


def _iter_message_dicts_from_conversation(convo: Any) -> Iterator[Tuple[Dict[str, Any], str]]:
    """
    Yield (message_dict, source_hint) pairs from a conversation object.
    """
    if not isinstance(convo, dict):
        return

    # ChatGPT export: mapping of nodes, each node has "message".
    mapping = convo.get("mapping")
    if isinstance(mapping, dict):
        for node_id, node in mapping.items():
            if not isinstance(node, dict):
                continue
            msg = node.get("message")
            if isinstance(msg, dict):
                yield msg, f"mapping:{node_id}"
        return

    # Alternate schema: explicit list of messages.
    messages = convo.get("messages")
    if isinstance(messages, list):
        for i, msg in enumerate(messages):
            if isinstance(msg, dict):
                yield msg, f"messages:{i}"
        return

    # Fallback: recursive search for dicts that look like messages.
    stack: List[Tuple[Any, str]] = [(convo, "root")]
    while stack:
        cur, path = stack.pop()
        if isinstance(cur, dict):
            if ("role" in cur or "author" in cur) and ("content" in cur or "text" in cur):
                yield cur, f"found:{path}"
            for k, v in cur.items():
                stack.append((v, f"{path}.{k}"))
        elif isinstance(cur, list):
            for i, v in enumerate(cur):
                stack.append((v, f"{path}[{i}]"))


def _extract_thread_meta(convo: Dict[str, Any], convo_index: int) -> Tuple[str, str]:
    title = convo.get("title") or convo.get("thread_title") or convo.get("chat_title") or ""
    if not isinstance(title, str):
        title = ""
    thread_id = (
        convo.get("id")
        or convo.get("conversation_id")
        or convo.get("thread_id")
        or convo.get("uuid")
        or ""
    )
    if not isinstance(thread_id, str):
        thread_id = ""
    if not thread_id:
        thread_id = f"convo_index:{convo_index}"
    return title.strip(), thread_id.strip()


def normalize_archive(input_path: Path) -> Dict[str, Any]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    totals = {
        "total_messages": 0,
        "user_messages": 0,
        "assistant_messages": 0,
        "system_messages": 0,
        "unknown_messages": 0,
        "earliest_ts": None,
        "latest_ts": None,
    }

    def _update_ts(ts_iso: Optional[str]) -> None:
        if not ts_iso:
            return
        # Compare lexicographically; ISO Z timestamps sort correctly.
        e = totals["earliest_ts"]
        l = totals["latest_ts"]
        if e is None or ts_iso < e:
            totals["earliest_ts"] = ts_iso
        if l is None or ts_iso > l:
            totals["latest_ts"] = ts_iso

    # Detect top-level type without relying on generator exception timing.
    with gzip.open(str(input_path), "rt", encoding="utf-8", errors="replace") as f:
        preview = f.read(8192)
    first_nonws = ""
    for ch in preview:
        if not ch.isspace():
            first_nonws = ch
            break

    seq = 0
    with open(OUT_JSONL, "w", encoding="utf-8", newline="\n") as out:
        if first_nonws == "[":
            with gzip.open(str(input_path), "rt", encoding="utf-8", errors="replace") as f:
                convo_iter = _iter_top_level_array(f)
                for convo_index, convo in enumerate(convo_iter):
                    if not isinstance(convo, dict):
                        continue
                    thread_title, thread_id = _extract_thread_meta(convo, convo_index)
                    for msg, source_hint in _iter_message_dicts_from_conversation(convo):
                        speaker_raw = _extract_speaker(msg)
                        speaker = speaker_raw.lower()
                        if speaker not in ("user", "assistant", "system"):
                            speaker = "unknown"

                        ts = _parse_timestamp(
                            msg.get("create_time")
                            or msg.get("created_at")
                            or msg.get("timestamp")
                            or msg.get("time")
                            or msg.get("date")
                        )
                        text = _extract_text(msg)
                        text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
                        paths = _extract_paths(text)

                        msg_source_id = ""
                        if isinstance(msg.get("id"), str):
                            msg_source_id = msg["id"]
                        msg_id = _stable_msg_id(thread_id, ts or "", speaker, msg_source_id, text[:4000])

                        record = {
                            "msg_id": msg_id,
                            "seq": seq,
                            "timestamp": ts,
                            "thread_id": thread_id,
                            "thread_title": thread_title,
                            "speaker": speaker,
                            "text": text,
                            "paths": paths,
                            "source_hint": source_hint,
                            "source_msg_id": msg_source_id or None,
                        }
                        out.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

                        seq += 1
                        totals["total_messages"] += 1
                        if speaker == "user":
                            totals["user_messages"] += 1
                        elif speaker == "assistant":
                            totals["assistant_messages"] += 1
                        elif speaker == "system":
                            totals["system_messages"] += 1
                        else:
                            totals["unknown_messages"] += 1
                        _update_ts(ts)
        else:
            with gzip.open(str(input_path), "rt", encoding="utf-8", errors="replace") as f:
                data = json.load(f)
            # Try common wrappers.
            if isinstance(data, dict) and isinstance(data.get("conversations"), list):
                convo_iter2 = iter(data["conversations"])
            elif isinstance(data, list):
                convo_iter2 = iter(data)
            else:
                convo_iter2 = iter([data])

            for convo_index, convo in enumerate(convo_iter2):
                if not isinstance(convo, dict):
                    continue
                thread_title, thread_id = _extract_thread_meta(convo, convo_index)
                for msg, source_hint in _iter_message_dicts_from_conversation(convo):
                    speaker_raw = _extract_speaker(msg)
                    speaker = speaker_raw.lower()
                    if speaker not in ("user", "assistant", "system"):
                        speaker = "unknown"

                    ts = _parse_timestamp(
                        msg.get("create_time")
                        or msg.get("created_at")
                        or msg.get("timestamp")
                        or msg.get("time")
                        or msg.get("date")
                    )
                    text = _extract_text(msg)
                    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
                    paths = _extract_paths(text)

                    msg_source_id = ""
                    if isinstance(msg.get("id"), str):
                        msg_source_id = msg["id"]
                    msg_id = _stable_msg_id(thread_id, ts or "", speaker, msg_source_id, text[:4000])

                    record = {
                        "msg_id": msg_id,
                        "seq": seq,
                        "timestamp": ts,
                        "thread_id": thread_id,
                        "thread_title": thread_title,
                        "speaker": speaker,
                        "text": text,
                        "paths": paths,
                        "source_hint": source_hint,
                        "source_msg_id": msg_source_id or None,
                    }
                    out.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")

                    seq += 1
                    totals["total_messages"] += 1
                    if speaker == "user":
                        totals["user_messages"] += 1
                    elif speaker == "assistant":
                        totals["assistant_messages"] += 1
                    elif speaker == "system":
                        totals["system_messages"] += 1
                    else:
                        totals["unknown_messages"] += 1
                    _update_ts(ts)

    return totals


def main(argv: List[str]) -> int:
    if len(argv) != 2:
        print("Usage: python tools/scan_archive.py /path/to/merged_conversations.json.gz", file=sys.stderr)
        return 2

    input_path = Path(argv[1])
    if not input_path.exists():
        print(f"ERROR: input file not found: {input_path}", file=sys.stderr)
        return 2

    stats = normalize_archive(input_path)

    print("SCAN_ARCHIVE: OK")
    print(f"input: {input_path}")
    print(f"output: {OUT_JSONL}")
    print(f"total_messages: {stats['total_messages']}")
    print(f"user_messages: {stats['user_messages']}")
    print(f"assistant_messages: {stats['assistant_messages']}")
    print(f"system_messages: {stats['system_messages']}")
    print(f"unknown_messages: {stats['unknown_messages']}")
    print(f"earliest_timestamp: {stats['earliest_ts']}")
    print(f"latest_timestamp: {stats['latest_ts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
