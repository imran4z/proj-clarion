# Clarion app — full self-observability for Grafana Cloud

Lights up the **Clarion app's own stack** in Grafana Cloud / Asserts under
`env = clarion`: the FastAPI service, its Postgres database, and the host —
correlated so the **RCA workbench** works. This is separate from the
synthetic *demo* telemetry Clarion generates (that's scoped per-customer).

## What emits what

| Layer | Source | Signal | Where it shows |
|---|---|---|---|
| Service + APIs + agents + LLM | the app itself, via OTLP (`src/proj_clarion/observability`) | traces + RED span-metrics + process metrics | Asserts **Service** `proj-clarion`, env=clarion |
| Per-query DB details | this collector → `database_observability.postgres` → Loki | query samples / schema / EXPLAIN | GC **Database Observability** (every query → detail page) |
| Postgres infra | this collector → `prometheus.exporter.postgres` → Mimir | `pg_up`, connections, locks, replication | Asserts **DataStore** entity, env=clarion |
| Host infra | this collector → `prometheus.exporter.unix` → Mimir | CPU / mem / disk / net | Asserts **Node** entity, env=clarion |

The **app side is already done in code** (env=clarion, FastAPI http.server
spans, process metrics) — it pushes via the OTLP path the app already uses.
This collector adds the DB + host layers a Python process can't emit itself.

## One-time Postgres prep (server side)

Reuse the files in [`../db-observability/`](../db-observability/):

1. Add [`postgresql.conf.snippet`](../db-observability/postgresql.conf.snippet)
   to `postgresql.conf` (enables `pg_stat_statements` + `track_io_timing`),
   then restart Postgres.
2. Run [`init-monitoring-user.sql`](../db-observability/init-monitoring-user.sql)
   as a superuser to create the least-privilege `grafana_dbo11y` role.

> Local docker Postgres: exec into `clarion-postgres` and apply the SQL;
> the conf snippet goes in the container's `postgresql.conf` (or pass
> `-c shared_preload_libraries=pg_stat_statements` and restart).

## Run the collector

```bash
cd deploy/clarion-obs
cp .env.example .env      # fill in Cloud push URLs/usernames + DSN (see .env.example)
docker compose up -d
open http://localhost:12346   # every component Healthy: true
```

Endpoints + usernames are in **Grafana Cloud → Connections → Prometheus /
Loki → "Send Metrics" / "Send Logs"**. The token needs `metrics:write` +
`logs:write`.

## Verify (≈2 min after start)

- **KG / Asserts** → set the env filter to **`clarion`** → you should see
  the `proj-clarion` service, the Postgres DataStore, and the host Node,
  joined by their RED + infra metrics. → **RCA workbench** can now reason
  across them.
- **Connections → Database Observability** → every query (not just COMMIT)
  has an `instance` and a clickable detail page.

Quick CLI checks (Grafana SE `gcx`):

```bash
gcx metrics query 'count by (job) ({asserts_env="clarion"})' --since 15m -o json
gcx metrics query 'pg_up{asserts_env="clarion"}'            --since 15m -o json
gcx metrics query 'count(node_cpu_seconds_total{asserts_env="clarion"})' --since 15m -o json
```

## Notes

- **macOS/Windows host metrics**: the node exporter reads the Docker
  LinuxKit VM, not the host OS — enough to draw a Node entity in dev. Run
  this on the Linux host in prod for real host metrics.
- **No PgBouncer** between Alloy and Postgres — the query-sample collector
  needs stable session access to `pg_stat_*`.
- The instance label on DB metrics/queries comes from the DSN host — keep
  it stable (e.g. always `host.docker.internal:5432`) so the Service →
  DataStore join and the query detail pages line up.
</content>
