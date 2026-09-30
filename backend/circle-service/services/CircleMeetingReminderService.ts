import CircleMeeting from "../models/CircleMeeting";
import Circle from "../models/Circle";
import User from "../models/User";

type ReminderNotificationData = {
    meetingId: string;
    circleId: string;
    meetingTitle: string;
    meetingDescription?: string;
    scheduledAt: Date;
};

const sendReminderEmails =
    async ({
        circleId,
        meetingTitle,
        meetingDescription,
        scheduledAt,
    }: ReminderNotificationData): Promise<void> => {
        try {
            const circle =
                await Circle.findById(
                    circleId,
                ).select(
                    "name members",
                );

            if (!circle) {
                console.error(
                    "Circle not found for meeting reminder",
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
                                    `${notificationServiceUrl}/api/notifications/circle-meeting-reminder`,
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
                                    `Reminder email request failed for ${member.email}: ${response.status}`,
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
                            `Failed to send reminder to ${members[index]?.email}:`,
                            result.reason,
                        );
                    }
                },
            );

            console.log(
                `Circle meeting reminder processed for ${members.length} member(s).`,
            );
        } catch (error) {
            console.error(
                "Circle meeting reminder error:",
                error,
            );

            throw error;
        }
    };

export const processCircleMeetingReminders =
    async (): Promise<void> => {
        try {
            const now =
                new Date();

            const reminderStart =
                new Date(
                    now.getTime() +
                    29 * 60 * 1000,
                );

            const reminderEnd =
                new Date(
                    now.getTime() +
                    31 * 60 * 1000,
                );

            const meetings =
                await CircleMeeting.find({
                    status:
                        "scheduled",

                    scheduledAt: {
                        $gte: reminderStart,
                        $lte: reminderEnd,
                    },

                    reminderSent:
                        false,
                });

            for (const meeting of meetings) {
                try {
                    await sendReminderEmails({
                        meetingId: meeting._id.toString(),
                        circleId: meeting.circle.toString(),
                        meetingTitle: meeting.title,
                        meetingDescription: meeting.description,
                        scheduledAt: meeting.scheduledAt,
                    });

                    meeting.reminderSent = true;

                    await meeting.save();

                    console.log(
                        `Reminder marked as sent for meeting: ${meeting.title}`,
                    );
                } catch (error) {
                    console.error(
                        `Failed to process reminder for meeting: ${meeting.title}`,
                        error,
                    );
                }
            }

            if (
                meetings.length > 0
            ) {
                console.log(
                    `${meetings.length} Circle meeting reminder(s) processed.`,
                );
            }
        } catch (error) {
            console.error(
                "Process circle meeting reminders error:",
                error,
            );
        }
    };

export default {
    processCircleMeetingReminders,
};