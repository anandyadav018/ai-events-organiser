import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../../../../lib/api-response";
import connectToDatabase from "../../../../lib/mongodb";
import Event from "../../../../models/Event";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "featured";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const now = Date.now();
    
    await connectToDatabase();
    
    let query: any = { startDate: { $gte: now } };
    let sort: any = {};
    
    if (type === "featured") {
      sort = { registrationCount: -1 };
    } else if (type === "popular") {
      sort = { registrationCount: -1 };
    } else if (type === "location") {
      const city = searchParams.get("city");
      const state = searchParams.get("state");
      
      if (city) {
        query.city = { $regex: new RegExp(`^${city}$`, "i") };
      } else if (state) {
        query.state = { $regex: new RegExp(`^${state}$`, "i") };
      }
    } else if (type === "category") {
      const category = searchParams.get("category");
      if (category) {
        query.category = category;
      }
    } else if (type === "counts") {
       const events = await Event.find({ startDate: { $gte: now } }).lean();
       const counts: Record<string, number> = {};
       events.forEach((event) => {
         counts[event.category] = (counts[event.category] || 0) + 1;
       });
       return successResponse(counts);
    }
    
    const events = await Event.find(query)
      .sort(sort)
      .limit(limit)
      .lean();
      
    return successResponse(events);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to explore events");
  }
}
