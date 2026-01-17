import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import AuthLayout from "@/layout/authLayout";
import AuthHeader from "@/components/header/auth-header";

interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

async function signupMutation(payload: SignupPayload) {
  const res = await axios.post(`${BACKEND_URL}/auth/signup`, payload, {
    withCredentials: true,
  });
  return res.data;
}

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: signupMutation,
    onSuccess: (data) => {
      toast.success("Account created successfully");
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
      toast.error("Signup failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    mutate({ name, email, password });
  };

  return (
    <AuthLayout>
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground">
                Start trading on real-world events
              </p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

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
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  At least 8 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full glow-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
