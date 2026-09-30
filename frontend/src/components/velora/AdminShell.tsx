import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import { VeloraLogo } from "./logo";
import { cn } from "@/lib/utils";

const adminNavigation = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "User Management",
    to: "/admin/users",
    icon: UserCog,
  },
  {
    label: "Circle Management",
    to: "/admin/circles",
    icon: Users,
  },
];

export function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate({
      to: "/",
    });
  };

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      {/* Admin sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border hidden shrink-0 border-r transition-[width] duration-300 lg:block",
          collapsed
            ? "w-[76px]"
            : "w-[264px]",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-border/60 px-4",
              collapsed &&
                "justify-center px-2",
            )}
          >
            <VeloraLogo
              compact={collapsed}
            />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-4 flex items-center gap-2 px-3">
              <Shield className="h-4 w-4 text-primary" />

              {!collapsed && (
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin
                </span>
              )}
            </div>

            <nav className="space-y-1">
              {adminNavigation.map(
                (item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                        collapsed &&
                          "justify-center px-2",
                      )}
                      activeProps={{
                        className:
                          "bg-primary/10 text-primary",
                      }}
                      title={
                        collapsed
                          ? item.label
                          : undefined
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      {!collapsed && (
                        <span className="truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                },
              )}
            </nav>
          </div>

          {/* Logout */}
          <div className="shrink-0 border-t border-border/60 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                collapsed &&
                  "justify-center px-2",
              )}
              title={
                collapsed
                  ? "Log out"
                  : undefined
              }
            >
              <LogOut className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <span>Log out</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Admin top bar */}
        <header className="border-border bg-background/80 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">
          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) => !value,
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
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

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              Velora Circle
            </p>

            <p className="text-xs text-muted-foreground">
              Administration
            </p>
          </div>

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

        {/* Admin content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() =>
          setCollapsed(
            (value) => !value,
          )
        }
        className="fixed bottom-5 left-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}