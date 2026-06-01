// Auth state using Zustand
import { create } from 'zustand'
import type { User } from '../types'
import { getStoredUser, getStoredToken, setSession, clearSession, verifyToken } from '../auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  initialize: () => void
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialize: () => {
    const user = getStoredUser()
    const token = getStoredToken()
    if (user && token && verifyToken(token)) {
      set({ user, isLoading: false })
    } else {
      clearSession()
      set({ user: null, isLoading: false })
    }
  },
  setAuth: (user, token) => {
    setSession(user, token)
    set({ user, isLoading: false })
  },
  logout: () => {
    clearSession()
    set({ user: null, isLoading: false })
  },
}))
