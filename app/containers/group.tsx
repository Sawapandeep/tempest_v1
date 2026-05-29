"use client";
// app/containers/group.tsx
// Group ride management: create, join, live tracking, chat

import { useState, useEffect, useRef } from "react";
import {
    Users, Plus, LogIn, Crown, Radio, MapPin,
    MessageCircle, Send, X, ChevronRight, Wifi, WifiOff,
    Share2, AlertTriangle, Navigation, Timer
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import {
    generateInviteCode, formatDistance, relativeTime,
    randomRiderColor, getInitials, haversineDistance, cn
} from "@/lib/utils";
import GlassPanel from "../components/ui/GlassPanel";
import GloveButton from "../components/ui/GloveButton";
import RiderAvatar from "../components/ui/RiderAvatar";
import SOSButton from "../components/ui/SOSButton";

// Mock demo riders for visual demo
const DEMO_RIDERS = [
    { userId: "r1", displayName: "Vikram S.", avatarColor: "#FF6B00", avatarInitials: "VS", lat: 28.622, lng: 77.215, heading: 35, speed: 68, altitude: 220, status: "riding" as const, lastUpdate: Date.now() - 3000, batteryLevel: 72, distanceFromMe: 0.4 },
    { userId: "r2", displayName: "Priya R.", avatarColor: "#00FF88", avatarInitials: "PR", lat: 28.618, lng: 77.219, heading: 42, speed: 64, altitude: 218, status: "riding" as const, lastUpdate: Date.now() - 6000, batteryLevel: 88, distanceFromMe: 0.9 },
    { userId: "r3", displayName: "Karan M.", avatarColor: "#BF5AF2", avatarInitials: "KM", lat: 28.608, lng: 77.225, heading: 40, speed: 0, altitude: 215, status: "stopped" as const, lastUpdate: Date.now() - 20000, batteryLevel: 34, distanceFromMe: 1.8 },
    { userId: "r4", displayName: "Ananya K.", avatarColor: "#FFD60A", avatarInitials: "AK", lat: 28.630, lng: 77.211, heading: 38, speed: 71, altitude: 222, status: "riding" as const, lastUpdate: Date.now() - 2000, batteryLevel: 91, distanceFromMe: 2.3 },
];

// Mock chat messages
const DEMO_MESSAGES = [
    { id: "1", userId: "r1", userName: "Vikram", message: "Taking the bypass, avoid main road - jam ahead", type: "text", timestamp: Date.now() - 5 * 60000 },
    { id: "2", userId: "r4", userName: "Ananya", message: "Copy that! I'm right behind you 🏍️", type: "text", timestamp: Date.now() - 4 * 60000 },
    { id: "3", userId: "system", userName: "Tempest", message: "Karan has stopped (1.8 km behind)", type: "system", timestamp: Date.now() - 2 * 60000 },
    { id: "4", userId: "r3", userName: "Karan", message: "Quick fuel stop, carry on - 5 min", type: "text", timestamp: Date.now() - 90000 },
];

type Tab = "riders" | "chat" | "route";

export default function GroupContainer() {
    const {
        activeRide, setActiveRide,
        riderLocations, updateRiderLocation,
        myLocation, user,
        sosActive
    } = useAppStore();

    const [tab, setTab] = useState<Tab>("riders");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [rideName, setRideName] = useState("");
    const [inviteInput, setInviteInput] = useState("");
    const [chatMsg, setChatMsg] = useState("");
    const [messages, setMessages] = useState(DEMO_MESSAGES);
    const [rideTime, setRideTime] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load demo riders on mount (for visual demo)
    useEffect(() => {
        DEMO_RIDERS.forEach((r) => updateRiderLocation(r.userId, r));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ride timer
    useEffect(() => {
        if (!activeRide) return;
        const t = setInterval(() => setRideTime((v) => v + 1), 1000);
        return () => clearInterval(t);
    }, [activeRide]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const riders = Object.values(riderLocations);

    // ── Create ride ──────────────────────────────────────────────────
    const handleCreateRide = () => {
        if (!rideName.trim()) return;
        const ride = {
            id: `ride_${Date.now()}`,
            name: rideName,
            leaderId: user.id ?? "me",
            leaderName: user.displayName,
            status: "active" as const,
            inviteCode: generateInviteCode(),
            riders: [user.id ?? "me"],
            startedAt: Date.now(),
        };
        setActiveRide(ride);
        setShowCreateModal(false);
        setRideName("");
    };

    // ── Join ride ────────────────────────────────────────────────────
    const handleJoinRide = () => {
        if (inviteInput.length < 4) return;
        // Demo: create a mock ride for any code
        const ride = {
            id: `ride_join_${Date.now()}`,
            name: `Ride #${inviteInput}`,
            leaderId: "r1",
            leaderName: "Vikram S.",
            status: "active" as const,
            inviteCode: inviteInput.toUpperCase(),
            riders: [user.id ?? "me", "r1", "r2", "r3", "r4"],
            startedAt: Date.now() - 45 * 60000,
        };
        setActiveRide(ride);
        setShowJoinModal(false);
        setInviteInput("");
    };

    const handleSendMessage = () => {
        if (!chatMsg.trim()) return;
        setMessages((prev) => [
            ...prev,
            {
                id: `m_${Date.now()}`,
                userId: user.id ?? "me",
                userName: user.displayName,
                message: chatMsg,
                type: "text",
                timestamp: Date.now(),
            },
        ]);
        setChatMsg("");
    };

    const formatRideTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    // ── No active ride ───────────────────────────────────────────────
    if (!activeRide) {
        return (
            <div className="px-4 py-6 flex flex-col gap-6 min-h-screen">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-tempest-orange/15 border border-tempest-orange/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-tempest-orange" />
                    </div>
                    <div>
                        <h2 className="text-white font-display font-bold text-xl">Group Rides</h2>
                        <p className="text-white/40 text-sm font-body">Ride together, stay connected</p>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                    <GloveButton
                        variant="orange"
                        size="lg"
                        icon={<Plus className="w-6 h-6" />}
                        fullWidth
                        glow
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Ride
                    </GloveButton>
                    <GloveButton
                        variant="secondary"
                        size="lg"
                        icon={<LogIn className="w-6 h-6" />}
                        fullWidth
                        onClick={() => setShowJoinModal(true)}
                    >
                        Join with Code
                    </GloveButton>
                </div>

                {/* Demo riders preview */}
                <GlassPanel className="p-4" rounded="3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Radio className="w-4 h-4 text-tempest-orange" />
                        <span className="text-white/60 text-sm font-display">Nearby riders (demo)</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {DEMO_RIDERS.slice(0, 3).map((rider) => (
                            <div key={rider.userId} className="flex items-center gap-3">
                                <RiderAvatar
                                    initials={rider.avatarInitials}
                                    color={rider.avatarColor}
                                    status={rider.status}
                                    size="sm"
                                />
                                <div className="flex-1">
                                    <p className="text-white text-sm font-display font-semibold">{rider.displayName}</p>
                                    <p className="text-white/40 text-xs">{formatDistance(rider.distanceFromMe ?? 0)} away</p>
                                </div>
                                <span className="text-xs font-mono text-white/30">{Math.round(rider.speed)} km/h</span>
                            </div>
                        ))}
                    </div>
                </GlassPanel>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: "📍", title: "Live Tracking", desc: "See all riders on map" },
                        { icon: "🗺️", title: "Route Sync", desc: "Follow leader's route" },
                        { icon: "💬", title: "Group Chat", desc: "Real-time comms" },
                        { icon: "🆘", title: "Emergency SOS", desc: "Instant distress alert" },
                    ].map((f) => (
                        <GlassPanel key={f.title} className="p-3" rounded="2xl">
                            <span className="text-2xl">{f.icon}</span>
                            <p className="text-white text-sm font-display font-semibold mt-2">{f.title}</p>
                            <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
                        </GlassPanel>
                    ))}
                </div>

                {/* Create modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
                        <GlassPanel variant="strong" rounded="4xl" className="w-full max-w-md p-6 animate-slide-up">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-display font-bold text-xl">New Ride</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-white/60 text-xs font-display uppercase tracking-wider mb-2 block">Ride Name</label>
                                    <input
                                        value={rideName}
                                        onChange={(e) => setRideName(e.target.value)}
                                        placeholder="Delhi to Manali Sprint"
                                        className="w-full h-14 rounded-2xl px-4 bg-white/8 border border-white/15 text-white placeholder-white/30 outline-none font-body text-base focus:border-tempest-orange/50"
                                    />
                                </div>

                                <GloveButton
                                    variant="orange"
                                    size="lg"
                                    fullWidth
                                    glow
                                    onClick={handleCreateRide}
                                    disabled={!rideName.trim()}
                                >
                                    Create & Start
                                </GloveButton>
                            </div>
                        </GlassPanel>
                    </div>
                )}

                {/* Join modal */}
                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
                        <GlassPanel variant="strong" rounded="4xl" className="w-full max-w-md p-6 animate-slide-up">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-display font-bold text-xl">Join Ride</h3>
                                <button
                                    onClick={() => setShowJoinModal(false)}
                                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-white/60 text-xs font-display uppercase tracking-wider mb-2 block">Invite Code</label>
                                    <input
                                        value={inviteInput}
                                        onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                                        placeholder="XKCD42"
                                        maxLength={8}
                                        className="w-full h-14 rounded-2xl px-4 bg-white/8 border border-white/15 text-tempest-cyan placeholder-white/30 outline-none font-mono text-2xl text-center tracking-widest focus:border-tempest-cyan/50"
                                    />
                                </div>

                                <GloveButton
                                    variant="cyan"
                                    size="lg"
                                    fullWidth
                                    glow
                                    onClick={handleJoinRide}
                                    disabled={inviteInput.length < 4}
                                >
                                    Join Ride
                                </GloveButton>
                            </div>
                        </GlassPanel>
                    </div>
                )}
            </div>
        );
    }

    // ── Active ride view ─────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full">

            {/* Ride header */}
            <GlassPanel variant="strong" className="mx-3 mt-3 p-4 rounded-3xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-3 h-3 bg-tempest-green rounded-full animate-ping-slow" />
                            <div className="absolute inset-0 w-3 h-3 bg-tempest-green rounded-full" />
                        </div>
                        <div>
                            <h3 className="text-white font-display font-bold text-base leading-tight">
                                {activeRide.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Crown className="w-3 h-3 text-tempest-yellow" />
                                <span className="text-white/50 text-xs font-body">{activeRide.leaderName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Timer */}
                        <GlassPanel className="px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <Timer className="w-3 h-3 text-tempest-cyan" />
                            <span className="font-mono text-sm text-tempest-cyan font-bold">
                                {formatRideTime(rideTime)}
                            </span>
                        </GlassPanel>

                        {/* Invite code */}
                        <GlassPanel className="px-3 py-1.5 rounded-xl">
                            <span className="font-mono text-xs text-tempest-orange font-bold tracking-widest">
                                {activeRide.inviteCode}
                            </span>
                        </GlassPanel>
                    </div>
                </div>

                {/* Rider count + SOS */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {riders.slice(0, 4).map((r) => (
                                <RiderAvatar key={r.userId} initials={r.avatarInitials} color={r.avatarColor} size="xs" status={r.status} />
                            ))}
                        </div>
                        <span className="text-white/60 text-sm font-display">{riders.length} riders</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <SOSButton compact />
                        <button
                            onClick={() => setActiveRide(null)}
                            className="h-9 px-3 rounded-xl text-white/50 text-xs font-display hover:bg-white/8 active:scale-95"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </GlassPanel>

            {/* Tabs */}
            <div className="flex gap-1 mx-3 mt-3 p-1 rounded-2xl bg-white/5 border border-white/8">
                {(["riders", "chat", "route"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            "flex-1 h-10 rounded-xl text-sm font-display font-semibold capitalize transition-all",
                            tab === t
                                ? "bg-tempest-cyan text-amoled-black shadow-[0_0_16px_rgba(0,212,255,0.3)]"
                                : "text-white/50 hover:text-white"
                        )}
                    >
                        {t === "riders" ? `Riders (${riders.length})` : t === "chat" ? "Chat" : "Route"}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto mt-3 px-3 pb-4">

                {/* ── Riders tab ────────────────────────────────────────── */}
                {tab === "riders" && (
                    <div className="flex flex-col gap-2">
                        {riders.map((rider) => {
                            const isLeader = rider.userId === activeRide.leaderId;
                            const isOnline = Date.now() - rider.lastUpdate < 30000;
                            const battColor = rider.batteryLevel > 50 ? "#00FF88" : rider.batteryLevel > 20 ? "#FFD60A" : "#FF2D55";

                            return (
                                <GlassPanel key={rider.userId} className="p-4 flex items-center gap-4" rounded="2xl">
                                    <RiderAvatar
                                        initials={rider.avatarInitials}
                                        color={rider.avatarColor}
                                        status={rider.status}
                                        isLeader={isLeader}
                                        heading={rider.heading}
                                        showHeading
                                        size="md"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-display font-semibold text-sm">{rider.displayName}</span>
                                            {isLeader && <Crown className="w-3 h-3 text-tempest-yellow" />}
                                            {rider.status === "sos" && (
                                                <span className="text-[10px] bg-tempest-red/20 text-tempest-red border border-tempest-red/30 rounded-md px-1.5 py-0.5 font-display font-bold animate-pulse">
                                                    SOS
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-white/40 text-xs font-mono">{Math.round(rider.speed)} km/h</span>
                                            {rider.distanceFromMe !== undefined && (
                                                <span className="text-white/30 text-xs">
                                                    {formatDistance(rider.distanceFromMe)}
                                                </span>
                                            )}
                                            <span className="text-white/30 text-xs">{relativeTime(rider.lastUpdate)}</span>
                                        </div>
                                    </div>

                                    {/* Battery */}
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1">
                                            <div className="w-12 h-2 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${rider.batteryLevel}%`,
                                                        backgroundColor: battColor,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono" style={{ color: battColor }}>
                                                {rider.batteryLevel}%
                                            </span>
                                        </div>
                                        {isOnline
                                            ? <Wifi className="w-3 h-3 text-tempest-green" />
                                            : <WifiOff className="w-3 h-3 text-white/30" />
                                        }
                                    </div>
                                </GlassPanel>
                            );
                        })}
                    </div>
                )}

                {/* ── Chat tab ──────────────────────────────────────────── */}
                {tab === "chat" && (
                    <div className="flex flex-col gap-2 pb-20">
                        {messages.map((msg) => {
                            const isMe = msg.userId === (user.id ?? "me");
                            const isSystem = msg.type === "system";

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center">
                                        <GlassPanel className="px-3 py-1.5 rounded-full" rounded="4xl">
                                            <span className="text-white/40 text-xs font-display">{msg.message}</span>
                                        </GlassPanel>
                                    </div>
                                );
                            }

                            const rider = riders.find((r) => r.userId === msg.userId);

                            return (
                                <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                                    {!isMe && (
                                        <RiderAvatar
                                            initials={getInitials(msg.userName)}
                                            color={rider?.avatarColor ?? "#888"}
                                            size="xs"
                                        />
                                    )}
                                    <div className={cn("max-w-[75%]", isMe ? "items-end" : "items-start", "flex flex-col gap-0.5")}>
                                        {!isMe && (
                                            <span className="text-white/40 text-[10px] font-display ml-1">{msg.userName}</span>
                                        )}
                                        <GlassPanel
                                            className={cn("px-3 py-2 rounded-2xl", isMe ? "rounded-tr-sm bg-tempest-cyan/15" : "rounded-tl-sm")}
                                        >
                                            <p className="text-white text-sm font-body leading-relaxed">{msg.message}</p>
                                        </GlassPanel>
                                        <span className="text-white/25 text-[10px] mx-1">{relativeTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* ── Route tab ─────────────────────────────────────────── */}
                {tab === "route" && (
                    <div className="flex flex-col gap-3">
                        <GlassPanel className="p-4" rounded="2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Navigation className="w-4 h-4 text-tempest-cyan" />
                                <span className="text-white font-display font-semibold text-sm">Active Route</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-white/50 text-sm">Distance</span>
                                    <span className="text-white font-display font-bold text-sm">342 km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50 text-sm">ETA</span>
                                    <span className="text-white font-display font-bold text-sm">6h 20m</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-white/50 text-sm">Waypoints</span>
                                    <span className="text-white font-display font-bold text-sm">4 stops</span>
                                </div>
                            </div>
                        </GlassPanel>

                        {[
                            { name: "Panipat bypass", dist: "32 km", status: "passed" },
                            { name: "Karnal fuel stop", dist: "98 km", status: "passed" },
                            { name: "Ambala junction", dist: "164 km", status: "current" },
                            { name: "Chandigarh", dist: "220 km", status: "upcoming" },
                            { name: "Manali", dist: "342 km", status: "upcoming" },
                        ].map((wp, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                                    wp.status === "passed" ? "bg-white/10 text-white/30" :
                                        wp.status === "current" ? "bg-tempest-cyan text-amoled-black shadow-cyan-glow" :
                                            "bg-white/5 text-white/50"
                                )}>
                                    {wp.status === "passed" ? "✓" : i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className={cn("font-display text-sm font-semibold",
                                        wp.status === "current" ? "text-tempest-cyan" :
                                            wp.status === "passed" ? "text-white/30" : "text-white"
                                    )}>{wp.name}</p>
                                </div>
                                <span className={cn("text-xs font-mono",
                                    wp.status === "passed" ? "text-white/20" : "text-white/50"
                                )}>{wp.dist}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat input (only on chat tab) */}
            {tab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <GlassPanel variant="strong" className="flex items-center gap-2 p-2 pr-3 rounded-3xl">
                        <input
                            value={chatMsg}
                            onChange={(e) => setChatMsg(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Message group..."
                            className="flex-1 h-12 px-3 bg-transparent outline-none text-white placeholder-white/30 font-body text-base"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatMsg.trim()}
                            className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                                chatMsg.trim()
                                    ? "bg-tempest-cyan text-amoled-black shadow-[0_0_16px_rgba(0,212,255,0.4)]"
                                    : "bg-white/10 text-white/30"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </GlassPanel>
                </div>
            )}
        </div>
    );
}