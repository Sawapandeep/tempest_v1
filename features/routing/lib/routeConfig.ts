// features/routing/lib/routeConfig.ts
import type { RouteProfile, RouteManeuver, RouteManeuverType } from "@/types/routing";

export const ROUTE_PROFILES: Array<{
  id: RouteProfile;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  lineColor: string;
}> = [
  {
    id: "driving",
    label: "Driving",
    shortLabel: "Drive",
    icon: "Car",
    color: "text-blue-400",
    lineColor: "#2a9ff0",
  },
  {
    id: "walking",
    label: "Walking",
    shortLabel: "Walk",
    icon: "Footprints",
    color: "text-emerald-400",
    lineColor: "#10b981",
  },
  {
    id: "cycling",
    label: "Cycling",
    shortLabel: "Bike",
    icon: "Bike",
    color: "text-amber-400",
    lineColor: "#f59e0b",
  },
];

// Valhalla maneuver type codes → human-readable category
const MANEUVER_ICONS: Record<string, string> = {
  "0":  "MapPin",        // kNone
  "1":  "Navigation",    // kStart
  "2":  "Navigation",    // kStartRight
  "3":  "Navigation",    // kStartLeft
  "4":  "MapPin",        // kDestination
  "5":  "MapPin",        // kDestinationRight
  "6":  "MapPin",        // kDestinationLeft
  "7":  "ArrowUp",       // kBecomes
  "8":  "ArrowUp",       // kContinue
  "9":  "CornerUpRight", // kSlightRight
  "10": "CornerUpRight", // kRight
  "11": "CornerUpRight", // kSharpRight
  "12": "RotateCw",      // kUturnRight
  "13": "RotateCcw",     // kUturnLeft
  "14": "CornerUpLeft",  // kSharpLeft
  "15": "CornerUpLeft",  // kLeft
  "16": "CornerUpLeft",  // kSlightLeft
  "17": "ArrowRight",    // kRampStraight
  "18": "CornerUpRight", // kRampRight
  "19": "CornerUpLeft",  // kRampLeft
  "20": "CornerUpRight", // kExitRight
  "21": "CornerUpLeft",  // kExitLeft
  "22": "ArrowUp",       // kStayStraight
  "23": "CornerUpRight", // kStayRight
  "24": "CornerUpLeft",  // kStayLeft
  "25": "RefreshCw",     // kMerge
  "26": "RefreshCw",     // kRoundaboutEnter
  "27": "RefreshCw",     // kRoundaboutExit
  "28": "Anchor",        // kFerryEnter
  "29": "Anchor",        // kFerryExit
  "30": "ArrowUp",       // kTransit
  "31": "ArrowUp",       // kTransitTransfer
  "32": "ArrowUp",       // kTransitRemainOn
  "33": "ArrowUp",       // kTransitConnectionStart
  "34": "ArrowUp",       // kTransitConnectionTransfer
  "35": "ArrowUp",       // kTransitConnectionDestination
  "36": "AlertTriangle", // kPostTransitConnectionDestination

  // OSRM types
  depart:     "Navigation",
  arrive:     "MapPin",
  turn:       "CornerUpRight",
  "new name": "ArrowUp",
  merge:      "GitMerge",
  "on ramp":  "CornerUpRight",
  "off ramp": "CornerUpLeft",
  fork:       "GitFork",
  roundabout: "RefreshCw",
  rotary:     "RefreshCw",
  ferry:      "Anchor",
  continue:   "ArrowUp",
  notification: "Bell",
};

export function getManeuverIcon(type: string, modifier?: string): string {
  const key = type?.toString() ?? "";
  if (MANEUVER_ICONS[key]) return MANEUVER_ICONS[key];

  // Try modifier-based fallback
  if (modifier?.includes("right")) return "CornerUpRight";
  if (modifier?.includes("left")) return "CornerUpLeft";
  if (modifier === "straight") return "ArrowUp";
  if (modifier === "uturn") return "RotateCw";

  return "ArrowUp";
}

export function getManeuverColor(type: string): string {
  const t = parseInt(type);
  if (isNaN(t)) {
    // OSRM string type
    if (type === "arrive" || type === "destination") return "text-tempest-400";
    if (type === "depart" || type === "start") return "text-emerald-400";
    if (type === "ferry") return "text-blue-400";
    return "text-foreground";
  }
  if (t === 4 || t === 5 || t === 6) return "text-tempest-400"; // destination
  if (t === 1 || t === 2 || t === 3) return "text-emerald-400"; // start
  if (t === 28 || t === 29) return "text-blue-400"; // ferry
  return "text-foreground";
}

export function formatDistance(meters: number, imperial = false): string {
  if (imperial) {
    const miles = meters / 1609.344;
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `< 1 min`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

export function getETA(seconds: number): string {
  const now = new Date();
  now.setSeconds(now.getSeconds() + seconds);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}