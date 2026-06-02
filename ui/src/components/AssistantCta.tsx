/**
 * Assistant launch affordances — the in-page entry points into the ONE
 * assistant surface (the ⌘J drawer). We deliberately do NOT embed a chat
 * panel on the page; instead sections expose a small button/card that
 * opens the main pane scoped to the entity (optionally seeded with a
 * prompt). This keeps a single, cohesive assistant interaction.
 *
 *  - AssistantSectionButton: a ghost icon-button for a card/section header.
 *  - AssistantCtaCard:       a compact call-to-action card for a column.
 */
import { Wand2 } from "lucide-react";

import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAssistant } from "@/lib/AssistantContext";
import type { AssistantContextScope } from "@/lib/api";
import { cn } from "@/lib/cn";

export function AssistantSectionButton({
  scope, seed, title = "Ask the assistant about this", className,
}: {
  scope: AssistantContextScope;
  seed?: string;
  title?: string;
  className?: string;
}) {
  const assistant = useAssistant();
  return (
    <button
      type="button"
      onClick={() => assistant.openAssistant({ scope, seedPrompt: seed })}
      title={title}
      aria-label={title}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-[var(--color-text-faint)]",
        "hover:bg-white/[0.05] hover:text-[var(--color-accent)] transition-colors",
        className,
      )}
    >
      <Wand2 size={14} />
    </button>
  );
}

export function AssistantCtaCard({
  scope, title, body, cta = "Open assistant", seed,
}: {
  scope: AssistantContextScope;
  title: string;
  body: string;
  cta?: string;
  seed?: string;
}) {
  const assistant = useAssistant();
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
          <Wand2 size={16} />
        </span>
        <h3 className="m-0 text-sm font-medium text-[var(--color-text)]">{title}</h3>
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{body}</p>
      <Button
        variant="primary"
        size="sm"
        onClick={() => assistant.openAssistant({ scope, seedPrompt: seed })}
      >
        <Wand2 size={12} /> {cta}
      </Button>
    </Card>
  );
}
