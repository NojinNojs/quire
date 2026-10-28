#!/usr/bin/env python3
"""End-to-end checks against the local Supabase: auth, RLS, streak arithmetic, duplicate guard."""
from __future__ import annotations

import json
import secrets
import string
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
failures: list[str] = []


def env() -> dict[str, str]:
    return dict(
        line.split("=", 1) for line in (ROOT / ".env").read_text().splitlines() if "=" in line
    )


def status() -> dict:
    out = subprocess.run(
        ["supabase", "status", "-o", "json"], cwd=ROOT, capture_output=True, text=True
    ).stdout
    return json.loads(out)


def post(url: str, headers: dict[str, str], body: dict) -> tuple[int, Any]:
    args = ["curl", "-s", "-w", "\\n%{http_code}", "-X", "POST", url, "-H", "Content-Type: application/json"]
    for key, value in headers.items():
        args += ["-H", f"{key}: {value}"]
    args += ["-d", json.dumps(body)]
    out = subprocess.run(args, capture_output=True, text=True).stdout
    payload, code = out.rsplit("\n", 1)
    try:
        return int(code), json.loads(payload)
    except json.JSONDecodeError:
        return int(code), payload


def get(url: str, headers: dict[str, str]) -> tuple[int, Any]:
    args = ["curl", "-s", "-w", "\\n%{http_code}", url]
    for key, value in headers.items():
        args += ["-H", f"{key}: {value}"]
    out = subprocess.run(args, capture_output=True, text=True).stdout
    payload, code = out.rsplit("\n", 1)
    try:
        return int(code), json.loads(payload)
    except json.JSONDecodeError:
        return int(code), payload


def check(label: str, ok: bool, detail: str = "") -> None:
    print(f"{'ok  ' if ok else 'FAIL'} {label}{(' :: ' + detail) if detail and not ok else ''}")
    if not ok:
        failures.append(label)


def make_user(base: str, anon: str, service: str, tag: str) -> tuple[str, str]:
    email = f"{tag}.{secrets.token_hex(3)}@quire.local"
    password = "".join(secrets.choice(string.ascii_letters) for _ in range(20))
    _, user = post(
        f"{base}/auth/v1/admin/users",
        {"apikey": service, "Authorization": f"Bearer {service}"},
        {"email": email, "password": password, "email_confirm": True},
    )
    _, token = post(
        f"{base}/auth/v1/token?grant_type=password",
        {"apikey": anon},
        {"email": email, "password": password},
    )
    return user["id"], token["access_token"]


def main() -> int:
    variables = env()
    base = variables["VITE_SUPABASE_URL"]
    anon = variables["VITE_SUPABASE_ANON_KEY"]
    service = status()["SERVICE_ROLE_KEY"]

    owner, jwt = make_user(base, anon, service, "smoke")
    other, other_jwt = make_user(base, anon, service, "other")
    auth = {"apikey": anon, "Authorization": f"Bearer {jwt}"}
    other_auth = {"apikey": anon, "Authorization": f"Bearer {other_jwt}"}

    code, books = post(
        f"{base}/rest/v1/books",
        {**auth, "Prefer": "return=representation"},
        {
            "owner": owner,
            "title": "Bumi Manusia",
            "author": "Pramoedya Ananta Toer",
            "publisher": "Hasta Mitra",
            "year": 1980,
            "pages": 550,
            "ddc": "899.2213",
            "isbn": "9780140126938",
            "language": "id",
            "status": "want",
        },
    )
    check("insert a book", code == 201, f"status {code}")
    book_id = books[0]["id"] if code == 201 else None
    if book_id is None:
        print("cannot continue without a book")
        return 1

    code, seen = get(f"{base}/rest/v1/books?select=id", other_auth)
    check("row level security hides another shelf", code == 200 and seen == [], str(seen)[:80])

    code, duplicate = post(
        f"{base}/rest/v1/books", {**auth, "Prefer": "return=representation"},
        {"owner": owner, "title": "Bumi Manusia", "isbn": "9780140126938", "language": "id"},
    )
    check("duplicate ISBN refused", code == 409, str(duplicate)[:80])

    # the active-book rule is checked with its own account, so the streak run below has a clean shelf
    active_user, active_jwt = make_user(base, anon, service, "active")
    active_auth = {"apikey": anon, "Authorization": f"Bearer {active_jwt}", "Prefer": "return=representation"}
    first_code, _ = post(
        f"{base}/rest/v1/books", active_auth,
        {"owner": active_user, "title": "Anak Semua Bangsa", "language": "id", "status": "reading"},
    )
    second_code, second_body = post(
        f"{base}/rest/v1/books", active_auth,
        {"owner": active_user, "title": "Jejak Langkah", "language": "id", "status": "reading"},
    )
    check(
        "only one active book allowed",
        first_code == 201 and second_code == 409,
        f"{first_code}/{second_code} {str(second_body)[:60]}",
    )

    sequence = [
        ("2026-10-26", 1, False),
        ("2026-10-26", 1, False),
        ("2026-10-27", 2, False),
        ("2026-10-29", 3, True),
        ("2026-10-31", 1, False),
        ("2026-11-02", 2, True),
    ]
    for day, expected_current, expected_restored in sequence:
        _, result = post(
            f"{base}/rest/v1/rpc/log_pages", auth, {"p_book": book_id, "p_pages": 5, "p_day": day}
        )
        if not isinstance(result, list):
            check(f"streak {day}", False, f"unexpected payload {str(result)[:120]}")
            continue
        row = result[0]
        check(
            f"streak {day}",
            row["streak_current"] == expected_current and row["restored"] == expected_restored,
            str(row),
        )

    _, listing = get(f"{base}/rest/v1/progress_log?select=pages,day&day=eq.2026-10-26", auth)
    check("two logs on one day add up", listing and listing[0]["pages"] == 10, str(listing)[:80])

    if failures:
        print(f"\n{len(failures)} check(s) failed")
        return 1
    print("\nall database checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
