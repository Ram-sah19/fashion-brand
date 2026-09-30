import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="w-full shrink-0 border-t border-border/60 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-24 sm:px-6 sm:pb-6">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
          
          {/* Brand */}
          <div className="w-full md:w-auto">
            <p className="text-sm font-semibold text-foreground">
              Velora Circle
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Private conversations, securely.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Link
              to="/help"
              className="transition-colors hover:text-foreground"
            >
              Help
            </Link>

            <Link
              to="/settings"
              className="transition-colors hover:text-foreground"
            >
              Settings
            </Link>
          </nav>

          {/* Copyright */}
          <p className="w-full text-center text-xs font-normal text-muted-foreground md:w-auto md:text-left">
            © 2026 Velora Circle
          </p>
        </div>
      </div>
    </footer>
  );
}
