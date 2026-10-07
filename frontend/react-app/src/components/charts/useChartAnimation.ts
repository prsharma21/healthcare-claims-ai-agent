import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Chart animations are disabled for users who prefer reduced motion. */
export function useChartAnimation(): boolean {
  return !useMediaQuery("(prefers-reduced-motion: reduce)");
}
