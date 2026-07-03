import { cn } from "@/lib/utils";

/**
 * Wordmark do Kaizen: ícone quadrado arredondado com "改善" + "kaizen".
 * `variant` controla a cor do texto para fundos claros vs. sidebar escura.
 */
export function Logo({
  className,
  markSize = 34,
  textSize = 22,
  variant = "dark",
  showText = true,
}: {
  className?: string;
  markSize?: number;
  textSize?: number;
  variant?: "dark" | "light";
  showText?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex shrink-0 items-center justify-center rounded-[9px] bg-sidebar"
        style={{ width: markSize, height: markSize }}
      >
        <span
          className="font-brand font-bold leading-none text-[hsl(var(--chip-mint))]"
          style={{ fontSize: markSize * 0.5 }}
        >
          改善
        </span>
      </span>
      {showText && (
        <span
          className={cn(
            "font-brand font-bold leading-none",
            variant === "light" ? "text-sidebar-foreground" : "text-sidebar"
          )}
          style={{ fontSize: textSize }}
        >
          kaizen
        </span>
      )}
    </span>
  );
}
