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
import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const userState = useRecoilValue(userAtom);
  return (
    <header className="border-b bg-white">
      <div className="px-4 md:px-6 py-4  w-[90%] mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-green-600">Kaleshi</div>
            <nav className="hidden md:flex gap-6">
              <a
                href="/markets"
                className="text-sm font-medium text-foreground hover:text-green-600 transition"
              >
                Markets
              </a>
              <a href="/live" className="text-sm font-medium text-red-600">
                Live
              </a>
              <a
                href="/ideas"
                className="text-sm font-medium text-foreground hover:text-green-600 transition"
              >
                Ideas
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4 flex-1 max-w-xs">
            <div className="relative hidden sm:block flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search markets or profiles"
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userState.isLoggedIn ? (
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
                <Button variant="link" onClick={() => navigate("/auth/login")}>
                  Login
                </Button>
                <Button variant="link" onClick={() => navigate("/auth/signup")}>
                  Signup
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t"></div>
      <div className="px-4 md:px-6  w-[90%] mx-auto">
        <div className="flex gap-6 overflow-x-auto">
          {[
            "Trending",
            "New",
            "All",
            "Politics",
            "Sports",
            "Culture",
            "Crypto",
            "Climate",
            "Economics",
            "Mentions",
            "Companies",
            "Financials",
            "Tech & Science",
          ].map((tab, i) => (
            <button
              key={i}
              className={`py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                i === 0
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
