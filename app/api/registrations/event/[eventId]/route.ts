import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../../lib/auth-guard";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "../../../../../lib/api-response";
import connectToDatabase from "../../../../../lib/mongodb";
import Registration from "../../../../../models/Registration";
import Event from "../../../../../models/Event";

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const resolvedParams = await params;
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    await connectToDatabase();
    
    const event = await Event.findById(resolvedParams.eventId).lean();
    if (!event) {
      return notFoundResponse("Event not found");
    }
    
    if (event.organizerId.toString() !== authResult.user._id.toString()) {
      return forbiddenResponse("You are not authorized to view registrations");
    }
    
    const registrations = await Registration.find({ eventId: event._id }).lean();
    
    return successResponse(registrations);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get event registrations");
  }
}
