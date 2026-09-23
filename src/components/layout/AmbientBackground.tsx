"use client";

import { useEffect, useMemo, useState } from "react";

const DOTS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 53 + 11) % 100,
  size: i % 5 === 0 ? 2.2 : 1.2,
  delay: (i % 9) * 0.8,
  duration: 14 + (i % 7) * 2,
}));

export function AmbientBackground() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const particles = useMemo(() => DOTS, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#050608]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, rgba(139,92,246,0.10), transparent 42%), radial-gradient(circle at 82% 72%, rgba(34,211,238,0.06), transparent 40%), radial-gradient(circle at 12% 80%, rgba(139,92,246,0.05), transparent 36%)",
        }}
      />
      <div className="grid-fade absolute inset-0 opacity-60" />
      {!reduce &&
        particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-white/40"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              animation: `drift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
    </div>
  );
}

export function CursorGlow() {
  const [pos, setPos] = useState({ x: -400, y: -400 });
  const [on, setOn] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    setOn(true);
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (!on) return null;

  return (
    <div
      className="pointer-events-none fixed z-10 h-[420px] w-[420px] rounded-full opacity-40 mix-blend-screen"
      style={{
        left: pos.x - 210,
        top: pos.y - 210,
        background: "radial-gradient(circle, rgba(139,92,246,0.12), transparent 62%)",
        transition: "left 0.12s linear, top 0.12s linear",
      }}
      aria-hidden
    />
  );
}
