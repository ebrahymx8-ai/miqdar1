import { NextRequest, NextResponse } from "next/server";
import { SubscriptionDB, UserDB } from "@/lib/db";
import { sendNotification, NOTIFICATION_TEMPLATES } from "@/lib/notifications";
import { NotificationDB } from "@/lib/db";

// This route is called by a cron job or manually to check renewal reminders
export async function GET(request: NextRequest) {
  // Simple auth for cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "dev_cron_secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSubs = SubscriptionDB.findAll();
  const now = new Date();
  const results = [];

  for (const sub of allSubs) {
    if (sub.status !== "active") continue;

    const endDate = new Date(sub.endDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);

    // Send reminder 3 days before expiry
    if (daysLeft === 3 || daysLeft === 1) {
      const user = UserDB.findById(sub.userId);
      if (!user) continue;

      const message = NOTIFICATION_TEMPLATES.renewalReminder(user.name, daysLeft);
      const result = await sendNotification({ phone: user.phone, message, type: "whatsapp" });

      // Log notification
      NotificationDB.create({
        userId: sub.userId,
        subscriptionId: sub.id,
        type: "renewal_reminder",
        channel: "whatsapp",
        status: result.success ? "sent" : "failed",
        message,
        scheduledAt: now.toISOString(),
        sentAt: result.success ? now.toISOString() : undefined,
      });

      results.push({ userId: sub.userId, daysLeft, success: result.success });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
