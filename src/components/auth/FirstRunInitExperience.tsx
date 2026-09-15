import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhysicsLabEnvironment } from './PhysicsLabEnvironment';

interface FirstRunInitExperienceProps {
  username: string;
  onComplete: () => void;
}

interface Vertex3D {
  baseX: number;
  baseY: number;
  baseZ: number;
  freq: number;
  phase: number;
  amp: number;
}

interface SatelliteNode {
  trackRadiusX: number;
  trackRadiusY: number;
  tilt: number;
  speed: number;
  angle: number;
  hue: string; // 'cyan' | 'blue' | 'violet'
  history: { x: number; y: number }[];
}

interface InflowingParticle {
  x: number;
  y: number;
  targetIdx: number;
  progress: number;
  speed: number;
  alpha: number;
}

export const FirstRunInitExperience: React.FC<FirstRunInitExperienceProps> = ({
  username,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stage, setStage] = useState<number>(0);
  // Stage 0: Initial knowledge core appears (0s - 1.2s)
  // Stage 1: Message 1: "Hi [username], Welcome to MECHANISM Physics." (1.2s - 4.2s)
  // Stage 2: Message 2: "This environment has been customised specifically for you." (4.4s - 7.2s)
  // Stage 3: Message 3: "Configuring your personalised Physics environment." (7.4s - 9.8s)
  // Stage 4: Message 4: "Almost ready." (10.0s - 11.6s)
  // Stage 5: Collapse & Transition (11.8s - 12.8s) -> onComplete

  const [collapseProgress, setCollapseProgress] = useState<number>(0); // 0 -> 1 during stage 5
  const [screenDim, setScreenDim] = useState<number>(0); // darkens at the very end

  const startTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);
  const isCompletedRef = useRef<boolean>(false);

  // Accessible reduced motion detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  // Timer-driven state sequence (Total ~12.5 seconds)
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Stage 1: Hi [username]...
    timers.push(setTimeout(() => setStage(1), 1200));

    // Message 1 fade out transition
    timers.push(setTimeout(() => setStage(1.5), 3800));

    // Stage 2: This environment has been customised...
    timers.push(setTimeout(() => setStage(2), 4300));

    // Message 2 fade out transition
    timers.push(setTimeout(() => setStage(2.5), 6800));

    // Stage 3: Configuring your personalised Physics environment...
    timers.push(setTimeout(() => setStage(3), 7300));

    // Message 3 fade out transition
    timers.push(setTimeout(() => setStage(3.5), 9400));

    // Stage 4: Almost ready...
    timers.push(setTimeout(() => setStage(4), 9800));

    // Message 4 fade out transition
    timers.push(setTimeout(() => setStage(4.5), 11300));

    // Stage 5: Core brightens, field collapses inward, screen dims
    timers.push(
      setTimeout(() => {
        setStage(5);
        let startCollapse = Date.now();
        const collapseDuration = 1000;

        const collapseInterval = setInterval(() => {
          const elapsed = Date.now() - startCollapse;
          const p = Math.min(1, elapsed / collapseDuration);
          setCollapseProgress(p);
          if (p >= 0.7) {
            setScreenDim((p - 0.7) / 0.3);
          }
          if (p >= 1) {
            clearInterval(collapseInterval);
            if (!isCompletedRef.current) {
              isCompletedRef.current = true;
              setTimeout(() => {
                onComplete();
              }, 200);
            }
          }
        }, 16);
      }, 11600)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  // Knowledge Core Canvas Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    // 14 3D Vertices constructing the irregular topological computational knowledge blob
    const vertices: Vertex3D[] = [
      { baseX: 0, baseY: -55, baseZ: 10, freq: 1.1, phase: 0.2, amp: 8 },
      { baseX: 45, baseY: -32, baseZ: -25, freq: 0.9, phase: 1.4, amp: 10 },
      { baseX: -42, baseY: -28, baseZ: 20, freq: 1.2, phase: 2.1, amp: 9 },
      { baseX: 52, baseY: 8, baseZ: 30, freq: 0.8, phase: 0.8, amp: 12 },
      { baseX: -48, baseY: 15, baseZ: -35, freq: 1.3, phase: 3.2, amp: 11 },
      { baseX: 18, baseY: 48, baseZ: 15, freq: 1.0, phase: 1.8, amp: 10 },
      { baseX: -22, baseY: 44, baseZ: -20, freq: 1.4, phase: 0.5, amp: 8 },
      { baseX: 30, baseY: -10, baseZ: -40, freq: 0.95, phase: 2.7, amp: 9 },
      { baseX: -28, baseY: -12, baseZ: 45, freq: 1.15, phase: 3.9, amp: 11 },
      { baseX: 10, baseY: 12, baseZ: 50, freq: 1.05, phase: 4.5, amp: 8 },
      { baseX: -8, baseY: 22, baseZ: -48, freq: 0.85, phase: 5.1, amp: 10 },
      { baseX: 38, baseY: 32, baseZ: -12, freq: 1.25, phase: 1.1, amp: 9 },
      { baseX: -35, baseY: -45, baseZ: -18, freq: 0.9, phase: 2.9, amp: 7 },
      { baseX: 5, baseY: -40, baseZ: 42, freq: 1.3, phase: 4.1, amp: 10 },
    ];

    // Translucent facets connecting vertex triads (irregular polyhedron layers)
    const facets = [
      [0, 1, 3],
      [0, 2, 8],
      [0, 3, 9],
      [1, 7, 11],
      [2, 4, 12],
      [3, 5, 9],
      [4, 6, 10],
      [5, 6, 11],
      [7, 11, 5],
      [8, 9, 2],
      [10, 6, 5],
      [0, 13, 9],
      [1, 3, 7],
      [2, 8, 4],
      [4, 10, 6],
    ];

    // Orbital satellites moving along topological contours
    const satellites: SatelliteNode[] = [
      {
        trackRadiusX: 88,
        trackRadiusY: 52,
        tilt: -0.35,
        speed: 0.016,
        angle: 0.2,
        hue: 'cyan',
        history: [],
      },
      {
        trackRadiusX: 102,
        trackRadiusY: 68,
        tilt: 0.48,
        speed: -0.012,
        angle: 1.8,
        hue: 'violet',
        history: [],
      },
      {
        trackRadiusX: 118,
        trackRadiusY: 62,
        tilt: 0.15,
        speed: 0.014,
        angle: 3.4,
        hue: 'blue',
        history: [],
      },
      {
        trackRadiusX: 95,
        trackRadiusY: 76,
        tilt: -0.55,
        speed: -0.018,
        angle: 4.8,
        hue: 'cyan',
        history: [],
      },
      {
        trackRadiusX: 125,
        trackRadiusY: 82,
        tilt: 0.72,
        speed: 0.011,
        angle: 2.5,
        hue: 'violet',
        history: [],
      },
    ];

    // Inflowing computational particles entering the structure
    let inflowingParticles: InflowingParticle[] = [];
    const spawnInflowingParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 60;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        targetIdx: Math.floor(Math.random() * vertices.length),
        progress: 0,
        speed: 0.012 + Math.random() * 0.016,
        alpha: 0.2 + Math.random() * 0.6,
      };
    };

    for (let i = 0; i < 12; i++) {
      inflowingParticles.push(spawnInflowingParticle());
    }

    const resize = () => {
      if (!canvas) return;
      width = canvas.parentElement?.clientWidth || 360;
      height = canvas.parentElement?.clientHeight || 360;
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

      const cx = width / 2;
      const cy = height / 2;
      const elapsedSec = (Date.now() - startTimeRef.current) / 1000;

      // Calculate collapse transform factor for the ending sequence
      const isCollapsing = elapsedSec > 11.4;
      const collapseFactor = isCollapsing
        ? Math.max(0.01, 1 - Math.pow(Math.min(1, (elapsedSec - 11.4) / 1.0), 3))
        : 1;
      const collapseBrighten = isCollapsing
        ? Math.min(2.5, 1 + Math.sin(Math.min(1, (elapsedSec - 11.4) / 0.4) * Math.PI * 0.5) * 1.5)
        : 1;

      // Slow 3D Rotation angles
      const rotY = frame * 0.009;
      const rotX = Math.sin(frame * 0.005) * 0.35 + 0.2;

      // Project 3D vertices to 2D screen coordinates
      const projected = vertices.map((v) => {
        // Organic harmonic pulsation per vertex
        const radialShift = Math.sin(frame * 0.03 * v.freq + v.phase) * v.amp;
        const dist = Math.sqrt(v.baseX * v.baseX + v.baseY * v.baseY + v.baseZ * v.baseZ);
        const normX = v.baseX / (dist || 1);
        const normY = v.baseY / (dist || 1);
        const normZ = v.baseZ / (dist || 1);

        let x = (v.baseX + normX * radialShift) * collapseFactor;
        let y = (v.baseY + normY * radialShift) * collapseFactor;
        let z = (v.baseZ + normZ * radialShift) * collapseFactor;

        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective projection
        const fov = 300;
        const scale = fov / (fov + z2);
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          z: z2,
          scale,
        };
      });

      // 1. Draw Outer Field Contour Lines (subtle resonance rings)
      if (collapseFactor > 0.1) {
        ctx.save();
        for (let ring = 0; ring < 3; ring++) {
          const ringRadX = (92 + ring * 24) * collapseFactor;
          const ringRadY = (54 + ring * 16) * collapseFactor;
          const ringTilt = (ring === 0 ? -0.2 : ring === 1 ? 0.35 : -0.45) + rotY * 0.2;
          const ringAlpha = (0.09 - ring * 0.02) * collapseBrighten;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(ringTilt);
          ctx.beginPath();
          ctx.ellipse(0, 0, ringRadX, ringRadY, 0, 0, Math.PI * 2);
          ctx.strokeStyle = ring === 0 ? `rgba(96, 207, 255, ${ringAlpha})` : `rgba(124, 92, 255, ${ringAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 2. Draw Translucent Polyhedral Facets (depth and geometry)
      facets.forEach((tri, idx) => {
        const p0 = projected[tri[0]];
        const p1 = projected[tri[1]];
        const p2 = projected[tri[2]];

        const avgZ = (p0.z + p1.z + p2.z) / 3;
        // Only render front-facing / middle facets with soft alpha
        if (avgZ > -40 && collapseFactor > 0.05) {
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();

          const baseAlpha = idx % 2 === 0 ? 0.05 : 0.08;
          const facetAlpha = Math.min(0.2, baseAlpha * collapseBrighten * collapseFactor);
          ctx.fillStyle = idx % 3 === 0
            ? `rgba(96, 207, 255, ${facetAlpha})`
            : idx % 3 === 1
            ? `rgba(59, 130, 246, ${facetAlpha})`
            : `rgba(124, 92, 255, ${facetAlpha})`;
          ctx.fill();
        }
      });

      // 3. Draw Internal Filaments & Edges
      ctx.save();
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const pi = projected[i];
          const pj = projected[j];

          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          // Connect nearby vertices to form the geometric structure
          if (dist2D < 85 * collapseFactor) {
            const edgeAlpha = Math.max(
              0.05,
              (1 - dist2D / (85 * collapseFactor)) * 0.45 * collapseBrighten
            );

            const grad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
            grad.addColorStop(0, `rgba(96, 207, 255, ${edgeAlpha})`);
            grad.addColorStop(0.5, `rgba(59, 130, 246, ${edgeAlpha * 0.8})`);
            grad.addColorStop(1, `rgba(124, 92, 255, ${edgeAlpha})`);

            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);

            // Slight curved internal filament for organic intelligence feel
            const midX = (pi.x + pj.x) / 2 + Math.sin(frame * 0.04 + i) * 3 * collapseFactor;
            const midY = (pi.y + pj.y) / 2 + Math.cos(frame * 0.04 + j) * 3 * collapseFactor;
            ctx.quadraticCurveTo(midX, midY, pj.x, pj.y);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.9 * pi.scale;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 4. Inflowing Particles (assembling into vertices)
      if (collapseFactor > 0.2) {
        inflowingParticles.forEach((p, index) => {
          p.progress += p.speed;
          if (p.progress >= 1) {
            inflowingParticles[index] = spawnInflowingParticle();
            return;
          }

          const target = projected[p.targetIdx];
          const currentX = cx + p.x * (1 - p.progress) + (target.x - cx) * p.progress;
          const currentY = cy + p.y * (1 - p.progress) + (target.y - cy) * p.progress;

          ctx.beginPath();
          ctx.arc(currentX, currentY, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${p.alpha * (1 - p.progress * 0.3) * collapseBrighten})`;
          ctx.shadowColor = 'rgba(96, 207, 255, 0.8)';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // 5. Draw Vertices (Nodes of Knowledge)
      projected.forEach((p, idx) => {
        const nodeAlpha = Math.min(1, (0.55 + p.scale * 0.45) * collapseBrighten);
        const nodeRadius = (1.8 + (idx % 3) * 0.6) * p.scale * collapseFactor;

        if (nodeRadius > 0.3) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = idx % 2 === 0 ? '#e0f2fe' : '#c4b5fd';
          ctx.shadowColor = idx % 2 === 0 ? 'rgba(96, 207, 255, 0.9)' : 'rgba(124, 92, 255, 0.9)';
          ctx.shadowBlur = (8 + (idx % 2) * 4) * collapseBrighten;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 6. Orbital Satellites & Trails
      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        const rawX = Math.cos(sat.angle) * sat.trackRadiusX * collapseFactor;
        const rawY = Math.sin(sat.angle) * sat.trackRadiusY * collapseFactor;

        // Apply tilt
        const cosT = Math.cos(sat.tilt);
        const sinT = Math.sin(sat.tilt);
        const satX = cx + (rawX * cosT - rawY * sinT);
        const satY = cy + (rawX * sinT + rawY * cosT);

        sat.history.push({ x: satX, y: satY });
        if (sat.history.length > 8) {
          sat.history.shift();
        }

        // Draw satellite trail
        if (sat.history.length > 2 && collapseFactor > 0.1) {
          ctx.beginPath();
          ctx.moveTo(sat.history[0].x, sat.history[0].y);
          for (let h = 1; h < sat.history.length; h++) {
            ctx.lineTo(sat.history[h].x, sat.history[h].y);
          }
          ctx.strokeStyle =
            sat.hue === 'cyan'
              ? 'rgba(96, 207, 255, 0.22)'
              : sat.hue === 'violet'
              ? 'rgba(124, 92, 255, 0.22)'
              : 'rgba(59, 130, 246, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw satellite point
        if (collapseFactor > 0.1) {
          ctx.beginPath();
          ctx.arc(satX, satY, 1.6 * collapseFactor, 0, Math.PI * 2);
          ctx.fillStyle = sat.hue === 'cyan' ? '#60cfff' : sat.hue === 'violet' ? '#c4b5fd' : '#93c5fd';
          ctx.shadowColor = sat.hue === 'cyan' ? 'rgba(96, 207, 255, 0.9)' : 'rgba(124, 92, 255, 0.9)';
          ctx.shadowBlur = 8 * collapseBrighten;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 7. Center Nucleus Luminescence (very soft internal glow)
      if (collapseFactor > 0.05) {
        const glowGrad = ctx.createRadialGradient(
          cx,
          cy,
          2,
          cx,
          cy,
          (55 + Math.sin(frame * 0.05) * 6) * collapseFactor
        );
        const nucleusAlpha = (0.16 + Math.sin(frame * 0.04) * 0.04) * collapseBrighten;
        glowGrad.addColorStop(0, `rgba(96, 207, 255, ${nucleusAlpha})`);
        glowGrad.addColorStop(0.5, `rgba(124, 92, 255, ${nucleusAlpha * 0.4})`);
        glowGrad.addColorStop(1, 'rgba(11, 16, 32, 0)');

        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, (60 + Math.sin(frame * 0.05) * 6) * collapseFactor, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-[#04060b] flex flex-col items-center justify-center select-none font-sans overflow-hidden z-50 text-slate-100"
      role="region"
      aria-live="polite"
      aria-label="First-Run Physics Initialization"
    >
      {/* Background: Calmer Physics Environment with sparse formula tracing */}
      <PhysicsLabEnvironment calmMode={true} />

      {/* Atmospheric Vignette & Soft Gradient Mesh */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_30%,rgba(4,6,11,0.85)_80%,rgba(4,6,11,0.98)_100%] pointer-events-none z-[2]" />

      {/* Central Interactive AI / Knowledge Core Object */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center">
        {/* Knowledge Core Container */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center mb-6">
          <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />

          {/* Core Status Micro-Label */}
          <div className="absolute -bottom-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#080d1a]/80 border border-cyan-500/20 text-[10px] font-mono tracking-widest uppercase text-cyan-300/80 shadow-[0_0_12px_rgba(96,207,255,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>KNOWLEDGE CORE INITIALIZING</span>
          </div>
        </div>

        {/* Message Sequence Display Area: ONLY ONE focal message visible at a time */}
        <div className="min-h-[110px] sm:min-h-[120px] flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {/* Stage 1: Hi [username], Welcome to MECHANISM Physics */}
            {stage === 1 && (
              <motion.div
                key="msg-1"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5"
              >
                <h1 className="text-xl sm:text-2xl font-light tracking-tight text-slate-100">
                  Hi <span className="font-semibold text-white text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300">{username}</span>,
                </h1>
                <p className="text-base sm:text-lg text-slate-300 font-light tracking-wide">
                  Welcome to <span className="font-medium tracking-wider text-slate-100">MECHANISM Physics</span>.
                </p>
              </motion.div>
            )}

            {/* Stage 2: This environment has been customised specifically for you. */}
            {stage === 2 && (
              <motion.div
                key="msg-2"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1"
              >
                <p className="text-base sm:text-lg text-slate-200 font-light tracking-wide max-w-md mx-auto">
                  This environment has been customised specifically for you.
                </p>
              </motion.div>
            )}

            {/* Stage 3: Configuring your personalised Physics environment. */}
            {stage === 3 && (
              <motion.div
                key="msg-3"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1"
              >
                <p className="text-base sm:text-lg text-slate-200 font-light tracking-wide max-w-md mx-auto">
                  Configuring your personalised Physics environment.
                </p>
                <p className="text-xs font-mono text-cyan-400/70 tracking-widest uppercase">
                  Reasoning Core • Cognitive Ledger • Quantum Manifolds
                </p>
              </motion.div>
            )}

            {/* Stage 4: Almost ready. */}
            {stage === 4 && (
              <motion.div
                key="msg-4"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1"
              >
                <p className="text-base sm:text-lg text-slate-200 font-light tracking-wide">
                  Almost ready.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle System Status Progress Bar (Subdued & Non-intrusive) */}
        <div className="w-48 h-[2px] bg-slate-800/80 rounded-full overflow-hidden mt-4 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-[#60cfff] via-[#3b82f6] to-[#7c5cff]"
            initial={{ width: '0%' }}
            animate={{ width: stage === 0 ? '8%' : stage === 1 ? '30%' : stage === 2 ? '55%' : stage === 3 ? '80%' : '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Final Stage Inward Collapse & Screen Darkening Transition Overlay */}
      <div
        className="fixed inset-0 pointer-events-none bg-black transition-opacity duration-300 z-40"
        style={{ opacity: screenDim }}
      />
    </div>
  );
};
