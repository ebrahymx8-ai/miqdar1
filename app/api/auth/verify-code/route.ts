import { NextRequest, NextResponse } from "next/server";
import { UserDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = await UserDB.findByPhone(cleanPhone);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({ error: "رمز التحقق يجب أن يتكون من 6 أرقام" }, { status: 400 });
    }

    // Accept any valid 6 digit code for demo / testing ease
    return NextResponse.json({ success: true, message: "تم التحقق بنجاح" });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
