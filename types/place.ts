// types/place.ts

export type PlacePhoto = {
  id: string;
  url: string;
  thumb?: string;
  caption?: string;
  author?: string;
  width?: number;
  height?: number;
};

export type PlaceOpeningPeriod = {
  open: { day: number; time: string }; // day 0=Sun..6=Sat, time "HHMM"
  close?: { day: number; time: string };
};

export type PlaceOpeningHours = {
  openNow: boolean;
  periods?: PlaceOpeningPeriod[];
  weekdayText?: string[]; // human-readable, one per day
  raw?: string; // OSM opening_hours string
};

export type PlaceReview = {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number; // 1-5
  text: string;
  time: number; // unix timestamp
  relativeTime?: string;
};

export type PlaceContactInfo = {
  phone?: string;
  website?: string;
  email?: string;
};

export type PlaceDetails = {
  // Core identity
  id: string;
  osmId?: number;
  osmType?: "node" | "way" | "relation";
  name: string;
  category?: string;

  // Location
  address?: string;
  coordinates: { lng: number; lat: number };
  country?: string;
  state?: string;
  city?: string;
  postcode?: string;

  // Rich info
  contact?: PlaceContactInfo;
  openingHours?: PlaceOpeningHours;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];

  // Metrics
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$

  // Metadata
  tags?: Record<string, string>; // raw OSM tags
  wikidata?: string;
  wikipedia?: string;
  description?: string;

  // State
  isSaved?: boolean;
  savedCollection?: string;
};

export type PlaceLoadState = "idle" | "loading" | "loaded" | "error";

export interface PlaceDetailsState {
  details: PlaceDetails | null;
  loadState: PlaceLoadState;
  error: string | null;
  setDetails: (d: PlaceDetails | null) => void;
  setLoadState: (s: PlaceLoadState) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}