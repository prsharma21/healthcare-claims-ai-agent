import { Fragment, useEffect, useState } from "react";
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { getRouteMeta } from "@/routes/navigation";
import { claimsService } from "@/services/claimsService";
import type { AppNotification, NotificationTone } from "@/types/notification";
import { formatRelativeTime } from "@/utils/format";

import { GlobalSearch } from "./GlobalSearch";

const toneDot: Record<NotificationTone, string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

interface TopNavbarProps {
  onOpenNavigation: () => void;
  showMenuButton: boolean;
}

export function TopNavbar({ onOpenNavigation, showMenuButton }: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getRouteMeta(location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    claimsService.getNotifications().then((items) => {
      setNotifications(items);
      setUnreadCount(items.length);
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:px-6">
      {showMenuButton && (
        <Button variant="ghost" size="icon-sm" onClick={onOpenNavigation} aria-label="Open navigation">
          <Menu aria-hidden="true" />
        </Button>
      )}

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <li className="hidden sm:block">
              <Link to="/dashboard" className="rounded-sm hover:text-foreground">
                {appConfig.appName}
              </Link>
            </li>
            {meta.breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                <li aria-hidden="true" className={cn(index === 0 && "hidden sm:block")}>
                  <ChevronRight className="size-3" />
                </li>
                <li className="truncate">
                  {crumb.path ? (
                    <Link to={crumb.path} className="rounded-sm hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-slate-700">
                      {crumb.label}
                    </span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>
        <p className="truncate text-sm font-semibold text-slate-900">{meta.title}</p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 w-56 justify-start gap-2 text-muted-foreground md:inline-flex"
        onClick={() => setSearchOpen(true)}
        aria-label="Search claims (Ctrl+K)"
      >
        <Search aria-hidden="true" />
        <span className="flex-1 text-left font-normal">Search claims...</span>
        <kbd className="rounded border bg-muted px-1 text-[10px]">Ctrl K</kbd>
      </Button>
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search claims">
        <Search aria-hidden="true" />
      </Button>

      <DropdownMenu onOpenChange={(open) => open && setUnreadCount(0)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
          >
            <Bell aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No notifications.</p>}
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="items-start py-2"
              onSelect={() => notification.claimId && navigate(`/claims/${notification.claimId}`)}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneDot[notification.tone])} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{notification.title}</span>
                <span className="block text-xs text-muted-foreground">{notification.description}</span>
                <span className="block text-[11px] text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Badge tone="warning" className="hidden sm:inline-flex">
        {appConfig.environment}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label={`User menu for ${appConfig.currentUser.name}`}>
            <span className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
              {appConfig.currentUser.initials}
            </span>
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-xs font-semibold">{appConfig.currentUser.name}</span>
              <span className="block text-[11px] font-normal text-muted-foreground">{appConfig.currentUser.email}</span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-foreground">
            {appConfig.currentUser.name}
            <span className="block text-xs font-normal text-muted-foreground">{appConfig.currentUser.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => toast.info("User profiles are not available in this version.")}>
            <UserRound aria-hidden="true" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate("/settings")}>
            <Settings aria-hidden="true" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => toast.info("Authentication is not implemented in this version.")}>
            <LogOut aria-hidden="true" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
