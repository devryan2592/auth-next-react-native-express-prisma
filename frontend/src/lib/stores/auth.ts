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

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  logout: () => void
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
      accessToken: null,
      isAuthenticated: false,
      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: !!user && !!state.accessToken,
        })),
      setAccessToken: (token) =>
        set((state) => ({
          accessToken: token,
          isAuthenticated: !!token && !!state.user,
        })),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
) 