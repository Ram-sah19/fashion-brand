import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface ICircle extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const circleSchema =
  new Schema<ICircle>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      members: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      admins: [
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

circleSchema.index({
  members: 1,
});

circleSchema.index({
  admins: 1,
});

const Circle =
  mongoose.model<ICircle>(
    "Circle",
    circleSchema,
  );

export default Circle;