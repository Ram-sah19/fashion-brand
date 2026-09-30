import bcrypt from "bcryptjs";
import crypto from "crypto";
import Otp from "../models/Otp";

type OtpPurpose = "register" | "login" | "reset";

type CreateOtpResult = {
  otp: string;
  expiresAt: Date;
};

const OTP_EXPIRATION_MINUTES = 5;

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export const createOtp = async ({
  userId,
  email,
  purpose,
}: {
  userId: string;
  email: string;
  purpose: OtpPurpose;
}): Promise<CreateOtpResult> => {
  await Otp.updateMany(
    {
      userId,
      purpose,
      used: false,
    },
    {
      $set: {
        used: true,
      },
    },
  );

  const otp = generateOtp();

  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000,
  );

  await Otp.create({
    userId,
    email,
    otpHash,
    purpose,
    expiresAt,
    attempts: 0,
    used: false,
  });

  return {
    otp,
    expiresAt,
  };
};

export const verifyOtp = async ({
  userId,
  otp,
  purpose,
}: {
  userId: string;
  otp: string;
  purpose: OtpPurpose;
}): Promise<boolean> => {
  const otpRecord = await Otp.findOne({
    userId,
    purpose,
    used: false,
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return false;
  }

  if (otpRecord.expiresAt.getTime() < Date.now()) {
    otpRecord.used = true;
    await otpRecord.save();
    return false;
  }

  if (otpRecord.attempts >= 5) {
    otpRecord.used = true;
    await otpRecord.save();
    return false;
  }

  const isValid = await bcrypt.compare(
    otp,
    otpRecord.otpHash,
  );

  if (!isValid) {
    otpRecord.attempts += 1;

    if (otpRecord.attempts >= 5) {
      otpRecord.used = true;
    }

    await otpRecord.save();
    return false;
  }

  otpRecord.used = true;
  await otpRecord.save();

  return true;
};