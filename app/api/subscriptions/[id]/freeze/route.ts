import { NextRequest, NextResponse } from "next/server";
import { SubscriptionDB, UserDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendNotification, NOTIFICATION_TEMPLATES } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { id } = await params;
    const { action } = await request.json(); // "freeze" | "unfreeze"

    const sub = await SubscriptionDB.findById(id);
    if (!sub || sub.userId !== session.userId) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    let result;
    if (action === "freeze") {
      result = await SubscriptionDB.freeze(id);
      if (result.success) {
        const user = await UserDB.findById(session.userId);
        if (user) {
          const resumeDate = new Date(Date.now() + 86400000).toLocaleDateString("ar-SA");
          await sendNotification({
            phone: user.phone,
            message: NOTIFICATION_TEMPLATES.freezeConfirmed(user.name, resumeDate),
            type: "whatsapp",
          });
        }
      }
    } else if (action === "unfreeze") {
      result = await SubscriptionDB.unfreeze(id);
    } else {
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Freeze error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
