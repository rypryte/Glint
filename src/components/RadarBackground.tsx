import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

export default function RadarBackground() {
  const [blips, setBlips] = useState<{ id: number; x: number; y: number; opacity: number }[]>([]);

  useEffect(() => {
    // Generate some stable, subtle "monitoring nodes" on the grid
    const initialBlips = [
      { id: 1, x: 30, y: 40, opacity: 0.4 },
      { id: 2, x: 75, y: 25, opacity: 0.2 },
      { id: 3, x: 60, y: 70, opacity: 0.5 },
      { id: 4, x: 20, y: 80, opacity: 0.15 },
    ];
    setBlips(initialBlips);

    // Periodically pulse node opacities slightly for organic operational feedback
    const interval = setInterval(() => {
      setBlips((prev) =>
        prev.map((b) => ({
          ...b,
          opacity: Math.max(0.1, Math.min(0.7, b.opacity + (Math.random() * 0.2 - 0.1))),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 bg-graphite-950">
      {/* Abstract Grid Layer */}
      <div className="absolute inset-0 mesh-grid opacity-30" />

      {/* Deep radial gradient representing sensor field scope */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0a0b0d_95%)]" />

      {/* Tech Rings (Concentric Circles) representing monitoring radius */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-25">
        <div className="border border-white/5 rounded-full w-[250px] h-[250px] relative flex items-center justify-center">
          <div className="border border-white/5 rounded-full w-[450px] h-[450px] absolute flex items-center justify-center">
            <div className="border border-white/5 rounded-full w-[650px] h-[650px] absolute flex items-center justify-center">
              <div className="border border-white/5 rounded-full w-[850px] h-[850px] absolute flex items-center justify-center">
                {/* Center crosshair */}
                <div className="w-6 h-[1px] bg-blue-500/10 absolute" />
                <div className="h-6 w-[1px] bg-blue-500/10 absolute" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slowly Rotating Radar Sweep Line */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="w-[850px] h-[850px] rounded-full radar-sweep absolute block"
        />
      </div>

      {/* Monitoring nodes / blips */}
      {blips.map((blip) => (
        <div
          key={blip.id}
          className="absolute"
          style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
        >
          {/* Beacon dot */}
          <span className="flex h-3 w-3 relative">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"
              style={{ animationDuration: "3s" }}
            ></span>
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500 mt-[3px] ml-[3px]"
              style={{ opacity: blip.opacity }}
            ></span>
          </span>
          {/* Coordinate overlay */}
          <span className="absolute left-4 top-[-2px] text-[8px] font-mono tracking-widest text-[#7c8ba1]/30 uppercase select-none">
            GL-{blip.id * 14}
          </span>
        </div>
      ))}

      {/* Top and Bottom atmospheric masks */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-graphite-950 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-graphite-950 to-transparent" />
    </div>
  );
}
