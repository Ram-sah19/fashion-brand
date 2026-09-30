import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Shield,
  Users,
  Video,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Link, useLocation, useNavigate } from "@tanstack/react-router";

import { CommandPalette } from "./command-palette";
import { VeloraLogo } from "./logo";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Home",
    to: "/home",
    icon: Home,
  },
  {
    label: "Messages",
    to: "/messages",
    icon: MessageCircle,
  },
  {
    label: "Circles",
    to: "/circles",
    icon: Users,
  },
  {
    label: "Meetings",
    to: "/meetings",
    icon: Video,
  },
  {
    label: "Files",
    to: "/files",
    icon: FileText,
  },
  {
    label: "Saved",
    to: "/saved",
    icon: Shield,
  },
];

const mobileNav = [
  {
    label: "Home",
    to: "/home",
    icon: Home,
  },
  {
    label: "Messages",
    to: "/messages",
    icon: MessageCircle,
  },
  {
    label: "Circles",
    to: "/circles",
    icon: Users,
  },
  {
    label: "Meetings",
    to: "/meetings",
    icon: Video,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

function SidebarItem({
  label,
  to,
  icon: Icon,
  collapsed,
}: {
  label: string;
  to: string;
  icon: typeof Home;
  collapsed: boolean;
}) {
  const location = useLocation();

  const isActive =
    location.pathname === to ||
    location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />

      {!collapsed && (
        <span className="truncate">
          {label}
        </span>
      )}
    </Link>
  );
}

function SidebarBody({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate({
      to: "/",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border/60 px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <VeloraLogo compact={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <SidebarItem
              key={item.to}
              {...item}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="my-5 border-t border-border/60" />

        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace
          </p>
        )}

        <nav className="space-y-1">
          <SidebarItem
            label="Admin"
            to="/admin"
            icon={LayoutDashboard}
            collapsed={collapsed}
          />

          <SidebarItem
            label="Help"
            to="/help"
            icon={CircleHelp}
            collapsed={collapsed}
          />

          <SidebarItem
            label="Settings"
            to="/settings"
            icon={Settings}
            collapsed={collapsed}
          />
        </nav>
      </div>

      <div className="shrink-0 border-t border-border/60 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />

          {!collapsed && (
            <span>Log out</span>
          )}
        </button>
      </div>
    </div>
  );
}

function MobileNavItem({
  label,
  to,
  icon: Icon,
}: {
  label: string;
  to: string;
  icon: typeof Home;
}) {
  const location = useLocation();

  const isActive =
    location.pathname === to ||
    location.pathname.startsWith(`${to}/`);

  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-medium transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />

      <span>{label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  rightPanel,
  flush = false,
}: {
  children: ReactNode;
  rightPanel?: ReactNode;
  flush?: boolean;
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [paletteOpen, setPaletteOpen] =
    useState(false);

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border hidden shrink-0 border-r transition-[width] duration-300 ease-out lg:block",
          collapsed
            ? "w-[76px]"
            : "w-[264px]",
        )}
      >
        <SidebarBody
          collapsed={collapsed}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="border-border bg-background/80 safe-top grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={() =>
              setPaletteOpen(true)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Desktop collapse */}
          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) => !value,
              )
            }
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:flex"
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() =>
              setPaletteOpen(true)
            }
            className="flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            <Search className="h-4 w-4 shrink-0" />

            <span className="truncate">
              Search Velora...
            </span>

            <span className="ml-auto hidden shrink-0 text-[10px] text-muted-foreground sm:block">
              Ctrl K
            </span>
          </button>

          {/* Header actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <Link
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            className={cn(
              "min-h-0 min-w-0 flex-1 overflow-y-auto",
              flush
                ? ""
                : "px-4 pt-5 pb-28 sm:px-6 lg:pb-8",
            )}
          >
            {children}
          </main>

          {rightPanel && (
            <aside className="border-border bg-sidebar/40 scrollbar-slim hidden w-[320px] shrink-0 overflow-y-auto border-l p-5 xl:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="border-border bg-background/95 safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t backdrop-blur-xl lg:hidden"
      >
        {mobileNav.map((item) => (
          <MobileNavItem
            key={item.label}
            {...item}
          />
        ))}
      </nav>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </div>
  );
}