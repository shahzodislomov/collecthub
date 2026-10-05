import { create } from "zustand";

interface User {
    id: string
    username: string
    avatarUrl: string | null
}
interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (user: User) => void
    logout: () => void
    setLoading: (status: boolean) => void
}
export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => set({user, isAuthenticated: true, isLoading: false}),
    logout: () => set({user: null, isAuthenticated: false, isLoading: true}),
    setLoading: (status) => set({isLoading: status})
}))