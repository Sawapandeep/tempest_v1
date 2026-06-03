// src/types/user.ts

export type UserRole = "user" | "admin" | "moderator";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type SavedPlace = {
  id: string;
  userId: string;
  placeId: string;
  name: string;
  address?: string;
  coordinates: { lng: number; lat: number };
  collection: SavedPlaceCollection;
  customLabel?: string;
  notes?: string;
  createdAt: Date;
};

export type SavedPlaceCollection =
  | "favorites"
  | "want-to-visit"
  | "home"
  | "work"
  | string; // custom lists

export type RecentSearch = {
  id: string;
  userId: string;
  query: string;
  result?: {
    name: string;
    coordinates: { lng: number; lat: number };
  };
  timestamp: Date;
};

export type LocationShare = {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  coordinates: { lng: number; lat: number };
  heading?: number;
  isActive: boolean;
  lastUpdated: Date;
};