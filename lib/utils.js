import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


// New function: createLocationSlug
export function createLocationSlug(location) {
  return location.toLowerCase().replace(/\s+/g, "-");
}