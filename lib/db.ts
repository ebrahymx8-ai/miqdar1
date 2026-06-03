import fs from "fs";
import path from "path";
import { Pool } from "pg";

const DB_PATH = path.join(process.cwd(), "data");

let pool: Pool | null = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false }
  });
}

let isDbInitialized = false;
let dbInitializationPromise: Promise<void> | null = null;

async function ensureDbInitialized() {
  if (!pool) return;
  if (isDbInitialized) return;
  
  if (!dbInitializationPromise) {
    dbInitializationPromise = (async () => {
      try {
        const client = await pool!.connect();
        try {
          await client.query("BEGIN");
          
          await client.query(`
            CREATE TABLE IF NOT EXISTS business_users (
              id VARCHAR(50) PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              pin_code VARCHAR(255) NOT NULL,
              role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'kitchen', 'purchaser', 'delivery')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS ingredients (
              id VARCHAR(50) PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              category VARCHAR(50) NOT NULL,
              status VARCHAR(10) NOT NULL DEFAULT 'فل' CHECK (status IN ('فل', 'ناقص')),
              last_updated VARCHAR(50) NOT NULL,
              updated_by VARCHAR(100),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS subscribers (
              id VARCHAR(50) PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              neighborhood VARCHAR(50) NOT NULL,
              package_type VARCHAR(100) NOT NULL,
              delivery_status VARCHAR(20) NOT NULL DEFAULT 'قيد التوصيل' CHECK (delivery_status IN ('قيد التوصيل', 'تم التوصيل')),
              details VARCHAR(255) NOT NULL,
              date VARCHAR(50) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          const usersCount = await client.query("SELECT COUNT(*) FROM business_users");
          if (parseInt(usersCount.rows[0].count, 10) === 0) {
            const salt = "_miqdar_salt";
            const u1Pin = Buffer.from("1111" + salt).toString("base64");
            const u2Pin = Buffer.from("2222" + salt).toString("base64");
            const u3Pin = Buffer.from("3333" + salt).toString("base64");
            const u4Pin = Buffer.from("4444" + salt).toString("base64");

            await client.query(`
              INSERT INTO business_users (id, name, pin_code, role) VALUES
              ('u1', 'مسؤول المطبخ', $1, 'kitchen'),
              ('u2', 'مندوب المقاضي', $2, 'purchaser'),
              ('u3', 'مندوب التوصيل', $3, 'delivery'),
              ('u4', 'مدير المشروع', $4, 'manager')
            `, [u1Pin, u2Pin, u3Pin, u4Pin]);
          }

          const ingCount = await client.query("SELECT COUNT(*) FROM ingredients");
          if (parseInt(ingCount.rows[0].count, 10) === 0) {
            const initialIngredients = [
              ["صدور دجاج طازجة", "البروتين", "فل", "08:30 ص"],
              ["شرائح لحم بقري", "البروتين", "فل", "08:30 ص"],
              ["لحم بقري مفروم", "البروتين", "فل", "08:30 ص"],
              ["جمبري مقشر ومنظف", "البروتين", "فل", "08:30 ص"],
              ["خس روماني", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["بقدونس طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["نعناع طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["بروكلي طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["فلفل رومي ملون", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["جزر", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["ملفوف أبيض أو أحمر", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["طماطم", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["خيار", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["بصل", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["ثوم طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["ليمون طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["رمان طازج", "الخضروات والورقيات", "فل", "08:35 ص"],
              ["نودلز طازجة", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["أرز أبيض بسمتي", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["مكرونة بيني أو سباغيتي", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["مكرونة فوتشيني", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["خبز بر أسمر", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["خبز توست", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["برغل ناعم عضوي", "النشويات والكربوهيدرات", "فل", "08:40 ص"],
              ["كريمة طبخ لايت", "الألبان والأجبان", "فل", "08:45 ص"],
              ["زبادي يوناني", "الألبان والأجبان", "فل", "08:45 ص"],
              ["جبن شيدر لايت", "الألبان والأجبان", "فل", "08:45 ص"],
              ["جبنة بارميزان مبشورة", "الألبان والأجبان", "فل", "08:45 ص"],
              ["صوص صويا معتدل", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["صوص ترياكي خفيف", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["زيت سمسم", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["زيت زيتون بكر ممتاز", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["دبس رمان طبيعي", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["معجون طماطم", "الزيوت والصوصات", "فل", "08:50 ص"],
              ["كركم", "البهارات والتوابل", "فل", "08:55 ص"],
              ["سمسم محمص", "البهارات والتوابل", "فل", "08:55 ص"],
              ["بودرة ثوم وبودرة بصل", "البهارات والتوابل", "فل", "08:55 ص"],
              ["أوريغانو وبهارات إيطالية", "البهارات والتوابل", "فل", "08:55 ص"],
              ["بابريكا وفلفل أسود وملح بحري", "البهارات والتوابل", "فل", "08:55 ص"]
            ];

            for (let i = 0; i < initialIngredients.length; i++) {
              const [name, category, status, lastUpdated] = initialIngredients[i];
              const id = (i + 1).toString();
              await client.query(`
                INSERT INTO ingredients (id, name, category, status, last_updated) VALUES ($1, $2, $3, $4, $5)
              `, [id, name, category, status, lastUpdated]);
            }
          }

          const subCount = await client.query("SELECT COUNT(*) FROM subscribers");
          if (parseInt(subCount.rows[0].count, 10) === 0) {
            const today = new Date().toISOString().split("T")[0];
            const initialSubscribers = [
              ["1001", "عبدالمجيد الغامدي", "العزيزية", "تضخيم (وجبتان وسناك)", "قيد التوصيل", "حي العزيزية - شارع عبد الله خياط - بجوار المسجد", today],
              ["1002", "سارة الحربي", "الشوقية", "تنشيف (وجبة وسناك)", "قيد التوصيل", "حي الشوقية - شارع الشيخ عبد الله بن دهيش", today],
              ["1003", "خالد الدوسري", "بطحاء قريش", "تضخيم (وجبتان)", "قيد التوصيل", "حي بطحاء قريش - شارع الفرسان", today],
              ["1004", "منى القحطاني", "العوالي", "حياة يومية (وجبة وسناك)", "تم التوصيل", "حي العوالي - شارع إبراهيم الجفالي", today],
              ["1005", "فيصل بن سلمان", "النزهة والزاهر", "تضخيم (وجبتان وسناك)", "قيد التوصيل", "حي النزهة - طريق المدينة المنورة", today],
              ["1006", "أحمد السديري", "العزيزية", "تنشيف (وجبتان)", "قيد التوصيل", "حي العزيزية - خلف مستشفى النور", today]
            ];

            for (const sub of initialSubscribers) {
              await client.query(`
                INSERT INTO subscribers (id, name, neighborhood, package_type, delivery_status, details, date)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, sub);
            }
          }

          await client.query("COMMIT");
          isDbInitialized = true;
        } catch (err) {
          await client.query("ROLLBACK");
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error("Failed to initialize PostgreSQL database:", err);
        dbInitializationPromise = null;
        throw err;
      }
    })();
  }
  return dbInitializationPromise;
}


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

type Collection = "users" | "subscriptions" | "discountCodes" | "notifications" | "businessUsers" | "ingredients" | "subscribers";

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

export interface BusinessUser {
  id: string;
  name: string;
  pinCode: string; // hashed/secure
  role: "manager" | "kitchen" | "purchaser" | "delivery";
  createdAt: string;
}

export interface BusinessIngredient {
  id: string;
  name: string;
  category: string;
  status: "فل" | "ناقص";
  lastUpdated: string;
  updatedBy?: string;
}

export interface BusinessSubscriber {
  id: string;
  name: string;
  neighborhood: string;
  packageType: string;
  deliveryStatus: "قيد التوصيل" | "تم التوصيل";
  details: string;
  date: string;
}

export const BusinessUserDB = {
  findAll: async (): Promise<BusinessUser[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users");
      return res.rows;
    }
    return readCollection<BusinessUser>("businessUsers");
  },
  findById: async (id: string): Promise<BusinessUser | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users WHERE id = $1", [id]);
      return res.rows[0];
    }
    return readCollection<BusinessUser>("businessUsers").find((u) => u.id === id);
  },
  findByRole: async (role: string): Promise<BusinessUser[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users WHERE role = $1", [role]);
      return res.rows;
    }
    return readCollection<BusinessUser>("businessUsers").filter((u) => u.role === role);
  },
  findByPinCode: async (pinCode: string): Promise<BusinessUser | undefined> => {
    const hashed = Buffer.from(pinCode + "_miqdar_salt").toString("base64");
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users WHERE pin_code = $1", [hashed]);
      return res.rows[0];
    }
    return readCollection<BusinessUser>("businessUsers").find((u) => u.pinCode === hashed);
  },
  create: async (data: Omit<BusinessUser, "id" | "createdAt">): Promise<BusinessUser> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      const createdAt = new Date().toISOString();
      await pool.query(
        "INSERT INTO business_users (id, name, pin_code, role, created_at) VALUES ($1, $2, $3, $4, $5)",
        [id, data.name, data.pinCode, data.role, createdAt]
      );
      return { ...data, id, createdAt };
    }
    const list = readCollection<BusinessUser>("businessUsers");
    const user: BusinessUser = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(user);
    writeCollection("businessUsers", list);
    return user;
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      return;
    }
    const list = readCollection<BusinessUser>("businessUsers");
    if (list.length === 0) {
      writeCollection("businessUsers", [
        { id: "u1", name: "مسؤول المطبخ", pinCode: Buffer.from("1111" + "_miqdar_salt").toString("base64"), role: "kitchen", createdAt: new Date().toISOString() },
        { id: "u2", name: "مندوب المقاضي", pinCode: Buffer.from("2222" + "_miqdar_salt").toString("base64"), role: "purchaser", createdAt: new Date().toISOString() },
        { id: "u3", name: "مندوب التوصيل", pinCode: Buffer.from("3333" + "_miqdar_salt").toString("base64"), role: "delivery", createdAt: new Date().toISOString() },
        { id: "u4", name: "مدير المشروع", pinCode: Buffer.from("4444" + "_miqdar_salt").toString("base64"), role: "manager", createdAt: new Date().toISOString() },
      ]);
    }
  },
  updatePinCode: async (role: "kitchen" | "purchaser" | "delivery", newPinCode: string): Promise<boolean> => {
    const hashed = Buffer.from(newPinCode + "_miqdar_salt").toString("base64");
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query(
        "UPDATE business_users SET pin_code = $1 WHERE role = $2",
        [hashed, role]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const list = readCollection<BusinessUser>("businessUsers");
    const index = list.findIndex((u) => u.role === role);
    if (index === -1) return false;
    list[index] = { ...list[index], pinCode: hashed };
    writeCollection("businessUsers", list);
    return true;
  }
};

export const BusinessIngredientDB = {
  findAll: async (): Promise<BusinessIngredient[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, category, status, last_updated as \"lastUpdated\", updated_by as \"updatedBy\" FROM ingredients ORDER BY created_at ASC");
      return res.rows;
    }
    return readCollection<BusinessIngredient>("ingredients");
  },
  findById: async (id: string): Promise<BusinessIngredient | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, category, status, last_updated as \"lastUpdated\", updated_by as \"updatedBy\" FROM ingredients WHERE id = $1", [id]);
      return res.rows[0];
    }
    return readCollection<BusinessIngredient>("ingredients").find((i) => i.id === id);
  },
  create: async (data: Omit<BusinessIngredient, "id">): Promise<BusinessIngredient> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      await pool.query(
        "INSERT INTO ingredients (id, name, category, status, last_updated, updated_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, data.name, data.category, data.status, data.lastUpdated, data.updatedBy || null]
      );
      return { ...data, id };
    }
    const list = readCollection<BusinessIngredient>("ingredients");
    const item: BusinessIngredient = { ...data, id: generateId() };
    list.push(item);
    writeCollection("ingredients", list);
    return item;
  },
  updateStatus: async (id: string, status: "فل" | "ناقص", updatedBy?: string, lastUpdated?: string): Promise<BusinessIngredient | null> => {
    const time = lastUpdated || new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query(
        "UPDATE ingredients SET status = $1, last_updated = $2, updated_by = $3 WHERE id = $4 RETURNING id, name, category, status, last_updated as \"lastUpdated\", updated_by as \"updatedBy\"",
        [status, time, updatedBy || null, id]
      );
      return res.rows[0] || null;
    }
    const list = readCollection<BusinessIngredient>("ingredients");
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return null;
    list[index] = { 
      ...list[index], 
      status, 
      lastUpdated: time,
      updatedBy 
    };
    writeCollection("ingredients", list);
    return list[index];
  },
  resetAll: async (): Promise<BusinessIngredient[]> => {
    if (pool) {
      await ensureDbInitialized();
      await pool.query("UPDATE ingredients SET status = 'فل'");
      const res = await pool.query("SELECT id, name, category, status, last_updated as \"lastUpdated\", updated_by as \"updatedBy\" FROM ingredients ORDER BY created_at ASC");
      return res.rows;
    }
    const list = readCollection<BusinessIngredient>("ingredients");
    const updated = list.map((item) => ({ ...item, status: "فل" as const }));
    writeCollection("ingredients", updated);
    return updated;
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      return;
    }
    const list = readCollection<BusinessIngredient>("ingredients");
    if (list.length === 0) {
      const initialList: Omit<BusinessIngredient, "id">[] = [
        // 1. البروتين
        { name: "صدور دجاج طازجة", category: "البروتين", status: "فل", lastUpdated: "08:30 ص" },
        { name: "شرائح لحم بقري", category: "البروتين", status: "فل", lastUpdated: "08:30 ص" },
        { name: "لحم بقري مفروم", category: "البروتين", status: "فل", lastUpdated: "08:30 ص" },
        { name: "جمبري مقشر ومنظف", category: "البروتين", status: "فل", lastUpdated: "08:30 ص" },
        // 2. الخضروات والورقيات
        { name: "خس روماني", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "بقدونس طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "نعناع طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "بروكلي طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "فلفل رومي ملون", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "جزر", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "ملفوف أبيض أو أحمر", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "طماطم", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "خيار", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "بصل", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "ثوم طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "ليمون طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        { name: "رمان طازج", category: "الخضروات والورقيات", status: "فل", lastUpdated: "08:35 ص" },
        // 3. النشويات والكربوهيدرات
        { name: "نودلز طازجة", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "أرز أبيض بسمتي", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "مكرونة بيني أو سباغيتي", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "مكرونة فوتشيني", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "خبز بر أسمر", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "خبز توست", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        { name: "برغل ناعم عضوي", category: "النشويات والكربوهيدرات", status: "فل", lastUpdated: "08:40 ص" },
        // 4. الألبان والأجبان
        { name: "كريمة طبخ لايت", category: "الألبان والأجبان", status: "فل", lastUpdated: "08:45 ص" },
        { name: "زبادي يوناني", category: "الألبان والأجبان", status: "فل", lastUpdated: "08:45 ص" },
        { name: "جبن شيدر لايت", category: "الألبان والأجبان", status: "فل", lastUpdated: "08:45 ص" },
        { name: "جبنة بارميزان مبشورة", category: "الألبان والأجبان", status: "فل", lastUpdated: "08:45 ص" },
        // 5. الزيوت والصوصات
        { name: "صوص صويا معتدل", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        { name: "صوص ترياكي خفيف", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        { name: "زيت سمسم", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        { name: "زيت زيتون بكر ممتاز", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        { name: "دبس رمان طبيعي", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        { name: "معجون طماطم", category: "الزيوت والصوصات", status: "فل", lastUpdated: "08:50 ص" },
        // 6. البهارات والتوابل
        { name: "كركم", category: "البهارات والتوابل", status: "فل", lastUpdated: "08:55 ص" },
        { name: "سمسم محمص", category: "البهارات والتوابل", status: "فل", lastUpdated: "08:55 ص" },
        { name: "بودرة ثوم وبودرة بصل", category: "البهارات والتوابل", status: "فل", lastUpdated: "08:55 ص" },
        { name: "أوريغانو وبهارات إيطالية", category: "البهارات والتوابل", status: "فل", lastUpdated: "08:55 ص" },
        { name: "بابريكا وفلفل أسود وملح بحري", category: "البهارات والتوابل", status: "فل", lastUpdated: "08:55 ص" }
      ];
      
      const seeded = initialList.map((item, index) => ({
        ...item,
        id: (index + 1).toString()
      }));
      writeCollection("ingredients", seeded);
    }
  }
};

export const BusinessSubscriberDB = {
  findAll: async (): Promise<BusinessSubscriber[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, neighborhood, package_type as \"packageType\", delivery_status as \"deliveryStatus\", details, date FROM subscribers ORDER BY created_at ASC");
      return res.rows;
    }
    return readCollection<BusinessSubscriber>("subscribers");
  },
  findById: async (id: string): Promise<BusinessSubscriber | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, neighborhood, package_type as \"packageType\", delivery_status as \"deliveryStatus\", details, date FROM subscribers WHERE id = $1", [id]);
      return res.rows[0];
    }
    return readCollection<BusinessSubscriber>("subscribers").find((s) => s.id === id);
  },
  create: async (data: Omit<BusinessSubscriber, "id" | "date">): Promise<BusinessSubscriber> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      const date = new Date().toISOString().split("T")[0];
      await pool.query(
        "INSERT INTO subscribers (id, name, neighborhood, package_type, delivery_status, details, date) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, data.name, data.neighborhood, data.packageType, data.deliveryStatus, data.details, date]
      );
      return { ...data, id, date };
    }
    const list = readCollection<BusinessSubscriber>("subscribers");
    const item: BusinessSubscriber = {
      ...data,
      id: generateId(),
      date: new Date().toISOString().split("T")[0]
    };
    list.push(item);
    writeCollection("subscribers", list);
    return item;
  },
  updateDeliveryStatus: async (id: string, deliveryStatus: "قيد التوصيل" | "تم التوصيل"): Promise<BusinessSubscriber | null> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query(
        "UPDATE subscribers SET delivery_status = $1 WHERE id = $2 RETURNING id, name, neighborhood, package_type as \"packageType\", delivery_status as \"deliveryStatus\", details, date",
        [deliveryStatus, id]
      );
      return res.rows[0] || null;
    }
    const list = readCollection<BusinessSubscriber>("subscribers");
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], deliveryStatus };
    writeCollection("subscribers", list);
    return list[index];
  },
  resetAll: async (): Promise<BusinessSubscriber[]> => {
    if (pool) {
      await ensureDbInitialized();
      await pool.query("DELETE FROM subscribers");
      const today = new Date().toISOString().split("T")[0];
      const initialList = [
        ["1001", "عبدالمجيد الغامدي", "العزيزية", "تضخيم (وجبتان وسناك)", "قيد التوصيل", "حي العزيزية - شارع عبد الله خياط - بجوار المسجد", today],
        ["1002", "سارة الحربي", "الشوقية", "تنشيف (وجبة وسناك)", "قيد التوصيل", "حي الشوقية - شارع الشيخ عبد الله بن دهيش", today],
        ["1003", "خالد الدوسري", "بطحاء قريش", "تضخيم (وجبتان)", "قيد التوصيل", "حي بطحاء قريش - شارع الفرسان", today],
        ["1004", "منى القحطاني", "العوالي", "حياة يومية (وجبة وسناك)", "تم التوصيل", "حي العوالي - شارع إبراهيم الجفالي", today],
        ["1005", "فيصل بن سلمان", "النزهة والزاهر", "تضخيم (وجبتان وسناك)", "قيد التوصيل", "حي النزهة - طريق المدينة المنورة", today],
        ["1006", "أحمد السديري", "العزيزية", "تنشيف (وجبتان)", "قيد التوصيل", "حي العزيزية - خلف مستشفى النور", today]
      ];
      for (const sub of initialList) {
        await pool.query(`
          INSERT INTO subscribers (id, name, neighborhood, package_type, delivery_status, details, date)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, sub);
      }
      const res = await pool.query("SELECT id, name, neighborhood, package_type as \"packageType\", delivery_status as \"deliveryStatus\", details, date FROM subscribers ORDER BY created_at ASC");
      return res.rows;
    }
    const initialList = [
      { id: "1001", name: "عبدالمجيد الغامدي", neighborhood: "العزيزية", packageType: "تضخيم (وجبتان وسناك)", deliveryStatus: "قيد التوصيل" as const, details: "حي العزيزية - شارع عبد الله خياط - بجوار المسجد", date: new Date().toISOString().split("T")[0] },
      { id: "1002", name: "سارة الحربي", neighborhood: "الشوقية", packageType: "تنشيف (وجبة وسناك)", deliveryStatus: "قيد التوصيل" as const, details: "حي الشوقية - شارع الشيخ عبد الله بن دهيش", date: new Date().toISOString().split("T")[0] },
      { id: "1003", name: "خالد الدوسري", neighborhood: "بطحاء قريش", packageType: "تضخيم (وجبتان)", deliveryStatus: "قيد التوصيل" as const, details: "حي بطحاء قريش - شارع الفرسان", date: new Date().toISOString().split("T")[0] },
      { id: "1004", name: "منى القحطاني", neighborhood: "العوالي", packageType: "حياة يومية (وجبة وسناك)", deliveryStatus: "تم التوصيل" as const, details: "حي العوالي - شارع إبراهيم الجفالي", date: new Date().toISOString().split("T")[0] },
      { id: "1005", name: "فيصل بن سلمان", neighborhood: "النزهة والزاهر", packageType: "تضخيم (وجبتان وسناك)", deliveryStatus: "قيد التوصيل" as const, details: "حي النزهة - طريق المدينة المنورة", date: new Date().toISOString().split("T")[0] },
      { id: "1006", name: "أحمد السديري", neighborhood: "العزيزية", packageType: "تنشيف (وجبتان)", deliveryStatus: "قيد التوصيل" as const, details: "حي العزيزية - خلف مستشفى النور", date: new Date().toISOString().split("T")[0] }
    ];
    writeCollection("subscribers", initialList);
    return initialList;
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      return;
    }
    const list = readCollection<BusinessSubscriber>("subscribers");
    if (list.length === 0) {
      await BusinessSubscriberDB.resetAll();
    }
  },
  delete: async (id: string): Promise<boolean> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("DELETE FROM subscribers WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const list = readCollection<BusinessSubscriber>("subscribers");
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    writeCollection("subscribers", list);
    return true;
  }
};

// Seed business db if empty
if (typeof window === "undefined") {
  (async () => {
    try {
      await BusinessUserDB.seed();
      await BusinessIngredientDB.seed();
      await BusinessSubscriberDB.seed();
    } catch (err) {
      console.error("Seeding business database failed:", err);
    }
  })();
}

