import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import AuthLayout from "@/layout/authLayout";
import AuthHeader from "@/components/header/auth-header";

interface LoginPayload {
  email: string;
  password: string;
}

async function loginMutation(payload: LoginPayload) {
  const res = await axios.post(`${BACKEND_URL}/auth/login`, payload, {
    withCredentials: true,
  });
  return res.data;
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: loginMutation,
    onSuccess: (data) => {
      toast.success("Logged in successfully");
      if (data.success) {
        navigate("/");
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (e: any) => {
      if (e?.response?.data?.message) {
        toast.error(e?.response?.data?.message);
        return;
      }
      toast.error("Login failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    mutate({ email, password });
  };

  return (
    <AuthLayout>
      <AuthHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground">
                Log in to your Kaleshi account
              </p>
            </div>
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full glow-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
