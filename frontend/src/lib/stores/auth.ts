import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'

interface User {
  id: string
  email: string
  isVerified: boolean
  isTwoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface Session {
  id: string;
  accessToken?: string;
  refreshToken?: string;
  ipAddress?: string;
  deviceType?: string | null;
  deviceName?: string | null;
  browser?: string | null;
  os?: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

const cookieStorage = {
  getItem: (name: string) => {
    const value = Cookies.get(name)
    return value ? value : null
  },
  setItem: (name: string, value: string) => {
    Cookies.set(name, value, {
      expires: 7, // 7 days
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    })
  },
  removeItem: (name: string) => Cookies.remove(name)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user && !!state.session,
        })),
      setSession: (session) =>
        set((state) => ({
          session,
          isAuthenticated: !!session && !!state.user,
        })),
      logout: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
) 