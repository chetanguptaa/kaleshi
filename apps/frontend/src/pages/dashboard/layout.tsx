import { BACKEND_URL } from "@/constants";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { useEffect } from "react";
import { useRecoilState } from "recoil";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useRecoilState(userAtom);

  useEffect(() => {
    const getResponse = async () => {
      try {
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
            account_id: res.data.account_id,
            name: res.data.name,
            email: res.data.email,
          },
        });
      } catch (error) {
        console.log(error);
      }
    };
    if (!user.isLoggedIn) {
      getResponse();
    }
  }, [user.isLoggedIn]);

  return <div className="bg-background">{children}</div>;
}
