import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";
import {
  Wallet,
  CheckCircle2,
  Loader2,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";

const TradingAccountPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, createTradingAccount } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/auth/login");
    return null;
  }

  const handleCreate = async () => {
    setIsLoading(true);
    const success = await createTradingAccount();
    setIsLoading(false);

    if (success) {
      toast.success("Trading account created! You can now place orders.");
    } else {
      toast.error("Failed to create trading account");
    }
  };

  if (user?.hasTradingAccount) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Trading Account Active</h1>
            <p className="text-muted-foreground mb-8">
              Your trading account is ready. You can now buy and sell contracts
              on any market.
            </p>

            <div className="glass-card p-6 text-left mb-6">
              <h3 className="font-semibold mb-4">Account Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono">{user.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-success">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-mono text-accent">$10,000.00</span>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate("/")} className="glow-primary">
              Explore Markets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-accent/20 glow-accent mb-6">
              <Wallet className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Create Trading Account</h1>
            <p className="text-muted-foreground">
              You need a trading account to buy and sell contracts on Kaleshi
              markets.
            </p>
          </div>

          <div className="glass-card p-6 mb-8">
            <h3 className="font-semibold mb-4">What you'll get:</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Trade on all markets</p>
                  <p className="text-sm text-muted-foreground">
                    Access sports, politics, crypto, and more
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Market & limit orders</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your execution strategy
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Secure & regulated</p>
                  <p className="text-sm text-muted-foreground">
                    Your funds are protected
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleCreate}
            size="lg"
            className="w-full glow-accent bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 mr-2" />
                Create Trading Account
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By creating an account, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingAccountPage;
