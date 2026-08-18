import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "@/lib/auth-guard";
import { successResponse, validationErrorResponse, errorResponse } from "@/lib/api-response";
import { onboardingSchema } from "@/lib/validations";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    
    if (isAuthResponse(authResult)) {
      return authResult;
    }
    
    const body = await req.json();
    const validation = onboardingSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.issues[0].message);
    }
    
    await connectToDatabase();
    
    const updatedUser = await User.findByIdAndUpdate(
      authResult.user._id,
      {
        location: validation.data.location,
        interests: validation.data.interests,
        hasCompletedOnBoarding: true,
      },
      { new: true }
    ).select("-password");
    
    return successResponse(updatedUser);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to complete onboarding");
  }
}
