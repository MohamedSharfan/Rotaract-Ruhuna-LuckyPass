"use client";

import { motion } from "framer-motion";

const pieces = Array.from({ length: 80 }, (_, index) => ({
  id: index,
  x: (index % 20) * 5 - 48,
  hue: index % 4,
  delay: (index % 12) * 0.018,
}));

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className={`confetti-piece confetti-${piece.hue}`}
          initial={{ opacity: 0, x: "50vw", y: "42vh", rotate: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: `calc(50vw + ${piece.x * 1.8}vw)`,
            y: `calc(42vh + ${48 + (piece.id % 16) * 2}vh)`,
            rotate: 420 + piece.id * 23,
            scale: [0.4, 1, 0.8],
          }}
          transition={{ duration: 2.4, delay: piece.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

