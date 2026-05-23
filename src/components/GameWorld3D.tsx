"use client";

import { Float, MeshReflectorMaterial, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

type WorldMode = "lobby" | "reveal" | "draw" | "winner";

export function GameWorld3D({ mode = "lobby", ticket = "LP284" }: { mode?: WorldMode; ticket?: string }) {
  return (
    <div className="game-world" aria-label="Animated Lucky Pass raffle machine">
      <Canvas dpr={[1, 1.75]} shadows>
        <PerspectiveCamera makeDefault position={[0, 2.8, 8.6]} fov={38} />
        <color attach="background" args={["#070606"]} />
        <fog attach="fog" args={["#070606", 10, 19]} />
        <ambientLight intensity={0.72} />
        <spotLight position={[0, 8, 5]} angle={0.48} penumbra={0.8} intensity={520} color="#ffd56f" castShadow />
        <pointLight position={[-4, 3, 4]} intensity={80} color="#ffffff" />
        <pointLight position={[4, 2, 3]} intensity={90} color="#f1c15d" />
        <ArcadeRaffleMachine mode={mode} ticket={ticket} />
        <LuckyWheel mode={mode} />
        <CoinField mode={mode} />
        <PrizeCapsules mode={mode} />
        <TicketStack ticket={ticket} mode={mode} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <MeshReflectorMaterial
            blur={[260, 120]}
            resolution={512}
            mixBlur={0.8}
            mixStrength={0.55}
            roughness={0.72}
            depthScale={0.38}
            color="#12100e"
            metalness={0.35}
          />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.1} maxPolarAngle={1.55} rotateSpeed={0.35} />
      </Canvas>
    </div>
  );
}

function ArcadeRaffleMachine({ mode, ticket }: { mode: WorldMode; ticket: string }) {
  const group = useRef<Group>(null);
  const drum = useRef<Mesh>(null);
  const lever = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.45) * 0.06;
      group.current.position.y = Math.sin(t * 1.2) * 0.035;
    }
    if (drum.current) {
      drum.current.rotation.z += mode === "draw" ? 0.09 : mode === "reveal" ? 0.045 : 0.012;
    }
    if (lever.current) {
      lever.current.rotation.z = mode === "reveal" || mode === "draw" ? -0.64 + Math.sin(t * 9) * 0.05 : -0.22;
    }
  });

  return (
    <group ref={group} position={[0, 0.2, 0]} castShadow>
      <mesh position={[0, -0.28, 0]} castShadow>
        <boxGeometry args={[3.6, 3.7, 1.55]} />
        <meshStandardMaterial color="#11100f" roughness={0.6} metalness={0.45} />
      </mesh>
      <mesh position={[0, 1.86, 0.03]} castShadow>
        <boxGeometry args={[4.08, 0.76, 1.75]} />
        <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.95} />
      </mesh>
      <mesh position={[0, -2.32, 0.02]} castShadow>
        <boxGeometry args={[4.42, 0.58, 1.95]} />
        <meshStandardMaterial color="#c6c6c6" roughness={0.28} metalness={1} />
      </mesh>
      <mesh position={[0, 0.08, 0.84]} castShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.72, 52]} />
        <meshStandardMaterial color="#1a1814" roughness={0.26} metalness={0.72} />
      </mesh>
      <mesh ref={drum} position={[0, 0.08, 1.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.18, 0.13, 16, 72]} />
        <meshStandardMaterial color="#f1c15d" roughness={0.18} metalness={1} emissive={mode === "draw" ? "#4d2b00" : "#000000"} />
      </mesh>
      <TicketMesh position={[0, mode === "winner" ? 0.42 : -0.08, 1.46]} scale={mode === "winner" ? 1.28 : 0.86} label={ticket} active={mode !== "lobby"} />
      <group ref={lever} position={[2.28, 0.42, 0.1]}>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 1.04, 18]} />
          <meshStandardMaterial color="#c8c8c8" metalness={1} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.16, 0]} castShadow>
          <sphereGeometry args={[0.24, 28, 28]} />
          <meshStandardMaterial color="#d71920" roughness={0.24} metalness={0.35} />
        </mesh>
      </group>
      <Text position={[0, 1.9, 0.94]} fontSize={0.32} anchorX="center" anchorY="middle" color="#1a1205">
        LUCKY PASS
      </Text>
      <Text position={[0, -1.16, 0.88]} fontSize={0.18} anchorX="center" anchorY="middle" color="#f5d36f">
        RACRUHUNA
      </Text>
    </group>
  );
}

function LuckyWheel({ mode }: { mode: WorldMode }) {
  const wheel = useRef<Group>(null);

  useFrame(() => {
    if (wheel.current) {
      wheel.current.rotation.z += mode === "draw" ? 0.12 : 0.012;
      wheel.current.rotation.y = -0.35;
    }
  });

  const segments = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <group ref={wheel} position={[-3.25, 0.72, -0.8]} scale={0.78}>
      {segments.map((segment) => (
        <mesh key={segment} rotation={[0, 0, (segment / segments.length) * Math.PI * 2]} castShadow>
          <boxGeometry args={[0.16, 1.64, 0.12]} />
          <meshStandardMaterial color={segment % 2 ? "#d4af37" : "#ece7d8"} roughness={0.25} metalness={0.86} />
        </mesh>
      ))}
      <mesh castShadow>
        <torusGeometry args={[0.95, 0.08, 18, 72]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0, 0.08]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#11100f" metalness={0.7} roughness={0.34} />
      </mesh>
    </group>
  );
}

function CoinField({ mode }: { mode: WorldMode }) {
  const coins = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        x: ((index * 1.73) % 7) - 3.5,
        y: ((index * 0.57) % 3.2) - 0.2,
        z: -1.8 - ((index * 0.91) % 4),
        speed: 0.35 + (index % 6) * 0.07,
        size: 0.11 + (index % 4) * 0.018,
      })),
    [],
  );

  return (
    <group>
      {coins.map((coin, index) => (
        <Coin key={index} {...coin} burst={mode === "winner"} />
      ))}
    </group>
  );
}

function Coin({ x, y, z, speed, size, burst }: { x: number; y: number; z: number; speed: number; size: number; burst: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y += speed;
    ref.current.position.y = y + Math.sin(t * speed * 2 + x) * (burst ? 0.44 : 0.18);
    ref.current.position.x = x + Math.sin(t * 0.4 + z) * 0.18;
  });

  return (
    <mesh ref={ref} position={[x, y, z]} castShadow>
      <cylinderGeometry args={[size, size, 0.035, 32]} />
      <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} />
    </mesh>
  );
}

function PrizeCapsules({ mode }: { mode: WorldMode }) {
  return (
    <group position={[3.15, 0.2, -0.7]}>
      {[0, 1, 2, 3, 4].map((item) => (
        <Float key={item} speed={2 + item * 0.2} floatIntensity={mode === "reveal" ? 0.72 : 0.32} rotationIntensity={0.55}>
          <mesh position={[Math.sin(item) * 0.65, -0.5 + item * 0.38, Math.cos(item) * 0.32]} castShadow>
            <capsuleGeometry args={[0.18, 0.46, 12, 24]} />
            <meshStandardMaterial color={item % 2 ? "#d4af37" : "#d9d9d9"} metalness={0.78} roughness={0.18} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function TicketStack({ ticket, mode }: { ticket: string; mode: WorldMode }) {
  return (
    <group position={[2.8, -1.08, 1.1]} rotation={[0.04, -0.45, 0.06]}>
      {[0, 1, 2].map((item) => (
        <TicketMesh key={item} position={[0, item * 0.06, -item * 0.04]} scale={0.36} label={item === 0 ? ticket : `LP${String(120 + item * 73).padStart(3, "0")}`} active={mode !== "lobby"} />
      ))}
    </group>
  );
}

function TicketMesh({
  position,
  scale,
  label,
  active,
}: {
  position: [number, number, number];
  scale: number;
  label: string;
  active: boolean;
}) {
  const ref = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = active ? Math.sin(t * 1.4) * 0.28 : Math.sin(t * 0.8) * 0.12;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.035;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[2.15, 1.15, 0.06]} />
        <meshStandardMaterial color="#f2d27a" metalness={0.72} roughness={0.2} emissive={active ? "#2a1700" : "#000000"} />
      </mesh>
      <mesh position={[-0.92, 0, 0.045]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
        <meshStandardMaterial color="#070606" roughness={0.58} />
      </mesh>
      <mesh position={[0.92, 0, 0.045]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
        <meshStandardMaterial color="#070606" roughness={0.58} />
      </mesh>
      <Text position={[0, 0.04, 0.08]} fontSize={0.31} anchorX="center" anchorY="middle" color="#160f05">
        {label}
      </Text>
    </group>
  );
}
