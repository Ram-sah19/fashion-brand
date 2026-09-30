import { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addCircleMember,
  demoteCircleAdmin,
  getCircleMembers,
  promoteCircleAdmin,
  removeCircleMember,
  type CircleMember,
} from "@/lib/circle-member-api";

type CircleMemberManagerProps = {
  circleId: string;
};

type SearchUser = {
  _id: string;
  id?: string;
  name: string;
  email: string;
};

export function CircleMemberManager({
  circleId,
}: CircleMemberManagerProps) {
  const [members, setMembers] =
    useState<CircleMember[]>([]);

  const [userId, setUserId] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<SearchUser[]>([]);

  const [searching, setSearching] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

  const [actionUserId, setActionUserId] =
    useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);

      const data =
        await getCircleMembers(circleId);

      setMembers(data);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load members",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [circleId]);

  const searchUsers = async (
    value: string,
  ) => {
    const query = value.trim();

    setUserId(value);

    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          {
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
            "Failed to search users",
        );
      }

      const results =
        data.users ||
        data.data ||
        [];

      setSearchResults(
        Array.isArray(results)
          ? results
          : [],
      );
    } catch (error) {
      console.error(
        "Search users error:",
        error,
      );

      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (
    selectedUserId?: string,
  ) => {
    const id =
      selectedUserId ||
      userId.trim();

    if (!id) {
      toast.error("Select a user");
      return;
    }

    try {
      setAdding(true);

      await addCircleMember(
        circleId,
        id,
      );

      toast.success(
        "Member added successfully",
      );

      setUserId("");
      setSearchResults([]);

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add member",
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await removeCircleMember(
        circleId,
        memberId,
      );

      toast.success(
        "Member removed successfully",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove member",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handlePromote = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await promoteCircleAdmin(
        circleId,
        memberId,
      );

      toast.success(
        "Member promoted to Circle Admin",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to promote member",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleDemote = async (
    memberId: string,
  ) => {
    try {
      setActionUserId(memberId);

      await demoteCircleAdmin(
        circleId,
        memberId,
      );

      toast.success(
        "Circle Admin demoted",
      );

      await loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to demote admin",
      );
    } finally {
      setActionUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add member */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Add member
        </p>

        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={userId}
              onChange={(event) =>
                void searchUsers(
                  event.target.value,
                )
              }
              placeholder="Search by name or email"
            />

            <Button
              onClick={() =>
                void handleAddMember()
              }
              disabled={
                adding ||
                !userId.trim()
              }
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}

              Add
            </Button>
          </div>

          {/* Search results */}
          {userId.trim() &&
            (searching ||
              searchResults.length > 0) && (
              <div className="border-border bg-background absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-lg">
                {searching ? (
                  <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching users...
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    {searchResults.map(
                      (user) => {
                        const actualUserId =
                          user._id ||
                          user.id ||
                          "";

                        const alreadyMember =
                          members.some(
                            (member) =>
                              member._id ===
                              actualUserId,
                          );

                        return (
                          <div
                            key={
                              actualUserId
                            }
                            className="hover:bg-surface-2 flex items-center justify-between gap-3 p-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {user.name}
                              </p>

                              <p className="text-muted-foreground truncate text-xs">
                                {user.email}
                              </p>
                            </div>

                            {alreadyMember ? (
                              <span className="text-muted-foreground shrink-0 text-xs">
                                Already added
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                disabled={
                                  adding
                                }
                                onClick={() =>
                                  void handleAddMember(
                                    actualUserId,
                                  )
                                }
                              >
                                <UserPlus className="mr-1 h-4 w-4" />
                                Add
                              </Button>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Circle members */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Circle members
        </p>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No members found.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const isProcessing =
                actionUserId ===
                member._id;

              return (
                <div
                  key={member._id}
                  className="border-border bg-surface-2/40 flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>

                    <p className="text-muted-foreground truncate text-xs">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={
                        isProcessing
                      }
                      onClick={() =>
                        void handlePromote(
                          member._id,
                        )
                      }
                      title="Promote to admin"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={
                        isProcessing
                      }
                      onClick={() =>
                        void handleDemote(
                          member._id,
                        )
                      }
                      title="Demote admin"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={
                        isProcessing
                      }
                      onClick={() =>
                        void handleRemoveMember(
                          member._id,
                        )
                      }
                      title="Remove member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}