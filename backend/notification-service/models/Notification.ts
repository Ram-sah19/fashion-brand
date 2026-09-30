import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface INotification
  extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "message"
    | "circle"
    | "call"
    | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema =
  new Schema<INotification>(
    {
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },

      type: {
        type: String,
        enum: [
          "message",
          "circle",
          "call",
          "system",
        ],
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      read: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    },
  );

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  read: 1,
});

const Notification =
  mongoose.model<INotification>(
    "Notification",
    notificationSchema,
  );

export default Notification;