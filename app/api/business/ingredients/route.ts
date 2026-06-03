import { NextRequest, NextResponse } from "next/server";
import { BusinessIngredientDB } from "@/lib/db";
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

    const list = await BusinessIngredientDB.findAll();
    return NextResponse.json({ ingredients: list });
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
    const { name, category } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const item = await BusinessIngredientDB.create({
      name: name.trim(),
      category,
      status: "فل",
      lastUpdated: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    });

    return NextResponse.json({ success: true, ingredient: item });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { id, status, lastUpdated } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const item = await BusinessIngredientDB.updateStatus(id, status, session.name, lastUpdated);
    if (!item) {
      return NextResponse.json({ error: "المادة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ingredient: item });
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

    const list = await BusinessIngredientDB.resetAll();
    return NextResponse.json({ success: true, ingredients: list });
  } catch {
    return NextResponse.json({ error: "خطأ في خادم البيانات" }, { status: 500 });
  }
}
