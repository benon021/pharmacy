/**
 * Supabase Database Seeder
 * Seeds pricing_tiers and creates a super_admin user in Supabase Auth.
 * This replaces the old Dexie-based seeding.
 */
import { supabase } from './supabase';

const DEFAULT_PRICING_TIERS = [
  {
    name: 'Starter',
    price: 2500,
    duration_days: 30,
    is_active: true,
  },
  {
    name: 'Professional',
    price: 5000,
    duration_days: 30,
    is_active: true,
  },
  {
    name: 'Enterprise',
    price: 12000,
    duration_days: 30,
    is_active: true,
  },
  {
    name: 'Trial',
    price: 0,
    duration_days: 14,
    is_active: true,
  },
];

export interface SeedResult {
  success: boolean;
  message: string;
  details: string[];
}

/**
 * Seed pricing tiers into Supabase
 */
export const seedPricingTiers = async (): Promise<string[]> => {
  const logs: string[] = [];

  const { data: existing } = await supabase.from('pricing_tiers').select('id');
  
  if (existing && existing.length > 0) {
    logs.push(`✅ Pricing tiers already exist (${existing.length} found). Skipping.`);
    return logs;
  }

  const { error } = await supabase.from('pricing_tiers').insert(DEFAULT_PRICING_TIERS);

  if (error) {
    logs.push(`❌ Failed to seed pricing tiers: ${error.message}`);
  } else {
    logs.push(`✅ Seeded ${DEFAULT_PRICING_TIERS.length} pricing tiers (Starter, Professional, Enterprise, Trial)`);
  }

  return logs;
};

/**
 * Create Super Admin in Supabase Auth
 */
export const seedSuperAdmin = async (
  email: string = 'admin@lumiaxy.ph',
  password: string = 'LumiaxySuperAdmin2026!'
): Promise<string[]> => {
  const logs: string[] = [];

  // Try signing in first to see if the admin already exists
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!signInError && signInData.user) {
    logs.push(`✅ Super Admin already exists: ${email}. Signing out now.`);
    await supabase.auth.signOut();
    return logs;
  }

  // Create new super admin
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Enterprise Master',
        role: 'super_admin',
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      logs.push(`⚠️ Admin email ${email} is registered but password may differ. Try logging in manually.`);
    } else {
      logs.push(`❌ Failed to create Super Admin: ${error.message}`);
    }
  } else if (data.user) {
    logs.push(`✅ Super Admin created: ${email}`);
    logs.push(`🔑 Password: ${password}`);
    // Sign out so user can log in fresh
    await supabase.auth.signOut();
  }

  return logs;
};

/**
 * Full seed: pricing + admin
 */
export const seedSupabaseDatabase = async (): Promise<SeedResult> => {
  const details: string[] = [];

  try {
    details.push('--- Seeding Pricing Tiers ---');
    const tierLogs = await seedPricingTiers();
    details.push(...tierLogs);

    details.push('');
    details.push('--- Seeding Super Admin ---');
    const adminLogs = await seedSuperAdmin();
    details.push(...adminLogs);

    const hasErrors = details.some(d => d.startsWith('❌'));

    return {
      success: !hasErrors,
      message: hasErrors ? 'Seeding completed with errors.' : 'Supabase database seeded successfully!',
      details
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Critical error: ${err.message}`,
      details: [...details, `❌ ${err.message}`]
    };
  }
};
