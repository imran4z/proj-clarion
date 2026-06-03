"""gcx target-stack safety.

Clarion shells out to `gcx` for ALL Grafana-Cloud writes (dashboards, alerts,
KG rules/entities, Grafana-Assistant refine). `gcx` is multi-context like
kubectl: its *current-context* can point at ANY stack the SE has access to —
including a customer's. Relying on that ambient context is how Clarion once
pushed a `clarion` dashboard folder into a customer's trial stack while the
SE thought it was hitting their own.

This module makes the gcx target **explicit and verified** so that can never
happen silently:

  - `resolve_gcx_context()` — the context NAME whose Grafana server matches
    Clarion's configured `GRAFANA_CLOUD_STACK_URL`. Honors an explicit
    `GCX_CONTEXT` override, otherwise auto-matches by host. It NEVER falls
    back to the ambient current-context.
  - It verifies the chosen context's server host equals the configured stack
    host and raises `GcxContextError` on any mismatch / ambiguity / missing
    config — callers ABORT rather than write to the wrong tenant.
  - `gcx_argv(*args)` → `["gcx", "--context", <verified>, *args]` — the single
    chokepoint EVERY gcx call site must build its command from. Never use a
    bare `["gcx", ...]` for anything that talks to a stack.

`list_contexts()` runs `gcx config list-contexts`, which is local + read-only
(it parses the on-disk gcx config, no tenant network call).
"""

from __future__ import annotations

import os
import shutil
import subprocess
from functools import lru_cache
from urllib.parse import urlparse

GCX_BINARY = "gcx"


class GcxContextError(RuntimeError):
    """Clarion can't confirm gcx's target stack matches the configured stack,
    so it refuses to run any gcx write. Message carries the exact remediation."""


def _host(url: str) -> str:
    u = (url or "").strip()
    if not u:
        return ""
    if "://" not in u:
        u = "https://" + u
    return (urlparse(u).hostname or "").lower().rstrip(".")


def _configured_stack_host() -> str:
    return _host(os.environ.get("GRAFANA_CLOUD_STACK_URL", ""))


def list_contexts(gcx_binary: str = GCX_BINARY) -> list[dict[str, str]]:
    """Parse `gcx config list-contexts` → [{name, server, current}].
    Local/read-only; returns [] if gcx is missing or the call fails."""
    if not shutil.which(gcx_binary):
        return []
    try:
        proc = subprocess.run(
            [gcx_binary, "config", "list-contexts", "--no-color", "--no-truncate"],
            capture_output=True, check=False, timeout=15,
        )
    except Exception:  # noqa: BLE001 — best-effort; treat any failure as "no contexts"
        return []
    out = proc.stdout.decode(errors="replace")
    rows: list[dict[str, str]] = []
    for line in out.splitlines():
        s = line.strip()
        if not s or s.upper().startswith("CURRENT"):
            continue
        toks = s.split()
        current = toks[0] == "*"
        rest = toks[1:] if current else toks
        if len(rest) < 2:
            continue
        # Server is a URL (no spaces) at the end; name immediately precedes it.
        rows.append({"name": rest[-2], "server": rest[-1], "current": "true" if current else ""})
    return rows


@lru_cache(maxsize=8)
def resolve_gcx_context(stack_url: str | None = None) -> str:
    """Return the gcx context NAME that targets Clarion's configured stack,
    verified by host. Raises GcxContextError if it can't be confirmed — the
    caller must NOT push when this raises."""
    stack_host = _host(stack_url) if stack_url else _configured_stack_host()
    if not stack_host:
        raise GcxContextError(
            "GRAFANA_CLOUD_STACK_URL is not set — Clarion can't confirm which Grafana "
            "stack gcx should target. Set it in .env before provisioning."
        )
    contexts = list_contexts()
    if not contexts:
        raise GcxContextError(
            "Couldn't read any gcx contexts (`gcx config list-contexts`). Is gcx installed "
            "and logged in? Run `gcx login`."
        )

    override = (os.environ.get("GCX_CONTEXT") or "").strip()
    if override:
        match = next((c for c in contexts if c["name"] == override), None)
        if match is None:
            raise GcxContextError(
                f"GCX_CONTEXT={override!r} is not a known gcx context "
                f"(known: {', '.join(c['name'] for c in contexts)})."
            )
        if _host(match["server"]) != stack_host:
            raise GcxContextError(
                f"GCX_CONTEXT={override!r} targets {match['server']}, but GRAFANA_CLOUD_STACK_URL "
                f"is {stack_host}. Refusing to push to a different stack — point GCX_CONTEXT at the "
                f"context for {stack_host}."
            )
        return override

    matches = [c for c in contexts if _host(c["server"]) == stack_host]
    if len(matches) == 1:
        return matches[0]["name"]
    if not matches:
        listing = ", ".join(f"{c['name']}→{_host(c['server'])}" for c in contexts)
        raise GcxContextError(
            f"No gcx context targets {stack_host} (your GRAFANA_CLOUD_STACK_URL). gcx contexts: "
            f"[{listing}]. Add/login a context for {stack_host}, then set GCX_CONTEXT or "
            f"`gcx config use-context <name>`."
        )
    raise GcxContextError(
        f"Multiple gcx contexts target {stack_host}: {', '.join(c['name'] for c in matches)}. "
        f"Set GCX_CONTEXT to the one you want."
    )


def gcx_argv(*args: str, stack_url: str | None = None, gcx_binary: str = GCX_BINARY) -> list[str]:
    """Build a gcx command pinned to Clarion's *verified* target context.

    USE THIS for every gcx invocation that talks to a stack — never a bare
    `["gcx", ...]`. Raises GcxContextError (caller aborts) if the target can't
    be confirmed to equal GRAFANA_CLOUD_STACK_URL."""
    ctx = resolve_gcx_context(stack_url)
    return [gcx_binary, "--context", ctx, *args]
