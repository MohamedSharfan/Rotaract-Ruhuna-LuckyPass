"use client";

import { type ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { emitSoundEvent } from "@/lib/sound-events";

export function MagneticButton({
  children,
  className = "",
  onClick,
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  return (
    <motion.button
      ref={ref}
      type={type}
      style={{ x, y }}
      whileTap={{ scale: 0.94 }}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.22);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      onClick={() => {
        emitSoundEvent("button");
        onClick?.();
      }}
      className={`magnetic-button ${className}`}
    >
      <span>{children}</span>
    </motion.button>
  );
}

export function TiltPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const shadowX = useTransform(rotateY, [-10, 10], [-22, 22]);

  return (
    <motion.div
      className={`tilt-panel ${className}`}
      style={{
        rotateX,
        rotateY,
        boxShadow: useTransform(shadowX, (value) => `${value}px 26px 70px rgba(255, 46, 166, 0.16)`),
      }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        rotateY.set(px * 11);
        rotateX.set(py * -10);
      }}
      onMouseLeave={() => {
        rotateX.set(0);
        rotateY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export const reveal = {
  hidden: { opacity: 0, y: 36, filter: "blur(14px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

