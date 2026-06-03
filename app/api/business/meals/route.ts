import { NextRequest, NextResponse } from "next/server";
import { BusinessMealsDB, PushSubscriptionDB } from "@/lib/db";
import { cookies } from "next/headers";
import { sendPushNotification } from "@/lib/webpush";

async function getSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("miqdar_business_session");
    if (!cookie?.value) return null;
    return JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const latest = await BusinessMealsDB.findLatest();
    return NextResponse.json({ meals: latest || null });
  } catch (error) {
    console.error("GET meals error:", error);
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "cook" && session.role !== "manager")) {
      return NextResponse.json({ error: "غير مصرح لغير الطباخ أو المدير" }, { status: 401 });
    }

    const body = await request.json();
    const { lunch, dinner, snacks, date } = body;

    if (!lunch || !dinner || !snacks || !date) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const item = await BusinessMealsDB.create({
      lunch: lunch.trim(),
      dinner: dinner.trim(),
      snacks: snacks.trim(),
      date,
    });

    // Send push notification to Kitchen Supervisors and Managers
    try {
      const kitchenSubs = await PushSubscriptionDB.findByRole("kitchen");
      const managerSubs = await PushSubscriptionDB.findByRole("manager");
      const allSubs = [...kitchenSubs, ...managerSubs];

      const payload = {
        title: "تم تقديم وجبات الغد 🍳",
        body: `قام الطباخ بتقديم وجبات الغد (${date})! يرجى الدخول والتحقق من توافر الطلبات.`,
        url: "/business"
      };

      for (const sub of allSubs) {
        await sendPushNotification(sub.subscription, payload);
      }
    } catch (pushError) {
      console.error("Failed to send push notifications:", pushError);
    }

    return NextResponse.json({ success: true, meals: item });
  } catch (error) {
    console.error("POST meals error:", error);
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "kitchen" && session.role !== "manager")) {
      return NextResponse.json({ error: "غير مصرح لغير مسؤول المطبخ أو المدير" }, { status: 401 });
    }

    const body = await request.json();
    const { id, verifiedLunch, verifiedDinner, verifiedSnacks } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الوجبات مطلوب" }, { status: 400 });
    }

    const updated = await BusinessMealsDB.updateVerification(
      id,
      !!verifiedLunch,
      !!verifiedDinner,
      !!verifiedSnacks
    );

    if (!updated) {
      return NextResponse.json({ error: "الوجبات غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ success: true, meals: updated });
  } catch (error) {
    console.error("PUT meals error:", error);
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}
