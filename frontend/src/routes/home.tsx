import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarPlus,
  MessageSquarePlus,
  Plus,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/velora/app-shell";
import {
  CircleCard,
  MeetingCard,
} from "@/components/velora/cards";
import { ConversationItem } from "@/components/velora/chat";
import {
  CreateCircleModal,
  ScheduleMeetingModal,
} from "@/components/velora/modals";
import {
  PrivacyBadge,
  SectionHeading,
} from "@/components/velora/primitives";
import type { Circle } from "@/lib/circle-api";

export const Route =
  createFileRoute("/home")({
    head: () => ({
      meta: [
        { title: "Home — Velora Circle" },
        {
          name: "description",
          content:
            "Your private Velora workspace: upcoming meetings, recent conversations and private spaces in one place.",
        },
        {
          property: "og:title",
          content: "Home — Velora Circle",
        },
        {
          property: "og:description",
          content: "Your private workspace, all in one place.",
        },
      ],
    }),

    component: HomePage,
  });

/* =====================================================
   TYPES
===================================================== */

type HomeConversation = {
  id: string;

  type: "direct";

  unreadCount: number;

  pinned: boolean;

  otherUser: {
    id: string;
    name: string;
    email: string;
  } | null;

  latestMessage: {
    text: string;
    createdAt: string;
    sender: string;
  } | null;
};
type HomeMeeting = {
  id: string;
  title: string;
  day: string;
  time: string;
  duration: string;
  privacy: string;
  host: string;
  scheduledAt: string;
  group: "upcoming";
};

/* =====================================================
   PAGE
===================================================== */

function HomePage() {
  const [userName, setUserName] =
    useState("User");

  const [
    backendConversations,
    setBackendConversations,
  ] = useState<HomeConversation[]>([]);
  const [
    upcomingMeetings,
    setUpcomingMeetings,
  ] = useState<HomeMeeting[]>([]);
  const [backendCircles, setBackendCircles] =
    useState<Circle[]>([]);

  /* =====================================================
     LOAD LOGGED-IN USER + CONVERSATIONS
  ===================================================== */

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      try {
        const user =
          JSON.parse(storedUser);

        if (user?.role === "admin") {
          setUserName("Admin");
        } else if (
          user?.role === "superadmin"
        ) {
          setUserName("Superadmin");
        } else {
          setUserName("User");
        }
      } catch (error) {
        console.error(
          "Failed to read logged-in user:",
          error,
        );

        setUserName("User");
      }
    }

    const loadHomeData = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {
        /* =================================================
           LOAD REAL CONVERSATIONS
        ================================================= */

        const conversationResponse =
          await fetch(
            "/api/conversations",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        if (!conversationResponse.ok) {
          throw new Error(
            "Failed to load conversations",
          );
        }

        const conversationData =
          await conversationResponse.json();

        setBackendConversations(
          conversationData.conversations ||
          [],
        );

        /* =================================================
           LOAD USER'S REAL CIRCLES
        ================================================= */

        const circlesResponse =
          await fetch(
            "/api/circles",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        if (!circlesResponse.ok) {
          throw new Error(
            "Failed to load circles",
          );
        }

        const circlesData =
          await circlesResponse.json();

        const userCircles =
          circlesData.circles || [];
        setBackendCircles(userCircles);

        /* =================================================
           LOAD MEETINGS FROM ALL USER CIRCLES
        ================================================= */

        const meetingResults =
          await Promise.all(
            userCircles.map(
              async (circle: {
                _id: string;
              }) => {
                try {
                  const response =
                    await fetch(
                      `/api/circles/${circle._id}/meetings`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      },
                    );

                  if (!response.ok) {
                    return [];
                  }

                  const data =
                    await response.json();

                  return data.meetings || [];
                } catch (error) {
                  console.error(
                    `Failed to load meetings for circle ${circle._id}:`,
                    error,
                  );

                  return [];
                }
              },
            ),
          );

        const allMeetings =
          meetingResults.flat();

        /* =================================================
           ONLY UPCOMING SCHEDULED MEETINGS
        ================================================= */

        const now =
          new Date();

        const upcoming =
          allMeetings
            .filter(
              (meeting: {
                scheduledAt: string;
                status?: string;
              }) => {
                const meetingDate =
                  new Date(
                    meeting.scheduledAt,
                  );

                return (
                  meeting.status !==
                  "cancelled" &&
                  meeting.status !==
                  "completed" &&
                  meetingDate > now
                );
              },
            )
            .sort(
              (
                a: {
                  scheduledAt: string;
                },
                b: {
                  scheduledAt: string;
                },
              ) =>
                new Date(
                  a.scheduledAt,
                ).getTime() -
                new Date(
                  b.scheduledAt,
                ).getTime(),
            )
            .slice(0, 2);

        /* =================================================
           CONVERT TO EXISTING MEETING CARD FORMAT
        ================================================= */

        const formattedMeetings =
          upcoming.map(
            (meeting: {
              _id: string;
              title: string;
              scheduledAt: string;
              createdBy?:
              | {
                name?: string;
                _id?: string;
              }
              | string;
            }) => {
              const date =
                new Date(
                  meeting.scheduledAt,
                );

              const day =
                date.toLocaleDateString(
                  [],
                  {
                    weekday:
                      "short",
                    month: "short",
                    day: "numeric",
                  },
                );

              const time =
                date.toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  },
                );

              return {
                id: meeting._id,
                title: meeting.title,
                day,
                time,
                duration: "Meeting",
                privacy: "Private",
                host:
                  typeof meeting.createdBy === "object"
                    ? meeting.createdBy?.name || "Circle Admin"
                    : "Circle Admin",
                scheduledAt: meeting.scheduledAt,
                group: "upcoming" as const,
              };
            },
          );

        setUpcomingMeetings(
          formattedMeetings,
        );
      } catch (error) {
        console.error(
          "Failed to load Home data:",
          error,
        );

        setBackendConversations([]);
        setUpcomingMeetings([]);
      }
    };

    void loadHomeData();
  }, []);

  return (
    <AppShell
      rightPanel={
        <div className="space-y-5">
          <div className="surface-panel rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="text-primary h-4 w-4"
                aria-hidden
              />

              <p className="text-sm font-semibold">
                Privacy posture
              </p>
            </div>

            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Member directories, counts and presence are
              hidden across all of your Circles.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <PrivacyBadge
                label="Directory hidden"
                tone="accent"
              />

              <PrivacyBadge
                label="Counts hidden"
                tone="muted"
              />
            </div>
          </div>

          <div>
            <SectionHeading title="Quick actions" />

            <div className="space-y-2">
              <CreateCircleModal
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4" />
                    Create a Circle
                  </Button>
                }
              />

              <ScheduleMeetingModal
                circleId={backendCircles[0]?._id || ""}
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Schedule meeting
                  </Button>
                }
              />

              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link to="/files">
                  Browse shared files
                </Link>
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-5xl space-y-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Good morning, {userName}
            </h1>

            <p className="text-muted-foreground mt-1.5 text-sm">
              Your private workspace, all in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link
                to="/meeting/$meetingId"
                params={{
                  meetingId:
                    "product-strategy",
                }}
              >
                <Video className="h-4 w-4" />
                Start Meeting
              </Link>
            </Button>

            <Button
              variant="outline"
              asChild
            >
              <Link to="/messages">
                <MessageSquarePlus className="h-4 w-4" />
                New Message
              </Link>
            </Button>
          </div>
        </header>

        {/* =================================================
            UPCOMING MEETINGS
        ================================================= */}

        <section>
          <SectionHeading
            title="Upcoming meetings"
            description="Private by default — attendees are never disclosed."
            action={
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link to="/meetings">
                  View all
                </Link>
              </Button>
            }
          />

          {upcomingMeetings.length === 0 ? (
            <div className="surface-panel rounded-2xl p-6 text-center">
              <p className="text-muted-foreground text-sm">
                No meetings scheduled right now
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingMeetings.map(
                (meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                  />
                ),
              )}
            </div>
          )}
        </section>

        {/* =================================================
            RECENT CONVERSATIONS
        ================================================= */}

        <section>
          <SectionHeading
            title="Recent conversations"
            action={
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link to="/messages">
                  Open messages
                </Link>
              </Button>
            }
          />

          <div className="surface-panel rounded-2xl p-2">
            {backendConversations.length ===
              0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                No conversations yet
              </p>
            ) : (
              backendConversations
                .slice(0, 4)
                .map(
                  (
                    conversation,
                  ) => {
                    const name =
                      conversation
                        .otherUser
                        ?.name ||
                      "User";

                    const initials =
                      name
                        .slice(0, 2)
                        .toUpperCase();

                    const preview =
                      conversation
                        .latestMessage
                        ?.text ||
                      "Private conversation";

                    const time =
                      conversation
                        .latestMessage
                        ?.createdAt
                        ? new Date(
                          conversation
                            .latestMessage
                            .createdAt,
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute:
                              "2-digit",
                          },
                        )
                        : "";

                    return (
                      <ConversationItem
                        key={
                          conversation.id
                        }
                        conversation={{
                          id: conversation.id,
                          name,
                          initials,
                          preview,
                          time,
                          unread:
                            conversation.unreadCount,
                          kind: "direct",
                          privacy: "private",
                        }}
                      />
                    );
                  },
                )
            )}
          </div>
        </section>

        {/* =================================================
            PRIVATE SPACES
        ================================================= */}

        <section>
          <SectionHeading
            title="Private spaces"
            description="Member visibility restricted"
            action={
              <CreateCircleModal
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    New Circle
                  </Button>
                }
              />
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {backendCircles.length === 0 ? (
              <div className="surface-panel rounded-2xl p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No private spaces yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {backendCircles.map((circle) => (
                  <CircleCard
                    key={circle._id}
                    circle={circle}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}