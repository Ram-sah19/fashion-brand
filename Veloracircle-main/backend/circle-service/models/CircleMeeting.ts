import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ICircleMeeting
  extends Document {
  circle: mongoose.Types.ObjectId;

  title: string;

  description?: string;

  scheduledAt: Date;

  createdBy: mongoose.Types.ObjectId;

  status:
    | "scheduled"
    | "cancelled"
    | "completed";

  reminderSent: boolean;

  createdAt: Date;

  updatedAt: Date;
}

const circleMeetingSchema =
  new Schema<ICircleMeeting>(
    {
      circle: {
        type: Schema.Types.ObjectId,
        ref: "Circle",
        required: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 1000,
      },

      scheduledAt: {
        type: Date,
        required: true,
        index: true,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      status: {
        type: String,
        enum: [
          "scheduled",
          "cancelled",
          "completed",
        ],
        default: "scheduled",
        required: true,
      },

      reminderSent: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    },
  );

circleMeetingSchema.index({
  circle: 1,
  scheduledAt: 1,
});

circleMeetingSchema.index({
  status: 1,
  scheduledAt: 1,
  reminderSent: 1,
});

const CircleMeeting =
  mongoose.model<ICircleMeeting>(
    "CircleMeeting",
    circleMeetingSchema,
  );

export default CircleMeeting;