import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  hasTradingAccount: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  createTradingAccount: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock validation
        if (email && password.length >= 6) {
          set({
            user: {
              id: crypto.randomUUID(),
              name: email.split('@')[0],
              email,
              hasTradingAccount: false,
            },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },
      
      signup: async (name: string, email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock validation
        if (name && email && password.length >= 6) {
          set({
            user: {
              id: crypto.randomUUID(),
              name,
              email,
              hasTradingAccount: false,
            },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      createTradingAccount: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { user } = get();
        if (user) {
          set({
            user: { ...user, hasTradingAccount: true },
          });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'kaleshi-auth',
    }
  )
);
