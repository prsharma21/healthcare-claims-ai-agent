import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { LoadingState } from "@/components/common/LoadingState";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

const COLLAPSED_STORAGE_KEY = "claims-ai.sidebar-collapsed";

/**
 * Desktop (>= 1024px): full sidebar that can be collapsed to an icon rail.
 * Tablet (768-1023px): icon rail, full menu available as a drawer.
 * Mobile (< 768px): drawer only.
 */
export function AppLayout() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(() => localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(userCollapsed));
  }, [userCollapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const showRail = isTablet;
  const collapsed = isDesktop ? userCollapsed : true;

  return (
    <div className="min-h-full">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      {showRail && (
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 border-r border-sidebar-border transition-[width] duration-200",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <Sidebar
            collapsed={collapsed}
            variant="rail"
            canCollapse={isDesktop}
            onToggleCollapsed={() => setUserCollapsed((value) => !value)}
          />
        </aside>
      )}

      <Dialog open={drawerOpen && !isDesktop} onOpenChange={setDrawerOpen}>
        <DialogContent
          hideClose
          className="left-0 top-0 h-full w-64 max-w-[85vw] translate-x-0 translate-y-0 gap-0 rounded-none border-0 p-0"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">Main application navigation</DialogDescription>
          <Sidebar collapsed={false} variant="drawer" onClose={() => setDrawerOpen(false)} />
        </DialogContent>
      </Dialog>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          showRail && (collapsed ? "pl-16" : "pl-60"),
        )}
      >
        <TopNavbar onOpenNavigation={() => setDrawerOpen(true)} showMenuButton={!isDesktop} />
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-5 outline-none lg:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Suspense fallback={<LoadingState message="Loading page..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
