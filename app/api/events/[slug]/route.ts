import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response";
import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    await connectToDatabase();
    
    const event = await Event.findOne({ slug: resolvedParams.slug }).lean();
    
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    return successResponse(event);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get event");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    await connectToDatabase();
    
    const event = await Event.findOne({ slug: resolvedParams.slug });
    
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    if (event.organizerId.toString() !== authResult.user._id.toString()) {
      return forbiddenResponse("You are not authorized to delete this event");
    }
    
    // Delete all registrations for this event
    await Registration.deleteMany({ eventId: event._id });
    
    // Delete the event
    await Event.findByIdAndDelete(event._id);
    
    // Update user's free event count if it was a free event
    if (event.ticketType === "free" && authResult.user.freeEventsCreated > 0) {
      await User.findByIdAndUpdate(authResult.user._id, {
        $inc: { freeEventsCreated: -1 },
      });
    }
    
    return successResponse({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete event");
  }
}
