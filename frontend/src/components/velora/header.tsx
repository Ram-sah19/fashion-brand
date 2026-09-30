import {
  Home,
  MessageCircle,
  Users,
  Video,
  Settings,
} from "lucide-react";

import { Link, useLocation } from "@tanstack/react-router";

import { VeloraLogo } from "./logo";

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
  // {
  //   label: "Meetings",
  //   to: "/meetings",
  //   icon: Video,
  // },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          to="/home"
          className="flex items-center gap-2.5"
        >
         <VeloraLogo />

          <div className="hidden sm:block">
            <p className="font-semibold leading-none tracking-tight text-foreground">
              Velora Circle
            </p>

            <p className="mt-1 text-[10px] text-muted-foreground">
              Private conversations
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.to ||
              location.pathname.startsWith(
                `${item.to}/`,
              );

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            location.pathname.startsWith(
              "/settings",
            )
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile navigation */}
      <div className="border-t border-border/40 md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center justify-around px-2 py-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.to ||
              location.pathname.startsWith(
                `${item.to}/`,
              );

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
