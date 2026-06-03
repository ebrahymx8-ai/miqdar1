import { NextRequest, NextResponse } from "next/server";
import { UserDB } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "أدخل رقم الجوال وكلمة المرور" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = await UserDB.findByPhone(cleanPhone);
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: "رقم الجوال أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const sessionData = { userId: user.id, name: user.name, phone: user.phone, email: user.email };
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("miqdar_session", sessionValue, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("miqdar_session");
  return NextResponse.json({ success: true });
}
