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
  { id: "u1", email: "admin@lumiaxy.ph", full_name: "Lumiaxy Admin", role: "admin", is_active: true, password: "qwertyio" },
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

import { supabase } from "@/integrations/supabase/client";

export interface LocalDb {
  auth: {
    getProfile: (userId: string) => Promise<User | null>;
    signOut: () => Promise<void>;
    getSession: () => Promise<User | null>;
    getAll: () => Promise<User[]>;
    insert: (user: Omit<User, "id" | "is_active"> & { password?: string }) => Promise<{ user: User | null; error: any }>;
    update: (id: string, updates: Partial<User>) => Promise<{ user: User | null; error: any }>;
  };
  drugs: {
    getAll: () => Promise<Drug[]>;
    getById: (id: string) => Promise<{ data: Drug | null; error: any }>;
    insert: (drug: Omit<Drug, "id" | "created_at">) => Promise<{ data: Drug | null; error: any }>;
    update: (id: string, updates: Partial<Drug>) => Promise<{ data: Drug | null; error: any }>;
  };
  system: {
    seed: (seedData: any[]) => Promise<{ success: boolean; error: any }>;
  };
  sales: {
    getAll: () => Promise<Sale[]>;
    create: (saleData: Omit<Sale, "id" | "created_at">, items: Omit<SaleItem, "id" | "sale_id">[]) => Promise<{ data: Sale | null; error: any }>;
    getDetailed: () => Promise<any[]>;
    getRecent: (n: number) => Promise<Sale[]>;
  };
  suppliers: {
    getAll: () => Promise<Supplier[]>;
    insert: (supplier: Omit<Supplier, "id" | "created_at">) => Promise<{ data: Supplier | null; error: any }>;
    update: (id: string, updates: Partial<Supplier>) => Promise<{ data: Supplier | null; error: any }>;
    delete: (id: string) => Promise<{ error: any }>;
  };
  auditLogs: {
    getAll: () => Promise<AuditLog[]>;
    create: (module: string, action: string, userId: string, userName: string) => Promise<void>;
  };
  expenses: {
    getAll: () => Promise<Expense[]>;
    create: (expense: Omit<Expense, "id" | "created_at">) => Promise<{ data: Expense | null; error: any }>;
    delete: (id: string) => Promise<{ error: any }>;
  };
  notifications: {
    getAll: () => Promise<Notification[]>;
    getUnread: () => Promise<Notification[]>;
    create: (notif: Omit<Notification, "id" | "read" | "created_at">) => Promise<Notification | null>;
    markAllRead: () => Promise<void>;
  };
}

// Database Service Interface (Supabase-Backed)
export const localDb: LocalDb = {
  // Auth
  auth: {
    getProfile: async (userId: string): Promise<User | null> => {
      // In Supabase, we might have a 'profiles' table or just return the user mapping
      // For now, we'll try to find the user in our local SEED_USERS or a 'users' table
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        // Fallback: check if it's the admin we just created in Supabase Auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          return {
            id: user.id,
            email: user.email!,
            full_name: "Admin User",
            role: "admin",
            is_active: true
          };
        }
        return null;
      }
      return data as User;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    getSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      return localDb.auth.getProfile(session.user.id);
    },
    getAll: async (): Promise<User[]> => {
      const { data, error } = await (supabase as any).from('profiles').select('*');
      return (data as User[]) || [];
    },
    insert: async (userData: Omit<User, "id" | "is_active"> & { password?: string }) => {
      // Create user in Supabase Auth first
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || "password123",
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      });

      if (authError || !user) return { user: null, error: authError };

      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .insert([{
          id: user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          is_active: true
        }])
        .select()
        .single();
      
      return { user: profile as User, error };
    },
    update: async (id: string, updates: Partial<User>) => {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { user: data as User, error };
    }
  },

  // Drugs
  drugs: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .order('name');
      if (error) {
        console.error("Forensic DB Error:", error);
        return [];
      }
      return data || [];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('drugs')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },
    insert: async (drug: Omit<Drug, "id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('drugs')
        .insert([drug])
        .select()
        .single();
      
      if (!error) {
        localDb.auditLogs.create("Inventory", `Added new drug: ${drug.name}`, user?.id || "system", user?.email || "System");
      }
      return { data: data as Drug, error };
    },
    update: async (id: string, updates: Partial<Drug>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('drugs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (!error) {
        localDb.auditLogs.create("Inventory", `Updated drug metadata for ID: ${id}`, user?.id || "system", user?.email || "System");
      }
      return { data: data as Drug, error };
    }
  },

  // System
  system: {
    seed: async (seedData: any[]) => {
      // Clear and seed drugs table in Supabase
      await supabase.from('drugs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('drugs').insert(seedData);
      return { success: !error, error };
    }
  },

  // Sales
  sales: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      return (data as Sale[]) || [];
    },
    create: async (saleData: Omit<Sale, "id" | "created_at">, items: Omit<SaleItem, "id" | "sale_id">[]) => {
      const { data: sale, error: saleError } = await (supabase as any)
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) return { error: saleError };

      const saleItems = items.map(item => ({ ...item, sale_id: (sale as any).id }));
      const { error: itemsError } = await (supabase as any).from('sale_items').insert(saleItems);
      
      if (itemsError) return { error: itemsError };

      // Update stock for each drug
      for (const item of items) {
        const { data: drug } = await supabase.from('drugs').select('stock').eq('id', item.drug_id).single();
        if (drug) {
          await supabase.from('drugs').update({ stock: drug.stock - item.quantity }).eq('id', item.drug_id);
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      localDb.auditLogs.create("Sales", `Transaction completed: ${sale.id} (KES ${sale.total_amount})`, user?.id || "system", user?.email || "System");

      return { data: sale as Sale, error: null };
    },
    getDetailed: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*, drugs(name))')
        .order('created_at', { ascending: false });
      
      if (error) return [];
      return (data as any[]).map(sale => ({
        ...sale,
        items: (sale.sale_items || []).map((si: any) => ({
          ...si,
          drug_name: si.drugs?.name || "Unknown Drug"
        }))
      }));
    },
    getRecent: async (n: number) => {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(n);
      return (data as Sale[]) || [];
    }
  },

  // Suppliers
  suppliers: {
    getAll: async () => {
      const { data } = await (supabase as any).from('suppliers').select('*').order('name');
      return (data as Supplier[]) || [];
    },
    insert: async (supplier: Omit<Supplier, "id" | "created_at">) => {
      const { data, error } = await (supabase as any).from('suppliers').insert([supplier]).select().single();
      return { data: data as Supplier, error };
    },
    update: async (id: string, updates: Partial<Supplier>) => {
      const { data, error } = await (supabase as any).from('suppliers').update(updates).eq('id', id).select().single();
      return { data: data as Supplier, error };
    },
    delete: async (id: string) => {
      return (supabase as any).from('suppliers').delete().eq('id', id);
    }
  },

  // Audit Logs
  auditLogs: {
    getAll: async () => {
      const { data } = await (supabase as any).from('audit_logs').select('*').order('created_at', { ascending: false });
      return (data as AuditLog[]) || [];
    },
    create: async (module: string, action: string, userId: string, userName: string) => {
      await (supabase as any).from('audit_logs').insert([{
        module,
        action,
        user_id: userId,
        user_name: userName,
        details: ""
      }]);
    }
  },

  // Expenses
  expenses: {
    getAll: async () => {
      const { data } = await (supabase as any).from('expenses').select('*').order('created_at', { ascending: false });
      return (data as Expense[]) || [];
    },
    create: async (expense: Omit<Expense, "id" | "created_at">) => {
      const { data, error } = await (supabase as any).from('expenses').insert([expense]).select().single();
      return { data: data as Expense, error };
    },
    delete: async (id: string) => {
      return (supabase as any).from('expenses').delete().eq('id', id);
    }
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const { data } = await (supabase as any).from('notifications').select('*').order('created_at', { ascending: false });
      return (data as Notification[]) || [];
    },
    getUnread: async () => {
      const { data } = await (supabase as any).from('notifications').select('*').eq('read', false).order('created_at', { ascending: false });
      return (data as Notification[]) || [];
    },
    create: async (notif: Omit<Notification, "id" | "read" | "created_at">) => {
      const { data } = await (supabase as any).from('notifications').insert([notif]).select().single();
      return data as Notification;
    },
    markAllRead: async () => {
      await (supabase as any).from('notifications').update({ read: true }).eq('read', false);
    }
  }
};
