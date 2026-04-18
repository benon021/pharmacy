import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const DrugCatalog = lazy(() => import("./pages/admin/DrugCatalog"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const SellerManagement = lazy(() => import("./pages/admin/SellerManagement"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const ExpiryTracker = lazy(() => import("./pages/admin/ExpiryTracker"));
const SupplierManagement = lazy(() => import("./pages/admin/SupplierManagement"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const ExpenseManagement = lazy(() => import("./pages/admin/ExpenseManagement"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerCatalog = lazy(() => import("./pages/seller/SellerCatalog"));
const NewSale = lazy(() => import("./pages/seller/NewSale"));
const SalesHistory = lazy(() => import("./pages/seller/SalesHistory"));
const Settings = lazy(() => import("./pages/shared/Settings"));
const DebugSetup = lazy(() => import("./pages/DebugSetup"));
const StaffAttendance = lazy(() => import("./pages/admin/StaffAttendance"));
const CustomerLoyalty = lazy(() => import("./pages/admin/CustomerLoyalty"));
const SupportCenter = lazy(() => import("./pages/support/SupportCenter"));
const PharmacyOnboarding = lazy(() => import("./pages/admin/PharmacyOnboarding"));
const BillingManagement = lazy(() => import("./pages/admin/BillingManagement"));
const PlatformPulse = lazy(() => import("./pages/admin/PlatformPulse"));
const DistributionNodes = lazy(() => import("./pages/admin/DistributionNodes"));
const RemoteScanner = lazy(() => import("./pages/shared/RemoteScanner"));
const MessagingHub = lazy(() => import("./pages/shared/MessagingHub"));
const ProfileHub = lazy(() => import("./pages/shared/ProfileHub"));
const DrugResearch = lazy(() => import("./pages/shared/DrugResearch"));


const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="rx-theme">
        <AuthProvider>
          <TenantProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/debug-setup" element={<DebugSetup />} />
                  <Route path="/remote-scanner" element={<RemoteScanner />} />
                  <Route path="/remote-scanner/:sessionId" element={<RemoteScanner />} />
                  <Route path="/research" element={<ProtectedRoute requiredRole={["super_admin", "admin", "seller"]}><AppLayout><DrugResearch /></AppLayout></ProtectedRoute>} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/drugs" element={<ProtectedRoute requiredRole="admin"><AppLayout><DrugCatalog /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/sales" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminSales /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/sellers" element={<ProtectedRoute requiredRole="admin"><AppLayout><SellerManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminReports /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/expiry" element={<ProtectedRoute requiredRole="admin"><AppLayout><ExpiryTracker /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/suppliers" element={<ProtectedRoute requiredRole="admin"><AppLayout><SupplierManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/audit" element={<ProtectedRoute requiredRole="admin"><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/expenses" element={<ProtectedRoute requiredRole="admin"><AppLayout><ExpenseManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/attendance" element={<ProtectedRoute requiredRole="admin"><AppLayout><StaffAttendance /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/loyalty" element={<ProtectedRoute requiredRole="admin"><AppLayout><CustomerLoyalty /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                  <Route path="/messaging" element={<ProtectedRoute requiredRole={["super_admin", "admin", "seller"]}><AppLayout><MessagingHub /></AppLayout></ProtectedRoute>} />
                  <Route path="/support" element={<ProtectedRoute requiredRole={["super_admin", "admin", "seller"]}><AppLayout><MessagingHub /></AppLayout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute requiredRole={["super_admin", "admin", "seller"]}><AppLayout><ProfileHub /></AppLayout></ProtectedRoute>} />
                  <Route path="/profile/:userId" element={<ProtectedRoute requiredRole={["super_admin", "admin", "seller"]}><AppLayout><ProfileHub /></AppLayout></ProtectedRoute>} />

                  {/* Super Admin routes */}
                  <Route path="/super-admin" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><SuperAdminDashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/super-admin/pharmacies" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><DistributionNodes /></AppLayout></ProtectedRoute>} />
                  <Route path="/super-admin/onboard" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><PharmacyOnboarding /></AppLayout></ProtectedRoute>} />
                  <Route path="/super-admin/billing" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><BillingManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/super-admin/pulse" element={<ProtectedRoute requiredRole="super_admin"><AppLayout><PlatformPulse /></AppLayout></ProtectedRoute>} />

                  {/* Seller routes */}
                  <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><AppLayout><SellerDashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/seller/catalog" element={<ProtectedRoute requiredRole="seller"><AppLayout><SellerCatalog /></AppLayout></ProtectedRoute>} />
                  <Route path="/seller/new-sale" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><NewSale /></AppLayout></ProtectedRoute>} />
                  <Route path="/seller/history" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><SalesHistory /></AppLayout></ProtectedRoute>} />
                  <Route path="/seller/settings" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>

            </TooltipProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
