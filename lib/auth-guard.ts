import { NextRequest } from "next/server";
import { verifyToken, type JWTPayload } from "./jwt";
import { unauthorizedResponse } from "./api-response";
import connectToDatabase from "./mongodb";
import User, { type IUser } from "../models/User";

export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: IUser; payload: JWTPayload } | Response> {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return unauthorizedResponse("Authentication required");
  }

  const payload = verifyToken(token);
  if (!payload) {
    return unauthorizedResponse("Invalid or expired token");
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select("-password");

  if (!user) {
    return unauthorizedResponse("User not found");
  }

  return { user, payload };
}

export function isAuthResponse(result: unknown): result is Response {
  return result instanceof Response;
}
