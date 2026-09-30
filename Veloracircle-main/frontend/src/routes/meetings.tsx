import {
  CalendarPlus,
  CalendarX,
  Video,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/velora/app-shell";
import { MeetingCard } from "@/components/velora/cards";
import { ScheduleMeetingModal } from "@/components/velora/modals";
import { StartInstantMeetingModal } from "@/components/velora/modals";
import {
  EmptyState,
  SectionHeading,
} from "@/components/velora/primitives";

import {
  getMyCircles,
  type Circle,
} from "@/lib/circle-api";

import {
  getCircleMeetings,
  type CircleMeeting,
} from "@/lib/circle-meeting-api";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      {
        title: "Meetings — Velora Circle",
      },
      {
        name: "description",
        content:
          "Schedule and join private video meetings. Participant lists stay hidden from attendees.",
      },
      {
        property: "og:title",
        content: "Meetings — Velora Circle",
      },
      {
        property: "og:description",
        content:
          "Private, encrypted meetings for focused teams.",
      },
    ],
  }),

  component: MeetingsPage,
});

function MeetingsPage() {
  const [circles, setCircles] =
    useState<Circle[]>([]);

  const [meetings, setMeetings] =
    useState<CircleMeeting[]>([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * =====================================================
   * LOAD REAL CIRCLES AND MEETINGS
   * =====================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadMeetings() {
      try {
        setLoading(true);

        /*
         * Get the user's real Circles.
         */
        const userCircles =
          await getMyCircles();
          console.log("MY CIRCLES:", userCircles);

        if (cancelled) {
          return;
        }

        setCircles(userCircles);

        /*
         * Get meetings for every Circle.
         */
        const meetingResults =
          await Promise.all(
            userCircles.map((circle) =>
              getCircleMeetings(
                circle._id,
              ),
            ),
          );

        if (cancelled) {
          return;
        }

        /*
         * Combine all Circle meetings
         * into one list.
         */
        const allMeetings =
          meetingResults.flat();
console.table(
  allMeetings.map((meeting) => ({
    id: meeting._id,
    title: meeting.title,
    circle: meeting.circle,
    scheduledAt: meeting.scheduledAt,
    status: meeting.status,
  })),
);
        /*
         * Prevent duplicate meetings if
         * the backend ever returns the same
         * meeting through multiple requests.
         */
        const uniqueMeetings =
          Array.from(
            new Map(
              allMeetings.map(
                (meeting) => [
                  meeting._id,
                  meeting,
                ],
              ),
            ).values(),
          );

        setMeetings(
          uniqueMeetings,
        );
      } catch (error) {
        console.error(
          "Load meetings error:",
          error,
        );

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to load meetings",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMeetings();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =====================================================
   * CONVERT REAL MEETING DATA INTO CARD DATA
   * =====================================================
   *
   * MeetingCard currently expects the old
   * mock-data Meeting structure.
   *
   * We convert the real backend meeting
   * into that same structure so the existing
   * MeetingCard does not need to be changed.
   */

  const meetingCards = useMemo(() => {
    const now =
      new Date();

    return meetings.map(
      (meeting) => {
        const scheduledAt =
          new Date(
            meeting.scheduledAt,
          );

        const isToday =
          scheduledAt.toDateString() ===
          now.toDateString();

        const group: "today" | "upcoming" | "past" =
          isToday
            ? "today"
            : scheduledAt.getTime() > now.getTime()
              ? "upcoming"
              : "past";
        const day =
          isToday
            ? "Today"
            : scheduledAt.toLocaleDateString(
              undefined,
              {
                weekday: "short",
                day: "numeric",
                month: "short",
              },
            );

        const time =
          scheduledAt.toLocaleTimeString(
            undefined,
            {
              hour: "numeric",
              minute: "2-digit",
            },
          );

        /*
         * Find the Circle name.
         */
        const circle =
          circles.find(
            (item) =>
              item._id ===
              meeting.circle,
          );

        return {
          id: meeting._id,
          title: meeting.title,
          day,
          time,
          host: "Circle meeting",
          privacy: circle
            ? `Private · ${circle.name}`
            : "Private Meeting",
          duration: "Scheduled meeting",
          group,

          // Real meeting details for View Summary
          description: meeting.description ?? "No description provided.",
          status: meeting.status ?? "completed",
        };
      },
    );
  }, [meetings, circles]);

  /*
   * =====================================================
   * SPLIT MEETINGS INTO THREE EXISTING SECTIONS
   * =====================================================
   */

  const today =
    meetingCards.filter(
      (meeting) =>
        meeting.group === "today",
    );

  const upcoming =
    meetingCards.filter(
      (meeting) =>
        meeting.group === "upcoming",
    );

  const past =
    meetingCards.filter(
      (meeting) =>
        meeting.group === "past",
    );

  /*
   * =====================================================
   * CIRCLE FOR SCHEDULING
   * =====================================================
   *
   * ScheduleMeetingModal already loads the
   * user's real Circles itself.
   *
   * We provide the first real Circle ID
   * because the modal requires a circleId.
   */

  const defaultCircleId =
    circles[0]?._id ?? "";

  /*
   * =====================================================
   * REFRESH MEETINGS
   * =====================================================
   *
   * This allows the page to refresh its
   * real meeting list after scheduling.
   */

  async function refreshMeetings() {
    try {
      const userCircles =
        await getMyCircles();

      setCircles(
        userCircles,
      );

      const meetingResults =
        await Promise.all(
          userCircles.map((circle) =>
            getCircleMeetings(
              circle._id,
            ),
          ),
        );

      const allMeetings =
        meetingResults.flat();

      const uniqueMeetings =
        Array.from(
          new Map(
            allMeetings.map(
              (meeting) => [
                meeting._id,
                meeting,
              ],
            ),
          ).values(),
        );

      setMeetings(
        uniqueMeetings,
      );
    } catch (error) {
      console.error(
        "Refresh meetings error:",
        error,
      );
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-10">
        {/* =====================================================
            PAGE HEADER
            ===================================================== */}

        <header className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Meetings
            </h1>

            <p className="text-muted-foreground mt-1.5 text-sm">
              Private meetings · Attendee lists are never disclosed.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <StartInstantMeetingModal
                trigger={
                  <Button>
                    Start Instant Meeting
                  </Button>
                }
              />
            </Button>

            {defaultCircleId && (
              <ScheduleMeetingModal
                circleId={
                  defaultCircleId
                }
                trigger={
                  <Button variant="outline">
                    <CalendarPlus className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                }
              />
            )}
          </div>
        </header>

        {/* =====================================================
            LOADING STATE
            ===================================================== */}

        {loading ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            Loading meetings...
          </div>
        ) : (
          <>
            {/* =================================================
                TODAY
                ================================================= */}

            <section>
              <SectionHeading title="Today" />

              {today.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {today.map(
                    (meeting) => (
                      <MeetingCard
                        key={
                          meeting.id
                        }
                        meeting={
                          meeting
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarX}
                  title="No meetings today"
                  description="You have no meetings scheduled for today."
                  actionLabel="Schedule a meeting"
                />
              )}
            </section>

            {/* =================================================
                UPCOMING
                ================================================= */}

            <section>
              <SectionHeading title="Upcoming" />

              {upcoming.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {upcoming.map(
                    (meeting) => (
                      <MeetingCard
                        key={
                          meeting.id
                        }
                        meeting={
                          meeting
                        }
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarX}
                  title="No upcoming meetings"
                  description="You have no future meetings scheduled."
                  actionLabel="Schedule a meeting"
                />
              )}
            </section>

            {/* =================================================
                PAST
                ================================================= */}

            <section>
              <SectionHeading title="Past" />

              {past.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {past.map(
                    (meeting) => (
                      <MeetingCard
                        key={
                          meeting.id
                        }
                        meeting={
                          meeting
                        }
                        past
                      />
                    ),
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarX}
                  title="No past meetings"
                  description="Completed meetings will appear here."
                  actionLabel="Schedule a meeting"
                />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}