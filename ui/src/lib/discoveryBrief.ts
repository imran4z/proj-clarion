/**
 * Discovery Brief exporter — turns a researched CompanyProfile into a
 * polished, self-contained HTML deliverable an SE can hand to an AE for
 * a discovery call, share with the account team, or feed to an internal
 * sales AI assistant.
 *
 * Self-contained (inline CSS, light/printable), so it opens cleanly in
 * any browser and prints straight to PDF. The closing "For a sales AI
 * assistant" block is a compact, copy-pasteable structured summary.
 */

// Loose shape — mirrors the fields of the profile JSON we render. All
// optional; we render whatever is present.
export interface BriefProfile {
  company?: {
    name?: string; legal_name?: string; primary_url?: string;
    headquarters_city?: string; headquarters_country?: string;
    founded_year?: number; ownership_type?: string; employee_count_estimate?: number;
  };
  industry_taxonomy?: { primary_industry?: string; business_model?: string; sub_industries?: string[] };
  geographic_footprint?: { countries?: string[]; regions?: string[]; flagship_locations?: string[] };
  channels?: Array<{ channel_type?: string; name?: string; description?: string }>;
  business_entity_candidates?: Array<{ entity_type?: string; name?: string; description?: string }>;
  recent_strategic_priorities?: Array<{ priority?: string }>;
  pain_signals?: Array<{ pain?: string; severity?: string }>;
  tech_stack_signals?: Array<{ component_type?: string; vendor_or_product?: string; confidence?: string }>;
  synthesized_flags?: Array<{ field_path?: string; claim?: string; rationale?: string }>;
}

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function hostOf(url?: string): string {
  if (!url) return "";
  try { return new URL(url).host.replace(/^www\./, ""); }
  catch { return url; }
}

function headcount(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

const sevRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function buildDiscoveryBriefHtml(p: BriefProfile): string {
  const co = p.company ?? {};
  const tax = p.industry_taxonomy ?? {};
  const geo = p.geographic_footprint ?? {};
  const name = co.name || hostOf(co.primary_url) || "Company";
  const host = hostOf(co.primary_url);
  const generated = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const pains = [...(p.pain_signals ?? [])].sort(
    (a, b) => (sevRank[a.severity ?? ""] ?? 3) - (sevRank[b.severity ?? ""] ?? 3),
  );
  const tech = p.tech_stack_signals ?? [];
  const priorities = p.recent_strategic_priorities ?? [];
  const flags = p.synthesized_flags ?? [];

  const snapshot = ([
    ["Industry", tax.primary_industry ?? ""],
    ["Business model", tax.business_model ?? ""],
    ["Headquarters", [co.headquarters_city, co.headquarters_country].filter(Boolean).join(", ")],
    ["Founded", co.founded_year ? String(co.founded_year) : ""],
    ["Ownership", co.ownership_type ?? ""],
    ["Headcount", co.employee_count_estimate ? `~${headcount(co.employee_count_estimate)}` : ""],
    ["Footprint", (geo.countries ?? []).slice(0, 6).join(", ")],
    ["Legal entity", co.legal_name && co.legal_name !== co.name ? co.legal_name : ""],
  ] as [string, string][]).filter(([, v]) => v);

  // Lightly-templated discovery questions off the top pains.
  const questions = pains.slice(0, 4).map((x) =>
    `How does ${esc(name)} detect, measure, and respond to <strong>${esc(x.pain)}</strong> today — and what does it cost when it slips?`);

  const sevBadge = (s?: string) => {
    const tone = s === "high" ? "#b91c1c" : s === "medium" ? "#b45309" : "#64748b";
    const bg = s === "high" ? "#fee2e2" : s === "medium" ? "#fef3c7" : "#f1f5f9";
    return `<span class="badge" style="color:${tone};background:${bg}">${esc(s ?? "—")}</span>`;
  };

  const aiSummary = [
    `Company: ${name}${host ? ` (${host})` : ""}`,
    tax.primary_industry ? `Industry: ${tax.primary_industry}` : "",
    pains.length ? `Top pains: ${pains.slice(0, 5).map((x) => x.pain).filter(Boolean).join("; ")}` : "",
    tech.length ? `Stack: ${tech.map((t) => t.vendor_or_product).filter(Boolean).slice(0, 10).join(", ")}` : "",
    priorities.length ? `Priorities: ${priorities.map((x) => x.priority).filter(Boolean).join("; ")}` : "",
  ].filter(Boolean).join("\n");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} — Discovery Brief</title>
<style>
  :root { --ink:#0f172a; --muted:#475569; --faint:#94a3b8; --line:#e2e8f0; --accent:#0d9488; }
  * { box-sizing: border-box; }
  body { margin:0; background:#f1f5f9; color:var(--ink);
    font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif; }
  .page { max-width:820px; margin:32px auto; background:#fff; border:1px solid var(--line);
    border-radius:16px; padding:44px 48px; box-shadow:0 10px 40px -16px rgba(15,23,42,.2); }
  .eyebrow { font:600 11px/1 ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }
  h1 { font-size:30px; letter-spacing:-.02em; margin:8px 0 4px; }
  .sub { color:var(--muted); font-size:14px; }
  h2 { font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:var(--faint);
    margin:34px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--line); }
  .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px 28px; }
  .cell .k { font:600 10px/1 ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--faint); }
  .cell .v { font-size:15px; margin-top:3px; }
  ul { margin:0; padding-left:20px; } li { margin:6px 0; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th { text-align:left; font:600 10px/1 ui-monospace,monospace; letter-spacing:.06em; text-transform:uppercase;
    color:var(--faint); padding:0 0 8px; border-bottom:1px solid var(--line); }
  td { padding:9px 0; border-bottom:1px solid var(--line); vertical-align:top; }
  .badge { display:inline-block; font:600 11px/1 ui-monospace,monospace; padding:3px 7px; border-radius:6px; text-transform:uppercase; }
  .note { background:#f0fdfa; border:1px solid #99f6e4; color:#0f766e; border-radius:10px; padding:12px 14px; font-size:13.5px; margin-top:12px; }
  .verify li { color:var(--muted); }
  .ai { background:#0f172a; color:#cbd5e1; border-radius:10px; padding:16px; font:13px/1.6 ui-monospace,monospace; white-space:pre-wrap; }
  .foot { margin-top:36px; padding-top:14px; border-top:1px solid var(--line); color:var(--faint); font-size:12px; }
  @media print { body { background:#fff; } .page { box-shadow:none; border:0; margin:0; border-radius:0; } }
</style></head><body><div class="page">
  <div class="eyebrow">Discovery Brief</div>
  <h1>${esc(name)}</h1>
  <div class="sub">${[host, tax.primary_industry, tax.business_model].filter(Boolean).map(esc).join(" · ")}${host ? ` · <a href="https://${esc(host)}" style="color:var(--accent)">${esc(host)}</a>` : ""}</div>

  ${snapshot.length ? `<h2>At a glance</h2><div class="grid">${snapshot.map(([k, v]) =>
    `<div class="cell"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("")}</div>` : ""}

  ${priorities.length ? `<h2>Why now — strategic priorities</h2><ul>${priorities
    .map((x) => `<li>${esc(x.priority)}</li>`).join("")}</ul>` : ""}

  ${pains.length ? `<h2>Pain signals to probe</h2>
  <table><thead><tr><th>Signal</th><th style="width:90px">Severity</th></tr></thead><tbody>${pains
    .map((x) => `<tr><td>${esc(x.pain)}</td><td>${sevBadge(x.severity)}</td></tr>`).join("")}</tbody></table>
  ${questions.length ? `<div class="note"><strong>Discovery questions to open with:</strong><ul style="margin-top:8px">${
    questions.map((q) => `<li>${q}</li>`).join("")}</ul></div>` : ""}` : ""}

  ${tech.length ? `<h2>Tech &amp; observability footprint</h2>
  <table><thead><tr><th>Area</th><th>Vendor / product</th><th style="width:90px">Confidence</th></tr></thead><tbody>${tech
    .map((t) => `<tr><td>${esc(t.component_type)}</td><td>${esc(t.vendor_or_product)}</td><td>${esc(t.confidence ?? "—")}</td></tr>`).join("")}</tbody></table>
  <div class="note">Where an incumbent monitoring/observability tool shows up, that's a consolidation + cost angle — position unified metrics, logs, and traces in one stack.</div>` : ""}

  ${flags.length ? `<h2>Verify before the call</h2><ul class="verify">${flags
    .map((f) => `<li><strong>${esc(f.claim || f.field_path)}</strong>${f.rationale ? ` — ${esc(f.rationale)}` : ""}</li>`).join("")}</ul>` : ""}

  <h2>For a sales AI assistant</h2>
  <div class="ai">${esc(aiSummary)}</div>

  <div class="foot">Generated ${esc(generated)} · Proj-Clarion · synthesised from public sources — verify the flagged items before quoting figures.</div>
</div></body></html>`;
}

/** Build the brief and trigger a browser download as a self-contained .html. */
export function downloadDiscoveryBrief(p: BriefProfile): void {
  const name = p.company?.name || hostOf(p.company?.primary_url) || "company";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 48) || "company";
  const blob = new Blob([buildDiscoveryBriefHtml(p)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-discovery-brief.html`;
  a.click();
  URL.revokeObjectURL(url);
}
