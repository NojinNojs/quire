"""Local Supabase validation and exact-user cleanup for the database smoke test."""
import ipaddress
import subprocess
from urllib.parse import urlsplit


def local_credentials(variables: dict[str, str], status: dict) -> tuple[str, str, str]:
    base = variables["VITE_SUPABASE_URL"].rstrip("/")
    anon = variables["VITE_SUPABASE_ANON_KEY"]
    parsed = urlsplit(base)
    host = parsed.hostname
    try:
        loopback = host == "localhost" or (host is not None and ipaddress.ip_address(host).is_loopback)
    except ValueError:
        loopback = False
    if (parsed.scheme not in ("http", "https") or not loopback or parsed.username or parsed.password
            or parsed.path or parsed.query or parsed.fragment
            or base != status["API_URL"].rstrip("/") or anon != status["ANON_KEY"]):
        raise ValueError(".env Supabase URL and anon key must match the local Supabase status")
    return base, anon, status["SERVICE_ROLE_KEY"]


def cleanup_users(base: str, service: str, user_ids: list[str]) -> None:
    errors = []
    for user_id in user_ids:
        try:
            result = subprocess.run(
                ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}", "-X", "DELETE",
                 f"{base}/auth/v1/admin/users/{user_id}", "-H", f"apikey: {service}",
                 "-H", f"Authorization: Bearer {service}"],
                capture_output=True, text=True,
            )
            if result.returncode or len(result.stdout) != 3 or not result.stdout.isdigit() or not result.stdout.startswith("2"):
                errors.append(f"{user_id}: HTTP {result.stdout or 'unavailable'}")
        except Exception as exc:
            errors.append(f"{user_id}: {type(exc).__name__}")
    if errors:
        raise RuntimeError("Failed to delete smoke users: " + "; ".join(errors))
