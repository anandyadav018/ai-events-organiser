import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "@/lib/auth-guard";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    return successResponse(authResult.user);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get user");
  }
}
