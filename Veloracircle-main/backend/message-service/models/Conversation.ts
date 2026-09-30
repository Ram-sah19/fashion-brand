import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IConversation
  extends Document {
  participants: mongoose.Types.ObjectId[];
  type: "direct" | "circle";
  circleId?: mongoose.Types.ObjectId;

  unreadCounts: Map<string, number>;

  pinnedBy: mongoose.Types.ObjectId[];

  deletedFor: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema =
  new Schema<IConversation>(
    {
      participants: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],

           type: {
        type: String,
        enum: ["direct", "circle"],
        required: true,
      },

      circleId: {
        type: Schema.Types.ObjectId,
        ref: "Circle",
        default: undefined,
        index: true,
      },

      unreadCounts: {
        type: Map,
        of: Number,
        default: {},
      },

      pinnedBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      deletedFor: [
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

conversationSchema.index({
  participants: 1,
});

conversationSchema.index({
  type: 1,
  participants: 1,
});

const Conversation =
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema,
  );

export default Conversation;