"use client";
import { useState, useEffect } from "react";
import styles from "./TopBar.module.css";

interface TopBarProps {
    speed?: number;          // km/h
    heading?: number;        // degrees 0-360
    onThemeToggle: () => void;
    isDark: boolean;
    rideActive?: boolean;
    onSOSPress: () => void;
}

const COMPASS_DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function headingToDir(deg: number) {
    return COMPASS_DIRS[Math.round(deg / 45) % 8];
}

export default function TopBar({
    speed = 0,
    heading = 0,
    onThemeToggle,
    isDark,
    rideActive = false,
    onSOSPress,
}: TopBarProps) {
    const [time, setTime] = useState("");
    const [sosHeld, setSosHeld] = useState(false);
    const [sosTimer, setSosTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleSOSDown = () => {
        setSosHeld(true);
        const t = setTimeout(() => {
            onSOSPress();
            setSosHeld(false);
        }, 2000);
        setSosTimer(t);
    };

    const handleSOSUp = () => {
        setSosHeld(false);
        if (sosTimer) clearTimeout(sosTimer);
    };

    return (
        <header className={styles.topBar}>
            {/* Logo */}
            <div className={styles.logo}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <polygon
                        points="14,2 26,8 26,20 14,26 2,20 2,8"
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="1.5"
                    />
                    <polygon
                        points="14,6 22,10 22,18 14,22 6,18 6,10"
                        fill="var(--accent-primary)"
                        opacity="0.15"
                    />
                    <path
                        d="M8 14 L13 10 L16 14 L20 11"
                        stroke="var(--accent-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                </svg>
                <span className={styles.logoText}>TEMPEST</span>
                {rideActive && (
                    <span className={styles.rideBadge}>
                        <span className={styles.rideDot} />
                        LIVE
                    </span>
                )}
            </div>

            {/* Center: Speed + Compass */}
            <div className={styles.centerHud}>
                <div className={styles.speedBox}>
                    <span className={styles.speedValue}>{Math.round(speed)}</span>
                    <span className={styles.speedUnit}>km/h</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.compassBox}>
                    <div
                        className={styles.compassNeedle}
                        style={{ transform: `rotate(${heading}deg)` }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <polygon points="10,2 13,10 10,8 7,10" fill="var(--accent-primary)" />
                            <polygon points="10,18 13,10 10,12 7,10" fill="var(--text-muted)" />
                        </svg>
                    </div>
                    <span className={styles.compassDir}>{headingToDir(heading)}</span>
                </div>
                <div className={styles.divider} />
                <span className={styles.clock}>{time}</span>
            </div>

            {/* Right actions */}
            <div className={styles.actions}>
                <button
                    className={`${styles.actionBtn} ${styles.themeBtn}`}
                    onClick={onThemeToggle}
                    aria-label="Toggle theme"
                >
                    {isDark ? "☀️" : "🌙"}
                </button>
                <button
                    className={`${styles.actionBtn} ${styles.sosBtn} ${sosHeld ? styles.sosActive : ""}`}
                    onPointerDown={handleSOSDown}
                    onPointerUp={handleSOSUp}
                    onPointerLeave={handleSOSUp}
                    aria-label="SOS — Hold 2 seconds"
                >
                    SOS
                </button>
            </div>
        </header>
    );
}