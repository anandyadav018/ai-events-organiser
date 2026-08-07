import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse, validationErrorResponse, errorResponse } from "../../../../lib/api-response";
import { loginSchema } from "../../../../lib/validations";
import connectToDatabase from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { signToken } from "../../../../lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { email, password } = validation.data;
    
    await connectToDatabase();
    
    const user = await User.findOne({ email });
    if (!user) {
      return validationErrorResponse("Invalid credentials");
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return validationErrorResponse("Invalid credentials");
    }
    
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    const userObj = user.toObject();
    delete userObj.password;
    
    return successResponse(userObj);
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse(error.message || "Failed to login");
  }
}
