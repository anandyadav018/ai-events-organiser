import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createEventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  startDate: z.number({ message: "Start date is required" }),
  endDate: z.number({ message: "End date is required" }),
  timezone: z.string().default("Asia/Kolkata"),
  locationType: z.enum(["physical", "online"]).default("physical"),
  venue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().default("India"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  ticketType: z.enum(["free", "paid"]).default("free"),
  ticketPrice: z.number().optional(),
  coverImage: z.string().optional(),
  themeColor: z.string().default("#1e3a8a"),
});

export const updateEventSchema = createEventSchema.partial();

export const registerForEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  attendeeName: z.string().min(1, "Name is required"),
  attendeeEmail: z.string().email("Invalid email"),
});

export const onboardingSchema = z.object({
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    country: z.string().default("India"),
  }),
  interests: z.array(z.string()).min(3, "Select at least 3 interests"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
