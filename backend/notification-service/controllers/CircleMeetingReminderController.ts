import { Request, Response } from "express";

import {
  sendEmail,
} from "../services/EmailService";

export const sendCircleMeetingReminderEmail =
  async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const {
        email,
        memberName,
        circleName,
        meetingTitle,
        meetingDescription,
        scheduledAt,
      } = req.body;

      if (
        !email ||
        !circleName ||
        !meetingTitle ||
        !scheduledAt
      ) {
        res.status(400).json({
          message:
            "Email, circle name, meeting title and scheduled time are required",
        });
        return;
      }

      const meetingDate =
        new Date(scheduledAt);

      if (
        Number.isNaN(
          meetingDate.getTime(),
        )
      ) {
        res.status(400).json({
          message:
            "Invalid meeting date and time",
        });
        return;
      }

      const formattedDate =
        meetingDate.toLocaleString(
          "en-US",
          {
            dateStyle: "full",
            timeStyle: "short",
          },
        );

      const greeting =
        memberName
          ? `Hello ${memberName},`
          : "Hello,";

      await sendEmail({
        to: email,

        subject:
          `Reminder: Circle Meeting in 30 Minutes — ${meetingTitle}`,

        text: `${greeting}

This is a reminder that your Velora Circle meeting is scheduled to start in approximately 30 minutes.

Circle: ${circleName}
Meeting: ${meetingTitle}
Date and time: ${formattedDate}

${
  meetingDescription
    ? `Details: ${meetingDescription}\n\n`
    : ""
}Please open Velora Circle and be ready to join the meeting.

Regards,
Velora Circle`,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Circle Meeting Reminder</h2>

            <p>${greeting}</p>

            <p>
              This is a reminder that your
              Velora Circle meeting is scheduled
              to start in approximately
              <strong>30 minutes</strong>.
            </p>

            <p>
              <strong>Circle:</strong>
              ${circleName}
            </p>

            <p>
              <strong>Meeting:</strong>
              ${meetingTitle}
            </p>

            <p>
              <strong>Date and time:</strong>
              ${formattedDate}
            </p>

            ${
              meetingDescription
                ? `
                  <p>
                    <strong>Details:</strong>
                    ${meetingDescription}
                  </p>
                `
                : ""
            }

            <p>
              Please open Velora Circle
              and be ready to join the meeting.
            </p>

            <p>
              Regards,<br />
              Velora Circle
            </p>
          </div>
        `,
      });

      res.status(200).json({
        message:
          "Circle meeting reminder email sent successfully",
      });
    } catch (error) {
      console.error(
        "Send circle meeting reminder email error:",
        error,
      );

      res.status(500).json({
        message:
          "Failed to send circle meeting reminder email",
      });
    }
  };

export default {
  sendCircleMeetingReminderEmail,
};