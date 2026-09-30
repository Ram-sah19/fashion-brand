import Circle from "../models/Circle";
import User from "../models/User";

type MeetingNotificationData = {
  circleId: string;
  meetingTitle: string;
  meetingDescription?: string;
  scheduledAt: Date;
};

export const notifyCircleMembers =
  async ({
    circleId,
    meetingTitle,
    meetingDescription,
    scheduledAt,
  }: MeetingNotificationData): Promise<void> => {
    try {
      const circle =
        await Circle.findById(
          circleId,
        ).select(
          "name members",
        );

      if (!circle) {
        console.error(
          "Circle not found for meeting notification",
        );
        return;
      }

      const members =
        await User.find({
          _id: {
            $in: circle.members,
          },
        }).select(
          "name email",
        );

      const notificationServiceUrl =
        process.env.NOTIFICATION_SERVICE_URL ||
        "http://127.0.0.1:5005";

      const results =
        await Promise.allSettled(
          members.map(
            async (member) => {
              if (!member.email) {
                return;
              }

              const response =
                await fetch(
                  `${notificationServiceUrl}/api/notifications/circle-meeting`,
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({
                      email:
                        member.email,

                      memberName:
                        member.name,

                      circleName:
                        circle.name,

                      meetingTitle:
                        meetingTitle,

                      meetingDescription:
                        meetingDescription ||
                        "",

                      scheduledAt:
                        scheduledAt,
                    }),
                  },
                );

              if (!response.ok) {
                throw new Error(
                  `Email request failed for ${member.email}: ${response.status}`,
                );
              }
            },
          ),
        );

      results.forEach(
        (result, index) => {
          if (
            result.status ===
            "rejected"
          ) {
            console.error(
              `Failed to send meeting email to member ${members[index]?.email}:`,
              result.reason,
            );
          }
        },
      );

      console.log(
        `Circle meeting notification processed for ${members.length} member(s).`,
      );
    } catch (error) {
      console.error(
        "Circle meeting notification error:",
        error,
      );
    }
  };

export default {
  notifyCircleMembers,
};