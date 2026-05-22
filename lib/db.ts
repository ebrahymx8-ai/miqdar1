import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data");

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string; // hashed in production
  gender: "male" | "female";
  age: number;
  weight: number;
  height: number;
  activityLevel: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  goal: "bulk" | "cut" | "maintain";
  menuType: "basic" | "premium";
  durationDays: 26 | 30;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "frozen" | "expired" | "cancelled";
  frozenDays: number;
  maxFreezeDays: number;
  targetCalories: number;
  price: number;
  deliveryFee: number;
  discountCode?: string;
  discountAmount: number;
  totalPrice: number;
  paymentMethod: "bank_transfer" | "cash" | "moyasar";
  paymentStatus: "pending" | "confirmed" | "failed";
  receiptImageUrl?: string;
  moyasarPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  isActive: boolean;
  usageCount: number;
  affiliatePhone?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  subscriptionId: string;
  type: "renewal_reminder" | "subscription_confirmed" | "delivery_out" | "freeze_confirmed";
  channel: "whatsapp" | "sms";
  status: "pending" | "sent" | "failed";
  message: string;
  scheduledAt: string;
  sentAt?: string;
  createdAt: string;
}

type Collection = "users" | "subscriptions" | "discountCodes" | "notifications";

function getFilePath(collection: Collection): string {
  return path.join(DB_PATH, `${collection}.json`);
}

function readCollection<T>(collection: Collection): T[] {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
    fs.writeFileSync(filePath, "[]", "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeCollection<T>(collection: Collection, data: T[]): void {
  fs.mkdirSync(DB_PATH, { recursive: true });
  fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), "utf-8");
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const UserDB = {
  findAll: (): User[] => readCollection<User>("users"),
  findById: (id: string) => readCollection<User>("users").find((u) => u.id === id),
  findByPhone: (phone: string) => readCollection<User>("users").find((u) => u.phone === phone),
  findByEmail: (email: string) => readCollection<User>("users").find((u) => u.email === email),
  create: (data: Omit<User, "id" | "createdAt">): User => {
    const users = readCollection<User>("users");
    const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    users.push(user);
    writeCollection("users", users);
    return user;
  },
  update: (id: string, data: Partial<User>): User | null => {
    const users = readCollection<User>("users");
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...data };
    writeCollection("users", users);
    return users[index];
  },
};

export const SubscriptionDB = {
  findAll: (): Subscription[] => readCollection<Subscription>("subscriptions"),
  findById: (id: string) => readCollection<Subscription>("subscriptions").find((s) => s.id === id),
  findByUserId: (userId: string) => readCollection<Subscription>("subscriptions").filter((s) => s.userId === userId),
  findActive: (userId: string) => readCollection<Subscription>("subscriptions").find((s) => s.userId === userId && s.status === "active"),
  create: (data: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Subscription => {
    const subs = readCollection<Subscription>("subscriptions");
    const sub: Subscription = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    subs.push(sub);
    writeCollection("subscriptions", subs);
    return sub;
  },
  update: (id: string, data: Partial<Subscription>): Subscription | null => {
    const subs = readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return null;
    subs[index] = { ...subs[index], ...data, updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return subs[index];
  },
  freeze: (id: string) => {
    const subs = readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, message: "الاشتراك غير موجود" };
    if (subs[index].status !== "active") return { success: false, message: "الاشتراك غير نشط" };
    if (subs[index].frozenDays >= subs[index].maxFreezeDays) return { success: false, message: `استنفدت أيام التجميد (${subs[index].maxFreezeDays} أيام)` };
    subs[index] = { ...subs[index], status: "frozen", updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return { success: true, message: "تم تجميد الاشتراك بنجاح" };
  },
  unfreeze: (id: string) => {
    const subs = readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, message: "الاشتراك غير موجود" };
    if (subs[index].status !== "frozen") return { success: false, message: "الاشتراك ليس مجمداً" };
    subs[index] = { ...subs[index], status: "active", frozenDays: subs[index].frozenDays + 1, updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return { success: true, message: "تم استئناف الاشتراك بنجاح" };
  },
};

export const DiscountDB = {
  findByCode: (code: string) => readCollection<DiscountCode>("discountCodes").find((d) => d.code.toUpperCase() === code.toUpperCase() && d.isActive),
  validate: (code: string): { valid: boolean; percentage: number; message: string } => {
    const d = DiscountDB.findByCode(code);
    if (!d) return { valid: false, percentage: 0, message: "كود الخصم غير صالح أو منتهي" };
    return { valid: true, percentage: d.percentage, message: `✅ تم تطبيق خصم ${d.percentage}%` };
  },
  seed: () => {
    const existing = readCollection<DiscountCode>("discountCodes");
    if (existing.length === 0) {
      writeCollection("discountCodes", [
        { id: generateId(), code: "MIQDAR5", percentage: 5, isActive: true, usageCount: 0, createdAt: new Date().toISOString() },
        { id: generateId(), code: "WELCOME10", percentage: 10, isActive: true, usageCount: 0, createdAt: new Date().toISOString() },
      ]);
    }
  },
};

export const NotificationDB = {
  create: (data: Omit<Notification, "id" | "createdAt">): Notification => {
    const notifs = readCollection<Notification>("notifications");
    const notif: Notification = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    notifs.push(notif);
    writeCollection("notifications", notifs);
    return notif;
  },
  findPending: () => readCollection<Notification>("notifications").filter((n) => n.status === "pending"),
  markSent: (id: string) => {
    const notifs = readCollection<Notification>("notifications");
    const index = notifs.findIndex((n) => n.id === id);
    if (index !== -1) { notifs[index].status = "sent"; notifs[index].sentAt = new Date().toISOString(); writeCollection("notifications", notifs); }
  },
};

export const PRICING = {
  basic:  { price26: 999,  price30: 1199, label: "الباقة الأساسية",  meals: "وجبتين + سناك" },
  premium:{ price26: 1499, price30: 1699, label: "الباقة المميزة",   meals: "وجبتين + سناك (مكونات فاخرة)" },
  deliveryFee: 99,
  freezeDays: { 26: 3, 30: 5 },
} as const;

export function calculatePrice(menuType: "basic" | "premium", durationDays: 26 | 30, discountPct = 0) {
  const base = durationDays === 26 ? PRICING[menuType].price26 : PRICING[menuType].price30;
  const delivery = PRICING.deliveryFee;
  const discount = Math.round((base * discountPct) / 100);
  return { basePrice: base, deliveryFee: delivery, discount, total: base + delivery - discount };
}
