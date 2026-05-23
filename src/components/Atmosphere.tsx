"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const particles = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 19) % 100}%`,
  top: `${(index * 37) % 100}%`,
  delay: (index % 12) * 0.28,
  size: 2 + (index % 4),
}));

export function Atmosphere() {
  const [mounted, setMounted] = useState(false);
  const mouseX = useSpring(useMotionValue(0), { stiffness: 70, damping: 18 });
  const mouseY = useSpring(useMotionValue(0), { stiffness: 70, damping: 18 });

  useEffect(() => {
    setMounted(true);
    const onMove = (event: MouseEvent) => {
      mouseX.set((event.clientX / window.innerWidth - 0.5) * 28);
      mouseY.set((event.clientY / window.innerHeight - 0.5) * 28);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mouseX, mouseY]);

  if (!mounted) return <div className="atmosphere" />;

  return (
    <div className="atmosphere" aria-hidden="true">
      <motion.div className="aurora aurora-pink" style={{ x: mouseX, y: mouseY }} />
      <motion.div className="aurora aurora-blue" style={{ x: mouseY, y: mouseX }} />
      <div className="grid-glow" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="particle"
          style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
          animate={{ y: [-12, -42, -12], opacity: [0.25, 0.9, 0.25], scale: [1, 1.7, 1] }}
          transition={{ duration: 4.5 + (particle.id % 5), delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

