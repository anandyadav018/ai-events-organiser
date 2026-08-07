import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../../lib/auth-guard";
import { successResponse, errorResponse } from "../../../../../lib/api-response";
import connectToDatabase from "../../../../../lib/mongodb";
import Registration from "../../../../../models/Registration";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    
    if (!eventId) {
      return successResponse(null);
    }
    
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return successResponse(null); // Don't throw error, just return null if not auth'd
    }
    
    await connectToDatabase();
    
    const registration = await Registration.findOne({
      eventId,
      userId: authResult.user._id,
      status: "confirmed"
    }).lean();
    
    return successResponse(registration);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to check registration");
  }
}
