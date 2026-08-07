import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../lib/auth-guard";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "../../../../lib/api-response";
import connectToDatabase from "../../../../lib/mongodb";
import Registration from "../../../../models/Registration";
import Event from "../../../../models/Event";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    const { qrCode } = await req.json();
    
    if (!qrCode) {
      return errorResponse("QR Code is required", 400);
    }
    
    await connectToDatabase();
    
    const registration = await Registration.findOne({ qrCode });
    if (!registration) {
      return errorResponse("Invalid QR code", 400);
    }
    
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    if (event.organizerId.toString() !== authResult.user._id.toString()) {
      return forbiddenResponse("You are not authorized to check in attendees");
    }
    
    if (registration.checkedIn) {
      return successResponse({
        success: false,
        message: "Already checked in",
        registration,
      });
    }
    
    registration.checkedIn = true;
    registration.checkedInAt = Date.now();
    await registration.save();
    
    return successResponse({
      success: true,
      message: "Check-in successful",
      registration,
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to check in attendee");
  }
}
