import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ShopProfile from "./pages/ShopProfile";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ShopRegistration from "./pages/ShopRegistration";
import JobBoard from "./pages/JobBoard";
import ShopDashboard from "./pages/ShopDashboard";
import JobApplications from "./pages/JobApplications";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Wallet from "./pages/Wallet";
import PaymentProcessing from "./pages/PaymentProcessing";
import Premium from "./pages/Premium";
import DeliveryAddresses from "./pages/DeliveryAddresses";
import MapPage from "./pages/MapPage";

import { LanguageSelector } from "@/components/LanguageSelector";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { CartProvider } from "@/contexts/CartContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminShops from "@/pages/admin/Shops";
import AdminShopEditor from "@/pages/admin/ShopEditor";
import AdminProducts from "@/pages/admin/Products";
import AdminProductEditor from "@/pages/admin/ProductEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <div className="pb-16 md:pb-0"> {/* Padding for mobile bottom nav */}
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/shop/:id" element={<ShopProfile />} />
              <Route path="/register-shop" element={<ShopRegistration />} />
              <Route path="/dashboard" element={<ShopDashboard />} />
              <Route path="/jobs" element={<JobBoard />} />
              <Route path="/applications" element={<JobApplications />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/payment-processing" element={<PaymentProcessing />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/delivery-addresses" element={<DeliveryAddresses />} />
              <Route path="/map" element={<MapPage />} />
              
              {/* ADMIN ROUTES */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="shops" element={<AdminShops />} />
                <Route path="shops/new" element={<AdminShopEditor />} />
                <Route path="shops/:id" element={<AdminShopEditor />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductEditor />} />
                <Route path="products/:id" element={<AdminProductEditor />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
            </div>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

