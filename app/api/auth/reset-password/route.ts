import { NextRequest, NextResponse } from "next/server";
import { UserDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { phone, password, confirmPassword } = await request.json();
    if (!phone || !password || !confirmPassword) {
      return NextResponse.json({ error: "يرجى تعبئة جميع الحقول المطلوبة" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "كلمات المرور غير متطابقة" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "يجب أن تتكون كلمة المرور من 6 خانات على الأقل" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const user = UserDB.findByPhone(cleanPhone);
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const hashedPassword = hashPassword(password);
    const updated = UserDB.update(user.id, { password: hashedPassword });
    if (!updated) {
      return NextResponse.json({ error: "فشل في تحديث كلمة المرور" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
