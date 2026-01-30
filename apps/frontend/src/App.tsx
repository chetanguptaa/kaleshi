import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/login";
import SignupPage from "./pages/auth/signup";
import NotFound from "./pages/not-found/not-found";
import { queryClient } from "./query/query-client";
import DashboardPage from "./pages/dashboard/dashboard";
import { RecoilRoot } from "recoil";
import TradingAccountPage from "./pages/account/create-account";
import Market from "./pages/market/market";

const App = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/trading-account" element={<TradingAccountPage />} />
            <Route path="/market/:id" element={<Market />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
