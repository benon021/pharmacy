/**
 * Kenya Rx Flow - Local Persistence Layer
 * Replacing Supabase with LocalStorage for standalone "Cyber Premium" experience.
 */

export type AppRole = "admin" | "pharmacist" | "cashier" | "storekeeper" | "seller";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
  avatar_url?: string | null;
  password?: string;
}

export interface Drug {
  id: string;
  name: string; // Commercial/Brand Name
  generic_name: string | null;
  brand_name?: string | null; // Explicit brand name for clarity
  sku?: string | null;
  barcode: string | null; 
  category: string; // e.g. OTC, Prescription
  therapeutic_class?: string | null; // e.g. Antibiotic, Analgesic
  form: string; // Dosage form: Tablet, Syrup, etc.
  strength?: string | null; // e.g. 500mg
  active_ingredients?: string | null; // Composition
  stock: number;
  reorder_level: number; // Low stock threshold
  unit: string;
  manufacturer: string | null;
  supplier?: string | null; // Supplier info
  description: string | null; // Extra details / Indications
  cost_price: number | null; // Purchase Price
  price: number; // Selling Price
  tax_rate?: number; // VAT details (e.g. 16)
  is_taxable: boolean; 
  prescription_required: boolean;
  batch_number: string | null; 
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "low_stock" | "expiry" | "payment" | "info";
  read: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  seller_id: string;
  total_amount: number;
  tax_amount: number; // NEW
  discount_total: number;
  payment_method: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  prescription_url: string | null; // NEW: Clinical workflow
  status: "completed" | "pending_approval" | "voided"; // NEW
  void_reason: string | null; // NEW
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  drug_id: string;
  quantity: number;
  unit_price: number;
  tax_amount: number; // NEW
  total_price: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string; // Rent, Salary, Power, etc.
  amount: number;
  description: string;
  recorded_by: string;
  created_at: string;
}

// Storage Keys
const KEYS = {
  USERS: "rx_users",
  DRUGS: "rx_drugs",
  SALES: "rx_sales",
  SALE_ITEMS: "rx_sale_items",
  AUTH: "rx_auth_session",
  NOTIFICATIONS: "rx_notifications",
  SUPPLIERS: "rx_suppliers",
  AUDIT_LOGS: "rx_audit_logs",
  EXPENSES: "rx_expenses",
};

import { SEED_DRUGS as ENTERPRISE_SEED } from "./seed_data";

// Seed Data
const SEED_USERS: User[] = [
  { id: "u1", email: "admin@pharmacy.co.ke", full_name: "John Admin", role: "admin", is_active: true, password: "password123" },
  { id: "u2", email: "seller@pharmacy.co.ke", full_name: "Alice Seller", role: "seller", is_active: true, password: "password123" },
];

const SEED_DRUGS: Drug[] = ENTERPRISE_SEED.map(d => ({
  ...d,
  id: "d-" + Math.random().toString(36).substr(2, 9),
  created_at: new Date().toISOString()
}));

// Helper to get from localstorage
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed = JSON.parse(data);
    return parsed ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialization
export const initDb = () => {
  const users = getItem<any[]>(KEYS.USERS, []);
  if (!users || users.length === 0) setItem(KEYS.USERS, SEED_USERS);

  const drugs = getItem<any[]>(KEYS.DRUGS, []);
  if (!drugs || drugs.length === 0) setItem(KEYS.DRUGS, SEED_DRUGS);

  const sales = getItem<any[]>(KEYS.SALES, []);
  if (!sales || sales.length === 0) {
    const freshDrugs = getItem<Drug[]>(KEYS.DRUGS, []);
    if (freshDrugs.length > 5) {
      const mockSales = [];
      const mockSaleItems = [];
      
      const methods = ["cash", "mpesa", "card"];
      const statues = ["completed", "completed", "completed", "pending"];

      for (let i = 0; i < 15; i++) {
        const saleId = "sl-" + Math.random().toString(36).substr(2, 9);
        const randomDrug = freshDrugs[Math.floor(Math.random() * 5)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const total = randomDrug.price * qty;

        const date = new Date();
        date.setDate(date.getDate() - (Math.floor(Math.random() * 14)));

        mockSaleItems.push({
          id: "item-" + Math.random().toString(36).substr(2, 9),
          sale_id: saleId,
          drug_id: randomDrug.id,
          drug_name: randomDrug.name,
          quantity: qty,
          unit_price: randomDrug.price,
          total_price: total
        });

        mockSales.push({
          id: saleId,
          seller_id: "u2",
          seller_name: "Alice Seller",
          total_amount: total,
          paid_amount: total,
          balance: 0,
          payment_method: methods[Math.floor(Math.random() * methods.length)],
          status: statues[Math.floor(Math.random() * statues.length)],
          created_at: date.toISOString()
        });
      }

      setItem(KEYS.SALES, mockSales);
      setItem(KEYS.SALE_ITEMS, mockSaleItems);
    } else {
      setItem(KEYS.SALES, []);
      setItem(KEYS.SALE_ITEMS, []);
    }
  } else {
    if (!localStorage.getItem(KEYS.SALE_ITEMS)) setItem(KEYS.SALE_ITEMS, []);
  }

  if (!localStorage.getItem(KEYS.NOTIFICATIONS)) setItem(KEYS.NOTIFICATIONS, []);
  if (!localStorage.getItem(KEYS.SUPPLIERS)) setItem(KEYS.SUPPLIERS, []);
  if (!localStorage.getItem(KEYS.AUDIT_LOGS)) setItem(KEYS.AUDIT_LOGS, []);
  if (!localStorage.getItem(KEYS.EXPENSES)) setItem(KEYS.EXPENSES, []);
};

// Database Service Interface
export const localDb = {
  // Auth
  auth: {
    signIn: (email: string, _pass: string) => {
      const users = getItem<User[]>(KEYS.USERS, []);
      const user = users.find(u => u.email === email);
      if (user) {
        setItem(KEYS.AUTH, user);
        localDb.auditLogs.create("Auth", `User ${user.full_name} logged in`, user.id, user.full_name);
        return { user, error: null };
      }
      return { user: null, error: new Error("Invalid credentials") };
    },
    signOut: () => {
      const user = localDb.auth.getSession();
      if (user) localDb.auditLogs.create("Auth", `User ${user.full_name} logged out`, user.id, user.full_name);
      localStorage.removeItem(KEYS.AUTH);
    },
    getSession: () => getItem<User | null>(KEYS.AUTH, null),
    getAll: () => getItem<User[]>(KEYS.USERS, []),
    update: (id: string, updates: Partial<User>) => {
      const users = getItem<User[]>(KEYS.USERS, []);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return { error: new Error("User not found") };
      users[index] = { ...users[index], ...updates };
      setItem(KEYS.USERS, users);
      
      // Update session if it's the current user
      const session = localDb.auth.getSession();
      if (session && session.id === id) {
        setItem(KEYS.AUTH, users[index]);
      }
      
      return { data: users[index], error: null };
    },
    changePassword: (id: string, current: string, newPass: string) => {
      const users = getItem<User[]>(KEYS.USERS, []);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return { error: new Error("User not found") };
      
      const user = users[index];
      if (user.password && user.password !== current) {
        return { error: new Error("Incorrect current password") };
      }
      
      user.password = newPass;
      users[index] = user;
      setItem(KEYS.USERS, users);
      
      // Notify Admin
      if (user.role !== "admin") {
        localDb.notifications.create({
          title: "Security Alert: Password Changed",
          message: `User ${user.full_name} (${user.role}) has updated their password. Verify action if unexpected.`,
          type: "payment" // Using payment type for red/priority color
        });
      }
      
      localDb.auditLogs.create("Security", `User ${user.full_name} changed password`, user.id, user.full_name);
      
      return { error: null };
    },
    insert: (user: Omit<User, "id">) => {
      const users = getItem<User[]>(KEYS.USERS, []);
      const newUser = { 
        ...user, 
        id: "u" + Math.random().toString(36).substr(2, 5), 
        password: user.password || "password123" 
      };
      setItem(KEYS.USERS, [...users, newUser]);
      return { data: newUser, error: null };
    }
  },

  // Drugs
  drugs: {
    getAll: () => getItem<Drug[]>(KEYS.DRUGS, []),
    getById: (id: string) => getItem<Drug[]>(KEYS.DRUGS, []).find(d => d.id === id),
    insert: (drug: Omit<Drug, "id" | "created_at">) => {
      const drugs = getItem<Drug[]>(KEYS.DRUGS, []);
      const newDrug: Drug = { ...drug, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      setItem(KEYS.DRUGS, [newDrug, ...drugs]);
      
      const admin = localDb.auth.getSession();
      localDb.auditLogs.create("Inventory", `Added new drug: ${drug.name}`, admin?.id || "system", admin?.full_name || "System");
      
      return { data: newDrug, error: null };
    },
    update: (id: string, updates: Partial<Drug>) => {
      const drugs = getItem<Drug[]>(KEYS.DRUGS, []);
      const index = drugs.findIndex(d => d.id === id);
      if (index === -1) return { error: new Error("Drug not found") };
      
      const oldVal = drugs[index];
      drugs[index] = { ...drugs[index], ...updates };
      setItem(KEYS.DRUGS, drugs);
      
      const admin = localDb.auth.getSession();
      localDb.auditLogs.create("Inventory", `Updated drug: ${oldVal.name}`, admin?.id || "system", admin?.full_name || "System");
      
      return { data: drugs[index], error: null };
    }
  },

  // System
  system: {
    seed: async (seedData: any[]) => {
      const items = seedData.map(item => ({
        ...item,
        id: "d-" + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      }));
      setItem(KEYS.DRUGS, items);
      
      // Clear other tables for a clean slate
      setItem(KEYS.SALES, []);
      setItem(KEYS.SALE_ITEMS, []);
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString();
      });

      const mockExpenses = [
        { id: "e1", title: "Monthly Rent", category: "Rent", amount: 45000, description: "Main Facility Rent", created_at: last7Days[6] },
        { id: "e2", title: "Pharmacist Salary", category: "Salary", amount: 15000, description: "Junior Pharmacist - June", created_at: last7Days[5] },
        { id: "e3", title: "Antibiotic Restock", category: "Inventory", amount: 12000, description: "Amoxicillin Bulk Purchase", created_at: last7Days[4] },
        { id: "e4", title: "Syringe Supplies", category: "Inventory", amount: 8000, description: "Syringe Restock", created_at: last7Days[3] },
        { id: "e5", title: "Electricity Bill", category: "Power", amount: 2500, description: "Kenya Power - Bill 002", created_at: last7Days[2] },
        { id: "e6", title: "Digital Marketing", category: "Marketing", amount: 5000, description: "Social Media Ads", created_at: last7Days[1] },
        { id: "e7", title: "Logistics", category: "Inventory", amount: 15000, description: "Cold Chain Logistics", created_at: last7Days[0] },
      ];
      
      setItem(KEYS.EXPENSES, mockExpenses);
      
      return { success: true };
    }
  },

  // Sales
  sales: {
    getAll: () => getItem<Sale[]>(KEYS.SALES, []),
    create: (saleData: Omit<Sale, "id" | "created_at">, items: Omit<SaleItem, "id" | "sale_id">[]) => {
      const sales = getItem<Sale[]>(KEYS.SALES, []);
      const saleItems = getItem<SaleItem[]>(KEYS.SALE_ITEMS, []);
      const drugs = getItem<Drug[]>(KEYS.DRUGS, []);

      const saleId = "s-" + Math.random().toString(36).substr(2, 9);
      const newSale: Sale = { 
        ...saleData, 
        id: saleId, 
        created_at: new Date().toISOString() 
      };
      
      const newItems: SaleItem[] = items.map(item => ({
        ...item,
        id: "si-" + Math.random().toString(36).substr(2, 9),
        sale_id: saleId
      }));

      // Validate and Update Stock
      for (const item of items) {
        const drugIndex = drugs.findIndex(d => d.id === item.drug_id);
        if (drugIndex === -1) return { error: new Error(`Drug ${item.drug_id} not found in inventory ledger`) };
        const drug = drugs[drugIndex];

        // Strict Stock Check
        if (Number(drug.stock) < Number(item.quantity)) {
          return { error: new Error(`Insufficient stock for ${drug.name}. Requested: ${item.quantity}, Available: ${drug.stock}`) };
        }
        
        // Expiry Condition
        const isExpired = drug.expiry_date && new Date(drug.expiry_date) < new Date();
        const user = localDb.auth.getSession();
        if (isExpired && user?.role !== "admin") {
          return { error: new Error(`Critical Block: ${drug.name} has expired. Dispensing restricted for non-administrative accounts.`) };
        }

        // Apply Deduction
        drugs[drugIndex] = {
          ...drug,
          stock: Number(drug.stock) - Number(item.quantity)
        };
      }

      setItem(KEYS.SALES, [newSale, ...sales]);
      setItem(KEYS.SALE_ITEMS, [...newItems, ...saleItems]);
      setItem(KEYS.DRUGS, drugs);

      const seller = localDb.auth.getSession();
      localDb.auditLogs.create("Sales", `Transaction completed: ${newSale.id} (KES ${newSale.total_amount})`, seller?.id || "system", seller?.full_name || "System");

      return { data: newSale, error: null };
    },
    getDetailed: () => {
      const sales = getItem<Sale[]>(KEYS.SALES, []);
      const saleItems = getItem<SaleItem[]>(KEYS.SALE_ITEMS, []);
      const drugs = getItem<Drug[]>(KEYS.DRUGS, []);
      const users = getItem<User[]>(KEYS.USERS, []);

      return sales.map(sale => ({
        ...sale,
        seller_name: users.find(u => u.id === sale.seller_id)?.full_name || "Unknown Seller",
        items: saleItems
          .filter(si => si.sale_id === sale.id)
          .map(si => ({
            ...si,
            drug_name: drugs.find(d => d.id === si.drug_id)?.name || "Unknown Drug"
          }))
      }));
    },
    getRecent: (n: number) => {
      const sales = getItem<Sale[]>(KEYS.SALES, []);
      return sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, n);
    },
    getAllItems: () => getItem<SaleItem[]>(KEYS.SALE_ITEMS, [])
  },

  // Suppliers
  suppliers: {
    getAll: () => getItem<Supplier[]>(KEYS.SUPPLIERS, []),
    insert: (supplier: Omit<Supplier, "id" | "created_at">) => {
      const all = getItem<Supplier[]>(KEYS.SUPPLIERS, []);
      const newSupp: Supplier = { ...supplier, id: "sup-" + Math.random().toString(36).substr(2, 5), created_at: new Date().toISOString() };
      setItem(KEYS.SUPPLIERS, [...all, newSupp]);
      return { data: newSupp, error: null };
    },
    update: (id: string, updates: Partial<Supplier>) => {
      const all = getItem<Supplier[]>(KEYS.SUPPLIERS, []);
      const index = all.findIndex(s => s.id === id);
      if (index === -1) return { error: new Error("Supplier not found") };
      all[index] = { ...all[index], ...updates };
      setItem(KEYS.SUPPLIERS, all);
      return { data: all[index], error: null };
    },
    delete: (id: string) => {
      const all = getItem<Supplier[]>(KEYS.SUPPLIERS, []);
      const filtered = all.filter(s => s.id !== id);
      setItem(KEYS.SUPPLIERS, filtered);
      return { error: null };
    }
  },

  // Audit Logs
  auditLogs: {
    getAll: () => getItem<AuditLog[]>(KEYS.AUDIT_LOGS, []),
    create: (module: string, action: string, userId: string, userName: string) => {
      const logs = getItem<AuditLog[]>(KEYS.AUDIT_LOGS, []);
      const newLog: AuditLog = {
        id: "log-" + Math.random().toString(36).substr(2, 9),
        module,
        action,
        user_id: userId,
        user_name: userName,
        details: "",
        created_at: new Date().toISOString()
      };
      setItem(KEYS.AUDIT_LOGS, [newLog, ...logs]);
    }
  },

  // Expenses
  expenses: {
    getAll: () => getItem<Expense[]>(KEYS.EXPENSES, []),
    create: (expense: Omit<Expense, "id" | "created_at">) => {
      const all = getItem<Expense[]>(KEYS.EXPENSES, []);
      const newExp: Expense = { ...expense, id: "exp-" + Math.random().toString(36).substr(2, 5), created_at: new Date().toISOString() };
      setItem(KEYS.EXPENSES, [newExp, ...all]);
      return { data: newExp, error: null };
    },
    delete: (id: string) => {
      const all = getItem<Expense[]>(KEYS.EXPENSES, []);
      const filtered = all.filter(e => e.id !== id);
      setItem(KEYS.EXPENSES, filtered);
      return { error: null };
    }
  },

  // Notifications
  notifications: {
    getAll: () => getItem<Notification[]>(KEYS.NOTIFICATIONS, []),
    getUnread: () => getItem<Notification[]>(KEYS.NOTIFICATIONS, []).filter(n => !n.read),
    create: (notif: Omit<Notification, "id" | "read" | "created_at">) => {
      const all = getItem<Notification[]>(KEYS.NOTIFICATIONS, []);
      const newNotif: Notification = { ...notif, id: "nt-" + Math.random().toString(36).substr(2, 9), read: false, created_at: new Date().toISOString() };
      setItem(KEYS.NOTIFICATIONS, [newNotif, ...all]);
      return newNotif;
    },
    markAllRead: () => {
      const all = getItem<Notification[]>(KEYS.NOTIFICATIONS, []);
      const updated = all.map(n => ({ ...n, read: true }));
      setItem(KEYS.NOTIFICATIONS, updated);
    }
  }
};
