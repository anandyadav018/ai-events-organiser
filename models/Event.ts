import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  slug: string;
  organizerId: mongoose.Types.ObjectId;
  organizerName: string;
  category: string;
  tags: string[];
  startDate: number;
  endDate: number;
  timezone: string;
  locationType: "physical" | "online";
  venue?: string;
  address?: string;
  city: string;
  state?: string;
  country: string;
  capacity: number;
  ticketType: "free" | "paid";
  ticketPrice?: number;
  registrationCount: number;
  coverImage?: string;
  themeColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    organizerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organizerName: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    startDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    locationType: { type: String, enum: ["physical", "online"], default: "physical" },
    venue: { type: String },
    address: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, default: "India" },
    capacity: { type: Number, required: true, min: 1 },
    ticketType: { type: String, enum: ["free", "paid"], default: "free" },
    ticketPrice: { type: Number },
    registrationCount: { type: Number, default: 0 },
    coverImage: { type: String },
    themeColor: { type: String, default: "#1e3a8a" },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ organizerId: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ startDate: 1 });
// slug index created via unique: true in schema
eventSchema.index({ city: 1, state: 1 });
eventSchema.index({ title: "text" });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);

export default Event;
