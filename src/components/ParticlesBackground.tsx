"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export default function ParticlesBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate random particles
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = 60; // Number of particles

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100, // Random X position (0-100%)
          delay: Math.random() * 5, // Random delay (0-5s)
          duration: 15 + Math.random() * 15, // Duration 15-30s
          size: 2 + Math.random() * 4, // Size 2-6px
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div className="absolute inset-0 hero-grid-pattern opacity-30" />

      {/* Purple Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: "var(--accent-blue-wash)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px]" style={{ background: "var(--accent-blue-wash)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-70" style={{ background: "var(--accent-blue-wash)" }} />

      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              "--x": `${particle.x}%`,
              "--delay": `${particle.delay}s`,
              "--duration": `${particle.duration}s`,
              "--size": `${particle.size}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to bottom, var(--background-alt), transparent)" }} />

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-radial-vignette" />
    </div>
  );
}
