// ============================================================
// مقدار - ثوابت الأسعار (client-safe - لا يستخدم fs)
// ============================================================

export const PRICING = {
  basic:  { price26: 999,  price30: 1199, label: "الباقة الأساسية",  meals: "وجبتان + سناك" },
  premium:{ price26: 1499, price30: 1699, label: "الباقة المميزة",   meals: "وجبتان + سناك (مكونات فاخرة)" },
  deliveryFee: 99,
  freezeDays: { 26: 3, 30: 5 } as Record<number, number>,
} as const;

export type MenuType = "basic" | "premium";
export type Duration = 26 | 30;

export function calculatePrice(
  menuType: MenuType,
  durationDays: Duration,
  discountPct = 0
) {
  const base =
    durationDays === 26
      ? PRICING[menuType].price26
      : PRICING[menuType].price30;
  const delivery = PRICING.deliveryFee;
  const discount = Math.round((base * discountPct) / 100);
  return { basePrice: base, deliveryFee: delivery, discount, total: base + delivery - discount };
}
