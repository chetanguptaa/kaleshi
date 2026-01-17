import Logo from "@/components/header/logo";
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
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreateAccountHeader() {
  const navigate = useNavigate();
  return (
    <header className="border-b bg-white">
      <div className="px-4 md:px-6 py-4  w-[90%] mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-3">
              <>
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
              </>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t"></div>
    </header>
  );
}
