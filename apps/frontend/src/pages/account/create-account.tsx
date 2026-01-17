import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Wallet,
  CheckCircle2,
  Loader2,
  Shield,
  Zap,
  TrendingUp,
  DollarSign,
  CoinsIcon,
} from "lucide-react";
import {
  useCreateTradingAccount,
  useCurrentUserAccount,
} from "@/schemas/account/hooks";
import Loading from "@/components/loading";
import RootLayout from "@/layout/rootLayout";
import CreateAccountHeader from "./components/header";
import { useCurrentUser } from "@/schemas/layout/hooks";

export default function CreateTradingAccountPage() {
  const currentUser = useCurrentUser();
  const currentUserAccount = useCurrentUserAccount();
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateTradingAccount();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Account created successfully");
          navigate("/");
          return;
        }
        toast.error("Account creation failed");
      },
    });
  };

  if (currentUser.isError) {
    const msg = currentUser.error.message;
    toast(msg || "Some error occoured, please try again later");
    return;
  }

  if (isPending || currentUser.isLoading || currentUserAccount.isLoading) {
    return <Loading />;
  }
  if (currentUserAccount?.data?.account) {
    return (
      <RootLayout isPrivate={true} currentUser={currentUser.data}>
        <div className="bg-background">
          <CreateAccountHeader />
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-md mx-auto text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/20 mb-6">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold mb-4">
                Trading Account Active
              </h1>
              <p className="text-muted-foreground mb-8">
                Your trading account is ready. You can now buy and sell
                contracts on any market.
              </p>

              <div className="glass-card p-6 text-left mb-6">
                <h3 className="font-semibold mb-4">Account Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account ID</span>
                    <span className="font-mono">
                      {currentUser.data.user.accountId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-success">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <div className="flex justify-end items-center gap-2 text-green-700">
                      <CoinsIcon />
                      <span className="text-success">
                        {currentUserAccount.data.account.coins} Coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate("/")} className="glow-primary">
                Explore Markets
              </Button>
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }
  return (
    <RootLayout isPrivate={true} currentUser={currentUser.data}>
      <div className="bg-background">
        <CreateAccountHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-4">
                Create Trading Account
              </h1>
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
                <li className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Initial Funds</p>
                    <p className="text-sm text-muted-foreground underline">
                      You'll get initial funds of 3 coins
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full glow-accent bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isPending}
            >
              {isPending ? (
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
    </RootLayout>
  );
}
