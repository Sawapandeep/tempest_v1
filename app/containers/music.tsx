"use client";
// app/containers/music.tsx
// Music controller - detects & controls Android MediaSession background apps
// Note: Full Android MediaSession API integration is added after APK conversion
// This implements the UI and Android WebView bridge hooks

import { useState, useEffect, useRef } from "react";
import {
    Music, Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Bluetooth, Smartphone,
    Wifi, ChevronDown, ChevronUp, Heart, Repeat,
    Shuffle, Radio, Mic, Settings
} from "lucide-react";

import GlassPanel from "../components/ui/GlassPanel";
import GloveButton from "../components/ui/GloveButton";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Supported music apps
const MUSIC_APPS = [
    { id: "spotify", name: "Spotify", icon: "🎵", color: "#1DB954" },
    { id: "youtube-music", name: "YT Music", icon: "▶️", color: "#FF0000" },
    { id: "vlc", name: "VLC", icon: "🔶", color: "#FF8800" },
    { id: "poweramp", name: "Poweramp", icon: "⚡", color: "#AA00FF" },
    { id: "local", name: "Local Music", icon: "🎶", color: "#00D4FF" },
];

// Mock now-playing data (replaced by Android MediaSession in APK)
const DEMO_TRACKS = [
    { title: "Highway to Hell", artist: "AC/DC", album: "Highway to Hell", duration: 214 },
    { title: "Born to Run", artist: "Bruce Springsteen", album: "Born to Run", duration: 270 },
    { title: "Radar Love", artist: "Golden Earring", album: "Moontan", duration: 398 },
    { title: "Road to Hell", artist: "Chris Rea", album: "The Road to Hell", duration: 340 },
    { title: "Runnin' Down a Dream", artist: "Tom Petty", album: "Full Moon Fever", duration: 256 },
];

// Android bridge - calls native Android via JavascriptInterface
const AndroidBridge = {
    isAvailable: () => typeof window !== "undefined" && "Android" in window,
    play: () => (window as any).Android?.mediaPlay?.(),
    pause: () => (window as any).Android?.mediaPause?.(),
    next: () => (window as any).Android?.mediaNext?.(),
    prev: () => (window as any).Android?.mediaPrev?.(),
    getState: () => (window as any).Android?.mediaGetState?.(),
};

export default function MusicContainer() {
    const { music, setMusic } = useAppStore();

    const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [activeApp, setActiveApp] = useState<string | null>(null);
    const [showAppPicker, setShowAppPicker] = useState(false);
    const [androidConnected] = useState(AndroidBridge.isAvailable());

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const track = DEMO_TRACKS[currentTrackIdx];

    // Simulate playback progress
    useEffect(() => {
        if (isPlaying) {
            progressIntervalRef.current = setInterval(() => {
                setPosition((p) => {
                    if (p >= track.duration) {
                        handleNext();
                        return 0;
                    }
                    return p + 1;
                });
            }, 1000);
        } else {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, track.duration]);

    const handlePlayPause = () => {
        if (androidConnected) {
            isPlaying ? AndroidBridge.pause() : AndroidBridge.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (androidConnected) AndroidBridge.next();
        const next = isShuffle
            ? Math.floor(Math.random() * DEMO_TRACKS.length)
            : (currentTrackIdx + 1) % DEMO_TRACKS.length;
        setCurrentTrackIdx(next);
        setPosition(0);
    };

    const handlePrev = () => {
        if (androidConnected) AndroidBridge.prev();
        if (position > 5) {
            setPosition(0);
            return;
        }
        setCurrentTrackIdx((i) => (i - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length);
        setPosition(0);
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, "0")}`;
    };

    const progressPercent = (position / track.duration) * 100;

    // Waveform bars (decorative)
    const waveformBars = Array.from({ length: 32 }, () =>
        Math.random() * 0.7 + 0.3
    );

    return (
        <div className="px-4 py-6 flex flex-col gap-4 min-h-screen">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-tempest-purple/15 border border-tempest-purple/30 flex items-center justify-center">
                        <Music className="w-5 h-5 text-tempest-purple" />
                    </div>
                    <div>
                        <h2 className="text-white font-display font-bold text-xl">Music</h2>
                        <p className="text-white/40 text-sm font-body">
                            {androidConnected ? "Android MediaSession" : "Demo Mode"}
                        </p>
                    </div>
                </div>

                {/* App selector */}
                <button
                    onClick={() => setShowAppPicker(!showAppPicker)}
                    className="flex items-center gap-2 glass px-3 py-2 rounded-xl active:scale-95"
                >
                    {activeApp ? (
                        <>
                            <span>{MUSIC_APPS.find((a) => a.id === activeApp)?.icon}</span>
                            <span className="text-xs text-white/70 font-display">
                                {MUSIC_APPS.find((a) => a.id === activeApp)?.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <Smartphone className="w-4 h-4 text-white/50" />
                            <span className="text-xs text-white/50 font-display">Select App</span>
                        </>
                    )}
                    {showAppPicker
                        ? <ChevronUp className="w-3 h-3 text-white/40" />
                        : <ChevronDown className="w-3 h-3 text-white/40" />}
                </button>
            </div>

            {/* App picker dropdown */}
            {showAppPicker && (
                <GlassPanel variant="strong" rounded="2xl" className="p-2 animate-scale-in">
                    <div className="grid grid-cols-5 gap-2">
                        {MUSIC_APPS.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => { setActiveApp(app.id); setShowAppPicker(false); }}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95",
                                    activeApp === app.id
                                        ? "bg-white/15"
                                        : "hover:bg-white/8"
                                )}
                            >
                                <span className="text-xl">{app.icon}</span>
                                <span className="text-[9px] text-white/60 font-display leading-tight text-center">{app.name}</span>
                            </button>
                        ))}
                    </div>
                </GlassPanel>
            )}

            {/* Album art */}
            <GlassPanel variant="strong" rounded="3xl" className="relative overflow-hidden">
                {/* Fake album art background */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${activeApp ? MUSIC_APPS.find((a) => a.id === activeApp)?.color : "#BF5AF2"
                            }60, transparent 70%)`,
                    }}
                />

                <div className="relative z-10 flex flex-col items-center py-8 px-4">
                    {/* Vinyl / album art */}
                    <div className="relative w-48 h-48 mb-6">
                        {/* Spinning vinyl */}
                        <div
                            className={cn(
                                "absolute inset-0 rounded-full border-4 border-white/10",
                                isPlaying ? "animate-spin-slow" : ""
                            )}
                            style={{
                                background: "conic-gradient(from 0deg, #1a1a1a 0%, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%, #1a1a1a 100%)",
                                boxShadow: isPlaying
                                    ? "0 0 40px rgba(191, 90, 242, 0.4)"
                                    : "0 0 20px rgba(0,0,0,0.5)",
                            }}
                        >
                            {/* Vinyl grooves */}
                            {[40, 60, 80, 100, 120].map((r) => (
                                <div
                                    key={r}
                                    className="absolute border border-white/5 rounded-full"
                                    style={{
                                        inset: `${(192 - r) / 2}px`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Center label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-amoled-card border-2 border-white/20 flex items-center justify-center">
                                <Music className="w-6 h-6 text-tempest-purple" />
                            </div>
                        </div>
                    </div>

                    {/* Track info */}
                    <div className="text-center w-full">
                        <h3 className="text-white font-display font-bold text-xl leading-tight truncate px-4">
                            {track.title}
                        </h3>
                        <p className="text-white/60 font-body mt-1 text-sm">{track.artist}</p>
                        <p className="text-white/30 font-body text-xs mt-0.5">{track.album}</p>
                    </div>

                    {/* Like button */}
                    <button
                        onClick={() => setIsLiked(!isLiked)}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center active:scale-90"
                    >
                        <Heart
                            className={cn("w-5 h-5 transition-all", isLiked ? "fill-tempest-red text-tempest-red" : "text-white/30")}
                        />
                    </button>
                </div>
            </GlassPanel>

            {/* Progress bar */}
            <GlassPanel className="p-4" rounded="2xl">
                {/* Waveform visualization */}
                <div className="flex items-center gap-0.5 h-10 mb-3">
                    {waveformBars.map((h, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-full transition-all duration-300"
                            style={{
                                height: `${h * 100}%`,
                                background: (i / waveformBars.length) * 100 <= progressPercent
                                    ? "linear-gradient(to top, #BF5AF2, #00D4FF)"
                                    : "rgba(255,255,255,0.12)",
                                opacity: isPlaying && (i / waveformBars.length) * 100 <= progressPercent
                                    ? 0.8 + Math.sin(Date.now() / 200 + i) * 0.2
                                    : 1,
                            }}
                        />
                    ))}
                </div>

                {/* Scrub bar */}
                <div className="relative h-1.5 bg-white/10 rounded-full cursor-pointer"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setPosition(Math.round(pct * track.duration));
                    }}
                >
                    <div
                        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-tempest-purple to-tempest-cyan transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
                        style={{ left: `calc(${progressPercent}% - 8px)` }}
                    />
                </div>

                {/* Times */}
                <div className="flex justify-between mt-2">
                    <span className="text-white/40 text-xs font-mono">{formatTime(position)}</span>
                    <span className="text-white/40 text-xs font-mono">-{formatTime(track.duration - position)}</span>
                </div>
            </GlassPanel>

            {/* Main controls */}
            <GlassPanel className="p-4" rounded="2xl">
                {/* Secondary controls */}
                <div className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                            isShuffle ? "text-tempest-cyan" : "text-white/30"
                        )}
                    >
                        <Shuffle className="w-5 h-5" />
                    </button>

                    {/* Primary controls */}
                    <div className="flex items-center gap-4">
                        {/* Previous */}
                        <button
                            onClick={handlePrev}
                            className="w-16 h-16 glass rounded-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-white/10"
                        >
                            <SkipBack className="w-7 h-7 text-white" />
                        </button>

                        {/* Play/Pause - large glove button */}
                        <button
                            onClick={handlePlayPause}
                            className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:scale-95",
                                "font-bold shadow-lg"
                            )}
                            style={{
                                background: "linear-gradient(135deg, #BF5AF2, #00D4FF)",
                                boxShadow: "0 0 30px rgba(191, 90, 242, 0.4)",
                            }}
                        >
                            {isPlaying
                                ? <Pause className="w-9 h-9 text-white" />
                                : <Play className="w-9 h-9 text-white ml-1" />
                            }
                        </button>

                        {/* Next */}
                        <button
                            onClick={handleNext}
                            className="w-16 h-16 glass rounded-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-white/10"
                        >
                            <SkipForward className="w-7 h-7 text-white" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsRepeat(!isRepeat)}
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95",
                            isRepeat ? "text-tempest-cyan" : "text-white/30"
                        )}
                    >
                        <Repeat className="w-5 h-5" />
                    </button>
                </div>

                {/* Volume slider */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="w-10 h-10 flex items-center justify-center active:scale-95"
                    >
                        {isMuted
                            ? <VolumeX className="w-5 h-5 text-white/30" />
                            : <Volume2 className="w-5 h-5 text-white/60" />
                        }
                    </button>
                    <div className="flex-1 relative h-1.5 bg-white/10 rounded-full cursor-pointer"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pct = (e.clientX - rect.left) / rect.width;
                            setVolume(Math.round(pct * 100));
                            setIsMuted(false);
                        }}
                    >
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-tempest-purple/70 to-tempest-purple"
                            style={{ width: `${isMuted ? 0 : volume}%` }}
                        />
                    </div>
                    <span className="text-white/40 text-xs font-mono w-8 text-right">
                        {isMuted ? "🔇" : `${volume}%`}
                    </span>
                </div>
            </GlassPanel>

            {/* Up next */}
            <GlassPanel className="p-4" rounded="2xl">
                <div className="flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4 text-white/40" />
                    <span className="text-white/50 text-xs font-display uppercase tracking-wider">Up Next</span>
                </div>
                {DEMO_TRACKS.slice(1, 4).map((t, i) => {
                    const idx = (currentTrackIdx + i + 1) % DEMO_TRACKS.length;
                    const track2 = DEMO_TRACKS[idx];
                    return (
                        <button
                            key={i}
                            onClick={() => { setCurrentTrackIdx(idx); setPosition(0); }}
                            className="w-full flex items-center gap-3 py-2 hover:bg-white/5 rounded-xl px-2 active:scale-98 transition-all"
                        >
                            <div className="w-8 h-8 rounded-xl bg-tempest-purple/15 border border-tempest-purple/20 flex items-center justify-center flex-shrink-0">
                                <Music className="w-4 h-4 text-tempest-purple/70" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-white/80 text-sm font-display font-semibold truncate">{track2.title}</p>
                                <p className="text-white/30 text-xs">{track2.artist}</p>
                            </div>
                            <span className="text-white/25 text-xs font-mono">{Math.floor(track2.duration / 60)}:{String(track2.duration % 60).padStart(2, "0")}</span>
                        </button>
                    );
                })}
            </GlassPanel>

            {/* Android note */}
            {!androidConnected && (
                <GlassPanel className="p-4 border border-tempest-yellow/20" rounded="2xl">
                    <div className="flex items-start gap-3">
                        <Bluetooth className="w-5 h-5 text-tempest-yellow flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-tempest-yellow font-display font-semibold text-sm">Android APK Required</p>
                            <p className="text-white/50 text-xs mt-1 font-body leading-relaxed">
                                Full music control via Android MediaSession API activates when the app is converted to a standalone APK using WebView or Capacitor.
                            </p>
                        </div>
                    </div>
                </GlassPanel>
            )}
        </div>
    );
}