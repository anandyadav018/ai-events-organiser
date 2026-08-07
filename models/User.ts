import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  imageUrl?: string;
  hasCompletedOnBoarding: boolean;
  location?: {
    city: string;
    state?: string;
    country: string;
  };
  interests?: string[];
  freeEventsCreated: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    imageUrl: { type: String },
    hasCompletedOnBoarding: { type: Boolean, default: false },
    location: {
      type: {
        city: { type: String, required: true },
        state: { type: String },
        country: { type: String, required: true },
      },
      default: undefined,
    },
    interests: { type: [String], default: undefined },
    freeEventsCreated: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
