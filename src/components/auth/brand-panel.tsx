import { cn } from "@/lib/utils";

type Chip = { width: string; dot: string; highlight?: boolean };
type Column = { title: string; chips: Chip[] };

// A small kanban-style illustration: cases flowing from submitted → resolved.
const COLUMNS: Column[] = [
  {
    title: "Submitted",
    chips: [
      { width: "w-3/4", dot: "bg-muted-foreground/40" },
      { width: "w-2/3", dot: "bg-amber-400" },
    ],
  },
  {
    title: "In Progress",
    chips: [
      { width: "w-4/5", dot: "bg-primary", highlight: true },
      { width: "w-1/2", dot: "bg-blue-400" },
      { width: "w-2/3", dot: "bg-muted-foreground/40" },
    ],
  },
  {
    title: "Resolved",
    chips: [{ width: "w-3/5", dot: "bg-emerald-400" }],
  },
];

function MiniBoard() {
  return (
    <div className="grid w-[26rem] grid-cols-3 gap-3">
      {COLUMNS.map((col) => (
        <div key={col.title} className="rounded-sm bg-background/40 p-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {col.title}
          </p>
          <div className="space-y-2">
            {col.chips.map((chip, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-sm border bg-card p-2 shadow-sm",
                  chip.highlight && "ring-1 ring-primary/40",
                )}
              >
                <div className={cn("mb-1.5 h-1.5 rounded-full bg-muted-foreground/25", chip.width)} />
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", chip.dot)} />
                  <div className="h-1 w-1/2 rounded-full bg-muted-foreground/15" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BrandPanel() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-heading text-3xl font-semibold uppercase tracking-[0.35em] text-foreground">
        FlowDesk
      </h1>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Every request. Every action. Tracked.
      </p>
      <div className="my-7 h-0.5 w-12 bg-primary" />

      <MiniBoard />

      <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Cases move from submitted to resolved — every assignment, comment, and
        decision tracked and auditable.
      </p>
    </div>
  );
}
