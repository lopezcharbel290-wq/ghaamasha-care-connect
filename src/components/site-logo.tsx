import { cn } from "@/lib/utils";
import logoAsset from "@/assets/ghaamasha-logo.png.asset.json";

export function SiteLogo({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  return (
    <span className={cn("flex min-w-0 items-center", className)}>
      <img
        src={logoAsset.url}
        alt="GHAAMASHA · Rehabilitación y Ortopedia"
        className={cn(
          "h-11 w-auto",
          tone === "onDark" && "rounded-md bg-white px-2 py-1",
        )}
      />
    </span>
  );
}
