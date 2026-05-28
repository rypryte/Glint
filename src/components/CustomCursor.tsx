import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function CustomCursor() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [targetLabel, setTargetLabel] = useState("");

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for trailing circle
  const springConfig = { damping: 25, stiffness: 220, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Check if device supports fine hover interactions (disable on mobile/touch)
    const mediaQuery = window.matchMedia("(any-hover: none)");
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaQueryChange);
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setCoords({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".bento-card") ||
        target.closest(".cursor-pointer") ||
        target.classList.contains("cursor-pointer");

      if (isClickable) {
        setHovered(true);

        // Figure out helpful status text depending on the hovered item
        const bentoCard = target.closest(".bento-card");
        if (bentoCard) {
          const title = bentoCard.querySelector("h3, h4")?.textContent || "CARD";
          setTargetLabel(`SCAN // ${title.toUpperCase()}`);
        } else if (target.tagName === "BUTTON" || target.closest("button")) {
          const btnText = (target.textContent || "ACTION").trim().substring(0, 15);
          setTargetLabel(`EXECUTE // ${btnText.toUpperCase()}`);
        } else if (target.tagName === "INPUT" || target.closest("input")) {
          setTargetLabel("INPUT // TEXT");
        } else {
          setTargetLabel("SYS // ENGAGE");
        }
      } else {
        setHovered(false);
        setTargetLabel("");
      }
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // Dynamic style to hide original cursor safely
    const originalStyle = document.body.style.cursor;
    if (!mediaQuery.matches) {
      document.body.style.cursor = "none";
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = originalStyle;
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaQueryChange);
      }
    };
  }, [mouseX, mouseY]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] select-none">
      {/* 1. Core Pointer (Subtle grid dot) */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
        style={{
          x: mouseX,
          y: mouseY,
        }}
        animate={{
          scale: clicked ? 0.7 : hovered ? 1.3 : 1,
          backgroundColor: hovered ? "#10b981" : "#3b82f6",
        }}
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
      />

      {/* 2. Tactical Tracking Crosshair / Circle Container */}
      <motion.div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center mix-blend-screen"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      >
        {/* Trailing Circular Targeting Reticle */}
        <motion.div
          className="border border-blue-500/20 rounded-full flex items-center justify-center relative"
          animate={{
            width: hovered ? 46 : 28,
            height: hovered ? 46 : 28,
            borderColor: hovered ? "rgba(16, 185, 129, 0.4)" : "rgba(59, 130, 246, 0.2)",
            rotate: hovered ? 90 : 0,
          }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
        >
          {/* Tactical Crosshair Notch Marks */}
          <span className="absolute w-[5px] h-[1px] bg-blue-500/40 -left-[1px]" />
          <span className="absolute w-[5px] h-[1px] bg-blue-500/40 -right-[1px]" />
          <span className="absolute w-[1px] h-[5px] bg-blue-500/40 -top-[1px]" />
          <span className="absolute w-[1px] h-[5px] bg-blue-500/40 -bottom-[1px]" />

          {/* Quick lock dots when hovered */}
          {hovered && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full top-[2px] left-[2px]"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute w-1 h-1 bg-emerald-400 rounded-full bottom-[2px] right-[2px]"
              />
            </>
          )}
        </motion.div>

        {/* 3. Live Real-Time Coordinates Data Label (Holographic Tactical Hud) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: hovered ? 0.95 : 0.25,
            scale: hovered ? 1.02 : 0.92,
            x: 42,
            y: 12,
          }}
          className="absolute left-0 top-0 pointer-events-none select-none text-left"
        >
          <div className="bg-graphite-950/90 backdrop-blur-sm border border-white/5 p-1 rounded font-mono text-[7.5px] tracking-wider leading-none text-steel-400 min-w-[100px] shadow-2xl space-y-0.5">
            <div className="text-white/40 flex justify-between">
              <span>SCANNER NODE</span>
              <span className={hovered ? "text-emerald-400 font-bold" : "text-blue-500/60"}>
                {hovered ? "CRITICAL" : "STANDBY"}
              </span>
            </div>
            <div className="text-[7.2px]">
              X: <span className="text-blue-400 font-semibold">{Math.round(coords.x)}PX</span> / Y:{" "}
              <span className="text-blue-400 font-semibold">{Math.round(coords.y)}PX</span>
            </div>
            {targetLabel && (
              <div className="text-[7.2px] border-t border-white/5 pt-0.5 mt-0.5 text-emerald-400 font-medium truncate">
                &gt; {targetLabel}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
