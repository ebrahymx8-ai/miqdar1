import { NextRequest, NextResponse } from "next/server";

// Define the expected request payload structure
interface SubscriberPayload {
  name: string;
  phone: string;
  calories: number;
  goal: "bulk" | "cut" | "maintain" | string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Partial<SubscriberPayload> = await request.json();
    const { name, phone, calories, goal } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "الاسم مطلوب ويجب أن يحتوي على حرفين على الأقل" },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !/^(05|5)\d{8}$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, error: "رقم الجوال مطلوب ويجب أن يكون رقم جوال سعودي صحيح (مثال: 05xxxxxxxx)" },
        { status: 400 }
      );
    }

    if (calories === undefined || calories === null || typeof calories !== "number" || calories <= 0) {
      return NextResponse.json(
        { success: false, error: "السعرات المحسوبة مطلوبة ويجب أن تكون رقماً أكبر من الصفر" },
        { status: 400 }
      );
    }

    if (!goal || typeof goal !== "string") {
      return NextResponse.json(
        { success: false, error: "الهدف مطلوب" },
        { status: 400 }
      );
    }

    // 2. Prepare payload for database binding
    const subscriberData = {
      name: name.trim(),
      phone: phone.trim(),
      calories: Math.round(calories),
      goal: goal.trim(),
      createdAt: new Date().toISOString(),
    };

    // Log the subscriber data for debugging
    console.log("New subscriber data received:", subscriberData);

    // TODO: Link with database (e.g., save to JSON file or external database)
    // Example:
    // await SubscriberDB.create(subscriberData);

    return NextResponse.json(
      {
        success: true,
        message: "تم استقبال بيانات المشترك بنجاح وتجهيزها للحفظ",
        data: subscriberData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in subscriber API endpoint:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}
