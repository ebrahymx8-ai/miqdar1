"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MIQDAR_MENU } from "@/lib/menu";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  status: "فل" | "ناقص";
  lastUpdated: string;
}

interface Order {
  id: string;
  customerName: string;
  region: string;
  packageType: string;
  status: "قيد التوصيل" | "تم التوصيل";
  details: string;
}

interface ActivityLog {
  id: string;
  time: string;
  text: string;
  type: "kitchen" | "purchaser" | "delivery" | "system";
}

export default function MiqdarBusinessPage() {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Mobile menu sidebar drawer open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("miqdar_business_authenticated") === "true";
    }
    return false;
  });
  const [pinCode, setPinCode] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<"manager" | "kitchen" | "purchaser" | "delivery" | "cook" | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("miqdar_business_role") as any;
    }
    return null;
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Dashboard Role State: 'manager' | 'kitchen' | 'purchaser' | 'delivery' | 'cook'
  const [activeRole, setActiveRole] = useState<"manager" | "kitchen" | "purchaser" | "delivery" | "cook">((() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("miqdar_business_role");
      if (storedRole) return storedRole as any;
    }
    return "manager";
  })());

  // Kitchen Category filter
  const [selectedKitchenCategory, setSelectedKitchenCategory] = useState<string>("الكل");

  // Ingredients State
  // Ingredients State (loaded dynamically from database)
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Orders State (loaded dynamically from database subscribers)
  const [orders, setOrders] = useState<Order[]>([]);

  // Loading indicator for database connection/updates
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form State for creating new subscribers
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newRegion, setNewRegion] = useState<string>("العزيزية");
  const [newPackageType, setNewPackageType] = useState<string>("");
  const [newDetails, setNewDetails] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  // Form State for creating new ingredients
  const [newIngredientName, setNewIngredientName] = useState<string>("");
  const [newIngredientCategory, setNewIngredientCategory] = useState<string>("البروتين");
  const [ingredientFormError, setIngredientFormError] = useState<string | null>(null);

  // Form State for managing member passwords
  const [updatePasswordRole, setUpdatePasswordRole] = useState<"kitchen" | "purchaser" | "delivery" | "cook">("kitchen");
  const [newMemberPin, setNewMemberPin] = useState<string>("");
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);

  // Cook Form & Meals State
  const [cookLunch, setCookLunch] = useState<string>("");
  const [cookDinner, setCookDinner] = useState<string>("");
  const [cookSnacks, setCookSnacks] = useState<string>("");
  const [cookDate, setCookDate] = useState<string>("");
  const [latestMeals, setLatestMeals] = useState<any | null>(null);
  const [mealsError, setMealsError] = useState<string | null>(null);

  // Activity Log State
  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: "1", time: "09:00 ص", text: "تم تشغيل نظام إدارة مقدار أعمال بنجاح.", type: "system" },
    { id: "2", time: "09:05 ص", text: "تحديث قائمة المكونات الأساسية في المطبخ.", type: "kitchen" },
  ]);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Sync theme and set default cook date to tomorrow
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCookDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  // Synchronize cook state with fetched meals for the selected date
  useEffect(() => {
    if (latestMeals && latestMeals.date === cookDate) {
      setCookLunch(latestMeals.lunch || "");
      setCookDinner(latestMeals.dinner || "");
      setCookSnacks(latestMeals.snacks || "");
    } else {
      setCookLunch("");
      setCookDinner("");
      setCookSnacks("");
    }
  }, [latestMeals, cookDate]);

  // Fetch all business database records
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch ingredients
      const ingResponse = await fetch("/api/business/ingredients");
      const ingData = await ingResponse.json();
      if (ingResponse.ok && ingData.ingredients) {
        setIngredients(ingData.ingredients);
      }

      // 2. Fetch subscribers
      const subResponse = await fetch("/api/business/subscribers");
      const subData = await subResponse.json();
      if (subResponse.ok && subData.subscribers) {
        const mappedOrders = subData.subscribers.map((s: any) => ({
          id: s.id,
          customerName: s.name,
          region: s.neighborhood,
          packageType: s.packageType,
          status: s.deliveryStatus,
          details: s.details,
        }));
        setOrders(mappedOrders);
      }

      // 3. Fetch latest meals
      const mealsResponse = await fetch("/api/business/meals");
      const mealsData = await mealsResponse.json();
      if (mealsResponse.ok && mealsData.meals) {
        setLatestMeals(mealsData.meals);
      } else {
        setLatestMeals(null);
      }

      // 4. Fetch team members if manager
      const storedRole = typeof window !== "undefined" ? localStorage.getItem("miqdar_business_role") : null;
      const currentRole = currentUserRole || storedRole;
      if (currentRole === "manager") {
        const teamResponse = await fetch("/api/business/login?all=true");
        const teamData = await teamResponse.json();
        if (teamResponse.ok && teamData.team) {
          setTeamMembers(teamData.team);
        }
      }
    } catch (error) {
      console.error("Error fetching database data:", error);
      showToast("❌ خطأ في تحميل البيانات من قاعدة البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      await fetch("/api/business/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
    } catch (err) {
      console.error("Error sending push subscription to server:", err);
    }
  };

  const setupPushNotifications = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Service workers or Push notifications are not supported in this browser.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered with scope:", registration.scope);

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsPushSubscribed(true);
        await sendSubscriptionToServer(existingSubscription);
        return;
      }

      if (Notification.permission === "denied") {
        showToast("⚠️ تم رفض صلاحية التنبيهات مسبقاً. يرجى تفعيلها من إعدادات المتصفح.");
        return;
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          showToast("⚠️ لم يتم منح صلاحية التنبيهات.");
          return;
        }
      }

      const vapidPublicKey = "BIubJL8mQ-j95iJHeEu8tZIgVNptB3Y48I4H1NS5AnCLCGhi-WABYbdBIPil2IfY3rqvhszs-Z08HpG3H6jZ8Yc";
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      setIsPushSubscribed(true);
      await sendSubscriptionToServer(subscription);
      showToast("🔔 تم تفعيل التنبيهات بنجاح!");
    } catch (err) {
      console.error("Error setting up Web Push:", err);
      setPushError(String(err));
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Setup push notifications automatically when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  // Check active business session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/business/login");
        const data = await res.json();
        if (res.ok && data.authenticated && data.user) {
          localStorage.setItem("miqdar_business_authenticated", "true");
          localStorage.setItem("miqdar_business_role", data.user.role);
          setIsAuthenticated(true);
          setCurrentUserRole(data.user.role);
          setActiveRole(data.user.role);
          showToast(`🔑 تم استعادة الجلسة: مرحباً ${data.user.name}`);
        } else {
          localStorage.removeItem("miqdar_business_authenticated");
          localStorage.removeItem("miqdar_business_role");
          setIsAuthenticated(false);
          setCurrentUserRole(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Reload data whenever session status becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, currentUserRole]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("miqdar-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/business/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinCode }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("miqdar_business_authenticated", "true");
        localStorage.setItem("miqdar_business_role", data.user.role);
        setIsAuthenticated(true);
        setCurrentUserRole(data.user.role);
        setActiveRole(data.user.role);
        setPinCode("");
        showToast(`🔑 مرحباً بك! تم تسجيل الدخول بصلاحية ${data.user.name}`);
      } else {
        setLoginError(data.error || "رقم الدخول غير صحيح! يرجى المحاولة مرة أخرى.");
        showToast("❌ رقم الدخول غير صحيح");
      }
    } catch (error) {
      setLoginError("خطأ في الاتصال بالخادم!");
      showToast("❌ خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/business/login", { method: "DELETE" });
      localStorage.removeItem("miqdar_business_authenticated");
      localStorage.removeItem("miqdar_business_role");
      setIsAuthenticated(false);
      setCurrentUserRole(null);
      setActiveRole("manager");
      setPinCode("");
      setLoginError(null);
      setIngredients([]);
      setOrders([]);
      setIsMobileMenuOpen(false);
      showToast("🔓 تم تسجيل الخروج بنجاح");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("❌ فشل تسجيل الخروج بشكل آمن");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  // Kitchen Actions: Report shortage in database
  const reportShortage = async (id: string, name: string) => {
    try {
      const response = await fetch("/api/business/ingredients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ناقص", lastUpdated: getCurrentTime() }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIngredients((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "ناقص", lastUpdated: getCurrentTime() } : item))
        );
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `المطبخ: تسجيل نقص في مكون (${name}) من قبل مسؤول الطهاة.`,
          type: "kitchen",
        };
        setLogs((prev) => [newLog, ...prev]);
        showToast(`⚠️ تم تسجيل نقص في: ${name}`);
      } else {
        showToast(`❌ فشل تحديث البيانات: ${data.error}`);
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
    }
  };

  // Purchaser Actions: Purchase shortage item and update database
  const purchaseItem = async (id: string, name: string) => {
    try {
      const response = await fetch("/api/business/ingredients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "فل", lastUpdated: getCurrentTime() }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIngredients((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "فل", lastUpdated: getCurrentTime() } : item))
        );
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `المقاضي: تم شراء وتوصيل المكون (${name}) من قبل مندوب المشتريات.`,
          type: "purchaser",
        };
        setLogs((prev) => [newLog, ...prev]);
        showToast(`✅ تم توفير وتوصيل المطبخ: ${name}`);
      } else {
        showToast(`❌ فشل تحديث البيانات: ${data.error}`);
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
    }
  };

  // Delivery Actions: Update subscriber delivery status in database
  const toggleDeliveryStatus = async (id: string, customerName: string, isDelivered: boolean) => {
    const status = isDelivered ? "تم التوصيل" : "قيد التوصيل";
    try {
      const response = await fetch("/api/business/subscribers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deliveryStatus: status }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? { ...order, status } : order))
        );
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `التوصيل: تم تعديل حالة طلب العميل (${customerName}) إلى (${status}).`,
          type: "delivery",
        };
        setLogs((prev) => [newLog, ...prev]);
        showToast(isDelivered ? `🚚 تم توصيل طلب: ${customerName}` : `⏳ تم إعادة الطلب لـ قيد التوصيل`);
      } else {
        showToast(`❌ فشل تحديث حالة الطلب: ${data.error}`);
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
    }
  };

  // Form submission handler for new subscribers (Database Integration)
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!newCustomerName.trim()) {
      setFormError("يرجى إدخال اسم المشترك.");
      return;
    }
    if (!newRegion) {
      setFormError("يرجى اختيار الحي.");
      return;
    }
    if (!newPackageType.trim()) {
      setFormError("يرجى إدخال نوع الباقة/الاشتراك.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/business/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          neighborhood: newRegion,
          packageType: newPackageType.trim(),
          details: newDetails.trim(),
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const newOrder: Order = {
          id: data.subscriber.id,
          customerName: data.subscriber.name,
          region: data.subscriber.neighborhood,
          packageType: data.subscriber.packageType,
          status: data.subscriber.deliveryStatus,
          details: data.subscriber.details,
        };

        setOrders((prev) => [...prev, newOrder]);

        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `مدير المشروع: تم إضافة مشترك جديد (${newCustomerName.trim()}) في حي (${newRegion}) بباقة (${newPackageType.trim()}).`,
          type: "system",
        };
        setLogs((prev) => [newLog, ...prev]);

        setNewCustomerName("");
        setNewPackageType("");
        setNewDetails("");
        setFormError(null);
        showToast(`👤 تم إضافة المشترك ${newCustomerName.trim()} بنجاح!`);
      } else {
        setFormError(data.error || "فشل إضافة المشترك بقاعدة البيانات");
        showToast("❌ فشل في إضافة المشترك");
      }
    } catch {
      setFormError("خطأ في الاتصال بالخادم");
      showToast("❌ خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission handler for new kitchen ingredients (Database Integration)
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngredientFormError(null);

    // Validation
    if (!newIngredientName.trim()) {
      setIngredientFormError("يرجى إدخال اسم المادة.");
      return;
    }
    if (!newIngredientCategory) {
      setIngredientFormError("يرجى اختيار التصنيف.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/business/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newIngredientName.trim(),
          category: newIngredientCategory,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIngredients((prev) => [...prev, data.ingredient]);

        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `مدير المشروع: تم إضافة مادة جديدة للمطبخ (${newIngredientName.trim()}) تحت تصنيف (${newIngredientCategory}).`,
          type: "system",
        };
        setLogs((prev) => [newLog, ...prev]);

        setNewIngredientName("");
        setIngredientFormError(null);
        showToast(`🥦 تم إضافة ${newIngredientName.trim()} إلى قائمة المطبخ!`);
      } else {
        setIngredientFormError(data.error || "فشل إضافة المادة بقاعدة البيانات");
        showToast("❌ فشل إضافة المادة");
      }
    } catch {
      setIngredientFormError("خطأ في الاتصال بالخادم");
      showToast("❌ خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  // Password updating handler (Database Integration)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFormError(null);

    // Validation
    if (!newMemberPin.trim() || newMemberPin.length !== 4) {
      setPasswordFormError("يرجى إدخال رمز سري مكون من 4 أرقام.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/business/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: updatePasswordRole,
          newPinCode: newMemberPin.trim(),
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setNewMemberPin("");
        setPasswordFormError(null);
        
        let roleNameAr = "";
        if (updatePasswordRole === "kitchen") roleNameAr = "مسؤول المطبخ";
        else if (updatePasswordRole === "purchaser") roleNameAr = "مندوب المقاضي";
        else if (updatePasswordRole === "delivery") roleNameAr = "مندوب التوصيل";
        else if (updatePasswordRole === "cook") roleNameAr = "طباخ مقدار";

        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `مدير المشروع: تم تحديث الرمز السري لـ (${roleNameAr}) بنجاح بقاعدة البيانات.`,
          type: "system",
        };
        setLogs((prev) => [newLog, ...prev]);
        showToast(`🔐 تم تحديث الرمز السري لـ ${roleNameAr} بنجاح!`);
        fetchDashboardData();
      } else {
        setPasswordFormError(data.error || "فشل تحديث الرمز السري بقاعدة البيانات");
        showToast("❌ فشل تحديث الرمز السري");
      }
    } catch {
      setPasswordFormError("خطأ في الاتصال بالخادم");
      showToast("❌ خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete subscriber handler (Database Integration)
  const handleDeleteSubscriber = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المشترك (${name})؟`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/business/subscribers?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setOrders((prev) => prev.filter((order) => order.id !== id));
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `مدير المشروع: تم حذف المشترك (${name}) من قاعدة البيانات.`,
          type: "system",
        };
        setLogs((prev) => [newLog, ...prev]);
        showToast(`🗑️ تم حذف المشترك ${name} بنجاح!`);
      } else {
        showToast(`❌ فشل حذف المشترك: ${data.error}`);
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  // Cook Actions: Submit tomorrow's meals
  const handleSubmitMeals = async (e: React.FormEvent) => {
    e.preventDefault();
    setMealsError(null);
    if (!cookLunch.trim() || !cookDinner.trim() || !cookSnacks.trim() || !cookDate) {
      setMealsError("يرجى تعبئة جميع خانات الوجبات والتاريخ.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/business/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lunch: cookLunch.trim(),
          dinner: cookDinner.trim(),
          snacks: cookSnacks.trim(),
          date: cookDate,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setLatestMeals(data.meals);
        setCookLunch(MIQDAR_MENU.lunch[0]?.name || "");
        setCookDinner(MIQDAR_MENU.dinner[0]?.name || "");
        setCookSnacks("");
        showToast("🍳 تم تقديم وجبات الغد بنجاح وإرسالها للمشرف!");
        
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `الطباخ: تم تقديم قائمة وجبات الغد لتاريخ (${cookDate}).`,
          type: "kitchen",
        };
        setLogs((prev) => [newLog, ...prev]);
      } else {
        setMealsError(data.error || "فشل إرسال الوجبات");
        showToast("❌ فشل تقديم الوجبات");
      }
    } catch {
      setMealsError("خطأ في الاتصال بالخادم");
      showToast("❌ خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  // Cook Actions: Clear a specific meal selection (delete/nullify)
  const handleClearMeal = async (type: "lunch" | "dinner") => {
    if (type === "lunch") {
      setCookLunch("");
    } else {
      setCookDinner("");
    }

    if (latestMeals && latestMeals.date === cookDate) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/business/meals?type=${type}&date=${cookDate}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setLatestMeals(data.meals);
          showToast(`🗑️ تم حذف وجبة ${type === "lunch" ? "الغداء" : "العشاء"} بنجاح`);
          
          const newLog: ActivityLog = {
            id: Date.now().toString(),
            time: getCurrentTime(),
            text: `الطباخ: تم حذف وجبة ${type === "lunch" ? "الغداء" : "العشاء"} لتاريخ (${cookDate}).`,
            type: "kitchen",
          };
          setLogs((prev) => [newLog, ...prev]);
        } else {
          showToast("❌ فشل حذف الوجبة من قاعدة البيانات");
        }
      } catch {
        showToast("❌ خطأ في الاتصال بالخادم");
      } finally {
        setIsLoading(false);
      }
    } else {
      showToast("🧹 تم إفراغ الاختيار");
    }
  };

  // Kitchen Supervisor Actions: Verify individual meal ingredient availability
  const handleVerifyIngredient = async (ingredient: string, checked: boolean) => {
    if (!latestMeals) return;

    const updatedVerifiedIngredients = {
      ...(latestMeals.verifiedIngredients || {}),
      [ingredient]: checked,
    };

    // Calculate new overall verified statuses
    const lunchIngs = latestMeals.lunchIngredients || [];
    const dinnerIngs = latestMeals.dinnerIngredients || [];

    const newVerifiedLunch = lunchIngs.length > 0
      ? lunchIngs.every((ing: string) => !!updatedVerifiedIngredients[ing])
      : latestMeals.verifiedLunch;

    const newVerifiedDinner = dinnerIngs.length > 0
      ? dinnerIngs.every((ing: string) => !!updatedVerifiedIngredients[ing])
      : latestMeals.verifiedDinner;

    const updatedMeals = {
      ...latestMeals,
      verifiedLunch: newVerifiedLunch,
      verifiedDinner: newVerifiedDinner,
      verifiedIngredients: updatedVerifiedIngredients,
    };

    setLatestMeals(updatedMeals);

    try {
      const response = await fetch("/api/business/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: latestMeals.id,
          verifiedLunch: newVerifiedLunch,
          verifiedDinner: newVerifiedDinner,
          verifiedSnacks: latestMeals.verifiedSnacks,
          verifiedIngredients: updatedVerifiedIngredients,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLatestMeals(data.meals);
        showToast("✓ تم تحديث حالة التحقق للمكون");
        
        const statusAr = checked ? "متوفر" : "غير متوفر";
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `المطبخ: تحديث حالة توافر المكون (${ingredient}) إلى (${statusAr}).`,
          type: "kitchen",
        };
        setLogs((prev) => [newLog, ...prev]);
      } else {
        showToast(`❌ فشل تحديث المكون: ${data.error}`);
        setLatestMeals(latestMeals); // Revert
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
      setLatestMeals(latestMeals); // Revert
    }
  };

  // Kitchen Supervisor Actions: Verify meal item availability (used for snacks)
  const handleVerifyMealItem = async (mealType: "lunch" | "dinner" | "snacks", checked: boolean) => {
    if (!latestMeals) return;

    // optimistic update
    const updatedMeals = { ...latestMeals };
    if (mealType === "lunch") updatedMeals.verifiedLunch = checked;
    if (mealType === "dinner") updatedMeals.verifiedDinner = checked;
    if (mealType === "snacks") updatedMeals.verifiedSnacks = checked;

    setLatestMeals(updatedMeals);

    try {
      const response = await fetch("/api/business/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: latestMeals.id,
          verifiedLunch: updatedMeals.verifiedLunch,
          verifiedDinner: updatedMeals.verifiedDinner,
          verifiedSnacks: updatedMeals.verifiedSnacks,
          verifiedIngredients: latestMeals.verifiedIngredients, // pass along existing
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setLatestMeals(data.meals);
        showToast("✓ تم تحديث حالة التحقق من الوجبة");
        
        const typeAr = mealType === "lunch" ? "الغداء" : mealType === "dinner" ? "العشاء" : "السناك";
        const statusAr = checked ? "متوفر" : "غير متوفر";
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          time: getCurrentTime(),
          text: `المطبخ: تحديث حالة توافر وجبة ${typeAr} إلى (${statusAr}).`,
          type: "kitchen",
        };
        setLogs((prev) => [newLog, ...prev]);
      } else {
        showToast(`❌ فشل تحديث حالة التحقق: ${data.error}`);
        // revert
        setLatestMeals(latestMeals);
      }
    } catch {
      showToast("❌ خطأ في الاتصال بالخادم");
      setLatestMeals(latestMeals);
    }
  };

  // Calculate live stats for PM view
  const activeShortages = ingredients.filter((item) => item.status === "ناقص").length;
  const totalDeliveries = orders.length;
  const completedDeliveries = orders.filter((order) => order.status === "تم التوصيل").length;
  const deliveryProgressPercent = Math.round((completedDeliveries / totalDeliveries) * 100) || 0;

  // Group deliveries by Makkah regions
  const regions = Array.from(new Set(orders.map((o) => o.region)));

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen font-arabic flex items-center justify-center bg-[#F7F6EC] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-4 transition-colors duration-300 relative"
        dir="rtl"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/15 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#76C139]/30 border-t-[#0B532B] dark:border-t-[#76C139] rounded-full animate-spin" />
              <p className="text-sm font-bold text-[#0B532B] dark:text-[#76C139] animate-pulse-soft">
                جاري معالجة البيانات والاتصال بقاعدة البيانات...
              </p>
            </div>
          </div>
        )}
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-[#76C139]/10 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#0B532B] p-8 text-center text-white relative">
            <div className="absolute top-4 left-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-[#76C139] cursor-pointer"
                aria-label="تبديل المظهر"
              >
                {theme === "light" ? (
                  <svg className="w-4 h-4 text-[#76C139]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#E7792B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="relative w-20 h-20 rounded-2xl bg-[#F7F6EC] p-2 flex items-center justify-center mx-auto shadow-md mb-4">
              <Image
                src="/logo.jpg"
                alt="شعار مقدار"
                width={70}
                height={70}
                className="object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-black">بوابة أعمال مقدار</h1>
            <p className="text-xs text-white/75 mt-1 font-bold">نظام الإدارة الداخلية للوجبات الصحية</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-zinc-700 dark:text-zinc-300">
                الرقم الخاص
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full text-center tracking-[1.2em] text-2xl font-black p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] focus:border-[#0B532B] dark:focus:ring-[#76C139] dark:focus:border-[#76C139] text-[#0B532B] dark:text-[#76C139]"
                required
                autoFocus
              />
              {loginError && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                  ⚠️ {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B532B] hover:bg-[#07361c] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-brand hover:shadow-lg text-sm cursor-pointer"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-arabic flex flex-col md:flex-row bg-[#F7F6EC] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 relative"
      dir="rtl"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/15 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#76C139]/30 border-t-[#0B532B] dark:border-t-[#76C139] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#0B532B] dark:text-[#76C139] animate-pulse-soft">
              جاري معالجة البيانات والاتصال بقاعدة البيانات...
            </p>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#0B532B] text-white px-5 py-3.5 rounded-xl shadow-xl animate-fade-in border border-[#76C139]/20 font-bold text-sm">
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-30 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 bg-[#0B532B] text-white flex flex-col justify-between flex-shrink-0 border-l border-[#76C139]/20 shadow-2xl transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl bg-[#F7F6EC] p-1 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Image
                  src="/logo.jpg"
                  alt="شعار مقدار"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-wide text-white">مقدار أعمال</span>
                <span className="text-[10px] text-[#76C139] font-bold">باقات الشركات B2B</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] bg-[#E7792B] text-white font-bold px-1.5 py-0.5 rounded-full select-none shadow shrink-0">
                تجريبي
              </span>
              {/* Close Button on Mobile Drawer */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 md:hidden rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
                aria-label="إغلاق القائمة"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="p-4 mx-4 mt-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#76C139] animate-pulse-soft" />
              <span className="text-[10px] font-bold text-white/60">المستخدم الحالي:</span>
            </div>
            <p className="font-black text-xs text-white">
              {currentUserRole === "kitchen" && "👨‍🍳 مسؤول المطبخ"}
              {currentUserRole === "purchaser" && "🛒 مندوب المقاضي"}
              {currentUserRole === "delivery" && "🚚 مندوب التوصيل"}
              {currentUserRole === "manager" && "👑 مدير المشروع"}
              {currentUserRole === "cook" && "👨‍🍳 طباخ مقدار"}
            </p>
          </div>

          {/* Role selection menu */}
          <nav className="p-4 space-y-2">
            <p className="text-[11px] text-[#76C139] font-black uppercase tracking-wider px-3 mb-3">
              {currentUserRole === "manager" ? "اختيار واجهة العمل" : "واجهتك المخصصة"}
            </p>

            {currentUserRole === "manager" && (
              <button
                onClick={() => { setActiveRole("manager"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-bold transition-all duration-300 ${
                  activeRole === "manager"
                    ? "bg-[#76C139] text-[#0B532B] shadow-md scale-[1.02]"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>لوحة المدير العام</span>
              </button>
            )}

            {(currentUserRole === "manager" || currentUserRole === "kitchen") && (
              <button
                onClick={() => { setActiveRole("kitchen"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-bold transition-all duration-300 ${
                  activeRole === "kitchen"
                    ? "bg-[#76C139] text-[#0B532B] shadow-md scale-[1.02]"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>قسم المطبخ</span>
                {activeShortages > 0 && (
                  <span className="mr-auto text-xs bg-[#E7792B] text-white font-bold px-2 py-0.5 rounded-full shadow-inner animate-pulse-soft">
                    {activeShortages}
                  </span>
                )}
              </button>
            )}

            {(currentUserRole === "manager" || currentUserRole === "cook") && (
              <button
                onClick={() => { setActiveRole("cook"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-bold transition-all duration-300 ${
                  activeRole === "cook"
                    ? "bg-[#76C139] text-[#0B532B] shadow-md scale-[1.02]"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>قسم الطباخ</span>
              </button>
            )}

            {(currentUserRole === "manager" || currentUserRole === "purchaser") && (
              <button
                onClick={() => { setActiveRole("purchaser"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-bold transition-all duration-300 ${
                  activeRole === "purchaser"
                    ? "bg-[#76C139] text-[#0B532B] shadow-md scale-[1.02]"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>مندوب المقاضي</span>
                {activeShortages > 0 && (
                  <span className="mr-auto text-xs bg-[#E7792B] text-white font-bold px-2 py-0.5 rounded-full shadow-inner animate-bounce-soft">
                    {activeShortages}
                  </span>
                )}
              </button>
            )}

            {(currentUserRole === "manager" || currentUserRole === "delivery") && (
              <button
                onClick={() => { setActiveRole("delivery"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right font-bold transition-all duration-300 ${
                  activeRole === "delivery"
                    ? "bg-[#76C139] text-[#0B532B] shadow-md scale-[1.02]"
                    : "hover:bg-white/5 text-white/80 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm0 0h-3.62a1 1 0 01-.707-.293L15 13.18a1 1 0 00-.707-.293H13m-2.28 4H7.28m0 0h-1.6c-.66 0-1.2-.54-1.2-1.2v-8c0-.66.54-1.2 1.2-1.2h3.2M11 17.2V9.8c0-.66-.54-1.2-1.2-1.2H7.2m8.64 0h3.24c.66 0 1.2.54 1.2 1.2v3.6" />
                </svg>
                <span>مندوب التوصيل</span>
                {totalDeliveries - completedDeliveries > 0 && (
                  <span className="mr-auto text-xs bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    {totalDeliveries - completedDeliveries} متبقي
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">الوضع الداكن/الفاتح</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-[#76C139] cursor-pointer"
              aria-label="تبديل المظهر"
            >
              {theme === "light" ? (
                <svg className="w-4 h-4 text-[#76C139]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[#E7792B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer active:scale-95"
          >
            <span>تسجيل الخروج</span>
            <svg className="w-4 h-4 text-[#E7792B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          
          <div className="text-[10px] text-center text-white/40">
            تطبيق مقدار أعمال © ٢٠٢٦
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-[#76C139]/10 p-5 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden rounded-xl bg-[#0B532B]/5 text-[#0B532B] dark:bg-zinc-800 dark:text-[#76C139] hover:bg-[#0B532B]/10 transition-colors cursor-pointer"
              aria-label="افتح القائمة"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="p-2 bg-[#0B532B]/10 dark:bg-zinc-800 rounded-xl text-[#0B532B] dark:text-[#76C139]">
              {activeRole === "manager" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )}
              {activeRole === "kitchen" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
              {activeRole === "cook" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
              {activeRole === "purchaser" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
              {activeRole === "delivery" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0zm0 0h-3.62a1 1 0 01-.707-.293L15 13.18a1 1 0 00-.707-.293H13m-2.28 4H7.28m0 0h-1.6c-.66 0-1.2-.54-1.2-1.2v-8c0-.66.54-1.2 1.2-1.2h3.2M11 17.2V9.8c0-.66-.54-1.2-1.2-1.2H7.2m8.64 0h3.24c.66 0 1.2.54 1.2 1.2v3.6" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-lg md:text-xl text-[#0B532B] dark:text-zinc-50">
                {activeRole === "manager" && "لوحة تحكم مدير المشروع"}
                {activeRole === "kitchen" && "قسم المطبخ والإنتاج"}
                {activeRole === "cook" && "قسم الطباخ وإعداد الوجبات"}
                {activeRole === "purchaser" && "قسم التجهيز ومشتريات المقاضي"}
                {activeRole === "delivery" && "قسم التوزيع وتوصيل الطلبات"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeRole === "manager" && "إدارة النواقص، إحصائيات حية وسجل عمليات التوصيل."}
                {activeRole === "kitchen" && "تسجيل وتتبع نقص المواد الأساسية ومستلزمات الإنتاج."}
                {activeRole === "cook" && "تقديم قوائم وجبات الغد (الغداء، العشاء، وسناك الغد) للمشرفين."}
                {activeRole === "purchaser" && "شراء المواد الناقصة فورياً وتوريدها للمطبخ."}
                {activeRole === "delivery" && "متابعة مسارات التوزيع اليومية في أحياء مكة المكرمة."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left hidden md:block">
              <p className="text-xs text-zinc-400 font-bold">التوقيت الحالي</p>
              <p className="font-bold text-sm text-[#0B532B] dark:text-[#76C139]">{getCurrentTime()}</p>
            </div>
            
            {/* Header Notification Toggle Button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={setupPushNotifications}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow cursor-pointer active:scale-95 shrink-0 text-white ${
                  isPushSubscribed 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-[#0B532B] hover:bg-[#07361c]"
                }`}
              >
                <span>{isPushSubscribed ? "🟢 التنبيهات نشطة" : "🔔 تفعيل التنبيهات"}</span>
              </button>
            )}

            {/* Header Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#E7792B] hover:bg-[#c9631d] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow cursor-pointer active:scale-95 shrink-0"
            >
              <span>تسجيل الخروج</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dynamic Views Rendering */}
        <div className="p-6 md:p-8 flex-1 space-y-8 animate-fade-in">
          {/* 1. PROJECT MANAGER VIEW */}
          {activeRole === "manager" && currentUserRole === "manager" && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Shortages count */}
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400">نواقص المطبخ النشطة</span>
                    <h3 className="text-3xl font-black text-[#E7792B]">{activeShortages}</h3>
                    <p className="text-[10px] text-zinc-500">مواد تحتاج إلى توريد فوري</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl flex items-center justify-center font-bold text-xl">
                    ⚠️
                  </div>
                </div>

                {/* Pending purchase */}
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400">طلبات شراء معلقة</span>
                    <h3 className="text-3xl font-black text-[#0B532B] dark:text-[#76C139]">
                      {activeShortages}
                    </h3>
                    <p className="text-[10px] text-zinc-500">في قائمة مندوب المشتريات</p>
                  </div>
                  <div className="w-12 h-12 bg-[#0B532B]/10 dark:bg-zinc-800 text-[#0B532B] dark:text-[#76C139] rounded-xl flex items-center justify-center font-bold text-xl">
                    🛒
                  </div>
                </div>

                {/* Delivery progress stats */}
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400">حالة توزيع الوجبات</span>
                    <h3 className="text-3xl font-black text-[#0B532B] dark:text-[#76C139]">
                      {completedDeliveries} <span className="text-sm font-normal text-zinc-400">/ {totalDeliveries}</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500">وجبات تم تسليمها بنجاح</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 text-[#76C139] rounded-xl flex items-center justify-center font-bold text-xl">
                    🚚
                  </div>
                </div>

                {/* Fulfilled rate percentage */}
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-400">نسبة إنجاز التوصيل</span>
                    <h3 className="text-3xl font-black text-[#E7792B]">{deliveryProgressPercent}%</h3>
                    <p className="text-[10px] text-zinc-500">معدل الإنجاز اليومي العام</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 text-[#E7792B] rounded-xl flex items-center justify-center font-bold text-xl">
                    📈
                  </div>
                </div>
              </div>

              {/* Progress Bar & Region Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* General Delivery Progress and Action */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                        مؤشر تقدم التوزيع اليومي
                      </h3>
                      <span className="text-xs font-bold text-zinc-400">تحديث فوري</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>النسبة المكتملة</span>
                        <span className="text-[#0B532B] dark:text-[#76C139]">{deliveryProgressPercent}%</span>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-l from-[#76C139] to-[#0B532B] h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${deliveryProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Regional Delivery Breakdown */}
                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <h4 className="font-bold text-sm text-zinc-600 dark:text-zinc-300">
                        تغطية أحياء ومناطق التوصيل:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {regions.map((region) => {
                          const regionOrders = orders.filter((o) => o.region === region);
                          const regionCompleted = regionOrders.filter((o) => o.status === "تم التوصيل").length;
                          const percent = Math.round((regionCompleted / regionOrders.length) * 100) || 0;
                          return (
                            <div
                              key={region}
                              className="bg-[#F7F6EC]/60 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-xs">{region}</p>
                                <span className="text-[10px] text-zinc-400">
                                  {regionCompleted} من أصل {regionOrders.length} طلبات
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-[#0B532B] dark:text-[#76C139]">
                                  {percent}%
                                </span>
                                <div className="w-12 bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#0B532B] dark:bg-[#76C139] h-full rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* إضافة مشترك جديد */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                          إضافة مشترك جديد 👤
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          قم بتسجيل مشترك جديد لتوزيعه تلقائياً على مندوب التوصيل في الحي المناسب.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddSubscriber} className="space-y-4">
                      {formError && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200/50">
                          <span>⚠️</span>
                          <span>{formError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* اسم المشترك */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            اسم المشترك <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="مثال: عبدالمجيد الغامدي"
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                            required
                          />
                        </div>

                        {/* الحي في مكة */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            حي التوصيل (مكة المكرمة) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newRegion}
                            onChange={(e) => setNewRegion(e.target.value)}
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100 cursor-pointer"
                            required
                          >
                            <option value="العزيزية">العزيزية</option>
                            <option value="الشوقية">الشوقية</option>
                            <option value="بطحاء قريش">بطحاء قريش</option>
                            <option value="العوالي">العوالي</option>
                            <option value="النزهة والزاهر">النزهة والزاهر</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* نوع الباقة */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            نوع الباقة/الاشتراك <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newPackageType}
                            onChange={(e) => setNewPackageType(e.target.value)}
                            placeholder="مثال: تضخيم (وجبتان وسناك) أو كيتو"
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                            required
                          />
                        </div>

                        {/* تفاصيل العنوان */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            العنوان بالتفصيل (اختياري)
                          </label>
                          <input
                            type="text"
                            value={newDetails}
                            onChange={(e) => setNewDetails(e.target.value)}
                            placeholder="مثال: الشارع العام - خلف الصيدلية"
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-[#0B532B] hover:bg-[#07361c] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>إضافة المشترك</span>
                          <span>➕</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* إضافة مادة/مقاضي جديدة للمطبخ */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                          إضافة مادة/مقاضي جديدة للمطبخ 🥦
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          قم بتسجيل مادة غذائية أو مستلزم إنتاج جديد ليتمكن مسؤول المطبخ من طلب نقصه لاحقاً.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddIngredient} className="space-y-4">
                      {ingredientFormError && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200/50">
                          <span>⚠️</span>
                          <span>{ingredientFormError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* اسم المادة */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            اسم المادة <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newIngredientName}
                            onChange={(e) => setNewIngredientName(e.target.value)}
                            placeholder="مثال: صدور دجاج متبلة، زيت زيتون عضوي..."
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                            required
                          />
                        </div>

                        {/* التصنيف */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            التصنيف <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newIngredientCategory}
                            onChange={(e) => setNewIngredientCategory(e.target.value)}
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100 cursor-pointer"
                            required
                          >
                            <option value="البروتين">البروتين</option>
                            <option value="الخضروات والورقيات">الخضروات والورقيات</option>
                            <option value="النشويات والكربوهيدرات">النشويات والكربوهيدرات</option>
                            <option value="الألبان والأجبان">الألبان والأجبان</option>
                            <option value="الزيوت والصوصات">الزيوت والصوصات</option>
                            <option value="البهارات والتوابل">البهارات والتوابل</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-[#0B532B] hover:bg-[#07361c] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>إضافة إلى المطبخ</span>
                          <span>➕</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* إدارة الرموز السرية للأعضاء */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                          إدارة الرموز السرية للأعضاء 🔑
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          تحديث رمز الدخول الخاص بأعضاء الفريق (المطبخ، المشتريات، أو التوصيل).
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      {passwordFormError && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200/50">
                          <span>⚠️</span>
                          <span>{passwordFormError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* دور العضو */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            دور العضو بالفريق <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={updatePasswordRole}
                            onChange={(e) => setUpdatePasswordRole(e.target.value as any)}
                            className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100 cursor-pointer"
                            required
                          >
                            <option value="kitchen">مسؤول المطبخ</option>
                            <option value="purchaser">مندوب المقاضي</option>
                            <option value="delivery">مندوب التوصيل</option>
                            <option value="cook">الطباخ (رمز ثابت)</option>
                          </select>
                        </div>

                        {/* الرمز السري الجديد */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            الرمز السري الجديد (4 أرقام) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={newMemberPin}
                            onChange={(e) => setNewMemberPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••"
                            className="w-full text-center tracking-[0.5em] text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-[#0B532B] hover:bg-[#07361c] text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>تحديث الرمز السري</span>
                          <span>💾</span>
                        </button>
                      </div>
                    </form>

                    {currentUserRole === "manager" && teamMembers && teamMembers.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-[#0B532B] dark:text-zinc-200">
                          <span className="text-sm">👥</span>
                          <h4 className="text-sm font-extrabold">
                            رموز الدخول الحالية للفريق
                          </h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-bold">
                                <th className="pb-2">اسم الموظف</th>
                                <th className="pb-2">الدور / الصلاحية</th>
                                <th className="pb-2 text-center">رمز الدخول الحالي</th>
                                <th className="pb-2 text-left">الإجراء</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                              {teamMembers.map((member) => {
                                let roleAr = "";
                                if (member.role === "manager") roleAr = "مدير المشروع";
                                else if (member.role === "kitchen") roleAr = "مسؤول المطبخ";
                                else if (member.role === "purchaser") roleAr = "مندوب المقاضي";
                                else if (member.role === "delivery") roleAr = "مندوب التوصيل";
                                else if (member.role === "cook") roleAr = "طباخ مقدار";

                                return (
                                  <tr key={member.id} className="text-zinc-800 dark:text-zinc-200">
                                    <td className="py-3 font-semibold">{member.name}</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                        member.role === "manager" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400" :
                                        member.role === "cook" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400" :
                                        "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                                      }`}>
                                        {roleAr}
                                      </span>
                                    </td>
                                    <td className="py-3 text-center font-mono font-bold tracking-wider text-[#E7792B]">
                                      {member.pinCode}
                                    </td>
                                    <td className="py-3 text-left">
                                      {member.role !== "manager" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setUpdatePasswordRole(member.role);
                                            const inputEl = document.querySelector("input[placeholder='••••']") as HTMLInputElement;
                                            if (inputEl) {
                                              inputEl.focus();
                                              inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
                                            }
                                          }}
                                          className="text-xs text-[#0B532B] dark:text-[#76C139] hover:underline bg-transparent border-none cursor-pointer"
                                        >
                                          تعديل الرمز ✏️
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* قائمة المشتركين الحاليين وإدارتهم */}
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div>
                        <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                          قائمة المشتركين الحاليين 👤
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          عرض وتعديل كافة المشتركين المسجلين في مكة المكرمة مع إمكانية حذف الحسابات التجريبية.
                        </p>
                      </div>
                      <span className="text-xs bg-[#0B532B]/10 text-[#0B532B] dark:bg-[#76C139]/10 dark:text-[#76C139] px-2.5 py-1 rounded-full font-bold">
                        {orders.length} مشتركين
                      </span>
                    </div>

                    {orders.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">لا يوجد مشتركين مسجلين حالياً.</p>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-xs font-bold text-zinc-500">
                              <th className="pb-3 pr-2">الاسم</th>
                              <th className="pb-3">الحي</th>
                              <th className="pb-3">الباقة</th>
                              <th className="pb-3">الحالة</th>
                              <th className="pb-3 text-left pl-2">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {orders.map((order) => (
                              <tr key={order.id} className="text-xs text-zinc-700 dark:text-zinc-300">
                                <td className="py-3 pr-2 font-bold text-zinc-900 dark:text-zinc-50">{order.customerName}</td>
                                <td className="py-3">{order.region}</td>
                                <td className="py-3 max-w-[120px] truncate">{order.packageType}</td>
                                <td className="py-3">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    order.status === "تم التوصيل"
                                      ? "bg-[#76C139]/10 text-[#0B532B] dark:bg-[#76C139]/10 dark:text-[#76C139]"
                                      : "bg-orange-100 text-[#E7792B] dark:bg-orange-950/30 dark:text-orange-400"
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3 text-left pl-2">
                                  <button
                                    onClick={() => handleDeleteSubscriber(order.id, order.customerName)}
                                    className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 hover:text-red-700 p-2 rounded-lg transition-colors cursor-pointer"
                                    title="حذف المشترك"
                                    aria-label="حذف المشترك"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Activity Log */}
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 shadow-sm flex flex-col h-[780px]">
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                      سجل العمليات المباشر
                    </h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                  </div>

                  {/* Logs list wrapper */}
                  <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 text-right">
                    {logs.map((log) => (
                      <div key={log.id} className="text-xs flex gap-2.5 border-b border-zinc-50 dark:border-zinc-800/50 pb-2">
                        <span className="text-[#E7792B] font-bold shrink-0">{log.time}</span>
                        <div className="space-y-1">
                          <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {log.text}
                          </p>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              log.type === "kitchen"
                                ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                                : log.type === "purchaser"
                                ? "bg-[#76C139]/10 text-[#0B532B] dark:bg-zinc-800 dark:text-[#76C139]"
                                : log.type === "delivery"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {log.type === "kitchen" && "المطبخ"}
                            {log.type === "purchaser" && "المقاضي"}
                            {log.type === "delivery" && "التوصيل"}
                            {log.type === "system" && "النظام"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reset Demo State button */}
                  <button
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const ingResponse = await fetch("/api/business/ingredients", { method: "PATCH" });
                        const subResponse = await fetch("/api/business/subscribers", { method: "PATCH" });
                        
                        const ingData = await ingResponse.json();
                        const subData = await subResponse.json();

                        if (ingResponse.ok && subResponse.ok && ingData.success && subData.success) {
                          setIngredients(ingData.ingredients);
                          const mappedOrders = subData.subscribers.map((s: any) => ({
                            id: s.id,
                            customerName: s.name,
                            region: s.neighborhood,
                            packageType: s.packageType,
                            status: s.deliveryStatus,
                            details: s.details,
                          }));
                          setOrders(mappedOrders);
                          
                          const resetLog: ActivityLog = {
                            id: Date.now().toString(),
                            time: getCurrentTime(),
                            text: "النظام: تم إعادة تعيين كافة البيانات والحالات الافتراضية بنجاح بقاعدة البيانات.",
                            type: "system",
                          };
                          setLogs([resetLog]);
                          showToast("🔄 تم إعادة تعيين بيانات المحاكاة بقاعدة البيانات");
                        } else {
                          showToast("❌ فشل إعادة تعيين بيانات قاعدة البيانات");
                        }
                      } catch {
                        showToast("❌ خطأ في الاتصال بخادم البيانات");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="mt-4 w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    إعادة تعيين البيانات للوضع الافتراضي
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. KITCHEN VIEW */}
          {activeRole === "kitchen" && (currentUserRole === "manager" || currentUserRole === "kitchen") && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                    مستودع المطبخ الفوري
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    استخدم الأزرار لتسجيل أي نقص في المواد فورياً لإرسالها لمندوب المشتريات.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold">الحالة الإجمالية:</span>
                  {activeShortages === 0 ? (
                    <span className="bg-green-100 text-[#0B532B] dark:bg-green-950/40 dark:text-green-300 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#76C139] animate-ping" />
                      مكتملة (لا توجد نواقص)
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                      يوجد عدد {activeShortages} نواقص
                    </span>
                  )}
                </div>
              </div>

              {/* قائمة التحقق من توافر وجبات الغد */}
              <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                      قائمة التحقق من توافر وجبات الغد 📋
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      تحقق من وجود كامل المكونات المطلوبة في المستودع لكل وجبة تم تقديمها من الطباخ.
                    </p>
                  </div>
                  {latestMeals && (
                    <span className="text-xs bg-[#76C139]/10 text-[#0B532B] dark:text-[#76C139] px-2.5 py-1 rounded-full font-bold">
                      التاريخ المستهدف: {latestMeals.date}
                    </span>
                  )}
                </div>

                {!latestMeals ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    ⏳ لم يقم الطباخ برفع قائمة الوجبات ليوم الغد بعد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* غداء الغد */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      latestMeals.verifiedLunch
                        ? "border-[#76C139]/40 bg-[#76C139]/5 dark:bg-[#76C139]/5"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}>
                      <div className="space-y-3">
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] text-zinc-400 font-bold">غداء الغد</span>
                          <p className="text-xs font-bold text-[#0B532B] dark:text-[#76C139] leading-relaxed">
                            {latestMeals.lunch}
                          </p>
                        </div>

                        {/* Ingredients Checklist */}
                        {latestMeals.lunchIngredients && latestMeals.lunchIngredients.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold">التحقق من المكونات:</span>
                            <div className="space-y-1.5">
                              {latestMeals.lunchIngredients.map((ing: string) => {
                                const isVerified = !!(latestMeals.verifiedIngredients && latestMeals.verifiedIngredients[ing]);
                                return (
                                  <label key={ing} className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isVerified}
                                      onChange={(e) => handleVerifyIngredient(ing, e.target.checked)}
                                      className="w-4 h-4 accent-[#0B532B] dark:accent-[#76C139] rounded cursor-pointer"
                                    />
                                    <span className={`text-xs ${isVerified ? "text-green-600 font-semibold" : "text-zinc-600 dark:text-zinc-400"}`}>
                                      {ing} {isVerified ? "🟢 (موجود)" : "🔴 (ناقص)"}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* عشاء الغد */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      latestMeals.verifiedDinner
                        ? "border-[#76C139]/40 bg-[#76C139]/5 dark:bg-[#76C139]/5"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}>
                      <div className="space-y-3">
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] text-zinc-400 font-bold">عشاء الغد</span>
                          <p className="text-xs font-bold text-[#0B532B] dark:text-[#76C139] leading-relaxed">
                            {latestMeals.dinner}
                          </p>
                        </div>

                        {/* Ingredients Checklist */}
                        {latestMeals.dinnerIngredients && latestMeals.dinnerIngredients.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold">التحقق من المكونات:</span>
                            <div className="space-y-1.5">
                              {latestMeals.dinnerIngredients.map((ing: string) => {
                                const isVerified = !!(latestMeals.verifiedIngredients && latestMeals.verifiedIngredients[ing]);
                                return (
                                  <label key={ing} className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={isVerified}
                                      onChange={(e) => handleVerifyIngredient(ing, e.target.checked)}
                                      className="w-4 h-4 accent-[#0B532B] dark:accent-[#76C139] rounded cursor-pointer"
                                    />
                                    <span className={`text-xs ${isVerified ? "text-green-600 font-semibold" : "text-zinc-600 dark:text-zinc-400"}`}>
                                      {ing} {isVerified ? "🟢 (موجود)" : "🔴 (ناقص)"}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* سناك الغد */}
                    <div className={`p-4 rounded-2xl border transition-all ${
                      latestMeals.verifiedSnacks
                        ? "border-[#76C139]/40 bg-[#76C139]/5 dark:bg-[#76C139]/5"
                        : "border-zinc-200 dark:border-zinc-800"
                    }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] text-zinc-400 font-bold">سناك الغد</span>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 leading-relaxed">
                            {latestMeals.snacks}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={latestMeals.verifiedSnacks}
                            onChange={(e) => handleVerifyMealItem("snacks", e.target.checked)}
                            className="w-5 h-5 accent-[#0B532B] dark:accent-[#76C139] rounded cursor-pointer"
                          />
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            المكونات متوفرة في المستودع
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category Filtering Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 pt-2 scrollbar-none">
                {["الكل", "البروتين", "الخضروات والورقيات", "النشويات والكربوهيدرات", "الألبان والأجبان", "الزيوت والصوصات", "البهارات والتوابل"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedKitchenCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedKitchenCategory === cat
                        ? "bg-[#0B532B] text-white shadow-sm dark:bg-[#76C139] dark:text-zinc-950"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid of raw ingredients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {ingredients
                  .filter((item) => selectedKitchenCategory === "الكل" || item.category === selectedKitchenCategory)
                  .map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between h-48 transition-all duration-300 shadow-sm hover:shadow-md ${
                      item.status === "ناقص"
                        ? "border-red-400/40 bg-red-50/20 dark:bg-red-950/5"
                        : "border-[#76C139]/10"
                    }`}
                  >
                    {/* Header Item Card */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 px-2 py-0.5 rounded font-bold">
                          {item.category}
                        </span>
                        <h4 className="font-extrabold text-base mt-2 text-[#0B532B] dark:text-zinc-50">
                          {item.name}
                        </h4>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          item.status === "ناقص"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            : "bg-green-100 text-[#0B532B] dark:bg-green-950/40 dark:text-[#76C139]"
                        }`}
                      >
                        {item.status === "ناقص" ? "❌ ناقص" : "✓ فل"}
                      </span>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">
                        آخر تحديث: {item.lastUpdated}
                      </span>

                      {item.status === "فل" ? (
                        <button
                          onClick={() => reportShortage(item.id, item.name)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                        >
                          تسجيل نقص ⚠️
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-bold animate-pulse-soft">
                          بانتظار المندوب...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PURCHASER/GROCERY VIEW */}
          {activeRole === "purchaser" && (currentUserRole === "manager" || currentUserRole === "purchaser") && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 p-6 rounded-3xl shadow-sm">
                <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                  قائمة شراء مستلزمات المطبخ الصحية
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  المكونات المذكورة أدناه تم تسجيل نقصها من المطبخ. يرجى توفيرها وتوصيلها ثم تأكيد الشراء.
                </p>
              </div>

              {ingredients.filter((item) => item.status === "ناقص").length === 0 ? (
                /* Empty state */
                <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-12 text-center shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-[#76C139] rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-lg text-[#0B532B] dark:text-zinc-50">
                    لا توجد نواقص في المطبخ حالياً!
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    جميع المكونات الأساسية متوفرة في المستودع بحالة جيدة (فل) لتجهيز الوجبات اليومية.
                  </p>
                </div>
              ) : (
                /* List of shortages */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ingredients
                    .filter((item) => item.status === "ناقص")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-zinc-900 border border-red-200/60 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between h-44 shadow-sm hover:shadow-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 rounded font-bold">
                              مطلوب فوراً
                            </span>
                            <h4 className="font-extrabold text-base mt-2 text-zinc-800 dark:text-zinc-50">
                              {item.name}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-1">المجال: {item.category}</p>
                          </div>
                          <span className="text-xs font-bold text-red-500">
                            تسجيل نقص: {item.lastUpdated}
                          </span>
                        </div>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                          <button
                            onClick={() => purchaseItem(item.id, item.name)}
                            className="bg-[#0B532B] hover:bg-[#07361c] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                          >
                            <span>تم الشراء وتوصيله للمطبخ</span>
                            <span>✓</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 4. DELIVERY VIEW */}
          {activeRole === "delivery" && (currentUserRole === "manager" || currentUserRole === "delivery") && (
            <div className="space-y-6">
              {/* Region Selector Summary */}
              <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                    جدول تسليم الوجبات في أحياء مكة المكرمة
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    قم بتأكيد تسليم الطلب للعميل لتحديث المؤشرات والنسب العامة للنظام.
                  </p>
                </div>
                <div className="bg-[#F7F6EC] dark:bg-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-500">تم التوصيل اليوم:</span>
                  <span className="font-black text-sm text-[#0B532B] dark:text-[#76C139]">
                    {completedDeliveries} من أصل {totalDeliveries} وجبات
                  </span>
                </div>
              </div>

              {/* Grouping by regions */}
              <div className="space-y-8">
                {regions.map((region) => {
                  const regionOrders = orders.filter((o) => o.region === region);
                  return (
                    <div key={region} className="space-y-4">
                      {/* Region Title Section */}
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-6 bg-[#E7792B] rounded-full" />
                        <h4 className="font-black text-base text-[#0B532B] dark:text-zinc-50">
                          {region} ({regionOrders.length} طلبات)
                        </h4>
                      </div>

                      {/* Orders grid inside the region */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regionOrders.map((order) => (
                          <div
                            key={order.id}
                            className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-sm ${
                              order.status === "تم التوصيل"
                                ? "border-[#76C139]/40 bg-[#76C139]/5 dark:bg-[#76C139]/5"
                                : "border-[#76C139]/10"
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Order header */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[10px] text-zinc-400 font-bold">طلب #{order.id}</p>
                                  <h5 className="font-extrabold text-base text-zinc-800 dark:text-zinc-50 mt-1">
                                    {order.customerName}
                                  </h5>
                                </div>
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    order.status === "تم التوصيل"
                                      ? "bg-green-100 text-[#0B532B] dark:bg-green-950/40 dark:text-[#76C139]"
                                      : "bg-orange-100 text-[#E7792B] dark:bg-orange-950/40 dark:text-[#E7792B]"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>

                              {/* Package type and details */}
                              <div className="bg-[#F7F6EC]/60 dark:bg-zinc-800/40 p-3 rounded-xl space-y-1">
                                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                  📦 الباقة: {order.packageType}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  📍 العنوان: {order.details}
                                </p>
                              </div>
                            </div>

                            {/* Checkbox Action */}
                            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={order.status === "تم التوصيل"}
                                  onChange={(e) =>
                                    toggleDeliveryStatus(order.id, order.customerName, e.target.checked)
                                  }
                                  className="w-5 h-5 accent-[#0B532B] dark:accent-[#76C139] rounded cursor-pointer"
                                />
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                  تعليم كـ تم التوصيل للعميل
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. COOK VIEW */}
          {activeRole === "cook" && (currentUserRole === "manager" || currentUserRole === "cook") && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 p-6 rounded-3xl shadow-sm">
                <h3 className="font-extrabold text-base text-[#0B532B] dark:text-zinc-100">
                  نموذج تقديم وجبات الغد الصحّية 🍳
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  قم بتسجيل وتعبئة الوجبات المقترحة ليوم غدٍ ليقوم مسؤول المطبخ بمراجعتها والتحقق من توفر كامل المكونات والطلبات المطلوبة.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 space-y-6 shadow-sm">
                    <form onSubmit={handleSubmitMeals} className="space-y-6">
                      {mealsError && (
                        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-red-200/50">
                          <span>⚠️</span>
                          <span>{mealsError}</span>
                        </div>
                      )}

                      {/* تاريخ الوجبات */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          تاريخ وجبات الغد <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={cookDate}
                          onChange={(e) => setCookDate(e.target.value)}
                          className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                          required
                        />
                      </div>

                      {/* غداء الغد */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            غداء الغد (غداء الغد) <span className="text-red-500">*</span>
                          </label>
                          {cookLunch && (
                            <button
                              type="button"
                              onClick={() => handleClearMeal("lunch")}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              🗑️ حذف الوجبة
                            </button>
                          )}
                        </div>
                        <select
                          value={cookLunch}
                          onChange={(e) => setCookLunch(e.target.value)}
                          className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100 cursor-pointer"
                          required
                        >
                          <option value="">-- اختر الوجبة --</option>
                          {MIQDAR_MENU?.lunch?.map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.name} ({item.ingredients.join("، ")})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* عشاء الغد */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            عشاء الغد (عشاء الغد) <span className="text-red-500">*</span>
                          </label>
                          {cookDinner && (
                            <button
                              type="button"
                              onClick={() => handleClearMeal("dinner")}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              🗑️ حذف الوجبة
                            </button>
                          )}
                        </div>
                        <select
                          value={cookDinner}
                          onChange={(e) => setCookDinner(e.target.value)}
                          className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100 cursor-pointer"
                          required
                        >
                          <option value="">-- اختر الوجبة --</option>
                          {MIQDAR_MENU?.dinner?.map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.name} ({item.ingredients.join("، ")})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* سناك الغد */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          سناك الغد (سناك الغد) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={cookSnacks}
                          onChange={(e) => setCookSnacks(e.target.value)}
                          placeholder="مثال: زبادي يوناني مع حبات الرمان الطازج وعسل"
                          className="w-full text-sm p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#0B532B] dark:focus:ring-[#76C139] text-zinc-800 dark:text-zinc-100"
                          required
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full sm:w-auto bg-[#0B532B] hover:bg-[#07361c] text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-sm text-sm cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                          <span>إرسال قائمة وجبات الغد لمشرف المطبخ</span>
                          <span>🍳</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* عرض آخر القوائم المقدمة */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 border border-[#76C139]/10 rounded-3xl p-6 shadow-sm">
                    <h4 className="font-extrabold text-sm text-[#0B532B] dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                      آخر قائمة وجبات مقدمة 📋
                    </h4>
                    {latestMeals ? (
                      <div className="space-y-4 text-right">
                        <div className="bg-[#F7F6EC]/60 dark:bg-zinc-800/40 p-3 rounded-xl">
                          <p className="text-[10px] text-zinc-400 font-bold">تاريخ الوجبات:</p>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{latestMeals.date}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-400 font-bold">غداء الغد:</p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">{latestMeals.lunch}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-400 font-bold">عشاء الغد:</p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">{latestMeals.dinner}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-400 font-bold">سناك الغد:</p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">{latestMeals.snacks}</p>
                        </div>
                        <div className="pt-2 text-[10px] text-zinc-400">
                          قدمت بتاريخ: {new Date(latestMeals.submittedAt).toLocaleString("ar-SA")}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4">لا توجد وجبات مسجلة حالياً.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
