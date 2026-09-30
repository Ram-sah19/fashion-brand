import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/velora/AdminShell";
import {
  Avatar,
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
  "/admin/users",
)({
  head: () => ({
    meta: [
      {
        title:
          "User Management — Velora Circle",
      },
      {
        name: "description",
        content:
          "Manage Velora Circle users and system roles.",
      },
      {
        property: "og:title",
        content:
          "User Management — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Manage Velora Circle users and system roles.",
      },
    ],
  }),
  component: UserManagementPage,
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

function formatJoinedDate(
  createdAt: string,
): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function UserManagementPage() {
  const navigate = useNavigate();

  const [query, setQuery] =
    useState("");

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [managingUserId, setManagingUserId] =
    useState<string | null>(null);

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

  /* LOAD USERS */

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

        console.log(
          "Admin users API response:",
          data,
        );

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
          "Load admin users error:",
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

  /* SEARCH */

  const filteredUsers =
    useMemo(() => {
      const normalizedQuery =
        query.trim().toLowerCase();

      if (!normalizedQuery) {
        return users;
      }

      return users.filter(
        (user) =>
          user.name
            .toLowerCase()
            .includes(
              normalizedQuery,
            ) ||
          user.email
            .toLowerCase()
            .includes(
              normalizedQuery,
            ),
      );
    }, [users, query]);

  /* UPDATE USER ROLE */

  const updateRole = async (
    userId: string,
    role: "user" | "admin",
  ) => {
    try {
      setManagingUserId(userId);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/users/admin/${userId}/role`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              role,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update user role",
        );
      }

      setUsers(
        (currentUsers) =>
          currentUsers.map(
            (user) =>
              user._id === userId
                ? {
                    ...user,
                    role,
                  }
                : user,
          ),
      );

      toast.success(
        "User role updated successfully",
      );
    } catch (error) {
      console.error(
        "Update user role error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update user role",
      );
    } finally {
      setManagingUserId(null);
    }
  };

  /* REMOVE USER */

  const removeUser = async (
    user: AdminUser,
  ) => {
    const confirmed =
      window.confirm(
        `Remove ${user.name} from Velora Circle?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setManagingUserId(user._id);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/users/admin/${user._id}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to remove user",
        );
      }

      setUsers(
        (currentUsers) =>
          currentUsers.filter(
            (currentUser) =>
              currentUser._id !==
              user._id,
          ),
      );

      toast.success(
        "User removed successfully",
      );
    } catch (error) {
      console.error(
        "Remove user error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove user",
      );
    } finally {
      setManagingUserId(null);
    }
  };

  if (checkingAuth) {
    return null;
  }

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

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-9">
        <header>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold sm:text-3xl">
              User Management
            </h1>

            <PrivacyBadge
              label="System Admin only"
              tone="accent"
              icon={ShieldAlert}
            />
          </div>

          <p className="text-muted-foreground mt-1.5 text-sm">
            Manage registered users and
            their system roles.
          </p>
        </header>

        {/* USER STATISTICS */}

        <section>
          <SectionHeading
            title="User overview"
            description="Current user data from MongoDB"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-panel rounded-2xl p-5">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Total users
              </div>

              <p className="text-2xl font-bold">
                {totalUsers}
              </p>
            </div>

            <div className="surface-panel rounded-2xl p-5">
              <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4" />
                Admins
              </div>

              <p className="text-2xl font-bold">
                {adminCount}
              </p>
            </div>

            <div className="surface-panel rounded-2xl p-5">
              <div className="text-muted-foreground mb-2 text-sm">
                Verified users
              </div>

              <p className="text-2xl font-bold">
                {verifiedCount}
              </p>
            </div>

            <div className="surface-panel rounded-2xl p-5">
              <div className="text-muted-foreground mb-2 text-sm">
                Pending verification
              </div>

              <p className="text-2xl font-bold">
                {pendingCount}
              </p>
            </div>
          </div>
        </section>

        {/* USER MANAGEMENT TABLE */}

        <section>
          <SectionHeading
            title="Registered users"
            description={`${totalUsers} user${
              totalUsers === 1
                ? ""
                : "s"
            } in the database`}
          />

          <div className="mb-4">
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden
              />

              <Input
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Search by name or email"
                aria-label="Search users"
                className="pl-9"
              />
            </div>
          </div>

          <div className="surface-panel overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-[11px] tracking-wider uppercase">
                  <th className="px-4 py-3 font-medium">
                    User
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Role
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Verification
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Joined
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-4 py-10 text-center"
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-muted-foreground px-4 py-10 text-center"
                    >
                      {query
                        ? "No users found."
                        : "No users in the database."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(
                    (user) => (
                      <tr
                        key={user._id}
                        className="border-border hover:bg-accent/30 border-b last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                              initials={getInitials(
                                user.name,
                              )}
                              size="sm"
                            />

                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {user.name}
                              </div>

                              <div className="text-muted-foreground truncate text-xs">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <PrivacyBadge
                            label={
                              user.role
                            }
                            tone={
                              user.role ===
                                "admin" ||
                              user.role ===
                                "superadmin"
                                ? "accent"
                                : "muted"
                            }
                            icon={Users}
                          />
                        </td>

                        <td className="text-muted-foreground px-4 py-3">
                          {user.emailVerified
                            ? "Verified"
                            : "Pending"}
                        </td>

                        <td className="text-muted-foreground px-4 py-3">
                          {formatJoinedDate(
                            user.createdAt,
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {user.role ===
                          "superadmin" ? (
                            <span className="text-muted-foreground text-xs">
                              Protected
                            </span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={
                                    managingUserId ===
                                    user._id
                                  }
                                  aria-label={`Manage ${user.name}`}
                                >
                                  {managingUserId ===
                                  user._id
                                    ? "Updating..."
                                    : "Manage"}
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                {user.role ===
                                "user" ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      void updateRole(
                                        user._id,
                                        "admin",
                                      )
                                    }
                                  >
                                    Make admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      void updateRole(
                                        user._id,
                                        "user",
                                      )
                                    }
                                  >
                                    Make user
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() =>
                                    void removeUser(
                                      user,
                                    )
                                  }
                                >
                                  Remove user
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}