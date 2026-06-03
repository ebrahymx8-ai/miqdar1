import { NextRequest, NextResponse } from "next/server";
import { PushSubscriptionDB } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("miqdar_business_session");
    if (!cookie?.value) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    
    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json({ error: "بيانات الاشتراك مطلوبة" }, { status: 400 });
    }

    const subscriptionStr = typeof subscription === "string" ? subscription : JSON.stringify(subscription);

    await PushSubscriptionDB.save(session.userId, session.role, subscriptionStr);

    return NextResponse.json({ success: true, message: "تم حفظ الاشتراك بنجاح" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "خطأ في الاتصال بالخادم" }, { status: 500 });
  }
}
