import Dexie, { type Table } from 'dexie';
import { User, Drug, Pharmacy, Sale, SaleItem, Supplier, AuditLog, Expense, Notification } from './db';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target_role: 'all' | 'admin' | 'seller';
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  pharmacy_id: string;
  clock_in: string;
  clock_out?: string;
  status: 'active' | 'completed';
}

export interface SupportTicket {
  id: string;
  user_id: string;
  pharmacy_id: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface Customer {
  id: string;
  pharmacy_id: string;
  name: string;
  phone: string;
  points: number;
  last_visit: string;
  created_at: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

export class LumiaxyDatabase extends Dexie {
  users!: Table<User>;
  pharmacies!: Table<Pharmacy>;
  pricing_tiers!: Table<PricingTier>;
  drugs!: Table<Drug>;
  sales!: Table<Sale>;
  sale_items!: Table<SaleItem>;
  suppliers!: Table<Supplier>;
  audit_logs!: Table<AuditLog>;
  expenses!: Table<Expense>;
  notifications!: Table<Notification>;
  announcements!: Table<Announcement>;
  attendance!: Table<Attendance>;
  support_tickets!: Table<SupportTicket>;
  customers!: Table<Customer>;

  constructor() {
    super('LumiaxyPOS');
    this.version(4).stores({
      users: 'id, email, role, pharmacy_id',
      pharmacies: 'id, name, status, owner_id, subscription_tier, kra_pin, license_number',
      pricing_tiers: 'id, name, is_active',
      drugs: 'id, pharmacy_id, name, category, is_active',
      sales: 'id, pharmacy_id, seller_id, status, created_at, customer_phone',
      sale_items: 'id, sale_id, drug_id, pharmacy_id',
      suppliers: 'id, pharmacy_id, name, is_active',
      audit_logs: 'id, pharmacy_id, user_id, action, created_at',
      expenses: 'id, pharmacy_id, category, created_at',
      notifications: 'id, pharmacy_id, type, read, created_at',
      announcements: 'id, target_role, created_at',
      attendance: 'id, user_id, pharmacy_id, clock_in, status',
      support_tickets: 'id, user_id, status, created_at',
      customers: 'id, pharmacy_id, phone, name'
    });
  }
}

export const db = new LumiaxyDatabase();

export const seedDatabase = async () => {
  const adminCount = await db.users.where('role').equals('super_admin').count();
  
  if (adminCount === 0) {
    console.log('[Dexie] Seeding Lumiaxy Enterprise Super Admin...');
    await db.users.add({
      id: crypto.randomUUID(),
      email: 'admin@lumiaxy.ph',
      password: 'LumiaxySuperAdmin2026!',
      full_name: 'Enterprise Master',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString()
    } as any);
  }
};
