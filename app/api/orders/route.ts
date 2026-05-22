import { NextRequest, NextResponse } from "next/server";
import { SubscriptionDB, calculatePrice } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendNotification, NOTIFICATION_TEMPLATES } from "@/lib/notifications";
import { UserDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });

    const body = await request.json();
    const { goal, menuType, durationDays, paymentMethod, discountCode, discountAmount, targetCalories } = body;

    if (!goal || !menuType || !durationDays || !paymentMethod) {
      return NextResponse.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
    }

    const pricing = calculatePrice(menuType, durationDays, discountAmount ? (discountAmount / calculatePrice(menuType, durationDays).basePrice * 100) : 0);
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + durationDays * 86400000).toISOString().split("T")[0];

    // Max freeze days based on duration
    const maxFreezeDays = durationDays === 26 ? 3 : 5;

    const sub = SubscriptionDB.create({
      userId: session.userId,
      goal, menuType,
      durationDays,
      startDate, endDate,
      status: paymentMethod === "cash" ? "active" : "pending",
      frozenDays: 0,
      maxFreezeDays,
      targetCalories: targetCalories || 2000,
      price: pricing.basePrice,
      deliveryFee: pricing.deliveryFee,
      discountCode,
      discountAmount: pricing.discount,
      totalPrice: pricing.total,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "confirmed" : "pending",
    });

    // Schedule confirmation notification
    const user = UserDB.findById(session.userId);
    if (user && sub.status === "active") {
      await sendNotification({
        phone: user.phone,
        message: NOTIFICATION_TEMPLATES.subscriptionConfirmed(user.name, startDate, endDate),
        type: "whatsapp",
      });
    }

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء الطلب" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const subs = SubscriptionDB.findByUserId(session.userId);
    return NextResponse.json({ subscriptions: subs });
  } catch {
    return NextResponse.json({ error: "خطأ في جلب البيانات" }, { status: 500 });
  }
}
