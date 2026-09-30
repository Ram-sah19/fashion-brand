import {
  Mic,
  MicOff,
  PhoneOff,
  UserPlus,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { CallState } from "../Types";

type CallScreenProps = {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onMute: () => void;
  onCamera: () => void;
  onInviteUsers: (
    users: {
      id: string;
      name: string;
    }[],
  ) => void;
  onEnd: () => void;
};

type User = {
  id: string;
  name: string;
  email: string;
};

export function CallScreen({
  callState,
  localStream,
  remoteStream,
  onMute,
  onCamera,
  onInviteUsers,
  onEnd,
}: CallScreenProps) {
  const isVideo =
    callState.type === "video";

  const remoteAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const remoteVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const localVideoRef =
    useRef<HTMLVideoElement | null>(null);

  const [showInvitePanel, setShowInvitePanel] =
    useState(false);

  const [users, setUsers] =
    useState<User[]>([]);

  const [selectedUsers, setSelectedUsers] =
    useState<User[]>([]);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const remoteAudioVolume = 0.8;

  useEffect(() => {
    if (
      remoteAudioRef.current &&
      remoteStream
    ) {
      remoteAudioRef.current.srcObject =
        remoteStream;

      remoteAudioRef.current.volume =
        remoteAudioVolume;

      void remoteAudioRef.current.play().catch(
        (error) => {
          console.error(
            "Unable to play remote audio:",
            error,
          );
        },
      );
    }
  }, [remoteStream]);

  useEffect(() => {
    if (
      remoteVideoRef.current &&
      remoteStream
    ) {
      remoteVideoRef.current.srcObject =
        remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (
      localVideoRef.current &&
      localStream
    ) {
      localVideoRef.current.srcObject =
        localStream;
    }
  }, [localStream]);

  const openInvitePanel = async () => {
    setShowInvitePanel(true);

    try {
      setLoadingUsers(true);

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "/api/users/for-call",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load users",
        );
      }

      const data = await response.json();

      const currentUser =
        JSON.parse(
          localStorage.getItem("user") ||
            "{}",
        );

      const currentUserId =
        currentUser.id ||
        currentUser._id;

      const fetchedUsers =
        Array.isArray(data)
          ? data
          : data.users || [];

      const filteredUsers =
        fetchedUsers.filter(
          (user: User) =>
            user.id !== currentUserId &&
            user.id !== currentUserId,
        );

      setUsers(filteredUsers);
    } catch (error) {
      console.error(
        "Failed to load users:",
        error,
      );

      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeInvitePanel = () => {
    setShowInvitePanel(false);
    setSearch("");
  };

  const addUser = (user: User) => {
    const alreadyAdded =
      selectedUsers.some(
        (selectedUser) =>
          selectedUser.id === user.id,
      );

    if (alreadyAdded) {
      return;
    }

    setSelectedUsers(
      (previous) => [
        ...previous,
        user,
      ],
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(
      (previous) =>
        previous.filter(
          (user) =>
            user.id !== userId,
        ),
    );
  };

  /*
   * Send selected users to the call hook.
   *
   * WebRTC/socket signaling is handled by
   * UseCall.tsx, not by this UI component.
   */
  const inviteSelectedUsers = () => {
    if (
      selectedUsers.length === 0
    ) {
      return;
    }

    onInviteUsers(
      selectedUsers.map((user) => ({
        id: user.id,
        name: user.name,
      })),
    );

    setSelectedUsers([]);
    closeInvitePanel();
  };

  const filteredUsers =
    users.filter((user) => {
      const searchText =
        search.toLowerCase();

      return (
        user.name
          .toLowerCase()
          .includes(searchText) ||
        user.email
          .toLowerCase()
          .includes(searchText)
      );
    });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      {/* Remote media */}

      {isVideo ? (
        <div className="absolute inset-0">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />

          {!remoteStream ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">
                  {callState.participants[0]?.name
                    ?.slice(0, 2)
                    .toUpperCase() || "VC"}
                </div>

                <p className="mt-4 text-lg font-semibold">
                  {callState.participants[0]
                    ?.name || "Calling..."}
                </p>
              </div>
            </div>
          ) : null}

          {/* Local video preview */}

          {localStream ? (
            <div className="absolute right-5 top-20 h-32 w-24 overflow-hidden rounded-xl border border-white/20 bg-black shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold">
              {callState.participants[0]?.name
                ?.slice(0, 2)
                .toUpperCase() || "VC"}
            </div>

            <p className="mt-4 text-lg font-semibold">
              {callState.participants[0]
                ?.name || "Calling..."}
            </p>
          </div>
        </div>
      )}

      {/* Hidden audio element */}

      {!isVideo ? (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          controls={false}
        />
      ) : null}

      {/* Header */}

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold">
            {isVideo
              ? "Video call"
              : "Audio call"}
          </p>

          <p className="text-xs text-white/60">
            {callState.status === "calling"
              ? "Calling..."
              : callState.status === "connected"
                ? "Connected"
                : "Connecting..."}
          </p>
        </div>

        <button
          type="button"
          onClick={openInvitePanel}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {/* Invite panel */}

      {showInvitePanel ? (
        <div className="absolute right-5 top-20 z-[120] w-80 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
          {/* Panel header */}

          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-semibold">
                Invite people
              </p>

              <p className="text-xs text-white/50">
                Add people to this call
              </p>
            </div>

            <button
              type="button"
              onClick={closeInvitePanel}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close invite panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}

          <div className="p-3">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search people..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
            />
          </div>

          {/* Selected users */}

          {selectedUsers.length > 0 ? (
            <div className="border-b border-white/10 px-3 pb-3">
              <p className="mb-2 text-xs text-white/50">
                Selected
              </p>

              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(
                  (user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        removeUser(user.id)
                      }
                      className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                    >
                      {user.name}

                      <X className="h-3 w-3" />
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : null}

          {/* User list */}

          <div className="max-h-72 overflow-y-auto p-2">
            {loadingUsers ? (
              <p className="px-3 py-6 text-center text-sm text-white/50">
                Loading people...
              </p>
            ) : filteredUsers.length ===
              0 ? (
              <p className="px-3 py-6 text-center text-sm text-white/50">
                No people found
              </p>
            ) : (
              filteredUsers.map(
                (user) => {
                  const isSelected =
                    selectedUsers.some(
                      (selectedUser) =>
                        selectedUser.id ===
                        user.id,
                    );

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>

                        <p className="truncate text-xs text-white/40">
                          {user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          isSelected
                            ? removeUser(
                                user.id,
                              )
                            : addUser(user)
                        }
                        className="ml-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                      >
                        {isSelected
                          ? "Added"
                          : "Add"}
                      </button>
                    </div>
                  );
                },
              )
            )}
          </div>

          {/* Add selected people to call */}

          {selectedUsers.length > 0 ? (
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={
                  inviteSelectedUsers
                }
                className="w-full rounded-xl bg-white py-2 text-sm font-semibold text-black hover:bg-white/90"
              >
                Add to call
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Controls */}

      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 pb-10">
        <button
          type="button"
          onClick={onMute}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label={
            callState.isMuted
              ? "Unmute microphone"
              : "Mute microphone"
          }
        >
          {callState.isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        {isVideo ? (
          <button
            type="button"
            onClick={onCamera}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label={
              callState.isCameraOff
                ? "Turn camera on"
                : "Turn camera off"
            }
          >
            {callState.isCameraOff ? (
              <VideoOff className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onEnd}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 hover:bg-red-700"
          aria-label="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}