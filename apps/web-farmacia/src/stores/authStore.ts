import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Using relative paths allows the Vite proxy (configured in vite.config.ts) 
// to handle requests, which avoids connection errors and CORS issues in development.
const API_URL = import.meta.env.VITE_API_URL || '';

interface PharmacyUser {
  id: number
  email: string
  name: string
  pharmacyId: number
  pharmacyName: string
  role: string
}

interface AuthState {
  user: PharmacyUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        try {
          // Use relative path to leverage the Vite proxy
          const response = await fetch(`/api/pharmacy/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          if (response.ok) {
            const data = await response.json()
            set({ user: data.user, isAuthenticated: true })
            return true
          }
          return false
        } catch (error) {
          console.error('Login error:', error)
          return false
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'pharmacy-auth-storage',
    }
  )
)
