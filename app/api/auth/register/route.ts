import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { successResponse, validationErrorResponse, errorResponse } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.issues[0].message);
    }
    
    const { name, email, password } = validation.data;
    
    await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return validationErrorResponse("Email is already in use");
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    
    // Generate JWT
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    });
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    const userObj = newUser.toObject();
    delete userObj.password;
    
    return successResponse(userObj, 201);
  } catch (error: any) {
    console.error("Registration error:", error);
    return errorResponse(error.message || "Failed to register user");
  }
}
