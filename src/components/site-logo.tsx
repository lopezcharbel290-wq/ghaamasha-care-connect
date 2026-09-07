import { cn } from "@/lib/utils";

export function SiteLogo({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span aria-hidden className="grid size-11 shrink-0 place-items-center">
        <svg viewBox="0 0 44 44" className="size-11" fill="none">
          <path d="M7 31.5C12.5 34.8 18.4 36 24.3 34.5C30.1 33 34.5 29 37 23.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className={tone === "onDark" ? "text-accent" : "text-primary"} />
          <path d="M8 23C12.5 17 17.2 14 22.3 14C27.6 14 32 17 36 22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className={tone === "onDark" ? "text-primary-foreground" : "text-primary-deep"} />
          <path d="M22 10V29M16.5 20.5H27.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent" />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "font-display block truncate text-xl font-bold",
            tone === "onDark" ? "text-primary-foreground" : "text-primary-deep",
          )}
        >
          GHAAMASHA
        </span>
        <span
          className={cn(
            "block truncate text-[0.62rem] font-semibold uppercase tracking-[0.14em]",
            tone === "onDark" ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          Rehabilitación integral
        </span>
      </span>
    </span>
  );
}
