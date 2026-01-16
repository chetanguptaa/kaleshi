import { atom } from "recoil";

export interface IUserAtom {
  name: string;
  email: string;
  account_id: string | null;
  sub: number;
}

const userAtom = atom<{
  isLoggedIn: boolean;
  user: IUserAtom | null;
}>({
  key: "userAtom",
  default: {
    isLoggedIn: false,
    user: null,
  },
});

export default userAtom;
