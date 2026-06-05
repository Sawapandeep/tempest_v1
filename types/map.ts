// src/types/map.ts

export type Coordinates = {
  lng: number;
  lat: number;
};

export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapViewState = {
  center: Coordinates;
  zoom: number;
  bearing: number;
  pitch: number;
};

export type MapLayerType =
  | "standard"
  | "terrain"
  | "satellite"
  | "traffic"
  | "transit";

export type MapLayer = {
  id: MapLayerType;
  label: string;
  icon: string;
  available: boolean;
  styleUrl?: string;
};

export type MapStyle = {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
};

export type GeocodingResult = {
  id: string;
  name: string;
  displayName: string;
  category?: string;
  address?: string;
  coordinates: Coordinates;
  bbox?: BoundingBox;
  confidence?: number;
};

export type PlaceDetails = {
  id: string;
  name: string;
  category?: string;
  address?: string;
  website?: string;
  phone?: string;
  coordinates: Coordinates;
  openingHours?: string[];
  photos?: string[];
  rating?: number;
  reviewCount?: number;
  tags?: Record<string, string>;
};

export type RouteProfile = "driving" | "walking" | "cycling";

export type RouteManeuver = {
  instruction: string;
  distance: number;
  duration: number;
  type: string;
  modifier?: string;
  location: Coordinates;
};

export type Route = {
  id: string;
  profile: RouteProfile;
  distance: number; // meters
  duration: number; // seconds
  geometry: GeoJSON.LineString;
  maneuvers: RouteManeuver[];
  bbox?: BoundingBox;
};

export type MapMarker = {
  id: string;
  coordinates: Coordinates;
  label?: string;
  color?: string;
  icon?: string;
  data?: Record<string, unknown>;
};

export type UserLocation = {
  coordinates: Coordinates;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
};

export type MapControlPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CompassState = {
  bearing: number;
  isNorth: boolean;
};