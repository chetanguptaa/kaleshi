import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BACKEND_URL } from "@/constants";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { Menu, Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue } from "recoil";
import Logo from "./logo";

const selectedTabs = [];

export default function Header({
  selectedTab,
}: {
  selectedTab: string | null;
}) {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userAtom);
  return (
    <header className="border-b bg-white">
      <div className="px-4 md:px-6 py-4  w-[90%] mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex gap-2">
              {selectedTabs.map((st) => (
                <Button
                  key={st.label}
                  variant="link"
                  className={
                    selectedTab && selectedTab === st.label
                      ? "text-blue-500 underline"
                      : "text-black"
                  }
                  asChild
                >
                  <Link to={st.url}>{st.label}</Link>
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex gap-2">
            <div className="flex items-end gap-4 flex-1 max-w-xs">
              <div className="relative hidden sm:block flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search markets"
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user.isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Menu />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem>Profile</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        const res = await axios.post(
                          BACKEND_URL + "/auth/logout",
                          {},
                          {
                            withCredentials: true,
                          },
                        );
                        if (res.status === 200) {
                          setUser({
                            isLoggedIn: false,
                            user: null,
                          });
                          navigate("/auth/login");
                        }
                      }}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="gap-2 flex justify-center items-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/auth/login")}
                  >
                    Login
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => navigate("/auth/signup")}
                  >
                    Signup
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t"></div>
    </header>
  );
}
