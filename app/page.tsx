"use client";
import { useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type ActiveSection } from "@/lib/store";
import MapsContainer from "./containers/maps";
import GroupContainer from "./containers/group";
import MusicContainer from "./containers/music";
import SettingsPanel from "@/app/components/ui/SettingsPanel";

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center" style={{ background: "#000" }}>
      <div className="absolute w-72 h-72 rounded-full opacity-20 animate-blob"
        style={{ background: "radial-gradient(circle, #00D4FF, #FF6B00)", filter: "blur(60px)" }} />
      <div className="relative flex flex-col items-center gap-4 animate-scale-in">
        <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(255,107,0,0.09))",
            border: "1.5px solid rgba(0,212,255,0.30)",
            boxShadow: "0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(255,107,0,0.15)",
          }}>
          <Zap className="w-12 h-12 text-tempest-cyan" style={{ filter: "drop-shadow(0 0 12px #00D4FF)" }} />
        </div>
        <div className="text-center">
          <h1 className="font-display font-black text-5xl tracking-tight"
            style={{ background: "linear-gradient(135deg, #00D4FF, #FF6B00)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TEMPEST
          </h1>
          <p className="font-display text-sm tracking-[0.3em] uppercase mt-1 text-white/40">Motorcycle Companion</p>
        </div>
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-tempest-cyan"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.4 }} />
          ))}
        </div>
      </div>
      <p className="absolute bottom-8 text-xs font-mono text-white/20">v1.0.0 · 2026</p>
    </div>
  );
}

export default function Home() {
  const { activeSection, setActiveSection, theme } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveSection | "settings">("map");

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") html.classList.add("light");
    else html.classList.remove("light");
  }, [theme]);

  const handleTabChange = (id: ActiveSection | "settings") => {
    if (id === "settings") { setShowSettings(true); return; }
    setActiveTab(id);
    setActiveSection(id as ActiveSection);
  };

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  return (
    <div className="relative flex flex-col w-full h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* Content — NO bottom nav bar for map tab; it's accessible via avatar */}
      <div className="flex-1 overflow-hidden relative">
        {/* Map — full screen, no bottom nav */}
        <div className={cn("absolute inset-0 transition-opacity duration-300",
          activeTab === "map" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
          <MapsContainer onNavigateTo={handleTabChange} />
        </div>

        {/* Group */}
        <div className={cn("absolute inset-0 overflow-y-auto transition-all duration-300",
          activeTab === "group" ? "opacity-100 z-10 translate-x-0" : activeTab === "map" ? "opacity-0 z-0 translate-x-full pointer-events-none" : "opacity-0 z-0 -translate-x-full pointer-events-none"
        )} style={{ paddingBottom: "5rem", background: "var(--bg-primary)" }}>
          <GroupContainer />
        </div>

        {/* Music */}
        <div className={cn("absolute inset-0 overflow-y-auto transition-all duration-300",
          activeTab === "music" ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-full pointer-events-none"
        )} style={{ paddingBottom: "5rem", background: "var(--bg-primary)" }}>
          <MusicContainer />
        </div>
      </div>

      {/* Bottom nav — only shown on group/music tabs */}
      {activeTab !== "map" && (
        <div className="relative z-40 px-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center rounded-[2rem] overflow-hidden"
            style={{
              background: "var(--nav-bg)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid var(--nav-border)",
              boxShadow: "var(--nav-shadow)",
            }}>
            {([
              { id: "map" as const, label: "Map", emoji: "🗺️", color: "#00D4FF" },
              { id: "group" as const, label: "Group", emoji: "👥", color: "#FF6B00" },
              { id: "music" as const, label: "Music", emoji: "🎵", color: "#BF5AF2" },
            ] as const).map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[60px] transition-all duration-300 active:scale-95 select-none relative"
                  style={{ WebkitTapHighlightColor: "transparent" }}>
                  {isActive && (
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                      style={{ background: tab.color, boxShadow: `0 0 8px ${tab.color}` }} />
                  )}
                  <div className={cn("w-11 h-8 rounded-2xl flex items-center justify-center transition-all duration-300", isActive ? "scale-110" : "scale-100")}
                    style={isActive ? { background: `${tab.color}18`, boxShadow: `0 0 16px ${tab.color}25` } : undefined}>
                    <span className="text-xl">{tab.emoji}</span>
                  </div>
                  <span className="text-[10px] font-display font-semibold transition-all duration-300"
                    style={{ color: isActive ? tab.color : "var(--text-muted)", opacity: isActive ? 1 : 0.75 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}