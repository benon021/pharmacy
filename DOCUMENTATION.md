# Kenya Rx Flow Premium Enterprise OS 
**Official System Documentation**

---

## 1. System Overview
**Kenya Rx Flow Premium** is a cutting-edge, ultra-responsive Pharmacy Management System designed for high-density, fast-paced retail and clinical environments. It operates as a local-first application, achieving instant latency by bypassing external API requirements. 

Visually, it is designed around a *"Cyber Premium"* glassmorphic architecture: enforcing stark dark-mode aesthetics, dynamic deep-glow visual feedback, and real-time interface rendering for an Enterprise-grade user experience.

---

## 2. Architecture & Technology Stack
*   **Core Framework**: React 18, bundled securely via Vite.
*   **Routing Architecture**: React Router v7 (Client-side localized routing).
*   **Local Persistence Engine**: Custom-built, synchronous `localDb` engine running on browser `localStorage`. 
*   **Interface Layer**: Tailwind CSS paired with custom-curated CSS variables (`index.css`) handling deep shadows, glass backgrounds (`bg-white/[0.04]`), and hardware-accelerated animations.
*   **Data Visualization**: Recharts (used for high-fidelity velocity graphs).
*   **Iconography**: Lucide React.

---

## 3. Database Schema (`localDb`)
The database has been fully abstracted from Supabase. It operates locally by serializing highly optimized JSON blobs. The foundational modules are:

1.  **Users (`rx_users`)**: Defines credentials, avatar URLs, and determines system access via Role-Based Access Control (RBAC).
2.  **Drugs (`rx_drugs`)**: The central repository. Tracks naming, formula, categorization (OTC vs. Controlled), pricing grids (wholesale/retail), inventory counts, and PPB compliance properties.
3.  **Sales & Linkers (`rx_sales` & `rx_sale_items`)**: Records transaction metadata (cashier, total value) and the respective line-item breakdown linking back to `rx_drugs`.
4.  **Expenses (`rx_expenses`)**: Enterprise tracker handling arbitrary facility cash burn (Rent, Power, Developer salaries), which is merged against `rx_sales` to generate authentic Net Profit calculations.
5.  **Audit Trail (`rx_audit_logs`)**: An immutable, forensic ledger tracking every major system event (drug addition, system seeding, sales voiding) tagged with the exact user timestamp.

---

## 4. Role-Based Access Control (RBAC)
The architecture routes traffic based strictly on the current active user context:

### The Administrator (`admin`)
The undisputed controller of the platform. They have overarching capabilities:
*   **Command Center (Dashboard)**: See top-down system statistics, Real-Time Profitability Forensics (Income vs. Expense bar charts), and active terminal states.
*   **Data Liquidity**: Add, edit, or archive drugs, users, and audit logs.
*   **Financial Integrity**: Override safety mechanics (such as dispensing expired or zero-stock medicines under emergency protocols).

### The Seller (`seller` / `cashier`)
Restricted to operational execution to preserve system integrity.
*   **Retail POS Terminal**: Build carts and execute cash transactions efficiently.
*   **Inventory Navigation**: Safely view catalogs, check real-time stock levels, and pull intelligence reports.
*   **Restrictions**: Cannot view financial dashboards, cannot edit drug profiles, and are aggressively locked out of selling 0-stock or critically expired products.

---

## 5. Core Operational Modules

### The Retail POS Terminal (`NewSale.tsx`)
A high-velocity transaction matrix. 
*   Medicine cards are dynamically rendered with real-time stock statuses. 
*   Features "Hover Glows" and disabled states for Out-of-Stock items. 
*   Adding to the cart is strictly handled via the isolated `+` button to prevent accidental overrides.

### Entity Intelligence Modal (`EntityIntelligenceModal.tsx`)
The absolute centerpiece of the platform's diagnostic tools. It serves as a universal, securely constrained popup (`max-h-[85vh]`) that adapts its display based on the entity passed to it:
*   **Drugs**: Analyzes the specific drug, rendering a 7-day sales velocity chart, profit margin calculators, expiry indicators, and extra manual clinical details.
*   **Expenses**: Details transaction timestamps and memos.
*   **Sellers**: Exposes ID numbers, authorization states, and avatar data.

### Inventory Health Monitor (`ExpiryTracker.tsx`)
A strictly hierarchical compliance board that processes the entire internal database to yield immediate problem items. It ranks issues by highest operational threat:
1.  **EXPIRED** [Red] (Highest Threat)
2.  **FINISHED (0 Stock)** [Red]
3.  **CRITICAL EXPIRY** (< 30 days) [Orange]
4.  **LOW STOCK** [Orange]
5.  **WARNING EXPIRY** (< 90 days) [Amber]
6.  **HEALTHY** [Green]

---

## 6. Design System Guidelines
Should developers continue building on this platform, the following aesthetic design tokens **must** be adhered to:
*   **Containers**: Use `.premium-card` or `.glass-panel` rather than flat colors to maintain the "holographic" OS illusion.
*   **Borders**: Borders should never be fully white. Use `border-white/5` or `border-white/10`.
*   **Typography**: Core headers utilize `bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent` and often heavily utilize `italic tracking-tighter` for emphasis.
*   **Accents**: Avoid raw `#FF0000` reds. Use the Tailwind default `.text-red-500` mixed heavily with alpha backgrounds like `bg-red-500/10` to avoid visually blinding the user.

---

> [!IMPORTANT]
> Because this system is running on `localDb` via LocalStorage, clearing your browser caching/site data **will permanently destroy the local database state**. It is incredibly effective for standalone kiosk environments but data must be exported if changing primary terminals.
