import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
}

interface AuthState {
  user: AdminUser | null
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
          const response = await fetch('/api/admin/login', {
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
      name: 'admin-auth-storage',
    }
  )
)
