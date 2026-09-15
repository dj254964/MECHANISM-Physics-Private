import React, { useEffect, useRef } from 'react';

export const NoirBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // 2-3 sparse, calm particles drifting with low luminance (0.12 - 0.20 alpha)
    const sparseParticles = [
      { x: 0.15, y: 0.25, vx: 0.00004, vy: 0.00006, r: 1.2, alpha: 0.18, phase: 0 },
      { x: 0.78, y: 0.65, vx: -0.00005, vy: 0.00003, r: 1.4, alpha: 0.14, phase: 2 },
      { x: 0.45, y: 0.85, vx: 0.00003, vy: -0.00005, r: 1.0, alpha: 0.16, phase: 4 },
    ];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Delicate Mathematical Coordinate Traces (faint crosshairs at subtle intervals)
      ctx.save();
      ctx.strokeStyle = 'rgba(96, 207, 255, 0.04)';
      ctx.lineWidth = 0.8;

      const gridSpacingX = Math.max(180, width / 6);
      const gridSpacingY = Math.max(180, height / 5);

      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        for (let y = gridSpacingY; y < height; y += gridSpacingY) {
          // Delicate crosshair marker `+`
          const arm = 4;
          ctx.beginPath();
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. Sparse calm floating particles
      ctx.save();
      sparseParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * width;
        const py = p.y * height;
        const currentAlpha = p.alpha + Math.sin(frame * 0.01 + p.phase) * 0.04;

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(186, 230, 253, ${currentAlpha})`;
        ctx.shadowColor = 'rgba(96, 207, 255, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.restore();

      // 3. Faint Waveform / Trajectory Geometry (bottom subtle edge trace)
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(96, 207, 255, 0.025)';
      ctx.lineWidth = 1;
      const waveY = height * 0.92;
      ctx.moveTo(0, waveY);
      for (let x = 0; x < width; x += 15) {
        const y = waveY + Math.sin(x * 0.008 + frame * 0.004) * 8;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
      role="presentation"
    >
      {/* Deep Noir Atmospheric Gradients (#07080C base with subtle #0C0E16 / cyan depth) */}
      <div className="absolute inset-0 bg-[#07080c]" />
      <div className="absolute inset-0 bg-radial-[circle_at_20%_15%,rgba(12,14,22,0.6)_0%,transparent_50%]" />
      <div className="absolute inset-0 bg-radial-[circle_at_85%_80%,rgba(16,20,32,0.45)_0%,transparent_55%]" />

      {/* Subtle Coordinate & Geometry Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-70" />
    </div>
  );
};
