// مقدار - بنية التحتية لنظام التنبيهات (واتساب / SMS)
// سيتم ربطها لاحقاً بـ API واتساب الفعلي

export interface NotificationPayload {
  phone: string;
  message: string;
  type: "whatsapp" | "sms";
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---- رسائل التنبيه المعيارية ----
export const NOTIFICATION_TEMPLATES = {
  subscriptionConfirmed: (name: string, startDate: string, endDate: string) =>
    `مرحباً ${name} 👋\nتم تأكيد اشتراكك في *مقدار للوجبات الصحية* ✅\n📅 بداية الاشتراك: ${startDate}\n📅 نهاية الاشتراك: ${endDate}\nنتمنى لك رحلة صحية ممتعة! 🥗`,

  renewalReminder: (name: string, daysLeft: number) =>
    `مرحباً ${name} ⏰\nاشتراكك في *مقدار* ينتهي خلال *${daysLeft} أيام*.\nجدد اشتراكك الآن للاستمرار في رحلتك الصحية 💪`,

  deliveryOut: (name: string, time: string) =>
    `مرحباً ${name} 🚴\nوجباتك في الطريق إليك! 🥦\nالوقت المتوقع للوصول: *${time}*\nشهية طيبة! 😋`,

  freezeConfirmed: (name: string, resumeDate: string) =>
    `مرحباً ${name} ❄️\nتم تجميد اشتراكك بنجاح.\nسيستأنف اشتراكك في: *${resumeDate}*`,
};

// ---- WhatsApp API Integration (Placeholder) ----
// استبدل هذا بـ API واتساب الفعلي (مثل Twilio أو WhatsApp Business API)
async function sendWhatsApp(phone: string, message: string): Promise<NotificationResult> {
  const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

  if (!WHATSAPP_API_URL || !WHATSAPP_TOKEN) {
    // في بيئة التطوير - طباعة الرسالة في الكونسول
    console.log(`[WhatsApp] To: ${phone}\n${message}`);
    return { success: true, messageId: `dev_${Date.now()}` };
  }

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, messageId: data.messages?.[0]?.id };
    } else {
      return { success: false, error: data.error?.message };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ---- SMS Integration (Placeholder) ----
async function sendSMS(phone: string, message: string): Promise<NotificationResult> {
  const SMS_API_URL = process.env.SMS_API_URL;
  const SMS_API_KEY = process.env.SMS_API_KEY;

  if (!SMS_API_URL || !SMS_API_KEY) {
    console.log(`[SMS] To: ${phone}\n${message}`);
    return { success: true, messageId: `dev_sms_${Date.now()}` };
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SMS_API_KEY}` },
      body: JSON.stringify({ phone, message }),
    });
    const data = await response.json();
    return response.ok ? { success: true, messageId: data.id } : { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ---- Main send function ----
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  if (payload.type === "whatsapp") {
    return sendWhatsApp(payload.phone, payload.message);
  } else {
    return sendSMS(payload.phone, payload.message);
  }
}

// ---- Moyasar Payment Integration ----
export interface MoyasarPaymentPayload {
  amount: number; // in halalas (SAR * 100)
  description: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}

export interface MoyasarPaymentResult {
  id: string;
  status: string;
  url: string; // redirect URL
}

export async function createMoyasarPayment(payload: MoyasarPaymentPayload): Promise<MoyasarPaymentResult | null> {
  const MOYASAR_KEY = process.env.MOYASAR_PUBLISHABLE_KEY;
  if (!MOYASAR_KEY) {
    console.log("[Moyasar] Not configured - using dev mode");
    return { id: `dev_pay_${Date.now()}`, status: "initiated", url: "/checkout/success?dev=1" };
  }

  try {
    const response = await fetch("https://api.moyasar.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(MOYASAR_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: "SAR",
        description: payload.description,
        callback_url: payload.callbackUrl,
        source: { type: "creditcard" },
        metadata: payload.metadata,
      }),
    });
    const data = await response.json();
    return response.ok ? { id: data.id, status: data.status, url: data.source?.transaction_url } : null;
  } catch {
    return null;
  }
}
