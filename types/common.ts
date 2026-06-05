// src/types/common.ts

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export type LoadingState = "idle" | "loading" | "success" | "error";

export type Theme = "light" | "dark" | "system";

export type UnitSystem = "metric" | "imperial";

export type Language = string; // BCP 47 language tag

export type AppSettings = {
  theme: Theme;
  unitSystem: UnitSystem;
  language: Language;
  defaultMapLayer: string;
  showTraffic: boolean;
  showTransit: boolean;
  locationSharingEnabled: boolean;
  searchHistoryEnabled: boolean;
};

export type Notification = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
};

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};