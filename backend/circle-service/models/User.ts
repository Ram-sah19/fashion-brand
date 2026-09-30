import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
}

const userSchema =
  new Schema<IUser>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
      },

      emailVerified: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    },
  );

const User =
  mongoose.model<IUser>(
    "User",
    userSchema,
  );

export default User;