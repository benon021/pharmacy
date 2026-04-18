/**
 * Lumiaxy POS - Local Database Implementation (Dexie.js)
 */
import { db, seedDatabase, Announcement, Attendance, SupportTicket, Customer } from './dexie';

export type AppRole = "super_admin" | "admin" | "pharmacist" | "cashier" | "storekeeper" | "seller";

export interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: AppRole;
  pharmacy_id?: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export interface Drug {
  id: string;
  pharmacy_id: string;
  name: string;
  generic_name: string | null;
  brand_name?: string | null;
  sku?: string | null;
  barcode: string | null; 
  category: string;
  therapeutic_class?: string | null;
  form: string;
  strength?: string | null;
  active_ingredients?: string | null;
  stock: number;
  reorder_level: number;
  unit: string;
  manufacturer: string | null;
  supplier?: string | null;
  description: string | null;
  cost_price: number | null;
  price: number;
  tax_rate?: number;
  is_taxable: boolean; 
  prescription_required: boolean;
  batch_number: string | null; 
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  status: 'trialing' | 'active' | 'suspended' | 'expired';
  location: string;
  kra_pin: string;
  license_number: string;
  owner_id: string;
  owner_phone: string;
  subscription_tier: string; // references pricing_tier.id
  monthly_fee: number;
  total_revenue_contributed: number;
  last_payment_date: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  pharmacy_id: string;
  seller_id: string;
  total_amount: number;
  tax_amount: number;
  discount_total: number;
  payment_method: string;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  prescription_url: string | null;
  status: "completed" | "pending_approval" | "voided";
  void_reason: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  pharmacy_id: string;
  sale_id: string;
  drug_id: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  total_price: number;
}

export interface Supplier {
  id: string;
  pharmacy_id: string;
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
  pharmacy_id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export interface Expense {
  id: string;
  pharmacy_id: string;
  category: string;
  amount: number;
  description: string;
  recorded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  pharmacy_id: string;
  title: string;
  message: string;
  type: "low_stock" | "expiry" | "payment" | "info";
  read: boolean;
  created_at: string;
}

export interface LocalDb {
  auth: {
    getProfile: (userId: string) => Promise<User | null>;
    signOut: () => Promise<void>;
    getSession: () => Promise<User | null>;
    getAll: () => Promise<User[]>;
    getAllWithPharmacy: () => Promise<(User & { pharmacy_name?: string })[]>;
    insert: (user: Omit<User, "id" | "is_active"> & { password?: string }) => Promise<{ user: User | null; error: any }>;
    update: (id: string, updates: Partial<User>) => Promise<{ user: User | null; error: any }>;
    setStatus: (userId: string, active: boolean) => Promise<{ success: boolean; error: any }>;
  };
  pharmacies: {
    getAll: () => Promise<Pharmacy[]>;
    getById: (id: string) => Promise<Pharmacy | null>;
    create: (data: Omit<Pharmacy, "id" | "created_at">) => Promise<{ data: Pharmacy | null; error: any }>;
    onboard: (data: any) => Promise<{ success: boolean; pharmacy?: Pharmacy; admin?: User; credentials?: { email: string; password: string }; error: any }>;
    update: (id: string, updates: Partial<Pharmacy>) => Promise<{ data: Pharmacy | null; error: any }>;
    setStatus: (id: string, status: Pharmacy["status"]) => Promise<{ success: boolean; error: any }>;
    delete: (id: string) => Promise<{ success: boolean; error: any }>;
  };
  drugs: {
    getAll: () => Promise<Drug[]>;
    getById: (id: string) => Promise<{ data: Drug | null; error: any }>;
    insert: (drug: Omit<Drug, "id" | "created_at" | "pharmacy_id">) => Promise<{ data: Drug | null; error: any }>;
    update: (id: string, updates: Partial<Drug>) => Promise<{ data: Drug | null; error: any }>;
  };
  sales: {
    getAll: () => Promise<Sale[]>;
    getAllGlobal: () => Promise<(Sale & { pharmacy_name?: string })[]>;
    create: (saleData: Omit<Sale, "id" | "created_at" | "pharmacy_id">, items: Omit<SaleItem, "id" | "sale_id" | "pharmacy_id">[]) => Promise<{ data: Sale | null; error: any }>;
    getDetailed: () => Promise<any[]>;
    getRecent: (n: number) => Promise<Sale[]>;
  };
  suppliers: {
    getAll: () => Promise<Supplier[]>;
    insert: (supplier: Omit<Supplier, "id" | "created_at" | "pharmacy_id">) => Promise<{ data: Supplier | null; error: any }>;
    update: (id: string, updates: Partial<Supplier>) => Promise<{ data: Supplier | null; error: any }>;
    delete: (id: string) => Promise<{ error: any }>;
  };
  auditLogs: {
    getAll: () => Promise<AuditLog[]>;
    create: (module: string, action: string, userId: string, userName: string) => Promise<void>;
  };
  expenses: {
    getAll: () => Promise<Expense[]>;
    create: (expense: Omit<Expense, "id" | "created_at" | "pharmacy_id">) => Promise<{ data: Expense | null; error: any }>;
    delete: (id: string) => Promise<{ error: any }>;
  };
  notifications: {
    getAll: () => Promise<Notification[]>;
    getUnread: () => Promise<Notification[]>;
    create: (notif: Omit<Notification, "id" | "read" | "created_at" | "pharmacy_id">) => Promise<Notification | null>;
    markAllRead: () => Promise<void>;
  };
  announcements: {
    getAll: () => Promise<Announcement[]>;
    create: (title: string, message: string, target_role: Announcement["target_role"]) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
  attendance: {
    getAll: () => Promise<Attendance[]>;
    getCurrent: (userId: string) => Promise<Attendance | null>;
    clockIn: (userId: string) => Promise<void>;
    clockOut: (id: string) => Promise<void>;
  };
  customers: {
    getAll: () => Promise<Customer[]>;
    getByPhone: (phone: string) => Promise<Customer | null>;
    upsert: (customer: Omit<Customer, "id" | "points" | "last_visit" | "created_at" | "pharmacy_id">) => Promise<void>;
    addPoints: (phone: string, points: number) => Promise<void>;
  };
  tickets: {
    getAll: () => Promise<SupportTicket[]>;
    create: (subject: string, message: string) => Promise<void>;
    close: (id: string) => Promise<void>;
  };
  pricing: {
    getAll: () => Promise<any[]>;
    create: (data: any) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };
}

const getEffectivePharmacyId = async (): Promise<string | null> => {
  const sessionUser = JSON.parse(localStorage.getItem('lumiaxy_session') || 'null');
  if (!sessionUser) return null;

  if (sessionUser.role === 'super_admin') {
    return sessionStorage.getItem("active_pharmacy_id");
  }

  return sessionUser.pharmacy_id || null;
};

export const localDb: LocalDb = {
  auth: {
    getProfile: async (userId: string) => {
      return (await db.users.get(userId)) || null;
    },
    signOut: async () => {
      localStorage.removeItem('lumiaxy_session');
    },
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('lumiaxy_session') || 'null');
      return session;
    },
    getAll: async () => {
      return db.users.toArray();
    },
    getAllWithPharmacy: async () => {
      const users = await db.users.toArray();
      const pharmacies = await db.pharmacies.toArray();
      
      return users.map(u => ({
        ...u,
        pharmacy_name: pharmacies.find(p => p.id === u.pharmacy_id)?.name || "System"
      }));
    },
    insert: async (userData) => {
      const newUser = {
        ...userData,
        id: crypto.randomUUID(),
        is_active: true,
        created_at: new Date().toISOString()
      };
      await db.users.add(newUser as any);
      return { user: newUser as any, error: null };
    },
    update: async (id, updates) => {
      await db.users.update(id, updates);
      const user = await db.users.get(id);
      return { user: user as any, error: null };
    },
    setStatus: async (userId, active) => {
      await db.users.update(userId, { is_active: active });
      return { success: true, error: null };
    }
  },

  pharmacies: {
    getAll: async () => {
      return db.pharmacies.toArray();
    },
    getById: async (id) => {
      return (await db.pharmacies.get(id)) || null;
    },
    create: async (data) => {
      const newPharmacy = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      };
      await db.pharmacies.add(newPharmacy as any);
      return { data: newPharmacy as any, error: null };
    },
    onboard: async (onboardData: any) => {
      const pharmacyId = crypto.randomUUID();
      const ownerId = crypto.randomUUID();
      const password = `Lumiaxy${Math.floor(1000 + Math.random() * 9000)}`;

      const pharmacy = {
        name: onboardData.name,
        location: onboardData.location,
        kra_pin: onboardData.kra_pin,
        license_number: onboardData.license_number,
        id: pharmacyId,
        owner_id: ownerId,
        owner_phone: onboardData.ownerPhone || "",
        status: 'active',
        subscription_tier: onboardData.tier_id || 'standard',
        monthly_fee: onboardData.price || 5000,
        total_revenue_contributed: 0,
        last_payment_date: new Date().toISOString(),
        expires_at: new Date(Date.now() + (onboardData.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      } as Pharmacy;

      await db.pharmacies.add(pharmacy as any);

      const admin = {
        id: ownerId,
        email: onboardData.ownerEmail,
        full_name: onboardData.ownerName,
        password: password,
        role: 'admin',
        pharmacy_id: pharmacyId,
        is_active: true,
        created_at: new Date().toISOString()
      } as User;

      await db.users.add(admin as any);

      return { 
        success: true, 
        pharmacy, 
        admin, 
        credentials: { email: admin.email, password: password }, 
        error: null 
      };
    },
    update: async (id, updates) => {
      await db.pharmacies.update(id, updates);
      const p = await db.pharmacies.get(id);
      return { data: p as any, error: null };
    },
    setStatus: async (id, status) => {
      await db.pharmacies.update(id, { status });
      return { success: true, error: null };
    },
    delete: async (id) => {
      await db.pharmacies.delete(id);
      return { success: true, error: null };
    }
  },

  drugs: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      if (!pharmacyId) return db.drugs.toArray();
      return db.drugs.where('pharmacy_id').equals(pharmacyId).toArray();
    },
    getById: async (id) => {
      const data = await db.drugs.get(id);
      return { data: data || null, error: null };
    },
    insert: async (drug) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const newDrug = {
        ...drug,
        id: crypto.randomUUID(),
        pharmacy_id: pharmacy_id!,
        created_at: new Date().toISOString()
      };
      await db.drugs.add(newDrug as any);
      return { data: newDrug as any, error: null };
    },
    update: async (id, updates) => {
      await db.drugs.update(id, updates);
      const d = await db.drugs.get(id);
      return { data: d as any, error: null };
    }
  },

  sales: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      if (!pharmacyId) return db.sales.orderBy('created_at').reverse().toArray();
      return db.sales.where('pharmacy_id').equals(pharmacyId).reverse().toArray();
    },
    getAllGlobal: async () => {
      const sales = await db.sales.orderBy('created_at').reverse().toArray();
      const pharmacies = await db.pharmacies.toArray();
      return sales.map(s => ({
        ...s,
        pharmacy_name: pharmacies.find(p => p.id === s.pharmacy_id)?.name || "Unknown Branch"
      }));
    },
    create: async (saleData, items) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const saleId = crypto.randomUUID();

      const newSale = {
        ...saleData,
        id: saleId,
        pharmacy_id: pharmacy_id!,
        created_at: new Date().toISOString()
      };
      await db.sales.add(newSale as any);

      for (const item of items) {
        await db.sale_items.add({
          ...item,
          id: crypto.randomUUID(),
          sale_id: saleId,
          pharmacy_id: pharmacy_id!
        } as any);
      }

      // Update branch revenue tracking
      const pharmacy = await db.pharmacies.get(pharmacy_id!);
      if (pharmacy) {
        await db.pharmacies.update(pharmacy_id!, {
          total_revenue_contributed: (pharmacy.total_revenue_contributed || 0) + saleData.total_amount
        });
      }

      // Update Loyalty Points
      if (saleData.customer_phone) {
        await localDb.customers.addPoints(saleData.customer_phone, Math.floor(saleData.total_amount / 100)); // 1% points
      }

      return { data: newSale as any, error: null };
    },
    getDetailed: async () => {
      const sales = await db.sales.orderBy('created_at').reverse().toArray();
      const items = await db.sale_items.toArray();
      const drugs = await db.drugs.toArray();

      return sales.map(s => ({
        ...s,
        sale_items: items.filter(i => i.sale_id === s.id).map(i => ({
          ...i,
          drugs: drugs.find(d => d.id === i.drug_id)
        }))
      }));
    },
    getRecent: async (n) => {
      const pharmacyId = await getEffectivePharmacyId();
      if (!pharmacyId) return db.sales.orderBy('created_at').reverse().limit(n).toArray();
      return db.sales.where('pharmacy_id').equals(pharmacyId).reverse().limit(n).toArray();
    }
  },

  suppliers: {
    getAll: async () => {
       const pharmacyId = await getEffectivePharmacyId();
       if (!pharmacyId) return db.suppliers.toArray();
       return db.suppliers.where('pharmacy_id').equals(pharmacyId).toArray();
    },
    insert: async (supplier) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const newSupplier = {
        ...supplier,
        id: crypto.randomUUID(),
        pharmacy_id: pharmacy_id!,
        created_at: new Date().toISOString()
      };
      await db.suppliers.add(newSupplier as any);
      return { data: newSupplier as any, error: null };
    },
    update: async (id, updates) => {
      await db.suppliers.update(id, updates);
      const s = await db.suppliers.get(id);
      return { data: s as any, error: null };
    },
    delete: async (id) => {
      await db.suppliers.delete(id);
      return { error: null };
    }
  },

  auditLogs: {
    getAll: async () => {
      return db.audit_logs.orderBy('created_at').reverse().toArray();
    },
    create: async (module, action, userId, userName) => {
      const pharmacy_id = await getEffectivePharmacyId();
      await db.audit_logs.add({
        id: crypto.randomUUID(),
        module,
        action,
        user_id: userId,
        user_name: userName,
        pharmacy_id: pharmacy_id!,
        created_at: new Date().toISOString(),
        details: ''
      } as any);
    }
  },

  expenses: {
    getAll: async () => {
        const pharmacyId = await getEffectivePharmacyId();
        if (!pharmacyId) return db.expenses.reverse().toArray();
        return db.expenses.where('pharmacy_id').equals(pharmacyId).reverse().toArray();
    },
    create: async (expense) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const newExpense = {
        ...expense,
        id: crypto.randomUUID(),
        pharmacy_id: pharmacy_id!,
        created_at: new Date().toISOString()
      };
      await db.expenses.add(newExpense as any);
      return { data: newExpense as any, error: null };
    },
    delete: async (id) => {
      await db.expenses.delete(id);
      return { error: null };
    }
  },

  notifications: {
    getAll: async () => {
      return db.notifications.orderBy('created_at').reverse().toArray();
    },
    getUnread: async () => {
      return db.notifications.where('read').equals(0).toArray(); 
    },
    create: async (notif) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const newNotif = {
        ...notif,
        id: crypto.randomUUID(),
        pharmacy_id: pharmacy_id!,
        read: false,
        created_at: new Date().toISOString()
      };
      await db.notifications.add(newNotif as any);
      return newNotif as any;
    },
    markAllRead: async () => {
      await db.notifications.toCollection().modify({ read: true });
    }
  },

  announcements: {
    getAll: async () => {
      return db.announcements.orderBy('created_at').reverse().toArray();
    },
    create: async (title, message, target_role) => {
      await db.announcements.add({
        id: crypto.randomUUID(),
        title,
        message,
        target_role,
        created_at: new Date().toISOString()
      });
    },
    delete: async (id) => {
      await db.announcements.delete(id);
    }
  },

  attendance: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      return db.attendance.where('pharmacy_id').equals(pharmacyId!).toArray();
    },
    getCurrent: async (userId) => {
      return await db.attendance.where({ user_id: userId, status: 'active' }).first() || null;
    },
    clockIn: async (userId) => {
      const pharmacyId = await getEffectivePharmacyId();
      await db.attendance.add({
        id: crypto.randomUUID(),
        user_id: userId,
        pharmacy_id: pharmacyId!,
        clock_in: new Date().toISOString(),
        status: 'active'
      });
    },
    clockOut: async (id) => {
      await db.attendance.update(id, { 
        clock_out: new Date().toISOString(),
        status: 'completed'
      });
    }
  },

  customers: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      return db.customers.where('pharmacy_id').equals(pharmacyId!).toArray();
    },
    getByPhone: async (phone) => {
      return await db.customers.where('phone').equals(phone).first() || null;
    },
    upsert: async (customerData) => {
      const pharmacyId = await getEffectivePharmacyId();
      const existing = await db.customers.where({ phone: customerData.phone, pharmacy_id: pharmacyId! }).first();
      
      if (existing) {
        await db.customers.update(existing.id, { 
          name: customerData.name, 
          last_visit: new Date().toISOString() 
        });
      } else {
        await db.customers.add({
          ...customerData,
          id: crypto.randomUUID(),
          pharmacy_id: pharmacyId!,
          points: 0,
          last_visit: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    },
    addPoints: async (phone, points) => {
      const pharmacyId = await getEffectivePharmacyId();
      const existing = await db.customers.where({ phone, pharmacy_id: pharmacyId! }).first();
      if (existing) {
        await db.customers.update(existing.id, { points: (existing.points || 0) + points });
      }
    }
  },

  tickets: {
    getAll: async () => {
      const session = JSON.parse(localStorage.getItem('lumiaxy_session') || 'null');
      if (session?.role === 'super_admin') return db.support_tickets.toArray();
      return db.support_tickets.where('pharmacy_id').equals(session?.pharmacy_id || '').toArray();
    },
    create: async (subject, message) => {
      const session = JSON.parse(localStorage.getItem('lumiaxy_session') || 'null');
      await db.support_tickets.add({
        id: crypto.randomUUID(),
        user_id: session.id,
        pharmacy_id: session.pharmacy_id || 'system',
        subject,
        message,
        status: 'open',
        created_at: new Date().toISOString()
      });
    },
    close: async (id) => {
      await db.support_tickets.update(id, { status: 'closed' });
    }
  },
  pricing: {
    getAll: async () => {
      return db.pricing_tiers.toArray();
    },
    create: async (data) => {
      await db.pricing_tiers.add({
        ...data,
        id: crypto.randomUUID(),
        is_active: true,
        created_at: new Date().toISOString()
      } as any);
    },
    delete: async (id) => {
      await db.pricing_tiers.delete(id);
    }
  }
};
