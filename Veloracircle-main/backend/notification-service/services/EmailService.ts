import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const emailHost =
  process.env.EMAIL_HOST;

const emailPort =
  Number(
    process.env.EMAIL_PORT || 587,
  );

const emailUser =
  process.env.EMAIL_USER;

const emailPassword =
  process.env.EMAIL_PASSWORD;

const emailFrom =
  process.env.EMAIL_FROM ||
  emailUser;

if (
  !emailHost ||
  !emailUser ||
  !emailPassword
) {
  console.warn(
    "Email configuration is incomplete.",
  );
}

const transporter =
  nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure:
      emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

export const sendEmail =
  async ({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> => {
    await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
      html,
    });
  };

export default {
  sendEmail,
};