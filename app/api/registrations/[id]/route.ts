import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response";
import connectToDatabase from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Event from "@/models/Event";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    await connectToDatabase();
    
    const registration = await Registration.findById(resolvedParams.id);
    
    if (!registration) {
      return notFoundResponse("Registration not found");
    }
    
    if (registration.userId.toString() !== authResult.user._id.toString()) {
      return forbiddenResponse("You are not authorized to cancel this registration");
    }
    
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    registration.status = "cancelled";
    await registration.save();
    
    if (event.registrationCount > 0) {
      await Event.findByIdAndUpdate(event._id, {
        $inc: { registrationCount: -1 },
      });
    }
    
    return successResponse({ success: true, message: "Registration cancelled successfully" });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to cancel registration");
  }
}
