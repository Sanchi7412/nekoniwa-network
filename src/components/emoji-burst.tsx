"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

type Particle = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  opacity: number;
  rotation: number;
};

export function EmojiBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  const animRef = useRef<number | null>(null);

  const burst = useCallback(
    (emoji: string, originX: number, originY: number) => {
      const count = 12;
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 3 + Math.random() * 5;
        newParticles.push({
          id: nextId.current++,
          emoji,
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          scale: 0.6 + Math.random() * 0.8,
          opacity: 1,
          rotation: Math.random() * 360,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);
    },
    [],
  );

  const hasParticles = particles.length > 0;

  useEffect(() => {
    if (!hasParticles) return;

    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            opacity: p.opacity - 0.015,
            rotation: p.rotation + p.vx * 2,
            scale: p.scale * 0.995,
          }))
          .filter((p) => p.opacity > 0),
      );
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hasParticles]);

  const ParticleRenderer = useMemo(() => {
    // BUG-006 fix: memoize the renderer to prevent unnecessary remounts
    const Renderer = () => (
      <div className="fixed inset-0 pointer-events-none z-50">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left: p.x,
              top: p.y,
              transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
              opacity: p.opacity,
              fontSize: "1.5rem",
              transition: "none",
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    );
    Renderer.displayName = "ParticleRenderer";
    return Renderer;
  }, [particles]);

  return { burst, ParticleRenderer };
}
