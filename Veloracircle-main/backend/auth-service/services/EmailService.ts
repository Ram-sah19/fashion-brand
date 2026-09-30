import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (!emailUser || !emailPassword) {
  console.warn(
    "Email credentials are not configured in .env",
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

export const sendOtpEmail = async ({
  email,
  otp,
  purpose,
}: {
  email: string;
  otp: string;
  purpose: "register" | "login" | "reset";
}): Promise<void> => {
  let subject: string;
  let message: string;

  if (purpose === "register") {
    subject = "Velora Circle - Verify Your Email";
    message =
      "Use the following OTP to verify your Velora Circle account:";
  } else if (purpose === "login") {
    subject = "Velora Circle - Login Verification Code";
    message =
      "Use the following OTP to complete your Velora Circle login:";
  } else {
    subject = "Velora Circle - Password Reset Code";
    message =
      "Use the following OTP to reset your Velora Circle password:";
  }

  await transporter.sendMail({
    from: `"Velora Circle" <${emailUser}>`,
    to: email,
    subject,
    text: `${message}

Your OTP is: ${otp}

This OTP will expire in 5 minutes.

If you did not request this code, please ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Velora Circle</h2>

        <p>${message}</p>

        <div style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>
          This OTP will expire in <strong>5 minutes</strong>.
        </p>

        <p>
          If you did not request this code, please ignore this email.
        </p>
      </div>
    `,
  });
};