import webpush from "web-push";

const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BIubJL8mQ-j95iJHeEu8tZIgVNptB3Y48I4H1NS5AnCLCGhi-WABYbdBIPil2IfY3rqvhszs-Z08HpG3H6jZ8Yc",
  privateKey: process.env.VAPID_PRIVATE_KEY || "fyupQuX7pBa8JaZxHTPkHrJ86EdTbni9eoiCT3vSrrw",
};

webpush.setVapidDetails(
  "mailto:support@miqdar.sa",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function sendPushNotification(subscriptionStr: string, payload: { title: string; body: string; url?: string }) {
  try {
    const subscription = JSON.parse(subscriptionStr);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error("Web Push error:", error);
    return { success: false, error: String(error) };
  }
}
