import type { LucideIcon } from "lucide-react";
import { BarChart3, BrainCircuit, ClipboardCheck, FileText, LayoutDashboard, Settings, Upload } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Claims", path: "/claims", icon: FileText },
  { label: "Upload Claim", path: "/upload", icon: Upload },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "AI Processing", path: "/ai-processing", icon: BrainCircuit },
  { label: "Evaluation", path: "/evaluation", icon: ClipboardCheck },
  { label: "Settings", path: "/settings", icon: Settings },
];

export interface Breadcrumb {
  label: string;
  path?: string;
}

export interface RouteMeta {
  title: string;
  breadcrumbs: Breadcrumb[];
}

/** Title and breadcrumb trail for the top navbar. */
export function getRouteMeta(pathname: string): RouteMeta {
  const claimMatch = pathname.match(/^\/claims\/([^/]+)$/);
  if (claimMatch) {
    const claimId = decodeURIComponent(claimMatch[1]);
    return {
      title: "Claim Details",
      breadcrumbs: [{ label: "Claims", path: "/claims" }, { label: claimId }],
    };
  }

  const item = navItems.find((nav) => nav.path === pathname);
  if (item) {
    return { title: item.label, breadcrumbs: [{ label: item.label }] };
  }

  return { title: "Page Not Found", breadcrumbs: [{ label: "Not Found" }] };
}
