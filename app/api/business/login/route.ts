import { NextRequest, NextResponse } from "next/server";
import { BusinessUserDB } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pinCode } = body;

    if (!pinCode) {
      return NextResponse.json({ error: "الرمز السري مطلوب" }, { status: 400 });
    }

    const user = await BusinessUserDB.findByPinCode(pinCode);
    if (!user) {
      return NextResponse.json({ error: "الرمز السري غير صحيح" }, { status: 401 });
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    const sessionData = { userId: user.id, name: user.name, role: user.role };
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");
    
    cookieStore.set("miqdar_business_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطأ في الاتصال بالخادم" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("miqdar_business_session");
    if (!cookie?.value) {
      return NextResponse.json({ authenticated: false });
    }
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    
    // Check search params
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");

    if (all === "true" && session.role === "manager") {
      const users = await BusinessUserDB.findAll();
      const team = users.map((u) => {
        let plainPin = "";
        try {
          plainPin = Buffer.from(u.pinCode, "base64").toString("utf-8").replace("_miqdar_salt", "");
        } catch (e) {
          plainPin = "????";
        }
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          pinCode: plainPin,
          createdAt: u.createdAt
        };
      });
      return NextResponse.json({ authenticated: true, user: session, team });
    }

    return NextResponse.json({ authenticated: true, user: session });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("miqdar_business_session");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("miqdar_business_session");
    if (!cookie?.value) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const session = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
    if (session.role !== "manager") {
      return NextResponse.json({ error: "غير مصرح لغير المدير" }, { status: 403 });
    }

    const body = await request.json();
    const { role, newPinCode } = body;

    if (!role || !newPinCode || newPinCode.length !== 4) {
      return NextResponse.json({ error: "البيانات غير مكتملة أو غير صالحة" }, { status: 400 });
    }

    if (!["kitchen", "purchaser", "delivery", "cook"].includes(role)) {
      return NextResponse.json({ error: "الدور المحدد غير صالح" }, { status: 400 });
    }

    const success = await BusinessUserDB.updatePinCode(role, newPinCode);
    if (!success) {
      return NextResponse.json({ error: "لم يتم العثور على المستخدم لتحديث الرمز السري" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم تحديث الرمز السري بنجاح" });
  } catch (error) {
    console.error("Update pin error:", error);
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}
