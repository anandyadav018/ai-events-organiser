import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "spott_jwt_secret_build_fallback_2026";
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  return token?.value || null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export async function getCurrentUserPayload(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}
