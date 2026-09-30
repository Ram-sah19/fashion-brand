import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/velora/AdminShell";
import {
  Avatar,
  PrivacyBadge,
  SectionHeading,
} from "@/components/velora/primitives";
import {
  getAllCirclesForAdmin,
  type AdminCircle,
} from "@/lib/circle-api";

export const Route = createFileRoute(
  "/admin/circles",
)({
  head: () => ({
    meta: [
      {
        title:
          "Circle Management — Velora Circle",
      },
      {
        name: "description",
        content:
          "Manage Velora Circle Circles and view their members.",
      },
      {
        property: "og:title",
        content:
          "Circle Management — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Manage Velora Circle Circles and view their members.",
      },
    ],
  }),
  component: CircleManagementPage,
});

function getInitials(
  name: string,
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]!
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0]![0]! +
    parts[parts.length - 1]![0]!
  ).toUpperCase();
}

function CircleManagementPage() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [circles, setCircles] =
    useState<AdminCircle[]>([]);

  const [loadingCircles, setLoadingCircles] =
    useState(false);

  /* ADMIN AUTH CHECK */

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

  /* LOAD CIRCLES */

  useEffect(() => {
    if (checkingAuth) {
      return;
    }

    const loadCircles = async () => {
      try {
        setLoadingCircles(true);

        const result =
          await getAllCirclesForAdmin();

        setCircles(result);
      } catch (error) {
        console.error(
          "Load admin circles error:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load Circles",
        );
      } finally {
        setLoadingCircles(false);
      }
    };

    void loadCircles();
  }, [checkingAuth]);

  if (checkingAuth) {
    return null;
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-9">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Circle Management
            </h1>

            <PrivacyBadge
              label="System Admin only"
              tone="accent"
              icon={ShieldAlert}
            />
          </div>

          <p className="text-muted-foreground mt-1.5 text-sm">
            View all Circles, their members,
            and Circle Admins.
          </p>
        </header>

        {/* CIRCLE OVERVIEW */}

        <section>
          <SectionHeading
            title="Circle overview"
            description={`${circles.length} Circle${
              circles.length === 1
                ? ""
                : "s"
            } in the database`}
          />

          <div className="surface-panel rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />

              <div>
                <p className="text-muted-foreground text-sm">
                  Total Circles
                </p>

                <p className="text-2xl font-bold">
                  {circles.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CIRCLE MANAGEMENT */}

        <section>
          <SectionHeading
            title="All Circles"
            description="Circle membership and administration information"
          />

          <div className="space-y-4">
            {loadingCircles ? (
              <div className="surface-panel rounded-2xl px-4 py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  Loading Circles...
                </p>
              </div>
            ) : circles.length === 0 ? (
              <div className="surface-panel rounded-2xl px-4 py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  No Circles found.
                </p>
              </div>
            ) : (
              circles.map((circle) => (
                <div
                  key={circle.id}
                  className="surface-panel rounded-2xl p-5"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {circle.name}
                      </h3>

                      {circle.description && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {circle.description}
                        </p>
                      )}
                    </div>

                    <PrivacyBadge
                      label={`${circle.members.length} ${
                        circle.members.length ===
                        1
                          ? "member"
                          : "members"
                      }`}
                      tone="muted"
                      icon={Users}
                    />
                  </div>

                  <div className="border-border overflow-hidden rounded-xl border">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="text-muted-foreground bg-accent/20 border-border border-b text-[11px] tracking-wider uppercase">
                          <th className="px-4 py-3 font-medium">
                            Member
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Email
                          </th>

                          <th className="px-4 py-3 font-medium">
                            Role
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {circle.members.map(
                          (member) => {
                            const isCircleAdmin =
                              circle.admins.includes(
                                member._id,
                              );

                            return (
                              <tr
                                key={
                                  member._id
                                }
                                className="border-border border-b last:border-b-0"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      initials={getInitials(
                                        member.name,
                                      )}
                                      size="sm"
                                    />

                                    <span className="font-medium">
                                      {member.name}
                                    </span>
                                  </div>
                                </td>

                                <td className="text-muted-foreground px-4 py-3">
                                  {member.email}
                                </td>

                                <td className="px-4 py-3">
                                  <PrivacyBadge
                                    label={
                                      isCircleAdmin
                                        ? "Circle Admin"
                                        : "Member"
                                    }
                                    tone={
                                      isCircleAdmin
                                        ? "accent"
                                        : "muted"
                                    }
                                    icon={
                                      isCircleAdmin
                                        ? ShieldAlert
                                        : Users
                                    }
                                  />
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}