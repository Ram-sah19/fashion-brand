import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ISavedItem
  extends Document {
  user: mongoose.Types.ObjectId;

  type:
    | "message"
    | "file"
    | "link";

  message?: mongoose.Types.ObjectId;

  file?: {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
  };

  link?: {
    url: string;
    title?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const savedItemSchema =
  new Schema<ISavedItem>(
    {
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },

      type: {
        type: String,
        enum: [
          "message",
          "file",
          "link",
        ],
        required: true,
      },

      message: {
        type: Schema.Types.ObjectId,
        ref: "Message",
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

      link: {
        url: {
          type: String,
        },

        title: {
          type: String,
        },
      },
    },
    {
      timestamps: true,
    },
  );

/*
 * Prevent the same user from
 * saving the same message multiple times.
 */
savedItemSchema.index(
  {
    user: 1,
    message: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

savedItemSchema.index({
  user: 1,
  type: 1,
  createdAt: -1,
});

const SavedItem =
  mongoose.model<ISavedItem>(
    "SavedItem",
    savedItemSchema,
  );

export default SavedItem;