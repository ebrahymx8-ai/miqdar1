import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { put, head } from "@vercel/blob";

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
              role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'kitchen', 'purchaser', 'delivery', 'cook')),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          try {
            await client.query(`ALTER TABLE business_users DROP CONSTRAINT IF EXISTS business_users_role_check`);
            await client.query(`ALTER TABLE business_users ADD CONSTRAINT business_users_role_check CHECK (role IN ('manager', 'kitchen', 'purchaser', 'delivery', 'cook'))`);
          } catch (e) {
            console.warn("Could not adjust check constraint for business_users role:", e);
          }

          await client.query(`
            CREATE TABLE IF NOT EXISTS meals (
              id VARCHAR(50) PRIMARY KEY,
              lunch TEXT NOT NULL,
              dinner TEXT NOT NULL,
              snacks TEXT NOT NULL,
              date VARCHAR(50) NOT NULL,
              verified_lunch BOOLEAN NOT NULL DEFAULT FALSE,
              verified_dinner BOOLEAN NOT NULL DEFAULT FALSE,
              verified_snacks BOOLEAN NOT NULL DEFAULT FALSE,
              submitted_at VARCHAR(100) NOT NULL
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
              id VARCHAR(50) PRIMARY KEY,
              user_id VARCHAR(50) NOT NULL,
              role VARCHAR(50) NOT NULL,
              subscription TEXT NOT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

          await client.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(50) PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              phone VARCHAR(20) UNIQUE NOT NULL,
              email VARCHAR(100) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
              age INT NOT NULL,
              weight NUMERIC(5,2) NOT NULL,
              height NUMERIC(5,2) NOT NULL,
              activity_level VARCHAR(50) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
              id VARCHAR(50) PRIMARY KEY,
              user_id VARCHAR(50) NOT NULL,
              goal VARCHAR(20) NOT NULL CHECK (goal IN ('bulk', 'cut', 'maintain')),
              menu_type VARCHAR(20) NOT NULL CHECK (menu_type IN ('basic', 'premium')),
              duration_days INT NOT NULL,
              start_date VARCHAR(50) NOT NULL,
              end_date VARCHAR(50) NOT NULL,
              status VARCHAR(20) NOT NULL,
              frozen_days INT NOT NULL,
              max_freeze_days INT NOT NULL,
              target_calories INT NOT NULL,
              price NUMERIC(10,2) NOT NULL,
              delivery_fee NUMERIC(10,2) NOT NULL,
              discount_code VARCHAR(50),
              discount_amount NUMERIC(10,2) NOT NULL,
              total_price NUMERIC(10,2) NOT NULL,
              payment_method VARCHAR(20) NOT NULL,
              payment_status VARCHAR(20) NOT NULL,
              receipt_image_url VARCHAR(255),
              moyasar_payment_id VARCHAR(100),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS discount_codes (
              id VARCHAR(50) PRIMARY KEY,
              code VARCHAR(50) UNIQUE NOT NULL,
              percentage INT NOT NULL,
              is_active BOOLEAN NOT NULL DEFAULT TRUE,
              usage_count INT NOT NULL DEFAULT 0,
              affiliate_phone VARCHAR(20),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
              id VARCHAR(50) PRIMARY KEY,
              user_id VARCHAR(50) NOT NULL,
              subscription_id VARCHAR(50) NOT NULL,
              type VARCHAR(50) NOT NULL,
              channel VARCHAR(20) NOT NULL,
              status VARCHAR(20) NOT NULL,
              message TEXT NOT NULL,
              scheduled_at VARCHAR(50) NOT NULL,
              sent_at VARCHAR(50),
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
            const u5Pin = Buffer.from("5555" + salt).toString("base64");

            await client.query(`
              INSERT INTO business_users (id, name, pin_code, role) VALUES
              ('u1', 'مسؤول المطبخ', $1, 'kitchen'),
              ('u2', 'مندوب المقاضي', $2, 'purchaser'),
              ('u3', 'مندوب التوصيل', $3, 'delivery'),
              ('u4', 'مدير المشروع', $4, 'manager'),
              ('u5', 'طباخ مقدار', $5, 'cook')
            `, [u1Pin, u2Pin, u3Pin, u4Pin, u5Pin]);
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

          const discCount = await client.query("SELECT COUNT(*) FROM discount_codes");
          if (parseInt(discCount.rows[0].count, 10) === 0) {
            await client.query(`
              INSERT INTO discount_codes (id, code, percentage, is_active, usage_count) VALUES
              ('d1', 'MIQDAR5', 5, true, 0),
              ('d2', 'WELCOME10', 10, true, 0)
            `);
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

type Collection = "users" | "subscriptions" | "discountCodes" | "notifications" | "businessUsers" | "ingredients" | "subscribers" | "meals" | "pushSubscriptions";

function getFilePath(collection: Collection): string {
  return path.join(DB_PATH, `${collection}.json`);
}

// Global in-memory storage for Vercel / Serverless read-only filesystems
const globalMemory = (global as any).memoryCollections || {};
if (!(global as any).memoryCollections) {
  (global as any).memoryCollections = globalMemory;
}

async function readCollection<T>(collection: Collection): Promise<T[]> {
  if (!globalMemory[collection]) {
    globalMemory[collection] = [];
  }

  const pathname = `data/${collection}.json`;

  // 1. Try to read from Vercel Blob
  try {
    const metadata = await head(pathname);
    const response = await fetch(metadata.url);
    if (response.ok) {
      const parsed = await response.json() as T[];
      if (Array.isArray(parsed)) {
        // Merge with memory collection to ensure in-memory items are preserved
        const fileIds = new Set(parsed.map((item: any) => item.id).filter(Boolean));
        const combined = [...parsed];
        for (const memItem of globalMemory[collection]) {
          if (memItem && memItem.id && !fileIds.has(memItem.id)) {
            combined.push(memItem);
          }
        }
        globalMemory[collection] = combined;
        return combined;
      }
    }
  } catch (err) {
    // If Blob fails (e.g. not configured locally), fallback to local filesystem
    try {
      const filePath = getFilePath(collection);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as T[];
        if (Array.isArray(parsed)) {
          const fileIds = new Set(parsed.map((item: any) => item.id).filter(Boolean));
          const combined = [...parsed];
          for (const memItem of globalMemory[collection]) {
            if (memItem && memItem.id && !fileIds.has(memItem.id)) {
              combined.push(memItem);
            }
          }
          globalMemory[collection] = combined;
          return combined;
        }
      }
    } catch (fsErr) {
      // Ignore
    }
  }

  return globalMemory[collection];
}

async function writeCollection<T>(collection: Collection, data: T[]): Promise<void> {
  // Always update memory first
  globalMemory[collection] = data;

  const pathname = `data/${collection}.json`;

  // 1. Try to write to Vercel Blob
  try {
    await put(pathname, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    // Fallback to local file system write (catch EROFS silently on Vercel)
    try {
      fs.mkdirSync(DB_PATH, { recursive: true });
      fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), "utf-8");
    } catch (fsErr) {
      // Ignore EROFS
    }
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const UserDB = {
  findAll: async (): Promise<User[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, phone, email, password, gender, age, weight, height, activity_level as \"activityLevel\", created_at as \"createdAt\" FROM users");
      return res.rows;
    }
    return readCollection<User>("users");
  },
  findById: async (id: string): Promise<User | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, phone, email, password, gender, age, weight, height, activity_level as \"activityLevel\", created_at as \"createdAt\" FROM users WHERE id = $1", [id]);
      return res.rows[0];
    }
    return (await readCollection<User>("users")).find((u) => u.id === id);
  },
  findByPhone: async (phone: string): Promise<User | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, phone, email, password, gender, age, weight, height, activity_level as \"activityLevel\", created_at as \"createdAt\" FROM users WHERE phone = $1", [phone]);
      return res.rows[0];
    }
    return (await readCollection<User>("users")).find((u) => u.phone === phone);
  },
  findByEmail: async (email: string): Promise<User | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, phone, email, password, gender, age, weight, height, activity_level as \"activityLevel\", created_at as \"createdAt\" FROM users WHERE email = $1", [email]);
      return res.rows[0];
    }
    return (await readCollection<User>("users")).find((u) => u.email === email);
  },
  create: async (data: Omit<User, "id" | "createdAt">): Promise<User> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      const createdAt = new Date().toISOString();
      await pool.query(
        "INSERT INTO users (id, name, phone, email, password, gender, age, weight, height, activity_level, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [id, data.name, data.phone, data.email, data.password, data.gender, data.age, data.weight, data.height, data.activityLevel, createdAt]
      );
      return { ...data, id, createdAt };
    }
    const users = await readCollection<User>("users");
    const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    users.push(user);
    writeCollection("users", users);
    return user;
  },
  update: async (id: string, data: Partial<User>): Promise<User | null> => {
    if (pool) {
      await ensureDbInitialized();
      const keys = Object.keys(data).filter((k) => (data as any)[k] !== undefined);
      if (keys.length === 0) return UserDB.findById(id).then((u) => u || null);
      
      const dbKeys = keys.map((k) => k === "activityLevel" ? "activity_level" : k);
      const setClause = dbKeys.map((k, idx) => `"${k}" = $${idx + 2}`).join(", ");
      const values = keys.map((k) => (data as any)[k]);
      
      const res = await pool.query(
        `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, name, phone, email, password, gender, age, weight, height, activity_level as "activityLevel", created_at as "createdAt"`,
        [id, ...values]
      );
      return res.rows[0] || null;
    }
    const users = await readCollection<User>("users");
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...data };
    writeCollection("users", users);
    return users[index];
  },
};

export const SubscriptionDB = {
  findAll: async (): Promise<Subscription[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", goal, menu_type as \"menuType\", duration_days as \"durationDays\", start_date as \"startDate\", end_date as \"endDate\", status, frozen_days as \"frozenDays\", max_freeze_days as \"maxFreezeDays\", target_calories as \"targetCalories\", price, delivery_fee as \"deliveryFee\", discount_code as \"discountCode\", discount_amount as \"discountAmount\", total_price as \"totalPrice\", payment_method as \"paymentMethod\", payment_status as \"paymentStatus\", receipt_image_url as \"receiptImageUrl\", moyasar_payment_id as \"moyasarPaymentId\", created_at as \"createdAt\", updated_at as \"updatedAt\" FROM subscriptions");
      return res.rows;
    }
    return readCollection<Subscription>("subscriptions");
  },
  findById: async (id: string): Promise<Subscription | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", goal, menu_type as \"menuType\", duration_days as \"durationDays\", start_date as \"startDate\", end_date as \"endDate\", status, frozen_days as \"frozenDays\", max_freeze_days as \"maxFreezeDays\", target_calories as \"targetCalories\", price, delivery_fee as \"deliveryFee\", discount_code as \"discountCode\", discount_amount as \"discountAmount\", total_price as \"totalPrice\", payment_method as \"paymentMethod\", payment_status as \"paymentStatus\", receipt_image_url as \"receiptImageUrl\", moyasar_payment_id as \"moyasarPaymentId\", created_at as \"createdAt\", updated_at as \"updatedAt\" FROM subscriptions WHERE id = $1", [id]);
      return res.rows[0];
    }
    return (await readCollection<Subscription>("subscriptions")).find((s) => s.id === id);
  },
  findByUserId: async (userId: string): Promise<Subscription[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", goal, menu_type as \"menuType\", duration_days as \"durationDays\", start_date as \"startDate\", end_date as \"endDate\", status, frozen_days as \"frozenDays\", max_freeze_days as \"maxFreezeDays\", target_calories as \"targetCalories\", price, delivery_fee as \"deliveryFee\", discount_code as \"discountCode\", discount_amount as \"discountAmount\", total_price as \"totalPrice\", payment_method as \"paymentMethod\", payment_status as \"paymentStatus\", receipt_image_url as \"receiptImageUrl\", moyasar_payment_id as \"moyasarPaymentId\", created_at as \"createdAt\", updated_at as \"updatedAt\" FROM subscriptions WHERE user_id = $1", [userId]);
      return res.rows;
    }
    return (await readCollection<Subscription>("subscriptions")).filter((s) => s.userId === userId);
  },
  findActive: async (userId: string): Promise<Subscription | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", goal, menu_type as \"menuType\", duration_days as \"durationDays\", start_date as \"startDate\", end_date as \"endDate\", status, frozen_days as \"frozenDays\", max_freeze_days as \"maxFreezeDays\", target_calories as \"targetCalories\", price, delivery_fee as \"deliveryFee\", discount_code as \"discountCode\", discount_amount as \"discountAmount\", total_price as \"totalPrice\", payment_method as \"paymentMethod\", payment_status as \"paymentStatus\", receipt_image_url as \"receiptImageUrl\", moyasar_payment_id as \"moyasarPaymentId\", created_at as \"createdAt\", updated_at as \"updatedAt\" FROM subscriptions WHERE user_id = $1 AND status = 'active'", [userId]);
      return res.rows[0];
    }
    return (await readCollection<Subscription>("subscriptions")).find((s) => s.userId === userId && s.status === "active");
  },
  create: async (data: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Promise<Subscription> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      const createdAt = new Date().toISOString();
      const updatedAt = new Date().toISOString();
      await pool.query(
        `INSERT INTO subscriptions (id, user_id, goal, menu_type, duration_days, start_date, end_date, status, frozen_days, max_freeze_days, target_calories, price, delivery_fee, discount_code, discount_amount, total_price, payment_method, payment_status, receipt_image_url, moyasar_payment_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [id, data.userId, data.goal, data.menuType, data.durationDays, data.startDate, data.endDate, data.status, data.frozenDays, data.maxFreezeDays, data.targetCalories, data.price, data.deliveryFee, data.discountCode || null, data.discountAmount, data.totalPrice, data.paymentMethod, data.paymentStatus, data.receiptImageUrl || null, data.moyasarPaymentId || null, createdAt, updatedAt]
      );
      return { ...data, id, createdAt, updatedAt };
    }
    const subs = await readCollection<Subscription>("subscriptions");
    const sub: Subscription = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    subs.push(sub);
    writeCollection("subscriptions", subs);
    return sub;
  },
  update: async (id: string, data: Partial<Subscription>): Promise<Subscription | null> => {
    if (pool) {
      await ensureDbInitialized();
      const keys = Object.keys(data).filter((k) => (data as any)[k] !== undefined);
      if (keys.length === 0) return SubscriptionDB.findById(id).then((s) => s || null);
      
      const snakeMap: Record<string, string> = {
        userId: "user_id", menuType: "menu_type", durationDays: "duration_days",
        startDate: "start_date", endDate: "end_date", frozenDays: "frozen_days",
        maxFreezeDays: "max_freeze_days", targetCalories: "target_calories",
        deliveryFee: "delivery_fee", discountCode: "discount_code",
        discountAmount: "discount_amount", totalPrice: "total_price",
        paymentMethod: "payment_method", paymentStatus: "payment_status",
        receiptImageUrl: "receipt_image_url", moyasarPaymentId: "moyasar_payment_id"
      };

      const setClause = keys.map((k, idx) => `"${snakeMap[k] || k}" = $${idx + 2}`).join(", ");
      const values = keys.map((k) => (data as any)[k]);
      const updatedAt = new Date().toISOString();

      const res = await pool.query(
        `UPDATE subscriptions SET ${setClause}, updated_at = $${values.length + 2} WHERE id = $1 RETURNING id, user_id as "userId", goal, menu_type as "menuType", duration_days as "durationDays", start_date as "startDate", end_date as "endDate", status, frozen_days as "frozenDays", max_freeze_days as "maxFreezeDays", target_calories as "targetCalories", price, delivery_fee as "deliveryFee", discount_code as "discountCode", discount_amount as "discountAmount", total_price as "totalPrice", payment_method as "paymentMethod", payment_status as "paymentStatus", receipt_image_url as "receiptImageUrl", moyasar_payment_id as "moyasarPaymentId", created_at as "createdAt", updated_at as "updatedAt"`,
        [id, ...values, updatedAt]
      );
      return res.rows[0] || null;
    }
    const subs = await readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return null;
    subs[index] = { ...subs[index], ...data, updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return subs[index];
  },
  freeze: async (id: string) => {
    if (pool) {
      await ensureDbInitialized();
      const sub = await SubscriptionDB.findById(id);
      if (!sub) return { success: false, message: "الاشتراك غير موجود" };
      if (sub.status !== "active") return { success: false, message: "الاشتراك غير نشط" };
      if (sub.frozenDays >= sub.maxFreezeDays) return { success: false, message: `استنفدت أيام التجميد (${sub.maxFreezeDays} أيام)` };
      
      await SubscriptionDB.update(id, { status: "frozen" });
      return { success: true, message: "تم تجميد الاشتراك بنجاح" };
    }
    const subs = await readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, message: "الاشتراك غير موجود" };
    if (subs[index].status !== "active") return { success: false, message: "الاشتراك غير نشط" };
    if (subs[index].frozenDays >= subs[index].maxFreezeDays) return { success: false, message: `استنفدت أيام التجميد (${subs[index].maxFreezeDays} أيام)` };
    subs[index] = { ...subs[index], status: "frozen", updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return { success: true, message: "تم تجميد الاشتراك بنجاح" };
  },
  unfreeze: async (id: string) => {
    if (pool) {
      await ensureDbInitialized();
      const sub = await SubscriptionDB.findById(id);
      if (!sub) return { success: false, message: "الاشتراك غير موجود" };
      if (sub.status !== "frozen") return { success: false, message: "الاشتراك ليس مجمداً" };
      
      await SubscriptionDB.update(id, { status: "active", frozenDays: sub.frozenDays + 1 });
      return { success: true, message: "تم استئناف الاشتراك بنجاح" };
    }
    const subs = await readCollection<Subscription>("subscriptions");
    const index = subs.findIndex((s) => s.id === id);
    if (index === -1) return { success: false, message: "الاشتراك غير موجود" };
    if (subs[index].status !== "frozen") return { success: false, message: "الاشتراك ليس مجمداً" };
    subs[index] = { ...subs[index], status: "active", frozenDays: subs[index].frozenDays + 1, updatedAt: new Date().toISOString() };
    writeCollection("subscriptions", subs);
    return { success: true, message: "تم استئناف الاشتراك بنجاح" };
  },
};

export const DiscountDB = {
  findByCode: async (code: string): Promise<DiscountCode | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, code, percentage, is_active as \"isActive\", usage_count as \"usageCount\", affiliate_phone as \"affiliatePhone\", created_at as \"createdAt\" FROM discount_codes WHERE UPPER(code) = $1 AND is_active = true", [code.toUpperCase()]);
      return res.rows[0];
    }
    return (await readCollection<DiscountCode>("discountCodes")).find((d) => d.code.toUpperCase() === code.toUpperCase() && d.isActive);
  },
  validate: async (code: string): Promise<{ valid: boolean; percentage: number; message: string }> => {
    const d = await DiscountDB.findByCode(code);
    if (!d) return { valid: false, percentage: 0, message: "كود الخصم غير صالح أو منتهي" };
    return { valid: true, percentage: d.percentage, message: `✅ تم تطبيق خصم ${d.percentage}%` };
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT COUNT(*) FROM discount_codes");
      if (parseInt(res.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO discount_codes (id, code, percentage, is_active, usage_count, created_at) VALUES
          ($1, 'MIQDAR5', 5, true, 0, $3),
          ($2, 'WELCOME10', 10, true, 0, $3)
        `, [generateId(), generateId(), new Date().toISOString()]);
      }
      return;
    }
    const existing = await readCollection<DiscountCode>("discountCodes");
    if (existing.length === 0) {
      writeCollection("discountCodes", [
        { id: generateId(), code: "MIQDAR5", percentage: 5, isActive: true, usageCount: 0, createdAt: new Date().toISOString() },
        { id: generateId(), code: "WELCOME10", percentage: 10, isActive: true, usageCount: 0, createdAt: new Date().toISOString() },
      ]);
    }
  },
};

export const NotificationDB = {
  create: async (data: Omit<Notification, "id" | "createdAt">): Promise<Notification> => {
    if (pool) {
      await ensureDbInitialized();
      const id = generateId();
      const createdAt = new Date().toISOString();
      await pool.query(
        `INSERT INTO notifications (id, user_id, subscription_id, type, channel, status, message, scheduled_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, data.userId, data.subscriptionId, data.type, data.channel, data.status, data.message, data.scheduledAt, createdAt]
      );
      return { ...data, id, createdAt };
    }
    const notifs = await readCollection<Notification>("notifications");
    const notif: Notification = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    notifs.push(notif);
    writeCollection("notifications", notifs);
    return notif;
  },
  findPending: async (): Promise<Notification[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", subscription_id as \"subscriptionId\", type, channel, status, message, scheduled_at as \"scheduledAt\", sent_at as \"sentAt\", created_at as \"createdAt\" FROM notifications WHERE status = 'pending'");
      return res.rows;
    }
    return (await readCollection<Notification>("notifications")).filter((n) => n.status === "pending");
  },
  markSent: async (id: string): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      const sentAt = new Date().toISOString();
      await pool.query("UPDATE notifications SET status = 'sent', sent_at = $2 WHERE id = $1", [id, sentAt]);
      return;
    }
    const notifs = await readCollection<Notification>("notifications");
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
  role: "manager" | "kitchen" | "purchaser" | "delivery" | "cook";
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
    return (await readCollection<BusinessUser>("businessUsers")).find((u) => u.id === id);
  },
  findByRole: async (role: string): Promise<BusinessUser[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users WHERE role = $1", [role]);
      return res.rows;
    }
    return (await readCollection<BusinessUser>("businessUsers")).filter((u) => u.role === role);
  },
  findByPinCode: async (pinCode: string): Promise<BusinessUser | undefined> => {
    const hashed = Buffer.from(pinCode + "_miqdar_salt").toString("base64");
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, name, pin_code as \"pinCode\", role, created_at as \"createdAt\" FROM business_users WHERE pin_code = $1", [hashed]);
      return res.rows[0];
    }
    return (await readCollection<BusinessUser>("businessUsers")).find((u) => u.pinCode === hashed);
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
    const list = await readCollection<BusinessUser>("businessUsers");
    const user: BusinessUser = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    list.push(user);
    await writeCollection("businessUsers", list);
    return user;
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      return;
    }
    const list = await readCollection<BusinessUser>("businessUsers");
    if (list.length === 0) {
      await writeCollection("businessUsers", [
        { id: "u1", name: "مسؤول المطبخ", pinCode: Buffer.from("1111" + "_miqdar_salt").toString("base64"), role: "kitchen", createdAt: new Date().toISOString() },
        { id: "u2", name: "مندوب المقاضي", pinCode: Buffer.from("2222" + "_miqdar_salt").toString("base64"), role: "purchaser", createdAt: new Date().toISOString() },
        { id: "u3", name: "مندوب التوصيل", pinCode: Buffer.from("3333" + "_miqdar_salt").toString("base64"), role: "delivery", createdAt: new Date().toISOString() },
        { id: "u4", name: "مدير المشروع", pinCode: Buffer.from("4444" + "_miqdar_salt").toString("base64"), role: "manager", createdAt: new Date().toISOString() },
        { id: "u5", name: "طباخ مقدار", pinCode: Buffer.from("5555" + "_miqdar_salt").toString("base64"), role: "cook", createdAt: new Date().toISOString() },
      ]);
    }
  },
  updatePinCode: async (role: "kitchen" | "purchaser" | "delivery" | "cook", newPinCode: string): Promise<boolean> => {
    const hashed = Buffer.from(newPinCode + "_miqdar_salt").toString("base64");
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query(
        "UPDATE business_users SET pin_code = $1 WHERE role = $2",
        [hashed, role]
      );
      return (res.rowCount ?? 0) > 0;
    }
    const list = await readCollection<BusinessUser>("businessUsers");
    const index = list.findIndex((u) => u.role === role);
    if (index === -1) return false;
    list[index] = { ...list[index], pinCode: hashed };
    await writeCollection("businessUsers", list);
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
    return (await readCollection<BusinessIngredient>("ingredients")).find((i) => i.id === id);
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
    const list = await readCollection<BusinessIngredient>("ingredients");
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
    const list = await readCollection<BusinessIngredient>("ingredients");
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
    const list = await readCollection<BusinessIngredient>("ingredients");
    const updated = list.map((item) => ({ ...item, status: "فل" as const }));
    writeCollection("ingredients", updated);
    return updated;
  },
  seed: async (): Promise<void> => {
    if (pool) {
      await ensureDbInitialized();
      return;
    }
    const list = await readCollection<BusinessIngredient>("ingredients");
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
    return (await readCollection<BusinessSubscriber>("subscribers")).find((s) => s.id === id);
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
    const list = await readCollection<BusinessSubscriber>("subscribers");
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
    const list = await readCollection<BusinessSubscriber>("subscribers");
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
    const list = await readCollection<BusinessSubscriber>("subscribers");
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
    const list = await readCollection<BusinessSubscriber>("subscribers");
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    await writeCollection("subscribers", list);
    return true;
  }
};

export interface BusinessMealSubmission {
  id: string;
  lunch: string;
  dinner: string;
  snacks: string;
  date: string; // e.g. "2026-06-04"
  verifiedLunch: boolean;
  verifiedDinner: boolean;
  verifiedSnacks: boolean;
  submittedAt: string;
}

export const BusinessMealsDB = {
  findLatest: async (): Promise<BusinessMealSubmission | undefined> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, lunch, dinner, snacks, date, verified_lunch as \"verifiedLunch\", verified_dinner as \"verifiedDinner\", verified_snacks as \"verifiedSnacks\", submitted_at as \"submittedAt\" FROM meals ORDER BY submitted_at DESC LIMIT 1");
      return res.rows[0];
    }
    const list = await readCollection<BusinessMealSubmission>("meals");
    if (list.length === 0) return undefined;
    return list[list.length - 1];
  },
  create: async (data: Omit<BusinessMealSubmission, "id" | "verifiedLunch" | "verifiedDinner" | "verifiedSnacks" | "submittedAt">): Promise<BusinessMealSubmission> => {
    const submittedAt = new Date().toISOString();
    const id = generateId();
    const item: BusinessMealSubmission = {
      ...data,
      id,
      verifiedLunch: false,
      verifiedDinner: false,
      verifiedSnacks: false,
      submittedAt,
    };
    if (pool) {
      await ensureDbInitialized();
      await pool.query(
        "INSERT INTO meals (id, lunch, dinner, snacks, date, verified_lunch, verified_dinner, verified_snacks, submitted_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [id, item.lunch, item.dinner, item.snacks, item.date, item.verifiedLunch, item.verifiedDinner, item.verifiedSnacks, item.submittedAt]
      );
      return item;
    }
    const list = await readCollection<BusinessMealSubmission>("meals");
    list.push(item);
    await writeCollection("meals", list);
    return item;
  },
  updateVerification: async (id: string, verifiedLunch: boolean, verifiedDinner: boolean, verifiedSnacks: boolean): Promise<BusinessMealSubmission | null> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query(
        "UPDATE meals SET verified_lunch = $1, verified_dinner = $2, verified_snacks = $3 WHERE id = $4 RETURNING id, lunch, dinner, snacks, date, verified_lunch as \"verifiedLunch\", verified_dinner as \"verifiedDinner\", verified_snacks as \"verifiedSnacks\", submitted_at as \"submittedAt\"",
        [verifiedLunch, verifiedDinner, verifiedSnacks, id]
      );
      return res.rows[0] || null;
    }
    const list = await readCollection<BusinessMealSubmission>("meals");
    const index = list.findIndex((m) => m.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], verifiedLunch, verifiedDinner, verifiedSnacks };
    await writeCollection("meals", list);
    return list[index];
  }
};

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  role: string;
  subscription: string; // serialized JSON
  updatedAt: string;
}

export const PushSubscriptionDB = {
  save: async (userId: string, role: string, subscriptionStr: string): Promise<PushSubscriptionRecord> => {
    const id = userId;
    const updatedAt = new Date().toISOString();
    const record: PushSubscriptionRecord = {
      id,
      userId,
      role,
      subscription: subscriptionStr,
      updatedAt,
    };
    if (pool) {
      await ensureDbInitialized();
      await pool.query(
        `INSERT INTO push_subscriptions (id, user_id, role, subscription, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, subscription = EXCLUDED.subscription, updated_at = EXCLUDED.updated_at`,
        [id, userId, role, subscriptionStr, new Date()]
      );
      return record;
    }
    const list = await readCollection<PushSubscriptionRecord>("pushSubscriptions");
    const idx = list.findIndex(r => r.id === id);
    if (idx > -1) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    await writeCollection("pushSubscriptions", list);
    return record;
  },
  findByRole: async (role: string): Promise<PushSubscriptionRecord[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", role, subscription, updated_at as \"updatedAt\" FROM push_subscriptions WHERE role = $1", [role]);
      return res.rows;
    }
    return (await readCollection<PushSubscriptionRecord>("pushSubscriptions")).filter(r => r.role === role);
  },
  findAll: async (): Promise<PushSubscriptionRecord[]> => {
    if (pool) {
      await ensureDbInitialized();
      const res = await pool.query("SELECT id, user_id as \"userId\", role, subscription, updated_at as \"updatedAt\" FROM push_subscriptions");
      return res.rows;
    }
    return readCollection<PushSubscriptionRecord>("pushSubscriptions");
  }
};


// Seed business db if empty
if (typeof window === "undefined") {
  (async () => {
    try {
      await BusinessUserDB.seed();
      await BusinessIngredientDB.seed();
      await BusinessSubscriberDB.seed();
      await DiscountDB.seed();
    } catch (err) {
      console.error("Seeding business database failed:", err);
    }
  })();
}

