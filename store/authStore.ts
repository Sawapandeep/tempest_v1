// src/store/authStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserProfile } from "@/types/user";

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGuest: (isGuest: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        isGuest: false,

        setUser: (user) =>
          set({
            user,
            isAuthenticated: user !== null,
            isLoading: false,
          }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setIsGuest: (isGuest) => set({ isGuest }),
        logout: () =>
          set({
            user: null,
            isAuthenticated: false,
            isGuest: false,
          }),
      }),
      {
        name: "tempest-auth",
        partialize: (state) => ({ isGuest: state.isGuest }),
      }
    ),
    { name: "tempest-auth-store" }
  )
);