/**
 * ClarionIcons — the Clarion brand mark + icon system, as one React/TSX module.
 *
 * Design tokens (theme.css / src/index.css): icons stroke with `currentColor`,
 * so colour follows the surrounding text colour. Semantic glyphs (KG tiers,
 * states) expose their intended colour token via CLARION_TONE — apply it with
 * `style={{ color: CLARION_TONE['state-running'] }}` or your own className.
 *
 * Sizing: default 20px, stroke 1.8. Pass `size` / `strokeWidth` to override.
 */
import * as React from "react";

export type ClarionIconProps = Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
  size?: number;
  strokeWidth?: number;
};

/* ── animation CSS — mount once near your app root ──
   (or paste these keyframes into your global stylesheet) */
export const CLARION_ICON_CSS = `
@keyframes clarion-spin { to { transform: rotate(360deg); } }
.clarion-spin { transform-box: fill-box; transform-origin: center; animation: clarion-spin 1.1s linear infinite; }
@keyframes clarion-flow { 0% { stroke-dashoffset: 7; } 100% { stroke-dashoffset: 0; } }
.clarion-flow { stroke-dasharray: 2.6 3; animation: clarion-flow 1s linear infinite; }
@media (prefers-reduced-motion: reduce) { .clarion-spin, .clarion-flow { animation: none; } }
`;
export function ClarionIconStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CLARION_ICON_CSS }} />;
}

/* ───────────────────────── Brand mark — Aperture Rise ─────────────────────────
   Focus ring + bright signal sweep + the agent rising at centre.
   `gradient` swaps the sweep to the teal→sky brand gradient (hero / large use). */
export function ClarionMark({
  size = 24, strokeWidth = 1.8, gradient = false, ...rest
}: ClarionIconProps & { gradient?: boolean }) {
  const gid = React.useId();
  const sweep = gradient ? `url(#${gid})` : "currentColor";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {gradient && (
        <defs>
          <linearGradient id={gid} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-accent-hover)" />
            <stop offset=".6" stopColor="var(--color-accent)" />
            <stop offset="1" stopColor="var(--color-accent-deep)" stopOpacity=".4" />
          </linearGradient>
        </defs>
      )}
      <circle cx="12" cy="12.5" r="8.3" opacity=".3" />
      <path d="M12 4.2A8.3 8.3 0 0 1 20.3 12.5" stroke={sweep} />
      <path d="M8.6 11.8 12 8.4 15.4 11.8" />
      <circle cx="12" cy="14.4" r="2.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Wordmark lockup: the mark + "Clarion". */
export function ClarionLockup({ size = 22, gap = 10 }: { size?: number; gap?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <ClarionMark size={Math.round(size * 1.2)} />
      <span style={{ fontWeight: 600, fontSize: size, letterSpacing: "-.025em" }}>Clarion</span>
    </span>
  );
}

/* ───────────────────────── Glyph set ─────────────────────────
   Inner SVG markup keyed by name. Rendered through one <ClarionGlyph/>. */
const GLYPHS: Record<string, string> = {
  // pipeline phases (research → plan → approve → generate → provision → kg-publish)
  research: '<circle cx="10.5" cy="10.5" r="6.6"/><path d="M10.5 10.5V4.4" opacity=".75"/><circle cx="13.7" cy="8" r="1.6" fill="currentColor" stroke="none"/><path d="m15.5 15.5 4.4 4.4"/>',
  plan: '<path d="M4.4 7.4h11"/><path d="M4.4 12h14.2"/><path d="M4.4 16.6h8"/><circle cx="19.4" cy="12" r="1.9" fill="currentColor" stroke="none"/>',
  approve: '<circle cx="12" cy="12" r="8.4" opacity=".4"/><path d="M7.7 12.2 10.7 15.2 16.4 8.4"/><circle cx="16.4" cy="8.4" r="1.8" fill="currentColor" stroke="none"/>',
  generate: '<circle cx="6.6" cy="12" r="2.7" fill="currentColor" stroke="none"/><path d="M9.3 10.9 14.4 7.2M9.5 12H15M9.3 13.1 14.4 16.8"/><circle cx="16.3" cy="6.6" r="1.5"/><circle cx="17" cy="12" r="1.5"/><circle cx="16.3" cy="17.4" r="1.5"/>',
  provision: '<path d="M8 12.6a3 3 0 0 1 .25-6 4.4 4.4 0 0 1 8.4.85 2.75 2.75 0 0 1-.3 5.3z"/><path d="M12 20.6V12.4"/><path d="M9.1 15.1 12 12.2 14.9 15.1"/><circle cx="12" cy="20.8" r="1.7" fill="currentColor" stroke="none"/>',
  "kg-publish": '<circle cx="12" cy="4.6" r="1.6"/><circle cx="5" cy="17.4" r="1.6"/><circle cx="19" cy="17.4" r="1.6"/><path d="M11.3 11 12 6.4M10.4 13.6 6.4 16.2M13.6 13.6 17.6 16.2" opacity=".65"/><circle cx="12" cy="12.5" r="2.6" fill="currentColor" stroke="none"/>',
  // KG tiers
  "tier-account": '<path d="M12 3.2 19.8 7.6v8.8L12 20.8 4.2 16.4V7.6z"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  "tier-business": '<path d="M12 3.4 20.6 12 12 20.6 3.4 12z"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  "tier-cloud-region": '<path d="M7.6 16.6a3.2 3.2 0 0 1 .3-6.4 4.6 4.6 0 0 1 8.8.9 2.9 2.9 0 0 1-.5 5.5z"/><circle cx="12" cy="13.4" r="1.9" fill="currentColor" stroke="none"/>',
  "tier-technical": '<rect x="4.6" y="4.6" width="14.8" height="14.8" rx="3.6"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>',
  // build presets (signal waveforms by load intensity)
  "preset-smoke": '<path d="M3 13H9L10.5 10.6 12 13H18" opacity=".9"/><circle cx="19.6" cy="13" r="1.7" fill="currentColor" stroke="none"/>',
  "preset-demo": '<path d="M3 13H6.5L8.5 9 10.5 13H13L15 9 17 13H18.2" opacity=".9"/><circle cx="19.6" cy="13" r="1.7" fill="currentColor" stroke="none"/>',
  "preset-auto": '<path d="M3 13.4H5.6L6.9 11 8.2 13.4H10.8L12.1 7.8 13.4 13.4H15" opacity=".9"/><path d="M16 8.6a2.7 2.7 0 1 0 .9 2.1"/><path d="M16.5 7.4 16.3 9.2 18.1 9"/>',
  "preset-stress": '<path d="M3 13.5 4.4 13.5 5.4 6.5 6.4 13.5 7.4 6.5 8.4 13.5 9.4 6.5 10.4 13.5 11.4 6.5 12.4 13.5 13.4 6.5 14.4 13.5 15.4 6.5 16.4 13.5 17.4 8" opacity=".9"/><circle cx="19" cy="13.5" r="1.7" fill="currentColor" stroke="none"/>',
  // run states
  "state-running": '<circle cx="12" cy="12" r="8.2" opacity=".22"/><path class="clarion-spin" d="M12 3.8A8.2 8.2 0 0 1 20.2 12" stroke-width="2"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/>',
  "state-done": '<circle cx="12" cy="12" r="8.4"/><path d="M8 12.2 11 15.2 16 8.8" stroke-width="2"/>',
  "state-failed": '<circle cx="12" cy="12" r="8.4"/><path d="M9 9l6 6M15 9l-6 6" stroke-width="2"/>',
  "state-pending": '<circle cx="12" cy="12" r="8.4" stroke-dasharray="2.5 3" opacity=".7"/><circle cx="12" cy="12" r="1.9" opacity=".7"/>',
};

export type ClarionGlyphName = keyof typeof GLYPHS;

/** Intended semantic colour token per glyph (apply via `style={{ color }}`). */
export const CLARION_TONE: Partial<Record<string, string>> = {
  "tier-account": "var(--color-text)",
  "tier-business": "var(--color-accent)",
  "tier-cloud-region": "var(--color-info)",
  "tier-technical": "var(--color-signal)",
  "state-running": "var(--color-info)",
  "state-done": "var(--color-success)",
  "state-failed": "var(--color-danger)",
  "state-pending": "var(--color-text-faint)",
};

export function ClarionGlyph({
  name, size = 20, strokeWidth = 1.8, ...rest
}: ClarionIconProps & { name: ClarionGlyphName }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] }} {...rest} />
  );
}

/* convenience named exports */
export const PhaseResearch = (p: ClarionIconProps) => <ClarionGlyph name="research" {...p} />;
export const PhasePlan = (p: ClarionIconProps) => <ClarionGlyph name="plan" {...p} />;
export const PhaseApprove = (p: ClarionIconProps) => <ClarionGlyph name="approve" {...p} />;
export const PhaseGenerate = (p: ClarionIconProps) => <ClarionGlyph name="generate" {...p} />;
export const PhaseProvision = (p: ClarionIconProps) => <ClarionGlyph name="provision" {...p} />;
export const PhaseKgPublish = (p: ClarionIconProps) => <ClarionGlyph name="kg-publish" {...p} />;

/** Ordered phase list — drive the six-column build journey from this. */
export const CLARION_PHASES: { key: ClarionGlyphName; label: string }[] = [
  { key: "research", label: "Research" },
  { key: "plan", label: "Plan" },
  { key: "approve", label: "Approve" },
  { key: "generate", label: "Generate" },
  { key: "provision", label: "Provision" },
  { key: "kg-publish", label: "KG publish" },
];

/* ── Live in Cloud — the one duotone, Grafana-orange, animated asset.
   Reserved for "telemetry flowing into the tenant". Never on idle UI. ── */
export function LiveInCloud({ size = 20, strokeWidth = 1.8, animated = true, ...rest }: ClarionIconProps & { animated?: boolean }) {
  const flow = animated ? "clarion-flow" : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--color-grafana)"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M8 11.6a3 3 0 0 1 .25-6 4.4 4.4 0 0 1 8.4.85 2.75 2.75 0 0 1-.3 5.3z" fill="var(--color-grafana-bg)" />
      <path className={flow} d="M9 21v-4" strokeDasharray="2.6 3" />
      <path className={flow} d="M12 22v-5.5" strokeDasharray="2.6 3" style={{ animationDelay: "-.5s" }} />
      <path className={flow} d="M15 21v-4" strokeDasharray="2.6 3" style={{ animationDelay: "-1s" }} />
      <circle cx="12" cy="11.8" r="2" fill="var(--color-grafana)" stroke="none" />
    </svg>
  );
}

/* ── Badge: a glyph inside an accent tile (KPI / brand / status tiles) ── */
export function ClarionBadge({
  name, size = 36, icon = 18, tone = "var(--color-accent)", radius = 10,
}: { name?: ClarionGlyphName; size?: number; icon?: number; tone?: string; radius?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: radius, display: "inline-grid", placeItems: "center",
      color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tone} 36%, transparent)`,
    }}>
      {name ? <ClarionGlyph name={name} size={icon} /> : <ClarionMark size={icon} />}
    </span>
  );
}

/* ── Empty-state spot illustrations ── */
const EMPTY: Record<string, string> = {
  profiles: '<svg width="150" height="120" viewBox="0 0 150 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g opacity=".22"><circle cx="34" cy="30" r="3.4"/><circle cx="116" cy="26" r="3.4"/><circle cx="128" cy="78" r="3.4"/><circle cx="28" cy="86" r="3.4"/><path d="M37 32 70 52M113 28 80 50M125 76 84 56M31 84 66 60"/></g><circle cx="75" cy="56" r="20" opacity=".35"/><path d="M75 56V41" opacity=".5"/><circle cx="84" cy="49" r="3.4" fill="var(--color-accent)" stroke="none"/><path d="m90 71 16 16" stroke="var(--color-accent)" stroke-width="2"/></svg>',
  builds: '<svg width="170" height="120" viewBox="0 0 170 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 70h142" opacity=".25"/><g opacity=".28"><circle cx="58" cy="70" r="4"/><circle cx="85" cy="70" r="4"/><circle cx="112" cy="70" r="4"/><circle cx="139" cy="70" r="4"/><circle cx="156" cy="70" r="4"/><path d="M40 70h6M62 70h19M89 70h19M116 70h19M143 70h9"/></g><circle cx="31" cy="70" r="11" fill="var(--color-accent-bg)" stroke="var(--color-accent)"/><path d="M28 65.5 35.5 70 28 74.5z" fill="var(--color-accent)" stroke="none"/></svg>',
};
export function ClarionEmptyArt({ name, className, style }: { name: "profiles" | "builds"; className?: string; style?: React.CSSProperties }) {
  return <span className={className} style={{ display: "inline-block", color: "var(--color-text-faint)", ...style }} dangerouslySetInnerHTML={{ __html: EMPTY[name] }} />;
}
