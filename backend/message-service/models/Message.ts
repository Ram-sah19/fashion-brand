import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;

  type: "text" | "file" | "voice";

  text?: string;

  file?: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  };

  readBy: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Conversation",
    },

    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["text", "file", "voice"],
      default: "text",
      required: true,
    },

    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    file: {
      name: {
        type: String,
      },

      url: {
        type: String,
      },

      size: {
        type: Number,
      },

      mimeType: {
        type: String,
      },
    },

    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

messageSchema.index({
  conversation: 1,
  createdAt: 1,
});

const Message = mongoose.model<IMessage>(
  "Message",
  messageSchema,
);

export default Message;