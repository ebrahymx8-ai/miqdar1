import { NextRequest, NextResponse } from "next/server";
import { UserDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, password, gender, age, weight, height, activityLevel } = body;

    if (!name || !phone || !email || !password || !gender || !age || !weight || !height || !activityLevel) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "رقم الجوال غير صحيح" }, { status: 400 });
    }

    // Check duplicate
    if (UserDB.findByPhone(cleanPhone)) {
      return NextResponse.json({ error: "رقم الجوال مسجل مسبقاً" }, { status: 409 });
    }
    if (UserDB.findByEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
    }

    const user = UserDB.create({
      name, phone: cleanPhone, email,
      password: hashPassword(password),
      gender, age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel,
    });

    // Create session
    const sessionData = { userId: user.id, name: user.name, phone: user.phone, email: user.email };
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("miqdar_session", sessionValue, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
