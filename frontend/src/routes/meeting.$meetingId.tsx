import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  Circle,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  MessageSquare,
  PhoneOff,
  Smile,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { callSocket } from "@/socket";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { VeloraLogo } from "@/components/velora/logo";

import {
  Avatar,
  IconButton,
  PrivacyBadge,
  SecureIndicator,
} from "@/components/velora/primitives";

import { useCall } from "@/hooks/UseCall";

import { cn } from "@/lib/utils";

export const Route = createFileRoute(
  "/meeting/$meetingId",
)({
  head: () => ({
    meta: [
      {
        title:
          "Meeting room — Velora Circle",
      },
      {
        name: "description",
        content:
          "Secure, private meeting room. Participant counts stay hidden from attendees; hosts manage access.",
      },
      {
        property: "og:title",
        content:
          "Meeting room — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Secure meeting · Private participants.",
      },
    ],
  }),

  component: MeetingRoom,
});

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role:
  | "user"
  | "admin"
  | "superadmin";
};

type CircleMeeting = {
  _id: string;
  circle: string;
  title: string;
  description?: string;
  scheduledAt: string;
  createdBy: string;
  status:
  | "scheduled"
  | "cancelled"
  | "completed";
};

type CircleSummary = {
  _id: string;
  name: string;
};

type MeetingParticipant = {
  id: string;
  name: string;
};

function getInitials(
  name: string,
): string {
  const parts =
    name
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

/*
 * Safely read JSON from an API response.
 *
 * This prevents a JSON.parse error when
 * a gateway/service returns plain text.
 */
async function readJson(
  response: Response,
): Promise<any> {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function StreamVideo({
  stream,
  muted,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean | undefined;
  className?: string | undefined;
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null,
    );

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    video.srcObject =
      stream ?? null;

    if (stream) {
      void video.play().catch(() => {
        /*
         * Browser autoplay policies can
         * occasionally block playback.
         */
      });
    }

    return () => {
      if (
        video.srcObject === stream
      ) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  if (!stream) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={cn(
        "absolute inset-0 h-full w-full object-cover",
        className,
      )}
    />
  );
}

function VideoTile({
  name,
  initials,
  self,
  muted,
  large,
  stream,
  reaction,
}: {
  name: string;
  initials: string;
  self?: boolean;
  muted?: boolean;
  large?: boolean;
  stream?: MediaStream | null;
  reaction?: string | null;
}) {
  return (
    <div
      className={cn(
        "border-border bg-surface relative aspect-video overflow-hidden rounded-2xl border",
        large && "min-h-[220px]",
      )}
    >
      <div
        className="mesh-bg absolute inset-0 opacity-70"
        aria-hidden
      />

      {stream && (
        <StreamVideo
          stream={stream}
          muted={self}
        />
      )}


      <div className="relative grid h-full place-items-center">
        {!stream && (
          <Avatar
            initials={initials}
            size="lg"
            tone={
              self
                ? "brand"
                : "default"
            }
          />
        )}
      </div>

      {reaction && (
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-6xl drop-shadow-lg">
          {reaction}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 p-2.5">
        <span className="glass truncate rounded-lg px-2 py-1 text-[11px] font-medium">
          {self ? "You" : name}
        </span>

        {muted && (
          <span className="glass text-muted-foreground grid h-6 w-6 place-items-center rounded-lg">
            <MicOff
              className="h-3 w-3"
              aria-hidden
            />
          </span>
        )}
      </div>
    </div>
  );
}

function ChatLine({
  author,
  time,
  body,
  self,
}: {
  author: string;
  time: string;
  body: string;
  self?: boolean;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 flex items-center gap-2 text-[11px]">
        <span
          className={cn(
            "font-medium",
            self
              ? "text-primary"
              : "text-foreground/70",
          )}
        >
          {author}
        </span>

        {time}
      </div>

      <p className="text-foreground/90">
        {body}
      </p>
    </div>
  );
}

function MeetingRoom() {
  const { meetingId } =
    useParams({
      from: "/meeting/$meetingId",
    });

  const navigate =
    useNavigate();

  /*
   * ---------------------------------------------------------
   * Existing working Velora call system.
   *
   * IMPORTANT:
   * We do not modify UseCall.tsx.
   * ---------------------------------------------------------
   */
  const {
    callState,
    localStreamRef,
    remoteStreamsRef,
    startGroupCall,
    acceptCall,
    rejectCall,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    endCall,
  } = useCall();

  const [user, setUser] =
    useState<AuthUser | null>(
      null,
    );

  const [
    userLoading,
    setUserLoading,
  ] = useState(true);

  const [
    userError,
    setUserError,
  ] = useState(false);

  /*
   * Real backend meeting.
   */
  const [
    meeting,
    setMeeting,
  ] =
    useState<CircleMeeting | null>(
      null,
    );

  const [
    circle,
    setCircle,
  ] =
    useState<CircleSummary | null>(
      null,
    );

  const [
    meetingLoading,
    setMeetingLoading,
  ] = useState(true);

  const [
    meetingError,
    setMeetingError,
  ] = useState<string | null>(
    null,
  );

  /*
   * Pre-join controls.
   */
  const [joined, setJoined] =
    useState(false);

  const [mic, setMic] =
    useState(true);

  const [cam, setCam] =
    useState(true);

  const [
    joining,
    setJoining,
  ] = useState(false);

  /*
   * Existing instant meeting state.
   */
  const [
    instantMeetingStarted,
    setInstantMeetingStarted,
  ] = useState(false);

  const [
    instantMeetingError,
    setInstantMeetingError,
  ] = useState(false);

  const [chatOpen, setChatOpen] =
    useState(false);

  const [
    peopleOpen,
    setPeopleOpen,
  ] = useState(false);

  /*
   * Used to force the UI to re-read the
   * remote stream map when WebRTC streams
   * arrive.
   */
  const [
    streamVersion,
    setStreamVersion,
  ] = useState(0);
  const [reactionMenuOpen, setReactionMenuOpen] =
    useState(false);

  const [activeReactions, setActiveReactions] =
    useState<Map<string, string>>(new Map());

  /*
   * ---------------------------------------------------------
   * Load authenticated user.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const loadCurrentUser =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token",
            );

          if (!token) {
            setUserError(true);
            return;
          }

          const response =
            await fetch(
              "/api/auth/me",
              {
                method: "GET",
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          const data =
            await readJson(
              response,
            );

          if (!response.ok) {
            throw new Error(
              data.message ||
              "Failed to load current user",
            );
          }

          setUser(data.user);
        } catch (error) {
          console.error(
            "Failed to load current user:",
            error,
          );

          setUserError(true);
        } finally {
          setUserLoading(false);
        }
      };

    void loadCurrentUser();
  }, []);

  /*
   * ---------------------------------------------------------
   * Load the REAL CircleMeeting.
   *
   * We intentionally use the existing Circle
   * and Circle Meeting APIs instead of mock-data.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const loadMeeting =
      async () => {
        try {
          setMeetingLoading(true);
          setMeetingError(null);

          const token =
            localStorage.getItem(
              "token",
            );

          if (!token) {
            throw new Error(
              "Authentication required",
            );
          }

          /*
           * First get the Circles that the
           * current user belongs to.
           */
          const circlesResponse =
            await fetch(
              "/api/circles",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          const circlesData =
            await readJson(
              circlesResponse,
            );

          if (!circlesResponse.ok) {
            throw new Error(
              circlesData.message ||
              "Failed to load Circles",
            );
          }

          const circles =
            (circlesData.circles ||
              []) as CircleSummary[];

          /*
           * Find the meeting across the
           * user's Circles.
           */
          const results =
            await Promise.all(
              circles.map(
                async (
                  currentCircle,
                ) => {
                  try {
                    const response =
                      await fetch(
                        `/api/circles/${currentCircle._id}/meetings`,
                        {
                          headers: {
                            Authorization:
                              `Bearer ${token}`,
                          },
                        },
                      );

                    const data =
                      await readJson(
                        response,
                      );

                    if (
                      !response.ok
                    ) {
                      console.warn(
                        `Could not load meetings for Circle ${currentCircle._id}:`,
                        data.message,
                      );

                      return [];
                    }

                    const meetings =
                      (data.meetings ||
                        []) as CircleMeeting[];

                    return meetings.map(
                      (item) => ({
                        meeting: item,
                        circle:
                          currentCircle,
                      }),
                    );
                  } catch (error) {
                    console.warn(
                      "Failed to load Circle meetings:",
                      error,
                    );

                    return [];
                  }
                },
              ),
            );

          const allMeetings =
            results.flat();

          const found =
            allMeetings.find(
              (item) =>
                item.meeting._id ===
                meetingId,
            );

          if (!found) {
            throw new Error(
              "Meeting not found or you do not have access to this meeting.",
            );
          }

          setMeeting(
            found.meeting,
          );

          setCircle(
            found.circle,
          );
        } catch (error) {
          console.error(
            "Failed to load meeting:",
            error,
          );

          setMeetingError(
            error instanceof Error
              ? error.message
              : "Failed to load meeting",
          );
        } finally {
          setMeetingLoading(
            false,
          );
        }
      };

    void loadMeeting();
  }, [meetingId]);


  useEffect(() => {
    if (!user) {
      return;
    }

    const meetingType =
      sessionStorage.getItem(
        "instantMeetingType",
      );

    const callType =
      sessionStorage.getItem(
        "instantMeetingCallType",
      ) as
      | "audio"
      | "video"
      | null;

    const storedUsers =
      sessionStorage.getItem(
        "instantMeetingUsers",
      );

    if (!meetingType || !callType) {
      return;
    }

    if (
      meetingType !== "private" ||
      !storedUsers
    ) {
      return;
    }

    try {
      const selectedUsers =
        JSON.parse(
          storedUsers,
        ) as {
          id: string;
          name: string;
          email?: string;
        }[];

      if (
        selectedUsers.length === 0
      ) {
        setInstantMeetingError(
          true,
        );
        return;
      }

      void startGroupCall(
        callType,
        selectedUsers,
      );

      setJoined(true);
      setInstantMeetingStarted(
        true,
      );

      sessionStorage.removeItem(
        "instantMeetingType",
      );

      sessionStorage.removeItem(
        "instantMeetingCallType",
      );

      sessionStorage.removeItem(
        "instantMeetingUsers",
      );
    } catch (error) {
      console.error(
        "Failed to start instant meeting:",
        error,
      );

      setInstantMeetingError(
        true,
      );
    }
  }, [
    user,
    startGroupCall,
  ]);

  /*
   * ---------------------------------------------------------
   * Existing Circle Instant Meeting flow.
   *
   * Privacy rule is preserved:
   * names/emails are NOT requested.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const meetingType =
      sessionStorage.getItem(
        "instantMeetingType",
      );

    const callType =
      sessionStorage.getItem(
        "instantMeetingCallType",
      ) as
      | "audio"
      | "video"
      | null;

    const circleId =
      sessionStorage.getItem(
        "instantMeetingCircleId",
      );

    if (
      meetingType !== "circle" ||
      !callType ||
      !circleId
    ) {
      return;
    }

    const startCircleMeeting =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token",
            );

          if (!token) {
            throw new Error(
              "Authentication required",
            );
          }

          const response =
            await fetch(
              `/api/circles/${circleId}/call-members`,
              {
                method: "GET",
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          const data =
            await readJson(
              response,
            );

          if (!response.ok) {
            throw new Error(
              data.message ||
              "Failed to prepare Circle meeting",
            );
          }

          const memberIds =
            data.memberIds as string[];

          if (
            !memberIds ||
            memberIds.length === 0
          ) {
            throw new Error(
              "There are no other members available for this meeting.",
            );
          }

          /*
           * Privacy-safe participant
           * representation.
           */
          const participants =
            memberIds.map(
              (id) => ({
                id,
                name: "Circle member",
              }),
            );

          await startGroupCall(
            callType,
            participants,
          );

          setJoined(true);

          sessionStorage.removeItem(
            "instantMeetingType",
          );

          sessionStorage.removeItem(
            "instantMeetingCallType",
          );

          sessionStorage.removeItem(
            "instantMeetingCircleId",
          );
        } catch (error) {
          console.error(
            "Failed to start Circle Meeting:",
            error,
          );

          setInstantMeetingError(
            true,
          );

          sessionStorage.removeItem(
            "instantMeetingType",
          );

          sessionStorage.removeItem(
            "instantMeetingCallType",
          );

          sessionStorage.removeItem(
            "instantMeetingCircleId",
          );
        }
      };

    void startCircleMeeting();
  }, [
    user,
    startGroupCall,
  ]);

  /*
   * ---------------------------------------------------------
   * Detect WebRTC stream updates.
   *
   * UseCall changes callState when connections
   * become connected, so this also gives the
   * meeting UI a chance to display the streams.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    setStreamVersion(
      (value) => value + 1,
    );
  }, [
    callState.status,
    callState.participants.length,
  ]);
  useEffect(() => {
    const handleReaction = ({
      callId,
      userId,
      reaction,
    }: {
      callId: string;
      userId: string;
      reaction: string;
    }) => {
      if (callId !== callState.callId) {
        return;
      }

      setActiveReactions((previous) => {
        const next = new Map(previous);
        next.set(userId, reaction);
        return next;
      });

      window.setTimeout(() => {
        setActiveReactions((previous) => {
          const next = new Map(previous);

          if (next.get(userId) === reaction) {
            next.delete(userId);
          }

          return next;
        });
      }, 2500);
    };

    callSocket.on(
      "call:reaction",
      handleReaction,
    );

    return () => {
      callSocket.off(
        "call:reaction",
        handleReaction,
      );
    };
  }, [callState.callId]);
  /*
   * ---------------------------------------------------------
   * Toasts for existing instant meeting flow.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    if (!instantMeetingError) {
      return;
    }

    toast.error(
      "Unable to start the instant meeting.",
    );

    setInstantMeetingError(
      false,
    );
  }, [
    instantMeetingError,
  ]);

  useEffect(() => {
    if (!instantMeetingStarted) {
      return;
    }

    toast.success(
      "Instant meeting started.",
    );

    setInstantMeetingStarted(
      false,
    );
  }, [
    instantMeetingStarted,
  ]);

  /*
   * ---------------------------------------------------------
   * Join the REAL scheduled Circle Meeting.
   *
   * We use the existing privacy-safe
   * /call-members endpoint.
   * ---------------------------------------------------------
   */
  const joinScheduledMeeting =
    async () => {
      if (!meeting) {
        toast.error(
          "Meeting information is not available.",
        );
        return;
      }

      if (
        meeting.status !==
        "scheduled"
      ) {
        toast.error(
          `This meeting is ${meeting.status}.`,
        );
        return;
      }

      if (!user) {
        toast.error(
          "Authentication required.",
        );
        return;
      }

      try {
        setJoining(true);

        const token =
          localStorage.getItem(
            "token",
          );

        if (!token) {
          throw new Error(
            "Authentication required",
          );
        }

        /*
         * Get only member IDs.
         *
         * No member names/emails are exposed.
         */
        const response =
          await fetch(
            `/api/circles/${meeting.circle}/call-members`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await readJson(
            response,
          );

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to prepare meeting participants.",
          );
        }

        const memberIds =
          (data.memberIds ||
            []) as string[];

        if (
          memberIds.length === 0
        ) {
          throw new Error(
            "There are no other Circle members available for this meeting.",
          );
        }

        /*
         * Privacy-safe participant
         * objects.
         */
        const participants =
          memberIds.map(
            (id) => ({
              id,
              name: "Circle member",
            }),
          );

        /*
         * Video if camera is enabled.
         * Audio if camera is disabled.
         */
        const callType =
          cam
            ? "video"
            : "audio";

        await startGroupCall(
          callType,
          participants,
        );

        setJoined(true);

        toast.success(
          "Joined meeting.",
        );
      } catch (error) {
        console.error(
          "Failed to join scheduled meeting:",
          error,
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to join meeting.",
        );
      } finally {
        setJoining(false);
      }
    };

  /*
   * ---------------------------------------------------------
   * Keep the local media controls synchronized
   * with the actual WebRTC stream.
   * ---------------------------------------------------------
   */
  const handleToggleMute =
    () => {
      if (!joined) {
        setMic(
          (value) => !value,
        );
        return;
      }

      toggleMute();

      setMic(
        (value) => !value,
      );
    };

  const handleToggleCamera =
    () => {
      if (!joined) {
        setCam(
          (value) => !value,
        );
        return;
      }

      /*
       * Audio-only calls do not have a
       * video track, so toggleCamera()
       * safely does nothing there.
       */
      toggleCamera();

      setCam(
        (value) => !value,
      );
    };

  /*
   * ---------------------------------------------------------
   * Leave meeting.
   *
   * IMPORTANT:
   * The previous version only navigated away.
   * This version actually tells the existing
   * call system to end the call first.
   * ---------------------------------------------------------
   */
  const leaveMeeting =
    () => {
      if (
        callState.callId
      ) {
        endCall();
      }

      setJoined(false);

      void navigate({
        to: "/meetings",
      });
    };

  /*
   * ---------------------------------------------------------
   * Incoming call/invitation UI.
   *
   * This uses the existing UseCall state.
   * ---------------------------------------------------------
   */
  const incomingCall =
    callState.status ===
    "ringing";

  /*
   * ---------------------------------------------------------
   * Current participant list.
   *
   * For Circle meetings, names remain
   * "Circle member" because the backend
   * intentionally does not expose the directory.
   * ---------------------------------------------------------
   */
  const participants =
    useMemo<MeetingParticipant[]>(
      () => {
        return callState.participants.map(
          (participant) => ({
            id: participant.id,
            name:
              participant.name ||
              "Circle member",
          }),
        );
      },
      [
        callState.participants,
      ],
    );

  /*
   * Force reading the map after WebRTC state
   * changes. The value itself is intentionally
   * not otherwise used.
   */
  void streamVersion;

  /*
   * ---------------------------------------------------------
   * Loading states.
   * ---------------------------------------------------------
   */
  if (
    userLoading ||
    meetingLoading
  ) {
    return (
      <div className="mesh-bg bg-background flex min-h-[100dvh] items-center justify-center px-5">
        <div className="glass rounded-3xl p-6 text-center">
          <VeloraLogo />

          <p className="text-muted-foreground mt-4 text-sm">
            Loading your meeting...
          </p>
        </div>
      </div>
    );
  }

  if (
    userError ||
    !user
  ) {
    return (
      <div className="mesh-bg bg-background flex min-h-[100dvh] items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-3xl p-6 text-center">
          <h1 className="text-lg font-semibold">
            Authentication required
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            We could not load your account.
            Please sign in again.
          </p>

          <Button
            className="mt-5"
            onClick={() =>
              void navigate({
                to: "/",
              })
            }
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (
    meetingError ||
    !meeting
  ) {
    return (
      <div className="mesh-bg bg-background flex min-h-[100dvh] items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-3xl p-6 text-center">
          <h1 className="text-lg font-semibold">
            Meeting unavailable
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            {meetingError ||
              "This meeting could not be loaded."}
          </p>

          <Button
            className="mt-5"
            onClick={() =>
              void navigate({
                to: "/meetings",
              })
            }
          >
            Back to Meetings
          </Button>
        </div>
      </div>
    );
  }

  const initials =
    getInitials(user.name);

  const isHost =
    meeting.createdBy ===
    user.id ||
    user.role ===
    "admin" ||
    user.role ===
    "superadmin";

  /*
   * ---------------------------------------------------------
   * Incoming call overlay.
   * ---------------------------------------------------------
   */
  if (incomingCall) {
    const caller =
      participants[0];

    return (
      <div className="mesh-bg bg-background flex min-h-[100dvh] items-center justify-center px-5">
        <div className="glass w-full max-w-md rounded-3xl p-6 text-center shadow-[var(--shadow-float)]">
          <VeloraLogo />

          <div className="mt-7 flex justify-center">
            <Avatar
              initials={getInitials(
                caller?.name ||
                "Circle member",
              )}
              size="lg"
              tone="brand"
            />
          </div>

          <h1 className="mt-4 text-lg font-semibold">
            {caller?.name ||
              "Incoming meeting"}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Incoming{" "}
            {callState.type ===
              "video"
              ? "video"
              : "audio"}{" "}
            call
          </p>

          <p className="text-muted-foreground mt-1 text-xs">
            {meeting.title}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={
                rejectCall
              }
            >
              Decline
            </Button>

            <Button
              onClick={async () => {
                await acceptCall();
                setJoined(true);
              }}
            >
              Join Meeting
            </Button>
          </div>

          <div className="mt-5 flex justify-center">
            <SecureIndicator />
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Pre-join screen.
   * ---------------------------------------------------------
   */
  if (
    !joined &&
    callState.status ===
    "idle"
  ) {
    return (
      <div className="mesh-bg bg-background flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10">
        <VeloraLogo />

        <div className="glass mt-8 w-full max-w-md rounded-3xl p-6 text-center shadow-[var(--shadow-float)]">
          <h1 className="text-lg font-semibold">
            {meeting.title}
          </h1>

          <p className="text-muted-foreground mt-1 text-xs">
            {circle?.name ||
              "Private Circle"}
          </p>

          {meeting.description && (
            <p className="text-muted-foreground mt-3 text-sm">
              {meeting.description}
            </p>
          )}

          <p className="text-muted-foreground mt-2 text-xs">
            {new Date(
              meeting.scheduledAt,
            ).toLocaleString()}
          </p>

          <div className="border-border bg-surface relative mt-6 aspect-video overflow-hidden rounded-2xl border">
            <div
              className="mesh-bg absolute inset-0 opacity-70"
              aria-hidden
            />

            <div className="relative grid h-full place-items-center">
              {cam ? (
                <Avatar
                  initials={initials}
                  size="lg"
                  tone="brand"
                />
              ) : (
                <VideoOff
                  className="text-muted-foreground h-7 w-7"
                  aria-hidden
                />
              )}
            </div>

            <span className="glass absolute bottom-2.5 left-2.5 rounded-lg px-2 py-1 text-[11px]">
              Camera preview
            </span>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <IconButton
              icon={
                mic
                  ? Mic
                  : MicOff
              }
              label={
                mic
                  ? "Mute microphone"
                  : "Unmute microphone"
              }
              variant="solid"
              active={mic}
              onClick={
                handleToggleMute
              }
              className="h-12 w-12"
            />

            <IconButton
              icon={
                cam
                  ? Video
                  : VideoOff
              }
              label={
                cam
                  ? "Turn camera off"
                  : "Turn camera on"
              }
              variant="solid"
              active={cam}
              onClick={
                handleToggleCamera
              }
              className="h-12 w-12"
            />
          </div>

          <Button
            className="mt-6 h-11 w-full"
            disabled={joining}
            onClick={() =>
              void joinScheduledMeeting()
            }
          >
            {joining
              ? "Joining..."
              : "Join Meeting"}
          </Button>

          <div className="mt-4 flex justify-center">
            <SecureIndicator />
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * Active meeting.
   * ---------------------------------------------------------
   */

  const localStream =
    localStreamRef.current;

  const remoteParticipants =
    participants;

  return (
    <div className="bg-background flex h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="border-border safe-top grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold">
              {meeting.title}
            </h1>

            <PrivacyBadge
              label="Private meeting"
              tone="accent"
            />
          </div>

          <div className="mt-1 flex items-center gap-3">
            <SecureIndicator />

            {callState.status ===
              "connected" && (
                <span className="text-primary inline-flex items-center gap-1.5 text-[11px]">
                  <Circle
                    className="h-2.5 w-2.5 fill-current"
                    aria-hidden
                  />
                  Connected
                </span>
              )}

            {callState.status ===
              "calling" && (
                <span className="text-muted-foreground text-[11px]">
                  Calling...
                </span>
              )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isHost && (
            <IconButton
              icon={Users}
              label="Participants"
              onClick={() =>
                setPeopleOpen(
                  true,
                )
              }
            />
          )}

          <IconButton
            icon={MessageSquare}
            label="Meeting chat"
            onClick={() =>
              setChatOpen(true)
            }
          />
        </div>
      </header>

      {/* Main meeting area */}
      <div className="flex min-h-0 flex-1">
        <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto p-3 pb-32 sm:p-5 sm:pb-32">
          <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2">
            {/* Local user */}
            <VideoTile
              name={user.name}
              initials={initials}
              self
              muted={callState.isMuted}
              large
              stream={localStream}
              reaction={
                activeReactions.get(user.id) ??
                null
              }
            />

            {/* Remote users */}
            {remoteParticipants.map(
              (
                participant,
                index,
              ) => {
                const stream =
                  remoteStreamsRef.current.get(
                    participant.id,
                  ) ||
                  null;

                return (
                  <VideoTile
                    key={participant.id}
                    name={participant.name}
                    initials={getInitials(
                      participant.name,
                    )}
                    muted={false}
                    large={
                      index === 0 &&
                      !localStream
                    }
                    stream={stream}
                    reaction={
                      activeReactions.get(
                        participant.id,
                      ) ?? null
                    }

                  />
                );
              },
            )}
          </div>

          {remoteParticipants.length ===
            0 &&
            callState.status !==
            "connected" && (
              <div className="text-muted-foreground mx-auto mt-6 max-w-md text-center text-xs">
                Waiting for other participants
                to join...
              </div>
            )}
        </main>

        {/* Desktop meeting chat */}
        <aside className="border-border hidden w-[330px] shrink-0 flex-col border-l xl:flex">
          <div className="border-border border-b px-4 py-3">
            <p className="text-sm font-semibold">
              Meeting chat
            </p>

            <p className="text-muted-foreground text-[11px]">
              Visible to participants only
            </p>
          </div>

          <div className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-[13px]">
            <ChatLine
              author="Velora"
              time="Now"
              body="You are securely connected to this meeting."
            />
          </div>
        </aside>
      </div>

      {/* Floating control bar */}
      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-4">
        <div className="glass pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl p-2 shadow-[var(--shadow-float)]">
          <IconButton
            icon={
              callState.isMuted
                ? MicOff
                : Mic
            }
            label={
              callState.isMuted
                ? "Unmute"
                : "Mute"
            }
            variant="solid"
            active={
              !callState.isMuted
            }
            onClick={
              handleToggleMute
            }
            className="h-12 w-12"
          />

          <IconButton
            icon={
              callState.isCameraOff
                ? VideoOff
                : Video
            }
            label={
              callState.isCameraOff
                ? "Start camera"
                : "Stop camera"
            }
            variant="solid"
            active={
              !callState.isCameraOff
            }
            onClick={
              handleToggleCamera
            }
            className="h-12 w-12"
          />

          <IconButton
            icon={MonitorUp}
            label={
              isScreenSharing
                ? "Stop sharing"
                : "Share screen"
            }
            variant="solid"
            active={isScreenSharing}
            className="hidden h-12 w-12 sm:inline-flex"
            onClick={() => {
              if (isScreenSharing) {
                void stopScreenShare();
              } else {
                void startScreenShare();
              }
            }}
          />


          <div className="relative">
            {reactionMenuOpen && (
              <div className="glass absolute bottom-14 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-xl p-2 shadow-[var(--shadow-float)]">
                {["👍", "❤️", "😂", "👏", "😮", "🎉"].map(
                  (reaction) => (
                    <button
                      key={reaction}
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-lg text-xl transition hover:bg-white/10"
                      onClick={() => {
                        if (!callState.callId) {
                          return;
                        }

                        callSocket.emit(
                          "call:reaction",
                          {
                            callId:
                              callState.callId,
                            reaction,
                            targetUserIds:
                              participants.map(
                                (participant) =>
                                  participant.id,
                              ),
                          },
                        );

                        setActiveReactions(
                          (previous) => {
                            const next =
                              new Map(previous);

                            next.set(
                              user.id,
                              reaction,
                            );

                            return next;
                          },
                        );

                        window.setTimeout(() => {
                          setActiveReactions(
                            (previous) => {
                              const next =
                                new Map(previous);

                              if (
                                next.get(user.id) ===
                                reaction
                              ) {
                                next.delete(user.id);
                              }

                              return next;
                            },
                          );
                        }, 2500);

                        setReactionMenuOpen(
                          false,
                        );
                      }}
                    >
                      {reaction}
                    </button>
                  ),
                )}
              </div>
            )}

            <IconButton
              icon={Smile}
              label="Reactions"
              variant="solid"
              className="hidden h-12 w-12 sm:inline-flex"
              onClick={() =>
                setReactionMenuOpen(
                  (open) => !open,
                )
              }
            />
          </div>

          <IconButton
            icon={MessageSquare}
            label="Chat"
            variant="solid"
            className="h-12 w-12 xl:hidden"
            onClick={() =>
              setChatOpen(true)
            }
          />

          {isHost && (
            <IconButton
              icon={Users}
              label="Participants"
              variant="solid"
              className="h-12 w-12"
              onClick={() =>
                setPeopleOpen(
                  true,
                )
              }
            />
          )}

          <IconButton
            icon={MoreHorizontal}
            label="More"
            variant="solid"
            className="hidden h-12 w-12 sm:inline-flex"
            onClick={() =>
              toast(
                "More meeting options",
              )
            }
          />

          <IconButton
            icon={PhoneOff}
            label="Leave meeting"
            variant="danger"
            className="h-12 w-14"
            onClick={
              leaveMeeting
            }
          />
        </div>
      </div>

      {/* Mobile / tablet chat sheet */}
      <Sheet
        open={chatOpen}
        onOpenChange={
          setChatOpen
        }
      >
        <SheetContent
          side="bottom"
          className="h-[80dvh] p-0"
        >
          <SheetHeader className="border-border grid grid-cols-[minmax(0,1fr)_auto] items-center border-b">
            <SheetTitle className="truncate">
              Meeting chat
            </SheetTitle>

            <IconButton
              icon={X}
              label="Close chat"
              onClick={() =>
                setChatOpen(false)
              }
            />
          </SheetHeader>

          <div className="scrollbar-slim min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-[13px]">
            <ChatLine
              author="Velora"
              time="Now"
              body="You are securely connected to this meeting."
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Host-only participants sheet */}
      <Sheet
        open={peopleOpen}
        onOpenChange={
          setPeopleOpen
        }
      >
        <SheetContent
          side="bottom"
          className="h-[70dvh] p-0"
        >
          <SheetHeader className="border-border border-b">
            <SheetTitle>
              Participants
            </SheetTitle>

            <p className="text-muted-foreground text-xs">
              Host view only. Attendees never see
              this directory.
            </p>
          </SheetHeader>

          <div className="scrollbar-slim min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5">
              <Avatar
                initials={
                  initials
                }
                size="sm"
                tone="brand"
              />

              <span className="truncate text-[13px]">
                {user.name}
              </span>

              <span className="text-muted-foreground text-[11px]">
                You
              </span>
            </div>

            {participants.map(
              (participant) => (
                <div
                  key={
                    participant.id
                  }
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5"
                >
                  <Avatar
                    initials={getInitials(
                      participant.name,
                    )}
                    size="sm"
                  />

                  <span className="truncate text-[13px]">
                    {participant.name}
                  </span>

                  <span className="text-muted-foreground text-[11px]">
                    In meeting
                  </span>
                </div>
              ),
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
