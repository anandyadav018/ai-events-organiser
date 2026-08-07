import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../lib/auth-guard";
import { successResponse, errorResponse } from "../../../../lib/api-response";
import connectToDatabase from "../../../../lib/mongodb";
import Event from "../../../../models/Event";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    await connectToDatabase();
    
    const events = await Event.find({ organizerId: authResult.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    return successResponse(events);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get events");
  }
}
