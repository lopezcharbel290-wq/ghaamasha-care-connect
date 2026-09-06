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
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-2xl",
          tone === "onDark"
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="4.3" r="2.1" fill="currentColor" stroke="none" />
          <path d="M4 9.4h16M12 8v13" strokeLinecap="round" />
          <path d="M7.5 21c1.2-3.4 2.6-5.4 4.5-6 1.9.6 3.3 2.6 4.5 6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block truncate text-lg font-extrabold tracking-tight",
            tone === "onDark" ? "text-primary-foreground" : "text-primary-deep",
          )}
        >
          GHAAMASHA
        </span>
        <span
          className={cn(
            "block truncate text-[0.64rem] font-semibold uppercase tracking-[0.16em]",
            tone === "onDark" ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          Rehabilitación integral
        </span>
      </span>
    </span>
  );
}
