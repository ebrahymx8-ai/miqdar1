import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { SubscriptionDB, UserDB } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const user = await UserDB.findById(session.userId);
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const subscriptions = await SubscriptionDB.findByUserId(session.userId);

    // Check for expiring subscriptions and update status
    const now = new Date();
    for (const sub of subscriptions) {
      if (sub.status === "active" && new Date(sub.endDate) < now) {
        await SubscriptionDB.update(sub.id, { status: "expired" });
      }
    }

    const updatedSubs = await SubscriptionDB.findByUserId(session.userId);

    return NextResponse.json({
      session: { name: user.name, phone: user.phone, email: user.email },
      subscriptions: updatedSubs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
