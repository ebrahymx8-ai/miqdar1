// مقدار - نظام الجلسات والمصادقة
import { cookies } from "next/headers";
import { UserDB, User } from "./db";

export interface Session {
  userId: string;
  name: string;
  phone: string;
  email: string;
}

const SESSION_COOKIE = "miqdar_session";

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    if (!cookie?.value) return null;
    return JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}

export function createSessionValue(user: User): string {
  const session: Session = { userId: user.id, name: user.name, phone: user.phone, email: user.email };
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function hashPassword(password: string): string {
  // In production use bcrypt - for now simple encoding
  return Buffer.from(password + "_miqdar_salt").toString("base64");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
