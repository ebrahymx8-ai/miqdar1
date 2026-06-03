import { NextRequest, NextResponse } from "next/server";
import { BusinessSubscriberDB } from "@/lib/db";
import { cookies } from "next/headers";

// Helper to check authorization
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
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const list = await BusinessSubscriberDB.findAll();
    return NextResponse.json({ subscribers: list });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "manager") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { name, neighborhood, packageType, details } = body;

    if (!name || !neighborhood || !packageType) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const item = await BusinessSubscriberDB.create({
      name: name.trim(),
      neighborhood,
      packageType: packageType.trim(),
      deliveryStatus: "قيد التوصيل",
      details: details?.trim() || `حي ${neighborhood} - شارع عام`,
    });

    return NextResponse.json({ success: true, subscriber: item });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { id, deliveryStatus } = body;

    if (!id || !deliveryStatus) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const item = await BusinessSubscriberDB.updateDeliveryStatus(id, deliveryStatus);
    if (!item) {
      return NextResponse.json({ error: "المشترك غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, subscriber: item });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

// Reset method
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session || session.role !== "manager") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const list = await BusinessSubscriberDB.resetAll();
    return NextResponse.json({ success: true, subscribers: list });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

// Delete method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "manager") {
      return NextResponse.json({ error: "غير مصرح لغير المدير" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف المشترك مطلوب" }, { status: 400 });
    }

    const success = await BusinessSubscriberDB.delete(id);
    if (!success) {
      return NextResponse.json({ error: "المشترك غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم حذف المشترك بنجاح" });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}
