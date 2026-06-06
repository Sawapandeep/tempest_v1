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
    id: "motorcycle",
    label: "Motorcycle",
    shortLabel: "Moto",
    icon: "Bike",
    color: "text-amber-400",
    lineColor: "#f59e0b",
  },
  {
    id: "walking",
    label: "Walking",
    shortLabel: "Walk",
    icon: "Footprints",
    color: "text-emerald-400",
    lineColor: "#10b981",
  },
  // {
  //   id: "cycling",
  //   label: "Cycling",
  //   shortLabel: "Cycle",
  //   icon: "Bike",
  //   color: "text-purple-400",
  //   lineColor: "#8b5cf6",
  // },
];

const MANEUVER_ICONS: Record<string, string> = {
  "0":  "MapPin",
  "1":  "Navigation",
  "2":  "Navigation",
  "3":  "Navigation",
  "4":  "MapPin",
  "5":  "MapPin",
  "6":  "MapPin",
  "7":  "ArrowUp",
  "8":  "ArrowUp",
  "9":  "CornerUpRight",
  "10": "CornerUpRight",
  "11": "CornerUpRight",
  "12": "RotateCw",
  "13": "RotateCcw",
  "14": "CornerUpLeft",
  "15": "CornerUpLeft",
  "16": "CornerUpLeft",
  "17": "ArrowRight",
  "18": "CornerUpRight",
  "19": "CornerUpLeft",
  "20": "CornerUpRight",
  "21": "CornerUpLeft",
  "22": "ArrowUp",
  "23": "CornerUpRight",
  "24": "CornerUpLeft",
  "25": "RefreshCw",
  "26": "RefreshCw",
  "27": "RefreshCw",
  "28": "Anchor",
  "29": "Anchor",
  "30": "ArrowUp",
  "31": "ArrowUp",
  "32": "ArrowUp",
  "33": "ArrowUp",
  "34": "ArrowUp",
  "35": "ArrowUp",
  "36": "AlertTriangle",
  depart:       "Navigation",
  arrive:       "MapPin",
  turn:         "CornerUpRight",
  "new name":   "ArrowUp",
  merge:        "GitMerge",
  "on ramp":    "CornerUpRight",
  "off ramp":   "CornerUpLeft",
  fork:         "GitFork",
  roundabout:   "RefreshCw",
  rotary:       "RefreshCw",
  ferry:        "Anchor",
  continue:     "ArrowUp",
  notification: "Bell",
};

export function getManeuverIcon(type: string, modifier?: string): string {
  const key = type?.toString() ?? "";
  if (MANEUVER_ICONS[key]) return MANEUVER_ICONS[key];
  if (modifier?.includes("right")) return "CornerUpRight";
  if (modifier?.includes("left"))  return "CornerUpLeft";
  if (modifier === "straight")     return "ArrowUp";
  if (modifier === "uturn")        return "RotateCw";
  return "ArrowUp";
}

export function getManeuverColor(type: string): string {
  const t = parseInt(type);
  if (isNaN(t)) {
    if (type === "arrive" || type === "destination") return "text-tempest-400";
    if (type === "depart" || type === "start")       return "text-emerald-400";
    if (type === "ferry")                            return "text-blue-400";
    return "text-foreground";
  }
  if (t === 4 || t === 5 || t === 6) return "text-tempest-400";
  if (t === 1 || t === 2 || t === 3) return "text-emerald-400";
  if (t === 28 || t === 29)          return "text-blue-400";
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
  if (seconds < 60)   return `< 1 min`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)   return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

export function getETA(seconds: number): string {
  const now = new Date();
  now.setSeconds(now.getSeconds() + seconds);
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}