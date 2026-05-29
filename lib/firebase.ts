// lib/firebase.ts
// Firebase configuration for Tempest
// Replace with your actual Firebase project credentials

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tempest-demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tempest-demo",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tempest-demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://tempest-demo-default-rtdb.firebaseio.com",
};

// Initialize Firebase (singleton pattern for Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;

/* ─── Firebase Database Schema ─────────────────────────────────────
 *
 * FIRESTORE (structured data):
 *
 * /users/{userId}
 *   - id: string
 *   - displayName: string
 *   - avatarColor: string
 *   - avatarInitials: string
 *   - photoURL: string | null
 *   - email: string
 *   - motorcycle: { make, model, year, color }
 *   - preferences: { theme, units, notifications }
 *   - stats: { totalRides, totalDistance, totalHours }
 *   - createdAt: timestamp
 *
 * /rides/{rideId}
 *   - id: string
 *   - name: string
 *   - leaderId: string
 *   - leaderName: string
 *   - status: "active" | "completed" | "paused"
 *   - inviteCode: string (6-char)
 *   - route: { waypoints: LatLng[], distance: number, duration: number }
 *   - riders: string[] (userIds)
 *   - startedAt: timestamp
 *   - endedAt: timestamp | null
 *   - meetingPoint: { lat, lng, name }
 *   - maxRiders: number
 *   - isPublic: boolean
 *   - description: string
 *
 * /rideHistory/{userId}/{rideId}
 *   - rideId: string
 *   - joinedAt: timestamp
 *   - leftAt: timestamp
 *   - distanceCovered: number
 *   - maxSpeed: number
 *   - avgSpeed: number
 *   - trackPoints: LatLng[]
 *
 *
 * REALTIME DATABASE (live data):
 *
 * /live/{rideId}/riders/{userId}
 *   - lat: number
 *   - lng: number
 *   - heading: number (0–360)
 *   - speed: number (km/h)
 *   - altitude: number (meters)
 *   - accuracy: number
 *   - status: "riding" | "stopped" | "sos" | "offline"
 *   - lastUpdate: timestamp
 *   - batteryLevel: number (0–100)
 *
 * /live/{rideId}/chat/{messageId}
 *   - userId: string
 *   - userName: string
 *   - message: string
 *   - type: "text" | "sos" | "system" | "waypoint"
 *   - timestamp: number
 *
 * /live/{rideId}/meta
 *   - status: "active" | "paused" | "ended"
 *   - leaderLat: number
 *   - leaderLng: number
 *   - pausedAt: timestamp | null
 *
 * ─────────────────────────────────────────────────────────────────
 */