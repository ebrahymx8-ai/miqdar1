import { NextRequest, NextResponse } from "next/server";
import { UserDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "أدخل رقم الجوال" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = UserDB.findByPhone(cleanPhone);
    if (!user) {
      return NextResponse.json({ error: "رقم الجوال غير مسجل لدينا" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم إرسال رمز استعادة كلمة المرور" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
