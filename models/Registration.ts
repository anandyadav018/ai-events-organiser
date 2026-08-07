import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistration extends Document {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: number;
  status: "confirmed" | "cancelled";
  registeredAt: number;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendeeName: { type: String, required: true, trim: true },
    attendeeEmail: { type: String, required: true, lowercase: true, trim: true },
    qrCode: { type: String, required: true, unique: true },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Number },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
    registeredAt: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

registrationSchema.index({ eventId: 1 });
registrationSchema.index({ userId: 1 });
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ qrCode: 1 });

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", registrationSchema);

export default Registration;
