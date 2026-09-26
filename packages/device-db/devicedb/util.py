"""Shared helpers: polite cached HTTP, console, ids, time."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
OUT = DATA / "out"

UA = "FixMyPhoneDeviceDB/0.1 (+https://fixmyphone.local; device-db pipeline)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_dirs() -> None:
    for p in (DATA, RAW, OUT, RAW / "lineageos", RAW / "play"):
        p.mkdir(parents=True, exist_ok=True)


def slug(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]


def fetch(url: str, *, cache_dir: Path | None = None, refresh: bool = False,
          retries: int = 3, timeout: int = 60) -> tuple[bytes, dict]:
    """Fetch with on-disk cache. Returns (body, meta)."""
    cache_dir = cache_dir or RAW
    cache_dir.mkdir(parents=True, exist_ok=True)
    key = slug(url)
    body_path = cache_dir / f"{key}.bin"
    meta_path = cache_dir / f"{key}.meta.json"

    if body_path.exists() and meta_path.exists() and not refresh:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        if meta.get("status") == 200:
            return body_path.read_bytes(), meta

    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": UA,
                    "Accept": "*/*",
                    "Accept-Encoding": "identity",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read()
                meta = {
                    "url": url,
                    "status": resp.status,
                    "etag": resp.headers.get("ETag"),
                    "last_modified": resp.headers.get("Last-Modified"),
                    "content_length": len(body),
                    "retrieved_at": now_iso(),
                }
                body_path.write_bytes(body)
                meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
                return body, meta
        except urllib.error.HTTPError as exc:
            last_err = exc
            if exc.code in (404, 403, 401):
                meta = {"url": url, "status": exc.code, "retrieved_at": now_iso(),
                        "error": str(exc)}
                meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
                return b"", meta
            time.sleep(1.5 * (attempt + 1))
        except Exception as exc:  # noqa: BLE001 - network is allowed to be flaky
            last_err = exc
            time.sleep(1.5 * (attempt + 1))

    meta = {"url": url, "status": 0, "retrieved_at": now_iso(), "error": str(last_err)}
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return b"", meta


# ---------------------------------------------------------------- console

_T0 = time.time()


def log(msg: str) -> None:
    print(f"[{time.time() - _T0:7.1f}s] {msg}", flush=True)


class Stage:
    def __init__(self, name: str):
        self.name = name

    def __enter__(self):
        log(f"-> {self.name}")
        self.t0 = time.time()
        return self

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            log(f"   {self.name} OK ({time.time() - self.t0:.1f}s)")
        else:
            log(f"   {self.name} FAILED: {exc}")
        return False


def table(rows: list[dict], columns: list[str], limit: int = 20) -> None:
    if not rows:
        print("   (sin datos)")
        return
    widths = {c: len(c) for c in columns}
    sample = rows[:limit]
    for r in sample:
        for c in columns:
            widths[c] = max(widths[c], len(str(r.get(c, "") or "")))
    line = "   " + "  ".join(c.ljust(widths[c]) for c in columns)
    print(line)
    print("   " + "  ".join("-" * widths[c] for c in columns))
    for r in sample:
        print("   " + "  ".join(str(r.get(c, "") or "").ljust(widths[c]) for c in columns))
    if len(rows) > limit:
        print(f"   ... +{len(rows) - limit} mas")
