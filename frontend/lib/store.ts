import { create } from "zustand";
import { api } from "./api";

interface User {
    id: string;
    username: string;
    avatarUrl: string | null;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    setLoading: (status: boolean) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
    setLoading: (status) => set({ isLoading: status }),
    checkAuth: async () => {
        try {
            const res = await api.get("/auth/me");
            set({ user: res.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    }
}));