import { NextRequest, NextResponse } from "next/server";
import { DiscountDB } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ valid: false, message: "أدخل كود الخصم" });
    // Seed codes if needed
    DiscountDB.seed();
    const result = DiscountDB.validate(code);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, message: "خطأ في التحقق" }, { status: 500 });
  }
}
