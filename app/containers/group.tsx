"use client";
// app/containers/group.tsx
// FIXED: all hardcoded "text-white" → CSS var equivalents so light mode works

import { useState, useEffect, useRef } from "react";
import {
    Users, Plus, LogIn, Crown, Radio,
    Send, X, Wifi, WifiOff, Navigation, Timer
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import {
    generateInviteCode, formatDistance, relativeTime,
    getInitials, cn
} from "@/lib/utils";
import GlassPanel from "../components/ui/GlassPanel";
import GloveButton from "../components/ui/GloveButton";
import RiderAvatar from "../components/ui/RiderAvatar";
import SOSButton from "../components/ui/SOSButton";

const DEMO_RIDERS = [
    { userId: "r1", displayName: "Vikram S.", avatarColor: "#FF6B00", avatarInitials: "VS", lat: 28.622, lng: 77.215, heading: 35, speed: 68, altitude: 220, status: "riding" as const, lastUpdate: Date.now() - 3000, batteryLevel: 72, distanceFromMe: 0.4 },
    { userId: "r2", displayName: "Priya R.", avatarColor: "#00FF88", avatarInitials: "PR", lat: 28.618, lng: 77.219, heading: 42, speed: 64, altitude: 218, status: "riding" as const, lastUpdate: Date.now() - 6000, batteryLevel: 88, distanceFromMe: 0.9 },
    { userId: "r3", displayName: "Karan M.", avatarColor: "#BF5AF2", avatarInitials: "KM", lat: 28.608, lng: 77.225, heading: 40, speed: 0, altitude: 215, status: "stopped" as const, lastUpdate: Date.now() - 20000, batteryLevel: 34, distanceFromMe: 1.8 },
    { userId: "r4", displayName: "Ananya K.", avatarColor: "#FFD60A", avatarInitials: "AK", lat: 28.630, lng: 77.211, heading: 38, speed: 71, altitude: 222, status: "riding" as const, lastUpdate: Date.now() - 2000, batteryLevel: 91, distanceFromMe: 2.3 },
];

const DEMO_MESSAGES = [
    { id: "1", userId: "r1", userName: "Vikram", message: "Taking the bypass, avoid main road - jam ahead", type: "text", timestamp: Date.now() - 5 * 60000 },
    { id: "2", userId: "r4", userName: "Ananya", message: "Copy that! I'm right behind you 🏍️", type: "text", timestamp: Date.now() - 4 * 60000 },
    { id: "3", userId: "system", userName: "Tempest", message: "Karan has stopped (1.8 km behind)", type: "system", timestamp: Date.now() - 2 * 60000 },
    { id: "4", userId: "r3", userName: "Karan", message: "Quick fuel stop, carry on - 5 min", type: "text", timestamp: Date.now() - 90000 },
];

type Tab = "riders" | "chat" | "route";

// ─── Helper: theme-aware text classes ──────────────────────────
// Instead of text-white we use inline style so dark/light both work
const tPrimary = { color: "var(--text-primary)" };
const tSecondary = { color: "var(--text-secondary)" };
const tMuted = { color: "var(--text-muted)" };

export default function GroupContainer() {
    const {
        activeRide, setActiveRide,
        riderLocations, updateRiderLocation,
        user, sosActive,
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

    useEffect(() => {
        DEMO_RIDERS.forEach((r) => updateRiderLocation(r.userId, r));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!activeRide) return;
        const t = setInterval(() => setRideTime((v) => v + 1), 1000);
        return () => clearInterval(t);
    }, [activeRide]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const riders = Object.values(riderLocations);

    const handleCreateRide = () => {
        if (!rideName.trim()) return;
        setActiveRide({
            id: `ride_${Date.now()}`,
            name: rideName,
            leaderId: user.id ?? "me",
            leaderName: user.displayName,
            status: "active",
            inviteCode: generateInviteCode(),
            riders: [user.id ?? "me"],
            startedAt: Date.now(),
        });
        setShowCreateModal(false);
        setRideName("");
    };

    const handleJoinRide = () => {
        if (inviteInput.length < 4) return;
        setActiveRide({
            id: `ride_join_${Date.now()}`,
            name: `Ride #${inviteInput}`,
            leaderId: "r1",
            leaderName: "Vikram S.",
            status: "active",
            inviteCode: inviteInput.toUpperCase(),
            riders: [user.id ?? "me", "r1", "r2", "r3", "r4"],
            startedAt: Date.now() - 45 * 60000,
        });
        setShowJoinModal(false);
        setInviteInput("");
    };

    const handleSendMessage = () => {
        if (!chatMsg.trim()) return;
        setMessages((prev) => [...prev, {
            id: `m_${Date.now()}`,
            userId: user.id ?? "me",
            userName: user.displayName,
            message: chatMsg,
            type: "text",
            timestamp: Date.now(),
        }]);
        setChatMsg("");
    };

    const formatRideTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    // ── No active ride ─────────────────────────────────────────────
    if (!activeRide) {
        return (
            <div className="px-4 py-6 flex flex-col gap-6 min-h-screen">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-tempest-orange/15 border border-tempest-orange/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-tempest-orange" />
                    </div>
                    <div>
                        <h2 className="font-display font-bold text-xl" style={tPrimary}>Group Rides</h2>
                        <p className="text-sm font-body" style={tMuted}>Ride together, stay connected</p>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                    <GloveButton variant="orange" size="lg" icon={<Plus className="w-6 h-6" />} fullWidth glow onClick={() => setShowCreateModal(true)}>
                        Create Ride
                    </GloveButton>
                    <GloveButton variant="secondary" size="lg" icon={<LogIn className="w-6 h-6" />} fullWidth onClick={() => setShowJoinModal(true)}>
                        Join with Code
                    </GloveButton>
                </div>

                {/* Nearby riders */}
                <GlassPanel className="p-4" rounded="3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Radio className="w-4 h-4 text-tempest-orange" />
                        <span className="text-sm font-display" style={tSecondary}>Nearby riders (demo)</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {DEMO_RIDERS.slice(0, 3).map((rider) => (
                            <div key={rider.userId} className="flex items-center gap-3">
                                <RiderAvatar initials={rider.avatarInitials} color={rider.avatarColor} status={rider.status} size="sm" />
                                <div className="flex-1">
                                    <p className="text-sm font-display font-semibold" style={tPrimary}>{rider.displayName}</p>
                                    <p className="text-xs" style={tMuted}>{formatDistance(rider.distanceFromMe ?? 0)} away</p>
                                </div>
                                <span className="text-xs font-mono" style={tMuted}>{Math.round(rider.speed)} km/h</span>
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
                            <p className="text-sm font-display font-semibold mt-2" style={tPrimary}>{f.title}</p>
                            <p className="text-xs mt-0.5" style={tMuted}>{f.desc}</p>
                        </GlassPanel>
                    ))}
                </div>

                {/* Create modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
                        <GlassPanel variant="strong" rounded="4xl" className="w-full max-w-md p-6 animate-slide-up">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-display font-bold text-xl" style={tPrimary}>New Ride</h3>
                                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <X className="w-5 h-5" style={tSecondary} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-display uppercase tracking-wider mb-2 block" style={tMuted}>Ride Name</label>
                                    <input
                                        value={rideName}
                                        onChange={(e) => setRideName(e.target.value)}
                                        placeholder="Delhi to Manali Sprint"
                                        className="w-full h-14 rounded-2xl px-4 outline-none font-body text-base"
                                        style={{
                                            background: "var(--glass-bg)",
                                            border: "1px solid var(--border-default)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                                <GloveButton variant="orange" size="lg" fullWidth glow onClick={handleCreateRide} disabled={!rideName.trim()}>
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
                                <h3 className="font-display font-bold text-xl" style={tPrimary}>Join Ride</h3>
                                <button onClick={() => setShowJoinModal(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <X className="w-5 h-5" style={tSecondary} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-display uppercase tracking-wider mb-2 block" style={tMuted}>Invite Code</label>
                                    <input
                                        value={inviteInput}
                                        onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                                        placeholder="XKCD42"
                                        maxLength={8}
                                        className="w-full h-14 rounded-2xl px-4 text-tempest-cyan outline-none font-mono text-2xl text-center tracking-widest"
                                        style={{
                                            background: "var(--glass-bg)",
                                            border: "1px solid var(--border-default)",
                                        }}
                                    />
                                </div>
                                <GloveButton variant="cyan" size="lg" fullWidth glow onClick={handleJoinRide} disabled={inviteInput.length < 4}>
                                    Join Ride
                                </GloveButton>
                            </div>
                        </GlassPanel>
                    </div>
                )}
            </div>
        );
    }

    // ── Active ride ────────────────────────────────────────────────
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
                            <h3 className="font-display font-bold text-base leading-tight" style={tPrimary}>
                                {activeRide.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Crown className="w-3 h-3 text-tempest-yellow" />
                                <span className="text-xs font-body" style={tMuted}>{activeRide.leaderName}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <GlassPanel className="px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <Timer className="w-3 h-3 text-tempest-cyan" />
                            <span className="font-mono text-sm text-tempest-cyan font-bold">{formatRideTime(rideTime)}</span>
                        </GlassPanel>
                        <GlassPanel className="px-3 py-1.5 rounded-xl">
                            <span className="font-mono text-xs text-tempest-orange font-bold tracking-widest">{activeRide.inviteCode}</span>
                        </GlassPanel>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {riders.slice(0, 4).map((r) => (
                                <RiderAvatar key={r.userId} initials={r.avatarInitials} color={r.avatarColor} size="xs" status={r.status} />
                            ))}
                        </div>
                        <span className="text-sm font-display" style={tSecondary}>{riders.length} riders</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SOSButton compact />
                        <button onClick={() => setActiveRide(null)} className="h-9 px-3 rounded-xl text-xs font-display active:scale-95" style={tMuted}>
                            Leave
                        </button>
                    </div>
                </div>
            </GlassPanel>

            {/* Tabs */}
            <div className="flex gap-1 mx-3 mt-3 p-1 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-subtle)" }}>
                {(["riders", "chat", "route"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn("flex-1 h-10 rounded-xl text-sm font-display font-semibold capitalize transition-all")}
                        style={
                            tab === t
                                ? { background: "#00D4FF", color: "#000", boxShadow: "0 0 16px rgba(0,212,255,0.3)" }
                                : tSecondary
                        }
                    >
                        {t === "riders" ? `Riders (${riders.length})` : t === "chat" ? "Chat" : "Route"}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto mt-3 px-3 pb-4">

                {/* Riders */}
                {tab === "riders" && (
                    <div className="flex flex-col gap-2">
                        {riders.map((rider) => {
                            const isLeader = rider.userId === activeRide.leaderId;
                            const isOnline = Date.now() - rider.lastUpdate < 30000;
                            const battColor = rider.batteryLevel > 50 ? "#00FF88" : rider.batteryLevel > 20 ? "#FFD60A" : "#FF2D55";
                            return (
                                <GlassPanel key={rider.userId} className="p-4 flex items-center gap-4" rounded="2xl">
                                    <RiderAvatar initials={rider.avatarInitials} color={rider.avatarColor} status={rider.status} isLeader={isLeader} heading={rider.heading} showHeading size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-display font-semibold text-sm" style={tPrimary}>{rider.displayName}</span>
                                            {isLeader && <Crown className="w-3 h-3 text-tempest-yellow" />}
                                            {rider.status === "sos" && (
                                                <span className="text-[10px] bg-tempest-red/20 text-tempest-red border border-tempest-red/30 rounded-md px-1.5 py-0.5 font-display font-bold animate-pulse">SOS</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs font-mono" style={tMuted}>{Math.round(rider.speed)} km/h</span>
                                            {rider.distanceFromMe !== undefined && (
                                                <span className="text-xs" style={tMuted}>{formatDistance(rider.distanceFromMe)}</span>
                                            )}
                                            <span className="text-xs" style={tMuted}>{relativeTime(rider.lastUpdate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1">
                                            <div className="w-12 h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                                                <div className="h-full rounded-full transition-all" style={{ width: `${rider.batteryLevel}%`, backgroundColor: battColor }} />
                                            </div>
                                            <span className="text-[10px] font-mono" style={{ color: battColor }}>{rider.batteryLevel}%</span>
                                        </div>
                                        {isOnline ? <Wifi className="w-3 h-3 text-tempest-green" /> : <WifiOff className="w-3 h-3" style={tMuted} />}
                                    </div>
                                </GlassPanel>
                            );
                        })}
                    </div>
                )}

                {/* Chat */}
                {tab === "chat" && (
                    <div className="flex flex-col gap-2 pb-20">
                        {messages.map((msg) => {
                            const isMe = msg.userId === (user.id ?? "me");
                            const isSystem = msg.type === "system";
                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center">
                                        <GlassPanel className="px-3 py-1.5 rounded-full" rounded="4xl">
                                            <span className="text-xs font-display" style={tMuted}>{msg.message}</span>
                                        </GlassPanel>
                                    </div>
                                );
                            }
                            const rider = riders.find((r) => r.userId === msg.userId);
                            return (
                                <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                                    {!isMe && <RiderAvatar initials={getInitials(msg.userName)} color={rider?.avatarColor ?? "#888"} size="xs" />}
                                    <div className={cn("max-w-[75%] flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                                        {!isMe && <span className="text-[10px] font-display ml-1" style={tMuted}>{msg.userName}</span>}
                                        <GlassPanel className={cn("px-3 py-2 rounded-2xl", isMe ? "rounded-tr-sm" : "rounded-tl-sm")}
                                            style={isMe ? { background: "rgba(0,212,255,0.12)" } : undefined}
                                        >
                                            <p className="text-sm font-body leading-relaxed" style={tPrimary}>{msg.message}</p>
                                        </GlassPanel>
                                        <span className="text-[10px] mx-1" style={tMuted}>{relativeTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* Route */}
                {tab === "route" && (
                    <div className="flex flex-col gap-3">
                        <GlassPanel className="p-4" rounded="2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Navigation className="w-4 h-4 text-tempest-cyan" />
                                <span className="font-display font-semibold text-sm" style={tPrimary}>Active Route</span>
                            </div>
                            {[
                                ["Distance", "342 km"],
                                ["ETA", "6h 20m"],
                                ["Waypoints", "4 stops"],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between py-1">
                                    <span className="text-sm" style={tMuted}>{k}</span>
                                    <span className="font-display font-bold text-sm" style={tPrimary}>{v}</span>
                                </div>
                            ))}
                        </GlassPanel>

                        {[
                            { name: "Panipat bypass", dist: "32 km", status: "passed" },
                            { name: "Karnal fuel stop", dist: "98 km", status: "passed" },
                            { name: "Ambala junction", dist: "164 km", status: "current" },
                            { name: "Chandigarh", dist: "220 km", status: "upcoming" },
                            { name: "Manali", dist: "342 km", status: "upcoming" },
                        ].map((wp, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                    style={
                                        wp.status === "passed"
                                            ? { background: "var(--glass-bg)", color: "var(--text-disabled)" }
                                            : wp.status === "current"
                                                ? { background: "#00D4FF", color: "#000", boxShadow: "0 0 12px rgba(0,212,255,0.5)" }
                                                : { background: "var(--glass-bg)", color: "var(--text-muted)" }
                                    }
                                >
                                    {wp.status === "passed" ? "✓" : i + 1}
                                </div>
                                <div className="flex-1">
                                    <p
                                        className="font-display text-sm font-semibold"
                                        style={
                                            wp.status === "current" ? { color: "#00D4FF" }
                                                : wp.status === "passed" ? { color: "var(--text-disabled)" }
                                                    : tPrimary
                                        }
                                    >
                                        {wp.name}
                                    </p>
                                </div>
                                <span className="text-xs font-mono" style={wp.status === "passed" ? { color: "var(--text-disabled)" } : tMuted}>
                                    {wp.dist}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat input */}
            {tab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <GlassPanel variant="strong" className="flex items-center gap-2 p-2 pr-3 rounded-3xl">
                        <input
                            value={chatMsg}
                            onChange={(e) => setChatMsg(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Message group…"
                            className="flex-1 h-12 px-3 bg-transparent outline-none font-body text-base"
                            style={{ color: "var(--text-primary)" }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!chatMsg.trim()}
                            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95")}
                            style={
                                chatMsg.trim()
                                    ? { background: "#00D4FF", color: "#000", boxShadow: "0 0 16px rgba(0,212,255,0.4)" }
                                    : { background: "var(--glass-bg)", color: "var(--text-muted)" }
                            }
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </GlassPanel>
                </div>
            )}
        </div>
    );
}