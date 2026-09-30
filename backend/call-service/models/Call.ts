import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ICall
  extends Document {
  callerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: "audio" | "video";
  status:
    | "calling"
    | "accepted"
    | "rejected"
    | "ended";
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema =
  new Schema<ICall>(
    {
      callerId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },

      receiverId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },

      type: {
        type: String,
        enum: ["audio", "video"],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "calling",
          "accepted",
          "rejected",
          "ended",
        ],
        default: "calling",
      },

      startedAt: {
        type: Date,
      },

      endedAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    },
  );

callSchema.index({
  callerId: 1,
  createdAt: -1,
});

callSchema.index({
  receiverId: 1,
  createdAt: -1,
});

const Call =
  mongoose.model<ICall>(
    "Call",
    callSchema,
  );

export default Call;