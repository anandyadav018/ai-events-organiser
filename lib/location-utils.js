
import { State, City } from "country-state-city";


/**
 * Parse and validate location slug (format: city-state)
 * @param {string} slug - The URL slug (e.g., "gurugram-haryana")
 * @returns {Object} - { city, state, isValid }
 */
export function parseLocationSlug(slug) {
  if (!slug || typeof slug !== "string") {
    return { city: null, state: null, isValid: false };
  }

  const parts = slug.split("-");

  if (parts.length < 2) return { city: null, state: null, isValid: false };

  // Assume last one or two parts belong to state, rest is city
  // For simplicity, take last part as state slug
  const stateSlug = parts[parts.length - 1];
  const citySlug = parts.slice(0, parts.length - 1).join("-");

  // Convert slugs back to readable names
  const cityName = citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const stateName = stateSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Validate state exists
  const indianStates = State.getStatesOfCountry("IN");
  const stateObj = indianStates.find(
    (s) => s.name.toLowerCase() === stateName.toLowerCase()
  );
  if (!stateObj) return { city: null, state: null, isValid: false };

  // Validate city exists in that state
  const cities = City.getCitiesOfState("IN", stateObj.isoCode);
  const cityExists = cities.some(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  );
  if (!cityExists) return { city: null, state: null, isValid: false };

  return { city: cityName, state: stateName, isValid: true };
}

/**
 * Create location slug from city and state
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {string} - URL slug (e.g., "gurugram-haryana")
 */
export function createLocationSlug(city, state) {
  if (!city || !state) return "";

  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  const stateSlug = state.toLowerCase().replace(/\s+/g, "-");

  return `${citySlug}-${stateSlug}`;
}

