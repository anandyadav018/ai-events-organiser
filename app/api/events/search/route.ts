import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    
    if (!query || query.trim().length < 2) {
      return successResponse([]);
    }
    
    const now = Date.now();
    await connectToDatabase();
    
    const searchResults = await Event.find({
      startDate: { $gte: now },
      title: { $regex: new RegExp(query, "i") },
    })
      .limit(limit)
      .lean();
      
    return successResponse(searchResults);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to search events");
  }
}
