/**
 * Lumiaxy POS - Online Database Implementation (Supabase)
 */
import { supabase } from './supabase';
import { Announcement, Attendance, SupportTicket, Customer } from './dexie';

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
  supplier_id?: string | null;
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
  subscription_tier: string; 
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

/**
 * Utility to get current pharmacy context from session context
 */
const getEffectivePharmacyId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const role = session.user.user_metadata.role;
  if (role === 'super_admin') {
    return sessionStorage.getItem("active_pharmacy_id");
  }

  return session.user.user_metadata.pharmacy_id || null;
};

export const localDb: LocalDb = {
  auth: {
    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          pharmacy_id,
          is_active,
          created_at,
          user_roles(role)
        `)
        .eq('user_id', userId)
        .single();
      
      if (error || !data) return null;
      return { 
        id: data.user_id,
        email: '', // Email not explicitly in profiles but in auth.users
        full_name: data.full_name,
        pharmacy_id: data.pharmacy_id,
        is_active: data.is_active,
        created_at: data.created_at,
        role: (data.user_roles as any)?.[0]?.role 
      } as unknown as User;
    },
    signOut: async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('lumiaxy_session');
    },
    getSession: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      return {
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.user_metadata.full_name,
        role: session.user.user_metadata.role,
        pharmacy_id: session.user.user_metadata.pharmacy_id,
        is_active: true,
        created_at: session.user.created_at
      };
    },
    getAll: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return (data || []) as any;
    },
    getAllWithPharmacy: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, pharmacies(name), user_roles(role)');
      
      return (data || []).map((u: any) => ({
        ...u,
        id: u.user_id,
        role: u.user_roles?.[0]?.role,
        pharmacy_name: u.pharmacies?.name || "System"
      }));
    },
    insert: async (userData) => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'Temporary123!',
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            pharmacy_id: userData.pharmacy_id
          }
        }
      });
      return { user: data.user as any, error };
    },
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', id)
        .select()
        .single();
      return { user: data as any, error };
    },
    setStatus: async (userId, active) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: active })
        .eq('user_id', userId);
      return { success: !error, error };
    }
  },

  pharmacies: {
    getAll: async () => {
      const { data } = await supabase.from('pharmacies').select('*');
      return data || [];
    },
    getById: async (id) => {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', id).single();
      return data;
    },
    create: async (data) => {
      const { data: pharmacy, error } = await supabase.from('pharmacies').insert(data).select().single();
      return { data: pharmacy, error };
    },
    onboard: async (onboardData: any) => {
      const { data, error } = await supabase.auth.signUp({
        email: onboardData.ownerEmail,
        password: `Lumiaxy${Math.floor(1000 + Math.random() * 9000)}`,
        options: {
          data: {
            full_name: onboardData.ownerName,
            role: 'admin',
          }
        }
      });

      if (error) return { success: false, error };

      const { data: pharmacy, error: pError } = await supabase.from('pharmacies').insert({
        name: onboardData.name,
        location: onboardData.location,
        license_number: onboardData.license_number,
        owner_id: data.user?.id,
        status: 'active'
      }).select().single();

      if (pError) return { success: false, error: pError };

      await supabase.from('profiles').update({ pharmacy_id: pharmacy.id }).eq('user_id', data.user?.id);

      return { success: true, pharmacy, admin: data.user as any, error: null };
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('pharmacies').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    setStatus: async (id, status) => {
      const { error } = await supabase.from('pharmacies').update({ status }).eq('id', id);
      return { success: !error, error };
    },
    delete: async (id) => {
      const { error } = await supabase.from('pharmacies').delete().eq('id', id);
      return { success: !error, error };
    }
  },

  drugs: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('drugs').select('*');
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    getById: async (id) => {
      const { data, error } = await supabase.from('drugs').select('*').eq('id', id).single();
      return { data, error };
    },
    insert: async (drug) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const { data, error } = await supabase.from('drugs').insert({ ...drug, pharmacy_id }).select().single();
      return { data, error };
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('drugs').update(updates).eq('id', id).select().single();
      return { data, error };
    }
  },

  sales: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    getAllGlobal: async () => {
      const { data } = await supabase.from('sales').select('*, pharmacies(name)').order('created_at', { ascending: false });
      return (data || []).map((s: any) => ({
        ...s,
        pharmacy_name: s.pharmacies?.name || "Unknown Branch"
      }));
    },
    create: async (saleData, items) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: sale, error } = await supabase.from('sales').insert({
        ...saleData,
        pharmacy_id,
        seller_id: user?.id
      }).select().single();

      if (error) return { data: null, error };

      const saleItems = items.map(item => ({
        ...item,
        sale_id: sale.id,
        pharmacy_id
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      
      return { data: sale, error: itemsError };
    },
    getDetailed: async () => {
      const { data } = await supabase
        .from('sales')
        .select('*, sale_items(*, drugs(*))')
        .order('created_at', { ascending: false });
      return data || [];
    },
    getRecent: async (n) => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(n);
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    }
  },

  suppliers: {
    getAll: async () => {
       const pharmacyId = await getEffectivePharmacyId();
       let query = supabase.from('suppliers').select('*');
       if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
       const { data } = await query;
       return data || [];
    },
    insert: async (supplier) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const { data, error } = await supabase.from('suppliers').insert({ ...supplier, pharmacy_id }).select().single();
      return { data, error };
    },
    update: async (id, updates) => {
      const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    delete: async (id) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      return { error };
    }
  },

  auditLogs: {
    getAll: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    create: async (module, action, userId, userName) => {
      const pharmacy_id = await getEffectivePharmacyId();
      await supabase.from('audit_logs').insert({
        module,
        action,
        user_id: userId,
        user_name: userName,
        pharmacy_id
      });
    }
  },

  expenses: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    create: async (expense) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('expenses').insert({ ...expense, pharmacy_id, recorded_by: user?.id }).select().single();
      return { data, error };
    },
    delete: async (id) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      return { error };
    }
  },

  notifications: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    getUnread: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('notifications').select('*').eq('read', false);
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    create: async (notif) => {
      const pharmacy_id = await getEffectivePharmacyId();
      const { data } = await supabase.from('notifications').insert({ ...notif, pharmacy_id }).select().single();
      return data;
    },
    markAllRead: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      await supabase.from('notifications').update({ read: true }).eq('pharmacy_id', pharmacyId);
    }
  },

  announcements: {
    getAll: async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    create: async (title, message, target_role) => {
      await supabase.from('announcements').insert({ title, message, target_role });
    },
    delete: async (id) => {
      await supabase.from('announcements').delete().eq('id', id);
    }
  },

  attendance: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      const { data } = await supabase.from('attendance').select('*').eq('pharmacy_id', pharmacyId).order('clock_in', { ascending: false });
      return data || [];
    },
    getCurrent: async (userId) => {
      const { data } = await supabase.from('attendance').select('*').eq('user_id', userId).eq('status', 'active').single();
      return data;
    },
    clockIn: async (userId) => {
      const pharmacyId = await getEffectivePharmacyId();
      await supabase.from('attendance').insert({ user_id: userId, pharmacy_id: pharmacyId, status: 'active' });
    },
    clockOut: async (id) => {
      await supabase.from('attendance').update({ clock_out: new Date().toISOString(), status: 'completed' }).eq('id', id);
    }
  },

  customers: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      const { data } = await supabase.from('customers').select('*').eq('pharmacy_id', pharmacyId);
      return data || [];
    },
    getByPhone: async (phone) => {
      const pharmacyId = await getEffectivePharmacyId();
      const { data } = await supabase.from('customers').select('*').eq('pharmacy_id', pharmacyId).eq('phone', phone).single();
      return data;
    },
    upsert: async (customerData) => {
      const pharmacyId = await getEffectivePharmacyId();
      await supabase.from('customers').upsert({ ...customerData, pharmacy_id: pharmacyId, last_visit: new Date().toISOString() });
    },
    addPoints: async (phone, points) => {
      const pharmacyId = await getEffectivePharmacyId();
      const { data: customer } = await supabase.from('customers').select('id, points').eq('pharmacy_id', pharmacyId).eq('phone', phone).single();
      if (customer) {
        await supabase.from('customers').update({ points: (customer.points || 0) + points }).eq('id', customer.id);
      }
    }
  },

  tickets: {
    getAll: async () => {
      const pharmacyId = await getEffectivePharmacyId();
      let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId);
      const { data } = await query;
      return data || [];
    },
    create: async (subject, message) => {
      const { data: { user } } = await supabase.auth.getUser();
      const pharmacy_id = await getEffectivePharmacyId();
      await supabase.from('support_tickets').insert({ user_id: user?.id, pharmacy_id, subject, message });
    },
    close: async (id) => {
      await supabase.from('support_tickets').update({ status: 'closed' }).eq('id', id);
    }
  },
  pricing: {
    getAll: async () => {
      const { data } = await supabase.from('pricing_tiers').select('*');
      return data || [];
    },
    create: async (data) => {
      await supabase.from('pricing_tiers').insert(data);
    },
    delete: async (id) => {
      await supabase.from('pricing_tiers').delete().eq('id', id);
    }
  }
};
