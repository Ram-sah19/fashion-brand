import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/velora/AdminShell";
import { StatCard } from "@/components/velora/cards";
import {
  PrivacyBadge,
  SectionHeading,
} from "@/components/velora/primitives";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role:
  | "user"
  | "admin"
  | "superadmin";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute(
  "/admin/",
)({
  head: () => ({
    meta: [
      {
        title:
          "Admin Dashboard — Velora Circle",
      },
      {
        name: "description",
        content:
          "Velora Circle system administration dashboard.",
      },
      {
        property: "og:title",
        content:
          "Admin Dashboard — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Velora Circle system administration dashboard.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const storedUser =
      localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate({
        to: "/admin/login",
      });
      return;
    }

    try {
      const user =
        JSON.parse(storedUser);

      if (user.role !== "admin") {
        navigate({
          to: "/admin/login",
        });
        return;
      }

      setCheckingAuth(false);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate({
        to: "/admin/login",
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const token =
          localStorage.getItem("token");

        if (!token) {
          navigate({
            to: "/admin/login",
          });
          return;
        }

        const response =
          await fetch(
            "/api/users/admin/all",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          if (
            response.status === 403 &&
            data.message ===
            "Your account has been disabled"
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            toast.error(
              "Your account has been disabled",
            );

            navigate({
              to: "/admin/login",
            });

            return;
          }

          throw new Error(
            data.message ||
            "Failed to load users",
          );
        }

        if (
          !data.users ||
          !Array.isArray(
            data.users,
          )
        ) {
          throw new Error(
            "Invalid users response from server",
          );
        }

        setUsers(data.users);
      } catch (error) {
        console.error(
          "Load admin dashboard users error:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load users",
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, [
    checkingAuth,
    navigate,
  ]);

  const totalUsers =
    users.length;

  const adminCount =
    users.filter(
      (user) =>
        user.role === "admin",
    ).length;

  const verifiedCount =
    users.filter(
      (user) =>
        user.emailVerified,
    ).length;

  const pendingCount =
    totalUsers -
    verifiedCount;

  if (checkingAuth) {
    return null;
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-9">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Admin Dashboard
            </h1>

            <PrivacyBadge
              label="System Admin only"
              tone="accent"
              icon={ShieldAlert}
            />
          </div>

          <p className="text-muted-foreground mt-1.5 text-sm">
            Overview of the Velora Circle
            platform.
          </p>
        </header>

        <section>
          <SectionHeading
            title="Platform overview"
            description={
              loadingUsers
                ? "Loading current data..."
                : "Current data from MongoDB"
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={String(
                totalUsers,
              )}
              hint="Registered users"
              icon={Users}
              tone="brand"
            />

            <StatCard
              label="Admins"
              value={String(
                adminCount,
              )}
              hint="System administrators"
              icon={ShieldAlert}
            />

            <StatCard
              label="Verified users"
              value={String(
                verifiedCount,
              )}
              hint="Email verified"
              icon={UserCheck}
            />

            <StatCard
              label="Pending verification"
              value={String(
                pendingCount,
              )}
              hint="Email not verified"
              icon={UserX}
            />
          </div>
        </section>

        <section>
          <SectionHeading
            title="Administration"
            description="Manage the platform using the sections in the sidebar."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="surface-panel rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />

                <h2 className="font-semibold">
                  User Management
                </h2>
              </div>

              <p className="text-muted-foreground text-sm">
                View registered users,
                manage system roles,
                and remove users.
              </p>
            </div>

            <div className="surface-panel rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-primary" />

                <h2 className="font-semibold">
                  Circle Management
                </h2>
              </div>

              <p className="text-muted-foreground text-sm">
                View all Circles, their
                members, and Circle Admins.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}