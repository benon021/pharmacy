/**
 * Supabase Database Seeder
 * Seeds ALL data: pricing tiers, super admin, demo pharmacy, drugs, sales, suppliers, etc.
 */
import { supabase } from './supabase';

// ─── PRICING TIERS ───────────────────────────────────────────────
const DEFAULT_PRICING_TIERS = [
  { name: 'Starter', price: 2500, duration_days: 30, is_active: true },
  { name: 'Professional', price: 5000, duration_days: 30, is_active: true },
  { name: 'Enterprise', price: 12000, duration_days: 30, is_active: true },
  { name: 'Trial', price: 0, duration_days: 14, is_active: true },
];

// ─── DEMO DRUGS (30 real pharmaceuticals) ────────────────────────
const DEMO_DRUGS = [
  { name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'Analgesics', form: 'Tablet', strength: '500mg', stock: 450, reorder_level: 50, unit: 'tablets', manufacturer: 'GSK', cost_price: 3, price: 8, is_taxable: false, prescription_required: false, batch_number: 'PCM-2026-001', expiry_date: '2027-06-15', barcode: '8901234560001', description: 'Pain reliever and fever reducer' },
  { name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', category: 'Antibiotics', form: 'Capsule', strength: '250mg', stock: 200, reorder_level: 30, unit: 'capsules', manufacturer: 'Cipla', cost_price: 12, price: 25, is_taxable: false, prescription_required: true, batch_number: 'AMX-2026-045', expiry_date: '2027-03-20', barcode: '8901234560002', description: 'Broad-spectrum antibiotic' },
  { name: 'Metformin 500mg', generic_name: 'Metformin HCl', category: 'Antidiabetics', form: 'Tablet', strength: '500mg', stock: 320, reorder_level: 40, unit: 'tablets', manufacturer: 'Merck', cost_price: 5, price: 15, is_taxable: false, prescription_required: true, batch_number: 'MET-2026-012', expiry_date: '2027-09-10', barcode: '8901234560003', description: 'Type 2 diabetes management' },
  { name: 'Omeprazole 20mg', generic_name: 'Omeprazole', category: 'Gastrointestinal', form: 'Capsule', strength: '20mg', stock: 180, reorder_level: 25, unit: 'capsules', manufacturer: 'AstraZeneca', cost_price: 8, price: 20, is_taxable: false, prescription_required: false, batch_number: 'OMP-2026-033', expiry_date: '2027-04-01', barcode: '8901234560004', description: 'Proton pump inhibitor for acid reflux' },
  { name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', category: 'NSAIDs', form: 'Tablet', strength: '400mg', stock: 500, reorder_level: 60, unit: 'tablets', manufacturer: 'Boots', cost_price: 4, price: 10, is_taxable: false, prescription_required: false, batch_number: 'IBU-2026-089', expiry_date: '2027-12-30', barcode: '8901234560005', description: 'Anti-inflammatory pain reliever' },
  { name: 'Cetirizine 10mg', generic_name: 'Cetirizine HCl', category: 'Antihistamines', form: 'Tablet', strength: '10mg', stock: 300, reorder_level: 35, unit: 'tablets', manufacturer: 'Johnson & Johnson', cost_price: 3, price: 12, is_taxable: false, prescription_required: false, batch_number: 'CET-2026-072', expiry_date: '2028-01-15', barcode: '8901234560006', description: 'Allergy relief antihistamine' },
  { name: 'Losartan 50mg', generic_name: 'Losartan Potassium', category: 'Antihypertensives', form: 'Tablet', strength: '50mg', stock: 150, reorder_level: 20, unit: 'tablets', manufacturer: 'Novartis', cost_price: 15, price: 35, is_taxable: false, prescription_required: true, batch_number: 'LOS-2026-018', expiry_date: '2027-08-20', barcode: '8901234560007', description: 'Blood pressure management' },
  { name: 'Azithromycin 500mg', generic_name: 'Azithromycin', category: 'Antibiotics', form: 'Tablet', strength: '500mg', stock: 120, reorder_level: 15, unit: 'tablets', manufacturer: 'Pfizer', cost_price: 25, price: 55, is_taxable: false, prescription_required: true, batch_number: 'AZI-2026-056', expiry_date: '2027-05-10', barcode: '8901234560008', description: 'Macrolide antibiotic for infections' },
  { name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin Calcium', category: 'Statins', form: 'Tablet', strength: '20mg', stock: 200, reorder_level: 25, unit: 'tablets', manufacturer: 'Pfizer', cost_price: 10, price: 28, is_taxable: false, prescription_required: true, batch_number: 'ATO-2026-041', expiry_date: '2027-11-25', barcode: '8901234560009', description: 'Cholesterol-lowering statin' },
  { name: 'Ciprofloxacin 500mg', generic_name: 'Ciprofloxacin HCl', category: 'Antibiotics', form: 'Tablet', strength: '500mg', stock: 90, reorder_level: 15, unit: 'tablets', manufacturer: 'Bayer', cost_price: 18, price: 40, is_taxable: false, prescription_required: true, batch_number: 'CIP-2026-067', expiry_date: '2027-07-08', barcode: '8901234560010', description: 'Fluoroquinolone antibiotic' },
  { name: 'Diclofenac Gel 1%', generic_name: 'Diclofenac Sodium', category: 'NSAIDs', form: 'Gel', strength: '1%', stock: 75, reorder_level: 10, unit: 'tubes', manufacturer: 'Novartis', cost_price: 80, price: 180, is_taxable: true, prescription_required: false, batch_number: 'DIC-2026-023', expiry_date: '2027-10-12', barcode: '8901234560011', description: 'Topical anti-inflammatory gel' },
  { name: 'Salbutamol Inhaler', generic_name: 'Salbutamol Sulfate', category: 'Respiratory', form: 'Inhaler', strength: '100mcg', stock: 45, reorder_level: 8, unit: 'inhalers', manufacturer: 'GSK', cost_price: 250, price: 550, is_taxable: true, prescription_required: true, batch_number: 'SAL-2026-009', expiry_date: '2027-02-28', barcode: '8901234560012', description: 'Bronchodilator for asthma relief' },
  { name: 'Doxycycline 100mg', generic_name: 'Doxycycline Hyclate', category: 'Antibiotics', form: 'Capsule', strength: '100mg', stock: 160, reorder_level: 20, unit: 'capsules', manufacturer: 'Cipla', cost_price: 8, price: 22, is_taxable: false, prescription_required: true, batch_number: 'DOX-2026-037', expiry_date: '2027-06-30', barcode: '8901234560013', description: 'Tetracycline antibiotic' },
  { name: 'Metronidazole 400mg', generic_name: 'Metronidazole', category: 'Antibiotics', form: 'Tablet', strength: '400mg', stock: 220, reorder_level: 30, unit: 'tablets', manufacturer: 'Sanofi', cost_price: 6, price: 18, is_taxable: false, prescription_required: true, batch_number: 'MTZ-2026-051', expiry_date: '2027-04-22', barcode: '8901234560014', description: 'Antiprotozoal and antibacterial' },
  { name: 'Prednisolone 5mg', generic_name: 'Prednisolone', category: 'Corticosteroids', form: 'Tablet', strength: '5mg', stock: 100, reorder_level: 15, unit: 'tablets', manufacturer: 'Pfizer', cost_price: 7, price: 20, is_taxable: false, prescription_required: true, batch_number: 'PRD-2026-014', expiry_date: '2027-09-05', barcode: '8901234560015', description: 'Anti-inflammatory corticosteroid' },
  { name: 'Folic Acid 5mg', generic_name: 'Folic Acid', category: 'Vitamins', form: 'Tablet', strength: '5mg', stock: 400, reorder_level: 50, unit: 'tablets', manufacturer: 'Universal', cost_price: 2, price: 5, is_taxable: false, prescription_required: false, batch_number: 'FOL-2026-078', expiry_date: '2028-03-10', barcode: '8901234560016', description: 'Vitamin B9 supplement' },
  { name: 'Vitamin C 1000mg', generic_name: 'Ascorbic Acid', category: 'Vitamins', form: 'Effervescent', strength: '1000mg', stock: 250, reorder_level: 30, unit: 'tablets', manufacturer: 'Bayer', cost_price: 15, price: 35, is_taxable: true, prescription_required: false, batch_number: 'VTC-2026-090', expiry_date: '2028-06-20', barcode: '8901234560017', description: 'Immune system booster' },
  { name: 'Amlodipine 5mg', generic_name: 'Amlodipine Besylate', category: 'Antihypertensives', form: 'Tablet', strength: '5mg', stock: 180, reorder_level: 25, unit: 'tablets', manufacturer: 'Pfizer', cost_price: 8, price: 22, is_taxable: false, prescription_required: true, batch_number: 'AML-2026-029', expiry_date: '2027-12-01', barcode: '8901234560018', description: 'Calcium channel blocker for blood pressure' },
  { name: 'Fluconazole 150mg', generic_name: 'Fluconazole', category: 'Antifungals', form: 'Capsule', strength: '150mg', stock: 60, reorder_level: 10, unit: 'capsules', manufacturer: 'Pfizer', cost_price: 30, price: 65, is_taxable: false, prescription_required: true, batch_number: 'FLU-2026-043', expiry_date: '2027-08-15', barcode: '8901234560019', description: 'Antifungal treatment' },
  { name: 'ORS Sachets', generic_name: 'Oral Rehydration Salts', category: 'Gastrointestinal', form: 'Powder', strength: 'Standard', stock: 350, reorder_level: 40, unit: 'sachets', manufacturer: 'WHO Formula', cost_price: 5, price: 15, is_taxable: false, prescription_required: false, batch_number: 'ORS-2026-100', expiry_date: '2028-01-01', barcode: '8901234560020', description: 'Dehydration treatment' },
  { name: 'Cough Syrup (Dextromethorphan)', generic_name: 'Dextromethorphan', category: 'Respiratory', form: 'Syrup', strength: '15mg/5ml', stock: 80, reorder_level: 12, unit: 'bottles', manufacturer: 'Reckitt', cost_price: 120, price: 280, is_taxable: true, prescription_required: false, batch_number: 'DXM-2026-055', expiry_date: '2027-05-18', barcode: '8901234560021', description: 'Cough suppressant syrup' },
  { name: 'Insulin Glargine', generic_name: 'Insulin Glargine', category: 'Antidiabetics', form: 'Injection', strength: '100IU/ml', stock: 25, reorder_level: 5, unit: 'pens', manufacturer: 'Sanofi', cost_price: 1200, price: 2800, is_taxable: true, prescription_required: true, batch_number: 'INS-2026-003', expiry_date: '2026-12-31', barcode: '8901234560022', description: 'Long-acting insulin for diabetes' },
  { name: 'Multivitamin Complex', generic_name: 'Multivitamins + Minerals', category: 'Vitamins', form: 'Tablet', strength: 'Standard', stock: 200, reorder_level: 25, unit: 'tablets', manufacturer: 'Centrum', cost_price: 20, price: 45, is_taxable: true, prescription_required: false, batch_number: 'MVC-2026-088', expiry_date: '2028-02-14', barcode: '8901234560023', description: 'Daily vitamin and mineral supplement' },
  { name: 'Tramadol 50mg', generic_name: 'Tramadol HCl', category: 'Opioid Analgesics', form: 'Capsule', strength: '50mg', stock: 40, reorder_level: 10, unit: 'capsules', manufacturer: 'Grunenthal', cost_price: 15, price: 35, is_taxable: false, prescription_required: true, batch_number: 'TRM-2026-007', expiry_date: '2027-03-30', barcode: '8901234560024', description: 'Centrally-acting analgesic (controlled)' },
  { name: 'Loperamide 2mg', generic_name: 'Loperamide HCl', category: 'Gastrointestinal', form: 'Capsule', strength: '2mg', stock: 150, reorder_level: 20, unit: 'capsules', manufacturer: 'Johnson & Johnson', cost_price: 5, price: 15, is_taxable: false, prescription_required: false, batch_number: 'LOP-2026-062', expiry_date: '2027-10-28', barcode: '8901234560025', description: 'Anti-diarrheal medication' },
];

// ─── DEMO SUPPLIERS ──────────────────────────────────────────────
const DEMO_SUPPLIERS = [
  { name: 'MedPharm Distributors', contact_person: 'James Kariuki', email: 'james@medpharm.co.ke', phone: '+254 722 100 200', category: 'General Pharmaceuticals', is_active: true },
  { name: 'Cipla Kenya Ltd', contact_person: 'Aisha Mohamed', email: 'aisha@ciplakenya.com', phone: '+254 733 300 400', category: 'Generic Drugs', is_active: true },
  { name: 'GSK East Africa', contact_person: 'Peter Omondi', email: 'peter.omondi@gsk.com', phone: '+254 711 500 600', category: 'Brand Pharmaceuticals', is_active: true },
  { name: 'Surgical & Medical Supplies', contact_person: 'Grace Wanjiku', email: 'grace@surgmed.co.ke', phone: '+254 700 700 800', category: 'Medical Equipment', is_active: true },
  { name: 'NairobiMed Wholesalers', contact_person: 'David Mwangi', email: 'david@nairobimed.com', phone: '+254 720 900 100', category: 'Wholesale Drugs', is_active: true },
];

// ─── DEMO CUSTOMERS ──────────────────────────────────────────────
const DEMO_CUSTOMERS = [
  { name: 'Mary Wanjiku', phone: '+254712345001', points: 120 },
  { name: 'John Kamau', phone: '+254712345002', points: 85 },
  { name: 'Sarah Akinyi', phone: '+254712345003', points: 200 },
  { name: 'Peter Njoroge', phone: '+254712345004', points: 45 },
  { name: 'Faith Muthoni', phone: '+254712345005', points: 310 },
  { name: 'Brian Ochieng', phone: '+254712345006', points: 60 },
  { name: 'Lucy Njeri', phone: '+254712345007', points: 175 },
  { name: 'Daniel Kipchoge', phone: '+254712345008', points: 95 },
];

// ─── DEMO EXPENSES ───────────────────────────────────────────────
const DEMO_EXPENSES = [
  { category: 'Rent', amount: 45000, description: 'Monthly shop rent - April 2026' },
  { category: 'Electricity', amount: 8500, description: 'KPLC bill - March 2026' },
  { category: 'Water', amount: 2200, description: 'Nairobi Water - March 2026' },
  { category: 'Staff Salary', amount: 35000, description: 'Pharmacist salary advance' },
  { category: 'Transport', amount: 3500, description: 'Drug delivery transport' },
  { category: 'Supplies', amount: 12000, description: 'Packaging materials and bags' },
  { category: 'Internet', amount: 4500, description: 'Safaricom fiber monthly' },
  { category: 'Maintenance', amount: 6000, description: 'AC unit servicing' },
];

export interface SeedResult {
  success: boolean;
  message: string;
  details: string[];
}

// ─── SEED PRICING TIERS ─────────────────────────────────────────
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
    logs.push(`✅ Seeded ${DEFAULT_PRICING_TIERS.length} pricing tiers`);
  }
  return logs;
};

// ─── SEED SUPER ADMIN ────────────────────────────────────────────
export const seedSuperAdmin = async (
  email: string = 'admin@lumiaxy.ph',
  password: string = 'LumiaxySuperAdmin2026!'
): Promise<string[]> => {
  const logs: string[] = [];

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInError && signInData.user) {
    logs.push(`✅ Super Admin already exists: ${email}`);
    await supabase.auth.signOut();
    return logs;
  }

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: 'Enterprise Master', role: 'super_admin' } }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      logs.push(`⚠️ Admin ${email} is already registered.`);
    } else {
      logs.push(`❌ Failed to create Super Admin: ${error.message}`);
    }
  } else if (data.user) {
    logs.push(`✅ Super Admin created: ${email}`);
    logs.push(`🔑 Password: ${password}`);
    await supabase.auth.signOut();
  }
  return logs;
};

// ─── SEED DEMO PHARMACY + ADMIN ─────────────────────────────────
export const seedDemoPharmacy = async (): Promise<string[]> => {
  const logs: string[] = [];

  // Check if demo pharmacy already exists
  const { data: existingPharmacy } = await supabase
    .from('pharmacies')
    .select('id')
    .eq('name', 'Lumiaxy Central Pharmacy')
    .maybeSingle();

  if (existingPharmacy) {
    logs.push(`✅ Demo pharmacy already exists. Skipping.`);
    return logs;
  }

  // 1. Create pharmacy admin user
  const pharmacyAdminEmail = 'pharmacist@lumiaxy.ph';
  const pharmacyAdminPassword = 'Pharmacy2026!';

  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: pharmacyAdminEmail,
    password: pharmacyAdminPassword,
    options: {
      data: {
        full_name: 'Dr. Karen Muthoni',
        role: 'admin',
      }
    }
  });

  if (adminError && !adminError.message.includes('already registered')) {
    logs.push(`❌ Failed to create pharmacy admin: ${adminError.message}`);
    return logs;
  }

  const adminUserId = adminData?.user?.id;
  logs.push(`✅ Pharmacy admin created: ${pharmacyAdminEmail}`);
  logs.push(`🔑 Password: ${pharmacyAdminPassword}`);

  // Sign out admin so we don't interfere
  await supabase.auth.signOut();

  // 2. Create the pharmacy
  const { data: pharmacy, error: pharmacyError } = await supabase.from('pharmacies').insert({
    name: 'Lumiaxy Central Pharmacy',
    status: 'active',
    location: 'Kenyatta Avenue, Nairobi CBD',
    kra_pin: 'P051234567X',
    license_number: 'PPB-2026-0001',
    owner_id: adminUserId || '00000000-0000-0000-0000-000000000000',
    owner_phone: '+254 722 000 001',
    subscription_tier: 'Professional',
    monthly_fee: 5000,
    total_revenue_contributed: 15000,
    last_payment_date: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }).select().single();

  if (pharmacyError) {
    logs.push(`❌ Failed to create pharmacy: ${pharmacyError.message}`);
    return logs;
  }

  const pharmacyId = pharmacy.id;
  logs.push(`✅ Pharmacy created: Lumiaxy Central Pharmacy (${pharmacyId})`);

  // Update admin's pharmacy_id in profiles if it exists
  if (adminUserId) {
    await supabase.from('profiles').update({ pharmacy_id: pharmacyId }).eq('user_id', adminUserId);
  }

  // 3. Seed drugs
  const drugsToInsert = DEMO_DRUGS.map(d => ({ ...d, pharmacy_id: pharmacyId, is_active: true, created_at: new Date().toISOString() }));
  const { error: drugsError } = await supabase.from('drugs').insert(drugsToInsert);
  if (drugsError) {
    logs.push(`❌ Failed to seed drugs: ${drugsError.message}`);
  } else {
    logs.push(`✅ Seeded ${DEMO_DRUGS.length} drugs (real pharma products)`);
  }

  // 4. Seed suppliers
  const suppliersToInsert = DEMO_SUPPLIERS.map(s => ({ ...s, pharmacy_id: pharmacyId, created_at: new Date().toISOString() }));
  const { error: suppError } = await supabase.from('suppliers').insert(suppliersToInsert);
  if (suppError) {
    logs.push(`❌ Failed to seed suppliers: ${suppError.message}`);
  } else {
    logs.push(`✅ Seeded ${DEMO_SUPPLIERS.length} suppliers`);
  }

  // 5. Seed customers
  const customersToInsert = DEMO_CUSTOMERS.map(c => ({ ...c, pharmacy_id: pharmacyId, last_visit: new Date().toISOString(), created_at: new Date().toISOString() }));
  const { error: custError } = await supabase.from('customers').insert(customersToInsert);
  if (custError) {
    logs.push(`❌ Failed to seed customers: ${custError.message}`);
  } else {
    logs.push(`✅ Seeded ${DEMO_CUSTOMERS.length} customers with loyalty points`);
  }

  // 6. Seed expenses
  const expensesToInsert = DEMO_EXPENSES.map(e => ({
    ...e,
    pharmacy_id: pharmacyId,
    recorded_by: adminUserId || '00000000-0000-0000-0000-000000000000',
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
  const { error: expError } = await supabase.from('expenses').insert(expensesToInsert);
  if (expError) {
    logs.push(`❌ Failed to seed expenses: ${expError.message}`);
  } else {
    logs.push(`✅ Seeded ${DEMO_EXPENSES.length} expense records`);
  }

  // 7. Seed sales (using inserted drug data)
  const { data: insertedDrugs } = await supabase.from('drugs').select('id, name, price').eq('pharmacy_id', pharmacyId).limit(10);
  
  if (insertedDrugs && insertedDrugs.length > 0) {
    const salesData = [];
    const saleItemsData: any[] = [];

    for (let i = 0; i < 15; i++) {
      const saleId = crypto.randomUUID();
      const numItems = 1 + Math.floor(Math.random() * 4);
      let totalAmount = 0;

      const items = [];
      for (let j = 0; j < numItems; j++) {
        const drug = insertedDrugs[Math.floor(Math.random() * insertedDrugs.length)];
        const qty = 1 + Math.floor(Math.random() * 5);
        const unitPrice = drug.price;
        const itemTotal = unitPrice * qty;
        totalAmount += itemTotal;

        items.push({
          id: crypto.randomUUID(),
          sale_id: saleId,
          pharmacy_id: pharmacyId,
          drug_id: drug.id,
          quantity: qty,
          unit_price: unitPrice,
          tax_amount: 0,
          total_price: itemTotal
        });
      }

      salesData.push({
        id: saleId,
        pharmacy_id: pharmacyId,
        seller_id: adminUserId || '00000000-0000-0000-0000-000000000000',
        total_amount: totalAmount,
        tax_amount: 0,
        discount_total: 0,
        payment_method: ['cash', 'mpesa', 'card'][Math.floor(Math.random() * 3)],
        customer_name: DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)].name,
        customer_phone: null,
        notes: null,
        prescription_url: null,
        status: 'completed',
        void_reason: null,
        created_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      saleItemsData.push(...items);
    }

    const { error: salesError } = await supabase.from('sales').insert(salesData);
    if (salesError) {
      logs.push(`❌ Failed to seed sales: ${salesError.message}`);
    } else {
      logs.push(`✅ Seeded 15 sales transactions`);
      
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsData);
      if (itemsError) {
        logs.push(`❌ Failed to seed sale items: ${itemsError.message}`);
      } else {
        logs.push(`✅ Seeded ${saleItemsData.length} sale line items`);
      }
    }
  }

  // 8. Seed notifications
  const notifications = [
    { type: 'low_stock', title: 'Low Stock Alert', message: 'Insulin Glargine is below reorder level (25 remaining)', pharmacy_id: pharmacyId, read: false },
    { type: 'low_stock', title: 'Low Stock Alert', message: 'Salbutamol Inhaler stock is critically low (45 remaining)', pharmacy_id: pharmacyId, read: false },
    { type: 'expiry', title: 'Expiry Warning', message: 'Insulin Glargine batch INS-2026-003 expires on Dec 31, 2026', pharmacy_id: pharmacyId, read: false },
    { type: 'payment', title: 'Subscription Payment', message: 'Your Professional plan payment of KES 5,000 is due in 7 days', pharmacy_id: pharmacyId, read: true },
    { type: 'info', title: 'Welcome to Lumiaxy', message: 'Your pharmacy has been successfully onboarded. Start by adding your inventory.', pharmacy_id: pharmacyId, read: true },
  ];
  const { error: notifError } = await supabase.from('notifications').insert(notifications);
  if (notifError) {
    logs.push(`❌ Failed to seed notifications: ${notifError.message}`);
  } else {
    logs.push(`✅ Seeded ${notifications.length} notifications`);
  }

  // 9. Seed announcements
  const announcements = [
    { title: 'System Update v2.0', message: 'Lumiaxy Enterprise has been updated with cloud sync, barcode scanning, and real-time analytics.', target_role: 'all' },
    { title: 'New Regulatory Compliance', message: 'PPB has mandated all pharmacies to digitize drug dispensing logs by Q3 2026.', target_role: 'admin' },
  ];
  const { error: annError } = await supabase.from('announcements').insert(announcements);
  if (annError) {
    logs.push(`❌ Failed to seed announcements: ${annError.message}`);
  } else {
    logs.push(`✅ Seeded ${announcements.length} announcements`);
  }

  // 10. Seed audit logs
  const auditLogs = [
    { pharmacy_id: pharmacyId, user_id: adminUserId || '', user_name: 'Dr. Karen Muthoni', action: 'Logged in', module: 'Auth' },
    { pharmacy_id: pharmacyId, user_id: adminUserId || '', user_name: 'Dr. Karen Muthoni', action: 'Added 25 drugs to inventory', module: 'Inventory' },
    { pharmacy_id: pharmacyId, user_id: adminUserId || '', user_name: 'Dr. Karen Muthoni', action: 'Processed sale #001 (KES 2,450)', module: 'POS' },
    { pharmacy_id: pharmacyId, user_id: adminUserId || '', user_name: 'Dr. Karen Muthoni', action: 'Added supplier MedPharm Distributors', module: 'Suppliers' },
    { pharmacy_id: pharmacyId, user_id: adminUserId || '', user_name: 'Enterprise Master', action: 'System seeded with demo data', module: 'System' },
  ];
  const { error: auditError } = await supabase.from('audit_logs').insert(auditLogs);
  if (auditError) {
    logs.push(`❌ Failed to seed audit logs: ${auditError.message}`);
  } else {
    logs.push(`✅ Seeded ${auditLogs.length} audit log entries`);
  }

  return logs;
};

// ─── FULL SEED ───────────────────────────────────────────────────
export const seedSupabaseDatabase = async (): Promise<SeedResult> => {
  const details: string[] = [];

  try {
    details.push('━━━ PRICING TIERS ━━━');
    details.push(...await seedPricingTiers());

    details.push('');
    details.push('━━━ SUPER ADMIN ━━━');
    details.push(...await seedSuperAdmin());

    details.push('');
    details.push('━━━ DEMO PHARMACY + DATA ━━━');
    details.push(...await seedDemoPharmacy());

    const hasErrors = details.some(d => d.startsWith('❌'));

    details.push('');
    details.push('━━━ LOGIN CREDENTIALS ━━━');
    details.push('👑 Super Admin: admin@lumiaxy.ph / LumiaxySuperAdmin2026!');
    details.push('💊 Pharmacy Admin: pharmacist@lumiaxy.ph / Pharmacy2026!');

    return {
      success: !hasErrors,
      message: hasErrors ? 'Seeding completed with some errors.' : '🎉 Full database seeded with demo data!',
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
