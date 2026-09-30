import { Request, Response } from "express";

import {
  sendEmail,
} from "../services/EmailService";

export const sendCircleMeetingEmail =
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
          `New Circle Meeting: ${meetingTitle}`,

        text: `${greeting}

A new meeting has been scheduled for your Velora Circle.

Circle: ${circleName}
Meeting: ${meetingTitle}
Date and time: ${formattedDate}

${
  meetingDescription
    ? `Details: ${meetingDescription}\n\n`
    : ""
}Please open Velora Circle to view the meeting and join when it starts.

Regards,
Velora Circle`,

        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New Circle Meeting</h2>

            <p>${greeting}</p>

            <p>
              A new meeting has been scheduled
              for your Velora Circle.
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
              to view the meeting and join
              when it starts.
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
          "Circle meeting email sent successfully",
      });
    } catch (error) {
      console.error(
        "Send circle meeting email error:",
        error,
      );

      res.status(500).json({
        message:
          "Failed to send circle meeting email",
      });
    }
  };

export default {
  sendCircleMeetingEmail,
};