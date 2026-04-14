import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DrugCatalog from "./pages/admin/DrugCatalog";
import AdminSales from "./pages/admin/AdminSales";
import SellerManagement from "./pages/admin/SellerManagement";
import AdminReports from "./pages/admin/AdminReports";
import ExpiryTracker from "./pages/admin/ExpiryTracker";
import SupplierManagement from "./pages/admin/SupplierManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import ExpenseManagement from "./pages/admin/ExpenseManagement";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerCatalog from "./pages/seller/SellerCatalog";
import NewSale from "./pages/seller/NewSale";
import SalesHistory from "./pages/seller/SalesHistory";
import Settings from "./pages/shared/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="rx-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />

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
              <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

              {/* Seller routes */}
              <Route path="/seller" element={<ProtectedRoute requiredRole="seller"><AppLayout><SellerDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/seller/catalog" element={<ProtectedRoute requiredRole="seller"><AppLayout><SellerCatalog /></AppLayout></ProtectedRoute>} />
              <Route path="/seller/new-sale" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><NewSale /></AppLayout></ProtectedRoute>} />
              <Route path="/seller/history" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><SalesHistory /></AppLayout></ProtectedRoute>} />
              <Route path="/seller/settings" element={<ProtectedRoute requiredRole={["admin", "seller"]}><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
