import {
  createFileRoute,
  Link,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  EyeOff,
  MoreHorizontal,
  Pin,
  Search,
  Settings2,
  Video,
} from "lucide-react";

import { getCircle, type Circle } from "@/lib/circle-api";
import { getOrCreateCircleConversation } from "@/lib/circle-conversation-api";
import {
  getCircleMeetings,
  type CircleMeeting,
} from "@/lib/circle-meeting-api";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/velora/app-shell";
import {
  MessageBubble,
  MessageComposer,
} from "@/components/velora/chat";
import {
  ManageCircleModal,
  ScheduleMeetingModal,
} from "@/components/velora/modals";
import {
  IconButton,
  PrivacyBadge,
} from "@/components/velora/primitives";

import { currentUser } from "@/lib/mock-data";

import socket from "../socket";

export const Route = createFileRoute(
  "/circles/$circleId",
)({
  head: () => ({
    meta: [
      {
        title:
          "Private Circle — Velora Circle",
      },
      {
        name: "description",
        content:
          "A private Circle conversation. Member directory hidden, member count hidden, invitations restricted.",
      },
      {
        property: "og:title",
        content:
          "Private Circle — Velora Circle",
      },
      {
        property:
          "og:description",
        content:
          "Private space · Member directory hidden.",
      },
    ],
  }),

  component: CirclePage,
});

type BackendMessage = {
  _id: string;

  conversation:
  | string
  | {
    _id: string;
  };

  sender: {
    _id: string;
    name: string;
    email: string;
  };

  text: string;

  createdAt: string;
};

function CirclePage() {
  const { circleId } =
    useParams({
      from: "/circles/$circleId",
    });

  const [circle, setCircle] =
    useState<Circle | null>(null);

  const [meetings, setMeetings] =
    useState<CircleMeeting[]>([]);

  const [conversationId, setConversationId] =
    useState("");

  const [backendMessages, setBackendMessages] =
    useState<BackendMessage[]>([]);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [conversationError, setConversationError] =
    useState("");

  /*
   * =====================================================
   * LOAD CIRCLE
   * Existing Circle functionality preserved.
   * =====================================================
   */

  useEffect(() => {
    getCircle(circleId)
      .then(setCircle)
      .catch((error) => {
        console.error(
          "Failed to load Circle:",
          error,
        );
      });
  }, [circleId]);

  /*
   * =====================================================
   * LOAD CIRCLE MEETINGS
   * Existing meeting functionality preserved.
   * =====================================================
   */

  useEffect(() => {
    getCircleMeetings(circleId)
      .then(setMeetings)
      .catch((error) => {
        console.error(
          "Failed to load Circle meetings:",
          error,
        );
      });
  }, [circleId]);

  /*
   * =====================================================
   * CREATE / GET REAL CIRCLE CONVERSATION
   * =====================================================
   */

  useEffect(() => {
    async function loadCircleConversation() {
      try {
        setConversationLoading(true);
        setConversationError("");

        const conversation =
          await getOrCreateCircleConversation(
            circleId,
          );

        setConversationId(
          conversation.id,
        );
      } catch (error) {
        console.error(
          "Failed to load Circle conversation:",
          error,
        );

        setConversationError(
          error instanceof Error
            ? error.message
            : "Failed to load Circle conversation",
        );
      } finally {
        setConversationLoading(false);
      }
    }

    void loadCircleConversation();
  }, [circleId]);

  /*
   * =====================================================
   * LOAD REAL CIRCLE MESSAGES
   * =====================================================
   */

  useEffect(() => {
    if (!conversationId) {
      setBackendMessages([]);
      return;
    }

    async function loadMessages() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/messages/${conversationId}`,
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
            "Failed to load Circle messages",
          );
        }

        setBackendMessages(
          data.data || [],
        );
      } catch (error) {
        console.error(
          "Failed to load Circle messages:",
          error,
        );

        setConversationError(
          error instanceof Error
            ? error.message
            : "Failed to load Circle messages",
        );
      }
    }

    void loadMessages();
  }, [conversationId]);

  /*
   * =====================================================
   * JOIN REAL-TIME CIRCLE CONVERSATION
   * =====================================================
   */

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const joinRoom = () => {
      socket.emit(
        "joinConversation",
        conversationId,
      );
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once(
        "connect",
        joinRoom,
      );
    }

    return () => {
      socket.off(
        "connect",
        joinRoom,
      );
    };
  }, [conversationId]);

  /*
   * =====================================================
   * RECEIVE REAL-TIME CIRCLE MESSAGES
   * =====================================================
   */

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handleNewMessage = (
      message: BackendMessage,
    ) => {
      const messageConversationId =
        typeof message.conversation ===
          "string"
          ? message.conversation
          : message.conversation?._id;

      if (
        messageConversationId !==
        conversationId
      ) {
        return;
      }

      setBackendMessages(
        (previous) => {
          const alreadyExists =
            previous.some(
              (item) =>
                item._id ===
                message._id,
            );

          if (alreadyExists) {
            return previous;
          }

          return [
            ...previous,
            message,
          ];
        },
      );
    };

    socket.on(
      "newMessage",
      handleNewMessage,
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage,
      );
    };
  }, [conversationId]);

  /*
   * =====================================================
   * LOADING CIRCLE
   * =====================================================
   */

  if (!circle) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Loading Circle...
          </p>
        </div>
      </AppShell>
    );
  }

 /*
 * =====================================================
 * CIRCLE ADMIN CHECK
 * =====================================================
 */

const storedUser = JSON.parse(
  localStorage.getItem("user") || "{}",
);

const currentUserId =
  storedUser.id || storedUser._id;

const isCircleAdmin =
  Array.isArray(circle.admins) &&
  circle.admins.includes(currentUserId);

const isAdmin =
  storedUser.role === "admin" ||
  storedUser.role === "superadmin" ||
  isCircleAdmin;
  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <AppShell
      flush
      rightPanel={
        <div className="space-y-5">

          {/* About Circle */}

          <div className="surface-panel rounded-2xl p-4">
            <h2 className="text-sm font-semibold">
              About this Circle
            </h2>

            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              {circle.description}
            </p>

            <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
              Private space. Messages are visible only to authorized participants.
            </p>
          </div>

          {/* Circle Meetings */}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Circle Meetings
                </h2>

                <p className="text-muted-foreground text-xs">
                  Scheduled meetings for this Circle
                </p>
              </div>
            </div>

            {meetings.length === 0 ? (
              <div className="border-border rounded-xl border p-4">
                <p className="text-muted-foreground text-sm">
                  No meetings scheduled.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {meetings.map(
                  (meeting) => (
                    <div
                      key={
                        meeting._id
                      }
                      className="border-border rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <p className="font-medium">
                            {meeting.title}
                          </p>

                          {meeting.description && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {
                                meeting.description
                              }
                            </p>
                          )}

                          <p className="text-muted-foreground mt-2 text-xs">
                            {new Date(
                              meeting.scheduledAt,
                            ).toLocaleString()}
                          </p>
                        </div>

                        <span className="text-xs capitalize">
                          {meeting.status}
                        </span>

                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Permissions */}

          <div className="surface-panel rounded-2xl p-4">
            <h2 className="text-sm font-semibold">
              Permissions
            </h2>

            <ul className="mt-3 space-y-2">
              {[
                "Member directory hidden",
                "Member count hidden",
                "Invitations restricted",
              ].map((p) => (
                <li
                  key={p}
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                >
                  <EyeOff
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                  />

                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Manage Circle */}

          {isAdmin && (
            <ManageCircleModal
              circleId={circleId}
              circleName={circle.name}
              trigger={
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <Settings2 className="h-4 w-4" />
                  Manage Circle
                </Button>
              }
            />
          )}

        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">

        {/* =================================================
            CIRCLE HEADER
        ================================================= */}

        <header className="border-border bg-background/70 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2.5 backdrop-blur-xl sm:px-5">

          <div className="flex min-w-0 items-center gap-2">

            <Link
              to="/circles"
              aria-label="Back to Circles"
            >
              <IconButton
                icon={ArrowLeft}
                label="Back to Circles"
              />
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {circle.name}
              </h1>

              <p className="text-muted-foreground truncate text-[11px]">
                Private space · Member directory hidden
              </p>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-1">

            <PrivacyBadge
              label="Private Circle"
              tone="accent"
              className="hidden sm:inline-flex"
            />

            <IconButton
              icon={Search}
              label="Search in Circle"
            />

            <ScheduleMeetingModal
              circleId={circleId}
              trigger={
                <IconButton
                  icon={Video}
                  label="Start Circle meeting"
                />
              }
            />

            {isAdmin && (
              <ManageCircleModal
                circleId={circleId}
                circleName={circle.name}
                circleDescription={circle.description}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Manage
                    </span>
                  </Button>
                }
              />
            )}

          </div>

        </header>

        {/* =================================================
            MESSAGES AREA
        ================================================= */}

        <div className="scrollbar-slim min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-6">

          {/* Existing pinned notice */}

          <div className="border-border bg-surface-2/50 flex items-start gap-2.5 rounded-xl border px-3.5 py-3">

            <Pin
              className="text-primary mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden
            />

            <p className="text-muted-foreground min-w-0 text-xs">
              <span className="text-foreground font-medium">
                Pinned ·{" "}
              </span>

              Release checklist for Nova v2 — review before tonight's session.
            </p>

          </div>

          {/* Privacy notice */}

          <div className="flex justify-center">
            <PrivacyBadge
              label="Member visibility restricted"
              tone="muted"
              icon={EyeOff}
            />
          </div>

          {/* Conversation loading */}

          {conversationLoading && (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground text-sm">
                Loading Circle conversation...
              </p>
            </div>
          )}

          {/* Conversation error */}

          {!conversationLoading &&
            conversationError && (
              <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
                <p className="text-destructive text-sm">
                  {conversationError}
                </p>
              </div>
            )}

          {/* Real messages */}

          {!conversationLoading &&
            !conversationError &&
            backendMessages.length ===
            0 && (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation.
                </p>
              </div>
            )}

          {!conversationLoading &&
            conversationId &&
            backendMessages.map(
              (message) => {
                const storedUser =
                  JSON.parse(
                    localStorage.getItem(
                      "user",
                    ) || "{}",
                  );

                const currentUserId =
                  storedUser.id ||
                  storedUser._id;

                const sender =
                  message.sender;

                const isSelf =
                  sender._id ===
                  currentUserId;

                const senderName =
                  sender.name ||
                  "Circle member";

                const initials =
                  isSelf
                    ? storedUser.name
                      ?.slice(
                        0,
                        2,
                      )
                      .toUpperCase() ||
                    "ME"
                    : senderName
                      .slice(
                        0,
                        2,
                      )
                      .toUpperCase();

                return (
                  <MessageBubble
                    key={
                      message._id
                    }
                    message={{
                      id:
                        message._id,

                      author:
                        isSelf
                          ? "You"
                          : senderName,

                      body:
                        message.text,

                      time:
                        new Date(
                          message.createdAt,
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        ),

                      initials,

                      self:
                        isSelf,
                    }}
                  />
                );
              },
            )}

        </div>

        {/* =================================================
            MESSAGE COMPOSER
        ================================================= */}

        <div className="pb-16 lg:pb-0">

          <MessageComposer
            placeholder={`Message ${circle.name}…`}
            conversationId={
              conversationId
            }
            onMessageSent={(
              message,
            ) => {
              setBackendMessages(
                (previous) => {
                  const alreadyExists =
                    previous.some(
                      (item) =>
                        item._id ===
                        message._id,
                    );

                  if (
                    alreadyExists
                  ) {
                    return previous;
                  }

                  return [
                    ...previous,
                    message,
                  ];
                },
              );
            }}
          />

        </div>

      </div>
    </AppShell>
  );
}