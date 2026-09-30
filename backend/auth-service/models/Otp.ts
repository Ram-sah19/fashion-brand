import mongoose, { Document, Schema } from "mongoose";

export interface IOtp extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: "register" | "login" | "reset";
  expiresAt: Date;
  attempts: number;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["register", "login", "reset"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

const Otp = mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;