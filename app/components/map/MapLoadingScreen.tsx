"use client";
// src/components/map/MapLoadingScreen.tsx

import { motion } from "framer-motion";

export function MapLoadingScreen() {
  return (
    <div className="h-full w-full bg-background flex flex-col items-center justify-center gap-6 select-none">
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        {/* Animated compass/storm icon */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-tempest-500/30"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Inner ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-tempest-500/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-tempest-500 shadow-[0_0_12px_rgba(42,159,240,0.6)]" />
          </div>
          {/* Compass needle */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-0.5 h-6 rounded-full bg-gradient-to-t from-red-500 to-transparent -mt-3" />
          </motion.div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tempest{" "}
            <span className="text-tempest-500">Maps</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            Open Mapping Platform
          </p>
        </div>
      </motion.div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="w-48 h-0.5 rounded-full bg-border overflow-hidden"
      >
        <motion.div
          className="h-full bg-tempest-500 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Status text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground"
      >
        Loading map tiles…
      </motion.p>
    </div>
  );
}