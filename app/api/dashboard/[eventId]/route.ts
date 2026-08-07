import { NextRequest } from "next/server";
import { authenticateRequest, isAuthResponse } from "../../../../../lib/auth-guard";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "../../../../../lib/api-response";
import connectToDatabase from "../../../../../lib/mongodb";
import Event from "../../../../../models/Event";
import Registration from "../../../../../models/Registration";

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
      return forbiddenResponse("You are not authorized to view this dashboard");
    }
    
    const registrations = await Registration.find({ eventId: event._id }).lean();
    
    const totalRegistrations = registrations.filter(r => r.status === "confirmed").length;
    const checkedInCount = registrations.filter(r => r.checkedIn && r.status === "confirmed").length;
    const pendingCount = totalRegistrations - checkedInCount;
    
    let totalRevenue = 0;
    if (event.ticketType === "paid" && event.ticketPrice) {
      totalRevenue = checkedInCount * event.ticketPrice;
    }
    
    const checkInRate = totalRegistrations > 0
      ? Math.round((checkedInCount / totalRegistrations) * 100)
      : 0;
      
    const now = Date.now();
    const timeUntilEvent = event.startDate - now;
    const hoursUntilEvent = Math.max(0, Math.floor(timeUntilEvent / (1000 * 60 * 60)));
    
    const today = new Date().setHours(0, 0, 0, 0);
    const startDay = new Date(event.startDate).setHours(0, 0, 0, 0);
    const endDay = new Date(event.endDate).setHours(0, 0, 0, 0);
    const isEventToday = today >= startDay && today <= endDay;
    const isEventPast = event.endDate < now;
    
    return successResponse({
      event,
      stats: {
        totalRegistrations,
        checkedInCount,
        pendingCount,
        capacity: event.capacity,
        checkInRate,
        totalRevenue,
        hoursUntilEvent,
        isEventToday,
        isEventPast,
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || "Failed to get dashboard data");
  }
}
