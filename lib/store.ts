// lib/store.ts
// Global state management with Zustand

import { create } from "zustand";

/* ─── Types ─────────────────────────────────────────────────────── */
export interface RiderLocation {
  userId: string;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  altitude: number;
  status: "riding" | "stopped" | "sos" | "offline";
  lastUpdate: number;
  batteryLevel: number;
  distanceFromMe?: number;
}

export interface GroupRide {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  status: "active" | "completed" | "paused";
  inviteCode: string;
  riders: string[];
  startedAt: number;
  meetingPoint?: { lat: number; lng: number; name: string };
  description?: string;
  maxRiders?: number;
}

export interface MapSettings {
  style: "dark" | "satellite" | "terrain";
  showPetrolPumps: boolean;
  showWashrooms: boolean;
  showMechanics: boolean;
  showHospitals: boolean;
  showFoodStops: boolean;
  showScenicSpots: boolean;
  showWeather: boolean;
  trafficLayer: boolean;
  followMode: boolean;
  bearing: number;
  zoom: number;
}

export interface NavState {
  isNavigating: boolean;
  destination: { lat: number; lng: number; name: string } | null;
  currentRoute: GeoJSON.Feature | null;
  distanceRemaining: number;
  etaMinutes: number;
  nextManeuver: string;
  nextManeuverDistance: number;
}

export interface UserState {
  id: string | null;
  displayName: string;
  avatarColor: string;
  avatarInitials: string;
  photoURL: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

export interface MusicState {
  isPlaying: boolean;
  trackTitle: string;
  artist: string;
  albumArt: string | null;
  app: "spotify" | "youtube-music" | "vlc" | "poweramp" | "local" | null;
  duration: number;
  position: number;
}

export type ActiveSection = "map" | "group" | "music";
export type Theme = "dark" | "light";

/* ─── App Store ─────────────────────────────────────────────────── */
interface AppStore {
  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  // Active section
  activeSection: ActiveSection;
  setActiveSection: (s: ActiveSection) => void;

  // User
  user: UserState;
  setUser: (u: Partial<UserState>) => void;

  // Location
  myLocation: { lat: number; lng: number; heading: number; speed: number; altitude: number } | null;
  setMyLocation: (loc: AppStore["myLocation"]) => void;

  // Group ride
  activeRide: GroupRide | null;
  setActiveRide: (r: GroupRide | null) => void;
  riderLocations: Record<string, RiderLocation>;
  updateRiderLocation: (userId: string, loc: RiderLocation) => void;
  removeRider: (userId: string) => void;

  // Map settings
  mapSettings: MapSettings;
  updateMapSettings: (s: Partial<MapSettings>) => void;

  // Navigation
  navState: NavState;
  setNavState: (s: Partial<NavState>) => void;
  startNavigation: (destination: { lat: number; lng: number; name: string }) => void;
  stopNavigation: () => void;

  // SOS
  sosActive: boolean;
  triggerSOS: () => void;
  cancelSOS: () => void;

  // Music
  music: MusicState;
  setMusic: (m: Partial<MusicState>) => void;

  // UI state
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  isRideModalOpen: boolean;
  setIsRideModalOpen: (v: boolean) => void;
  selectedPOI: { type: string; lat: number; lng: number; name: string } | null;
  setSelectedPOI: (p: AppStore["selectedPOI"]) => void;
}

const defaultMapSettings: MapSettings = {
  style: "dark",
  showPetrolPumps: true,
  showWashrooms: true,
  showMechanics: true,
  showHospitals: true,
  showFoodStops: true,
  showScenicSpots: true,
  showWeather: false,
  trafficLayer: false,
  followMode: true,
  bearing: 0,
  zoom: 15,
};

const defaultNavState: NavState = {
  isNavigating: false,
  destination: null,
  currentRoute: null,
  distanceRemaining: 0,
  etaMinutes: 0,
  nextManeuver: "",
  nextManeuverDistance: 0,
};

const defaultMusic: MusicState = {
  isPlaying: false,
  trackTitle: "No media playing",
  artist: "",
  albumArt: null,
  app: null,
  duration: 0,
  position: 0,
};

export const useAppStore = create<AppStore>((set, get) => ({
  // Theme
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", theme === "light");
    }
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  // Active section
  activeSection: "map",
  setActiveSection: (activeSection) => set({ activeSection }),

  // User
  user: {
    id: null,
    displayName: "Rider",
    avatarColor: "#00D4FF",
    avatarInitials: "R",
    photoURL: null,
    email: null,
    isAuthenticated: false,
  },
  setUser: (u) => set((state) => ({ user: { ...state.user, ...u } })),

  // Location
  myLocation: null,
  setMyLocation: (loc) => set({ myLocation: loc }),

  // Group ride
  activeRide: null,
  setActiveRide: (r) => set({ activeRide: r }),
  riderLocations: {},
  updateRiderLocation: (userId, loc) =>
    set((state) => ({
      riderLocations: { ...state.riderLocations, [userId]: loc },
    })),
  removeRider: (userId) =>
    set((state) => {
      const copy = { ...state.riderLocations };
      delete copy[userId];
      return { riderLocations: copy };
    }),

  // Map settings
  mapSettings: defaultMapSettings,
  updateMapSettings: (s) =>
    set((state) => ({ mapSettings: { ...state.mapSettings, ...s } })),

  // Navigation
  navState: defaultNavState,
  setNavState: (s) =>
    set((state) => ({ navState: { ...state.navState, ...s } })),
  startNavigation: (destination) =>
    set((state) => ({
      navState: { ...state.navState, isNavigating: true, destination },
    })),
  stopNavigation: () => set({ navState: defaultNavState }),

  // SOS
  sosActive: false,
  triggerSOS: () => set({ sosActive: true }),
  cancelSOS: () => set({ sosActive: false }),

  // Music
  music: defaultMusic,
  setMusic: (m) =>
    set((state) => ({ music: { ...state.music, ...m } })),

  // UI state
  isSearchOpen: false,
  setIsSearchOpen: (v) => set({ isSearchOpen: v }),
  isRideModalOpen: false,
  setIsRideModalOpen: (v) => set({ isRideModalOpen: v }),
  selectedPOI: null,
  setSelectedPOI: (p) => set({ selectedPOI: p }),
}));