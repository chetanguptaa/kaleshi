import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CategoryPage from "./pages/CategoryPage";
import MarketPage from "./pages/MarketPage";
import LoginPage from "./pages/auth/login";
import SignupPage from "./pages/auth/signup";
import TradingAccountPage from "./pages/TradingAccountPage";
import NotFound from "./pages/not-found/not-found";
import { queryClient } from "./query/query-client";
import DashboardPage from "./pages/dashboard/dashboard";
import { RecoilRoot } from "recoil";

const App = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route
              path="/category/:categoryId/:subcategoryId"
              element={<CategoryPage />}
            />
            <Route path="/market/:marketId" element={<MarketPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/trading-account" element={<TradingAccountPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
