import Loading from "@/components/loading";
import { BACKEND_URL, ROLES } from "@/constants";
import { useCurrentUser } from "@/schemas/layout/hooks";
import { TGetCurrentUserResponse } from "@/schemas/layout/schema";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthLayout({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: TGetCurrentUserResponse | null;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!currentUser?.user || !currentUser.success) {
      navigate("/auth/login");
    }
  }, [currentUser, navigate]);
  return <div className="bg-background">{children}</div>;
}
