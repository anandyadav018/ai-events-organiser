import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../lib/auth-guard";
import { successResponse, validationErrorResponse, errorResponse, notFoundResponse } from "../../../../lib/api-response";
import { registerForEventSchema } from "../../../../lib/validations";
import connectToDatabase from "../../../../lib/mongodb";
import Event from "../../../../models/Event";
import Registration from "../../../../models/Registration";

function generateQRCode() {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    const body = await req.json();
    const validation = registerForEventSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { eventId, attendeeName, attendeeEmail } = validation.data;
    
    await connectToDatabase();
    
    const event = await Event.findById(eventId);
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    if (event.registrationCount >= event.capacity) {
      return errorResponse("Event is full", 400);
    }
    
    const existingRegistration = await Registration.findOne({
      eventId: event._id,
      userId: authResult.user._id,
    });
    
    if (existingRegistration) {
      return errorResponse("You are already registered for this event", 400);
    }
    
    const qrCode = generateQRCode();
    
    const newRegistration = await Registration.create({
      eventId: event._id,
      userId: authResult.user._id,
      attendeeName,
      attendeeEmail,
      qrCode,
      checkedIn: false,
      status: "confirmed",
      registeredAt: Date.now(),
    });
    
    await Event.findByIdAndUpdate(event._id, {
      $inc: { registrationCount: 1 },
    });
    
    return successResponse(newRegistration, 201);
  } catch (error: any) {
    console.error("Register for event error:", error);
    return errorResponse(error.message || "Failed to register for event");
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    await connectToDatabase();
    
    const registrations = await Registration.find({ userId: authResult.user._id })
      .populate("eventId")
      .sort({ registeredAt: -1 })
      .lean();
      
    // Transform to match frontend expectations (putting event inside registration object)
    const formattedRegistrations = registrations.map((reg: any) => ({
      ...reg,
      event: reg.eventId,
      eventId: reg.eventId?._id,
    }));
    
    return successResponse(formattedRegistrations);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get registrations");
  }
}
