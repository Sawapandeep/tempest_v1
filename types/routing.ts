// types/routing.ts
import type { Coordinates, BoundingBox } from "@/types/map";

export type RouteProfile = "driving" | "walking" | "cycling" | "motorcycle" | "bus";

export type RouteManeuverType =
  | "start"
  | "end"
  | "turn"
  | "new name"
  | "depart"
  | "arrive"
  | "merge"
  | "on ramp"
  | "off ramp"
  | "fork"
  | "use lane"
  | "continue"
  | "roundabout"
  | "rotary"
  | "roundabout turn"
  | "exit roundabout"
  | "exit rotary"
  | "ferry"
  | "push boat"
  | "notification"
  | "pass"
  | string;

export type RouteManeuverModifier =
  | "uturn"
  | "sharp right"
  | "right"
  | "slight right"
  | "straight"
  | "slight left"
  | "left"
  | "sharp left"
  | string;

export type RouteManeuver = {
  instruction: string;
  type: RouteManeuverType;
  modifier?: RouteManeuverModifier;
  location: Coordinates;
  distance: number;
  duration: number;
  streetName?: string;
  exitNumber?: number;
  roundaboutExitCount?: number;
  verbalTransitionAlertInstruction?: string;
  verbalPreTransitionInstruction?: string;
  verbalPostTransitionInstruction?: string;
};

export type RouteSummary = {
  distance: number;    // meters
  duration: number;    // seconds
  hasHighway?: boolean;
  hasToll?: boolean;
  hasFerry?: boolean;
};

export type Route = {
  id: string;
  profile: RouteProfile;
  distance: number;
  duration: number;
  geometry: GeoJSON.LineString;
  maneuvers: RouteManeuver[];
  legs?: RouteLeg[];
  bbox?: BoundingBox;
  summary?: RouteSummary;
  waypointIndices?: number[];
  weight?: number;
  weightName?: string;
};

export type RouteLeg = {
  distance: number;
  duration: number;
  summary: string;
  steps: RouteManeuver[];
};

export type RouteWaypoint = {
  id: string;
  label: string;
  coordinates: Coordinates;
  type: "origin" | "destination" | "waypoint";
};

export type RouteRequest = {
  origin: Coordinates;
  destination: Coordinates;
  waypoints?: Coordinates[];
  profile: RouteProfile;
  alternatives?: boolean;
  language?: string;
  units?: "km" | "mi";
};

export type RouteResponse = {
  routes: Route[];
  waypoints: RouteWaypoint[];
};

export type RouteProfileConfig = {
  id: RouteProfile;
  label: string;
  icon: string;
  valhallaCosting: string;
  color: string;
  lineWidth: number;
  lineColor: string;
  lineOutlineColor: string;
};

export type DirectionStep = RouteManeuver & {
  index: number;
  isActive?: boolean;
};