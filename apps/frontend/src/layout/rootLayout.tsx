import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import { TGetCurrentUserResponse } from "@/schemas/layout/schema";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RootLayout({
  children,
  isPrivate = true,
  currentUser,
}: {
  children: React.ReactNode;
  isPrivate: boolean;
  currentUser: TGetCurrentUserResponse | null;
}) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!isPrivate) return;
    if (!currentUser?.user || !currentUser.success) {
    }
  }, [isPrivate, currentUser, navigate]);
  return (
    <div className="bg-background">
      <div className="flex-1 overflow-hidden pb-20">{children}</div>
      <Footer />
    </div>
  );
}
