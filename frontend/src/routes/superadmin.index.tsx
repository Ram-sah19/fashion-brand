import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import { VeloraLogo } from "@/components/velora/logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/")({
  component: SuperadminPage,
});

type Admin = {
  _id: string;
  name: string;
  email: string;
  role: "admin";
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

function SuperadminPage() {
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingAdminId, setManagingAdminId] =
    useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate({
        to: "/superadmin/login",
      });
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (user.role !== "superadmin") {
        navigate({
          to: "/superadmin/login",
        });
        return;
      }

      const fetchAdmins = async () => {
        try {
          const response = await fetch(
            "/api/users/admins",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to fetch admins",
            );
          }

          setAdmins(data.admins || []);
        } catch (error) {
          console.error(
            "Failed to load admins:",
            error,
          );

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load admins",
          );
        } finally {
          setLoading(false);
        }
      };

      void fetchAdmins();
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate({
        to: "/superadmin/login",
      });
    }
  }, [navigate]);

  const handleAdminStatus = async (
    admin: Admin,
  ) => {
    const action = admin.isActive
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      admin.isActive
        ? `Disable ${admin.name}'s admin account?`
        : `Re-enable ${admin.name}'s admin account?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setManagingAdminId(admin._id);

      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate({
          to: "/superadmin/login",
        });
        return;
      }

      const response = await fetch(
        `/api/users/admins/${admin._id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${action} admin`,
        );
      }

      setAdmins((currentAdmins) =>
        currentAdmins.map(
          (currentAdmin) =>
            currentAdmin._id === admin._id
              ? {
                  ...currentAdmin,
                  isActive:
                    !currentAdmin.isActive,
                }
              : currentAdmin,
        ),
      );

      toast.success(
        admin.isActive
          ? "Admin account disabled successfully"
          : "Admin account enabled successfully",
      );
    } catch (error) {
      console.error(
        `Failed to ${action} admin:`,
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${action} admin`,
      );
    } finally {
      setManagingAdminId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate({
      to: "/",
    });
  };

  const activeAdminCount = admins.filter(
    (admin) => admin.isActive,
  ).length;

  return (
    <div className="bg-background flex h-dvh w-full overflow-hidden">
      {/* Sidebar */}
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
          <div className="flex-1 px-3 py-4">
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary",
                collapsed &&
                  "justify-center px-2",
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <span>
                  Admin Monitoring
                </span>
              )}
            </div>
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
            >
              <LogOut className="h-4 w-4 shrink-0" />

              {!collapsed && (
                <span>Log out</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="border-border bg-background/80 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">
          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) => !value,
              )
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <div>
            <p className="text-sm font-semibold">
              Superadmin
            </p>

            <p className="text-xs text-muted-foreground">
              Admin monitoring
            </p>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Heading */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Admin Monitoring
                </h1>

                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>

              <p className="text-muted-foreground mt-1.5 text-sm">
                Monitor and control administrator
                accounts during security incidents.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Total admins */}
              <div className="surface-panel rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Admins
                    </p>

                    <p className="text-2xl font-bold">
                      {loading
                        ? "..."
                        : admins.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active admins */}
              <div className="surface-panel rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Active Admins
                    </p>

                    <p className="text-2xl font-bold">
                      {loading
                        ? "..."
                        : activeAdminCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin table */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">
                Administrators
              </h2>

              <div className="surface-panel overflow-x-auto rounded-2xl">
                {loading ? (
                  <div className="text-muted-foreground p-6 text-sm">
                    Loading administrators...
                  </div>
                ) : admins.length === 0 ? (
                  <div className="text-muted-foreground p-6 text-sm">
                    No administrators found.
                  </div>
                ) : (
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-border border-b text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 font-medium">
                          Admin
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Email
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Role
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Status
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Account Created
                        </th>

                        <th className="px-4 py-3 font-medium">
                          Security Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin._id}
                          className="border-border border-b last:border-b-0"
                        >
                          <td className="px-4 py-4 font-medium">
                            {admin.name}
                          </td>

                          <td className="text-muted-foreground px-4 py-4">
                            {admin.email}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              Admin
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                admin.isActive
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400",
                              )}
                            >
                              {admin.isActive
                                ? "Active"
                                : "Disabled"}
                            </span>
                          </td>

                          <td className="text-muted-foreground px-4 py-4">
                            {new Date(
                              admin.createdAt,
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                void handleAdminStatus(
                                  admin,
                                )
                              }
                              disabled={
                                managingAdminId ===
                                admin._id
                              }
                              className={cn(
                                "rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                admin.isActive
                                  ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                  : "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
                              )}
                            >
                              {managingAdminId ===
                              admin._id
                                ? "Updating..."
                                : admin.isActive
                                  ? "Disable Admin"
                                  : "Enable Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}