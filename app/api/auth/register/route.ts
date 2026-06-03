import { NextRequest, NextResponse } from "next/server";
import { UserDB, BusinessSubscriberDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Ensure the data directory and subscribers.json file exist to prevent server errors
    const dataDir = path.join(process.cwd(), "data");
    const subscribersFile = path.join(dataDir, "subscribers.json");
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(subscribersFile)) {
        fs.writeFileSync(subscribersFile, "[]", "utf-8");
      }
    } catch (e) {
      console.warn("Read-only filesystem detected on Vercel:", e);
    }

    const body = await request.json();
    const { name, phone, email, password, gender, age, weight, height, activityLevel } = body;

    if (!name || !phone || !email || !password || !gender || !age || !weight || !height || !activityLevel) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "رقم الجوال غير صحيح" }, { status: 400 });
    }

    // Check duplicate
    if (await UserDB.findByPhone(cleanPhone)) {
      return NextResponse.json({ error: "رقم الجوال مسجل مسبقاً" }, { status: 409 });
    }
    if (await UserDB.findByEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
    }

    const user = await UserDB.create({
      name, phone: cleanPhone, email,
      password: hashPassword(password),
      gender, age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel,
    });

    // Save subscriber directly to subscribers.json to avoid database/connection conflicts
    let subscribers = [];
    try {
      const fileContent = fs.readFileSync(subscribersFile, "utf-8");
      subscribers = JSON.parse(fileContent);
      if (!Array.isArray(subscribers)) {
        subscribers = [];
      }
    } catch (e) {
      // Fallback: use global in-memory array on read-only systems like Vercel
      if (!(global as any).subscribersMemory) {
        (global as any).subscribersMemory = [];
      }
      subscribers = (global as any).subscribersMemory;
    }

    // Avoid duplicate subscriber entry in subscribers.json
    const exists = subscribers.some(
      (sub: any) =>
        sub.name === name.trim() ||
        (sub.details && sub.details.includes(cleanPhone))
    );

    if (!exists) {
      let newId = "";
      const numericIds = subscribers
        .map((s: any) => parseInt(s.id, 10))
        .filter((id: number) => !isNaN(id));
      if (numericIds.length > 0) {
        newId = (Math.max(...numericIds) + 1).toString();
      } else {
        newId = "100" + (subscribers.length + 1);
      }

      const newSubscriber = {
        id: newId,
        name: name.trim(),
        neighborhood: "العزيزية", // Default neighborhood for new online registrations
        packageType: "حياة يومية (وجبة وسناك)", // Default package type
        deliveryStatus: "قيد التوصيل",
        details: `مسجل عبر الموقع الإلكتروني - هاتف: ${cleanPhone}`,
        date: new Date().toISOString().split("T")[0]
      };

      subscribers.push(newSubscriber);
      
      // Update global memory store to persist on this instance
      if ((global as any).subscribersMemory) {
        (global as any).subscribersMemory = subscribers;
      }

      try {
        fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2), "utf-8");
      } catch (writeError) {
        // Silently skip on read-only filesystems (Vercel)
      }
    }

    // Create Business Subscriber record in external DB if configured
    if (process.env.DATABASE_URL) {
      try {
        await BusinessSubscriberDB.create({
          name: name.trim(),
          neighborhood: "العزيزية",
          packageType: "حياة يومية (وجبة وسناك)",
          deliveryStatus: "قيد التوصيل",
          details: `مسجل عبر الموقع الإلكتروني - هاتف: ${cleanPhone}`,
        });
      } catch (dbError) {
        console.error("Could not save to BusinessSubscriberDB (Postgres):", dbError);
      }
    }

    // Create session
    const sessionData = { userId: user.id, name: user.name, phone: user.phone, email: user.email };
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("miqdar_session", sessionValue, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
