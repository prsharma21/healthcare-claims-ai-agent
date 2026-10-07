import { HeartPulse, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { navItems } from "@/routes/navigation";

interface SidebarProps {
  /** Icon-only rail. */
  collapsed: boolean;
  /** Mobile drawer variant with a close button. */
  variant: "rail" | "drawer";
  onToggleCollapsed?: () => void;
  onClose?: () => void;
  canCollapse?: boolean;
}

export function Sidebar({ collapsed, variant, onToggleCollapsed, onClose, canCollapse = true }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
          <HeartPulse className="size-[18px]" aria-hidden="true" />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{appConfig.appName}</p>
            <p className="truncate text-[11px] text-sidebar-muted">Claims Operations</p>
          </div>
        )}
        {variant === "drawer" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">Workspace</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                onClick={onClose}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-400",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-accent text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-500"
                      : "text-slate-300 hover:bg-sidebar-accent/60 hover:text-white",
                  )
                }
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <span className="size-2 rounded-full bg-amber-400" title="Environment: Development" />
            <span className="size-2 rounded-full bg-green-400" title="Backend: Claims API + mocks" />
          </div>
        ) : (
          <dl className="space-y-2 rounded-md bg-sidebar-accent/50 px-3 py-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-sidebar-muted">Environment</dt>
              <dd className="flex items-center gap-1.5 font-medium text-white">
                <span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                {appConfig.environment}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-sidebar-muted">Backend status</dt>
              <dd className="flex items-center gap-1.5 font-medium text-white">
                <span className="size-1.5 rounded-full bg-green-400" aria-hidden="true" />
                {appConfig.useMockApi ? "Claims API + mocks" : "FastAPI"}
              </dd>
            </div>
          </dl>
        )}
        {variant === "rail" && canCollapse && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "mt-2 flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-xs font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-white",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden="true" />
                Collapse
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
