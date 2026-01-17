import Loading from "@/components/loading";
import { BACKEND_URL, ROLES } from "@/constants";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userAtom);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getResponse = async () => {
      try {
        setLoading(true);
        const res = await axios.get(BACKEND_URL + "/auth/me", {
          withCredentials: true,
        });
        if (!res.data.user || !res.data.success) {
          setUser({
            isLoggedIn: false,
            user: null,
          });
          return;
        }
        setUser({
          isLoggedIn: true,
          user: {
            sub: res.data.user.id,
            account_id: res.data.user.account_id,
            name: res.data.user.name,
            email: res.data.user.email,
            roles: res.data.user.roles,
            isAdmin: res.data.user.roles.includes(ROLES.ADMIN),
          },
        });
        navigate("/");
        return;
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    if (!user.isLoggedIn) {
      getResponse();
    }
  }, [user.isLoggedIn]);
  if (loading) {
    return <Loading />;
  }
  return <div className="bg-background">{children}</div>;
}
