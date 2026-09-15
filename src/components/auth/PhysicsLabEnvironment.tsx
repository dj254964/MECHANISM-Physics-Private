import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

// Glyph definitions for true stroke-by-stroke vector writing
// Coordinate box: height = 24, baseline at y = 22
interface GlyphStroke {
  points: Point[];
}

interface GlyphDef {
  width: number;
  strokes: GlyphStroke[];
}

const GLYPHS: Record<string, GlyphDef> = {
  F: {
    width: 16,
    strokes: [
      // 1. Vertical stem (top to bottom)
      { points: [{ x: 2, y: 1 }, { x: 2, y: 22 }] },
      // 2. Top bar (left to right)
      { points: [{ x: 2, y: 1 }, { x: 15, y: 1 }] },
      // 3. Middle bar (left to right)
      { points: [{ x: 2, y: 11 }, { x: 11, y: 11 }] },
    ],
  },
  '=': {
    width: 16,
    strokes: [
      // 1. Upper bar
      { points: [{ x: 1, y: 9 }, { x: 15, y: 9 }] },
      // 2. Lower bar
      { points: [{ x: 1, y: 16 }, { x: 15, y: 16 }] },
    ],
  },
  m: {
    width: 19,
    strokes: [
      // 1. Left vertical stem
      { points: [{ x: 2, y: 8 }, { x: 2, y: 22 }] },
      // 2. First arch
      {
        points: [
          { x: 2, y: 12 },
          { x: 4, y: 8 },
          { x: 8, y: 8 },
          { x: 10, y: 12 },
          { x: 10, y: 22 },
        ],
      },
      // 3. Second arch
      {
        points: [
          { x: 10, y: 12 },
          { x: 12, y: 8 },
          { x: 16, y: 8 },
          { x: 18, y: 12 },
          { x: 18, y: 22 },
        ],
      },
    ],
  },
  a: {
    width: 15,
    strokes: [
      // 1. Round counter / loop
      {
        points: [
          { x: 12, y: 12 },
          { x: 8, y: 8 },
          { x: 3, y: 10 },
          { x: 2, y: 16 },
          { x: 6, y: 22 },
          { x: 11, y: 22 },
          { x: 13, y: 18 },
          { x: 13, y: 12 },
        ],
      },
      // 2. Right vertical stem
      {
        points: [
          { x: 13, y: 8 },
          { x: 13, y: 22 },
          { x: 15, y: 22 },
        ],
      },
    ],
  },
  E: {
    width: 16,
    strokes: [
      // 1. Vertical stem
      { points: [{ x: 2, y: 1 }, { x: 2, y: 22 }] },
      // 2. Top bar
      { points: [{ x: 2, y: 1 }, { x: 14, y: 1 }] },
      // 3. Mid bar
      { points: [{ x: 2, y: 11 }, { x: 10, y: 11 }] },
      // 4. Bottom bar
      { points: [{ x: 2, y: 22 }, { x: 14, y: 22 }] },
    ],
  },
  c: {
    width: 14,
    strokes: [
      {
        points: [
          { x: 13, y: 10 },
          { x: 9, y: 8 },
          { x: 4, y: 10 },
          { x: 2, y: 15 },
          { x: 4, y: 20 },
          { x: 9, y: 22 },
          { x: 13, y: 20 },
        ],
      },
    ],
  },
  '²': {
    width: 10,
    strokes: [
      {
        points: [
          { x: 1, y: 3 },
          { x: 4, y: 1 },
          { x: 7, y: 2 },
          { x: 8, y: 5 },
          { x: 2, y: 10 },
          { x: 8, y: 10 },
        ],
      },
    ],
  },
  p: {
    width: 15,
    strokes: [
      // 1. Vertical descender stem
      { points: [{ x: 2, y: 8 }, { x: 2, y: 28 }] },
      // 2. Round bowl
      {
        points: [
          { x: 2, y: 9 },
          { x: 6, y: 8 },
          { x: 12, y: 10 },
          { x: 13, y: 15 },
          { x: 9, y: 21 },
          { x: 2, y: 21 },
        ],
      },
    ],
  },
  v: {
    width: 15,
    strokes: [
      {
        points: [
          { x: 1, y: 8 },
          { x: 7, y: 22 },
          { x: 14, y: 8 },
        ],
      },
    ],
  },
  λ: {
    width: 16,
    strokes: [
      // 1. Main diagonal
      { points: [{ x: 5, y: 1 }, { x: 15, y: 22 }] },
      // 2. Branching left foot
      { points: [{ x: 9, y: 10 }, { x: 1, y: 22 }] },
    ],
  },
  h: {
    width: 15,
    strokes: [
      // 1. Tall vertical stem
      { points: [{ x: 2, y: 1 }, { x: 2, y: 22 }] },
      // 2. Arch
      {
        points: [
          { x: 2, y: 12 },
          { x: 5, y: 8 },
          { x: 10, y: 8 },
          { x: 13, y: 12 },
          { x: 13, y: 22 },
        ],
      },
    ],
  },
  '/': {
    width: 12,
    strokes: [{ points: [{ x: 10, y: 3 }, { x: 2, y: 26 }] }],
  },
  V: {
    width: 16,
    strokes: [
      {
        points: [
          { x: 1, y: 1 },
          { x: 8, y: 22 },
          { x: 15, y: 1 },
        ],
      },
    ],
  },
  I: {
    width: 12,
    strokes: [
      { points: [{ x: 6, y: 1 }, { x: 6, y: 22 }] },
      { points: [{ x: 2, y: 1 }, { x: 10, y: 1 }] },
      { points: [{ x: 2, y: 22 }, { x: 10, y: 22 }] },
    ],
  },
  R: {
    width: 16,
    strokes: [
      // 1. Vertical stem
      { points: [{ x: 2, y: 1 }, { x: 2, y: 22 }] },
      // 2. Top loop
      {
        points: [
          { x: 2, y: 1 },
          { x: 10, y: 1 },
          { x: 14, y: 3 },
          { x: 14, y: 9 },
          { x: 10, y: 12 },
          { x: 2, y: 12 },
        ],
      },
      // 3. Diagonal leg
      { points: [{ x: 7, y: 12 }, { x: 14, y: 22 }] },
    ],
  },
  ' ': {
    width: 9,
    strokes: [],
  },
};

// Available short physics formulas for tracing
const FORMULA_KEYS = ['F = ma', 'E = mc²', 'p = mv', 'λ = h/p', 'V = IR'];

interface VectorStroke {
  points: Point[];
  totalLength: number;
}

// Built vector formula with absolute coordinates
interface BuiltFormula {
  text: string;
  strokes: VectorStroke[];
  totalStrokes: number;
}

// Compile formula string into continuous vector strokes
function buildFormulaStrokes(
  text: string,
  startX: number,
  startY: number,
  scale = 1.05
): BuiltFormula {
  const strokes: VectorStroke[] = [];
  let currentX = startX;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = GLYPHS[char];
    if (!glyph) {
      currentX += 12 * scale;
      continue;
    }

    glyph.strokes.forEach((s) => {
      const worldPoints: Point[] = s.points.map((pt) => ({
        x: currentX + pt.x * scale,
        y: startY + pt.y * scale,
      }));

      // Calculate stroke length
      let length = 0;
      for (let j = 0; j < worldPoints.length - 1; j++) {
        length += Math.hypot(
          worldPoints[j + 1].x - worldPoints[j].x,
          worldPoints[j + 1].y - worldPoints[j].y
        );
      }

      strokes.push({
        points: worldPoints,
        totalLength: Math.max(length, 1),
      });
    });

    currentX += (glyph.width + 4) * scale;
  }

  return {
    text,
    strokes,
    totalStrokes: strokes.length,
  };
}

// Interpolate position along a multi-point polyline
function getPointAlongStroke(points: Point[], distance: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || distance <= 0) return { ...points[0] };

  let covered = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    if (covered + segLen >= distance) {
      const t = segLen > 0 ? (distance - covered) / segLen : 0;
      return {
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      };
    }
    covered += segLen;
  }

  return { ...points[points.length - 1] };
}

// ----------------------------------------------------
// STATE TYPES
// ----------------------------------------------------

interface SciStructure {
  id: string;
  relX: number;
  relY: number;
  w: number;
  h: number;
  style: 'corner-bracket' | 'slender-cell' | 'fragmented-frame' | 'cross-reticle';
  hoverVal: number; // 0..1 (dormant -> active glow)
  lastHovered: boolean;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  curveSpeed: number;
  curveAmp: number;
  phase: number;
  radius: number;
  history: Point[];
  maxHistory: number;
  age: number;
  lifespan: number;
}

interface WritingParticleState {
  status: 'idle' | 'approaching' | 'drawing' | 'air-travel' | 'lingering' | 'fading';
  x: number;
  y: number;
  vx: number;
  vy: number;
  formula: BuiltFormula | null;
  strokeIndex: number;
  strokeProgressDist: number; // Distance traveled along current stroke
  // Ink points already laid down per stroke
  completedStrokes: Point[][];
  currentStrokeDrawnPoints: Point[];
  airStart: Point;
  airTarget: Point;
  airT: number;
  lingerFrames: number;
  fadeFrames: number;
  opacity: number;
  cooldownFrames: number;
}

interface PhysicsLabEnvironmentProps {
  calmMode?: boolean;
}

export const PhysicsLabEnvironment: React.FC<PhysicsLabEnvironmentProps> = ({ calmMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const mousePos = useRef<{ x: number; y: number; active: boolean }>({
    x: -2000,
    y: -2000,
    active: false,
  });

  // Track prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Environmental structures (abstract geometric shapes, NO HUD/text/labels)
    const structures: SciStructure[] = [
      {
        id: 's-01',
        relX: 0.12,
        relY: 0.20,
        w: 48,
        h: 48,
        style: 'corner-bracket',
        hoverVal: 0,
        lastHovered: false,
      },
      {
        id: 's-02',
        relX: 0.09,
        relY: 0.65,
        w: 42,
        h: 62,
        style: 'slender-cell',
        hoverVal: 0,
        lastHovered: false,
      },
      {
        id: 's-03',
        relX: 0.15,
        relY: 0.85,
        w: 58,
        h: 38,
        style: 'fragmented-frame',
        hoverVal: 0,
        lastHovered: false,
      },
      {
        id: 's-04',
        relX: 0.88,
        relY: 0.22,
        w: 48,
        h: 48,
        style: 'corner-bracket',
        hoverVal: 0,
        lastHovered: false,
      },
      {
        id: 's-05',
        relX: 0.91,
        relY: 0.62,
        w: 42,
        h: 64,
        style: 'slender-cell',
        hoverVal: 0,
        lastHovered: false,
      },
      {
        id: 's-06',
        relX: 0.85,
        relY: 0.86,
        w: 56,
        h: 40,
        style: 'fragmented-frame',
        hoverVal: 0,
        lastHovered: false,
      },
    ];

    // Helper: spawn slow, deliberate ambient particle
    const createAmbientParticle = (w: number, h: number, immediateSpread = false): AmbientParticle => {
      const angle = Math.random() * Math.PI * 2;
      // Slower, deliberate physical speed (0.5 to 0.95 px/frame)
      const speed = 0.55 + Math.random() * 0.4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      let x: number;
      let y: number;

      if (immediateSpread) {
        x = Math.random() * w;
        y = Math.random() * h;
      } else {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
          x = Math.random() * w;
          y = -10;
        } else if (side === 1) {
          x = w + 10;
          y = Math.random() * h;
        } else if (side === 2) {
          x = Math.random() * w;
          y = h + 10;
        } else {
          x = -10;
          y = Math.random() * h;
        }
      }

      return {
        x,
        y,
        vx,
        vy,
        speed,
        curveSpeed: 0.008 + Math.random() * 0.012,
        curveAmp: (Math.random() - 0.5) * 0.025,
        phase: Math.random() * Math.PI * 2,
        radius: 1.2 + Math.random() * 0.8,
        history: [],
        maxHistory: 16 + Math.floor(Math.random() * 8),
        age: 0,
        lifespan: 380 + Math.floor(Math.random() * 400),
      };
    };

    // STRICT REQUIREMENT: Only 2–5 particles total (prefer ~3)
    let ambientParticles: AmbientParticle[] = [];

    // The single formula-tracing pen particle state
    const writer: WritingParticleState = {
      status: 'idle',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      formula: null,
      strokeIndex: 0,
      strokeProgressDist: 0,
      completedStrokes: [],
      currentStrokeDrawnPoints: [],
      airStart: { x: 0, y: 0 },
      airTarget: { x: 0, y: 0 },
      airT: 0,
      lingerFrames: 0,
      fadeFrames: 0,
      opacity: 1,
      cooldownFrames: 140, // First event starts ~2.3 seconds after load
    };

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Maintain sparse ambient particles (calmer during initialization)
      const targetAmbient = calmMode ? 1 : width < 640 ? 2 : 3;
      if (ambientParticles.length === 0) {
        ambientParticles = Array.from({ length: targetAmbient }, () =>
          createAmbientParticle(width, height, true)
        );
      } else if (ambientParticles.length < targetAmbient) {
        while (ambientParticles.length < targetAmbient) {
          ambientParticles.push(createAmbientParticle(width, height, true));
        }
      } else if (ambientParticles.length > targetAmbient) {
        ambientParticles = ambientParticles.slice(0, targetAmbient);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Passive pointer tracking
    const handlePointerMove = (e: PointerEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      mousePos.current.active = true;
    };

    const handlePointerLeave = () => {
      mousePos.current.active = false;
      mousePos.current.x = -2000;
      mousePos.current.y = -2000;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // Trigger a new genuine formula-tracing event
    const startFormulaEvent = () => {
      const formulaKey = FORMULA_KEYS[Math.floor(Math.random() * FORMULA_KEYS.length)];

      // Position: Place in the calm peripheral zones (outside central login panel)
      const isLeft = Math.random() > 0.45;
      const relX = isLeft ? 0.11 + Math.random() * 0.05 : 0.77 + Math.random() * 0.04;
      const relY = 0.40 + Math.random() * 0.16;

      const originX = relX * width;
      const originY = relY * height;

      const built = buildFormulaStrokes(formulaKey, originX, originY, 1.15);
      if (built.strokes.length === 0) return;

      writer.formula = built;
      writer.strokeIndex = 0;
      writer.strokeProgressDist = 0;
      writer.completedStrokes = [];
      writer.currentStrokeDrawnPoints = [];
      writer.opacity = 1;

      // The particle starts from a nearby point in space and approaches stroke 0's start
      const firstPt = built.strokes[0].points[0];
      const approachAngle = isLeft ? -0.6 : -2.6;
      const approachDist = 70 + Math.random() * 30;

      writer.x = firstPt.x + Math.cos(approachAngle) * approachDist;
      writer.y = firstPt.y + Math.sin(approachAngle) * approachDist;
      writer.airStart = { x: writer.x, y: writer.y };
      writer.airTarget = { x: firstPt.x, y: firstPt.y };
      writer.airT = 0;
      writer.status = 'approaching';
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const isMouseActive = mousePos.current.active;

      // ----------------------------------------------------
      // 1. ENVIRONMENTAL ABSTRACT STRUCTURES (DORMANT -> VIBRANT GLOW)
      // ----------------------------------------------------
      structures.forEach((st) => {
        const sx = st.relX * width;
        const sy = st.relY * height;
        const halfW = st.w / 2;
        const halfH = st.h / 2;

        const isHovered =
          isMouseActive &&
          Math.abs(mx - sx) <= halfW + 10 &&
          Math.abs(my - sy) <= halfH + 10;

        // Smooth transition: fast activation, calm phosphorescent decay
        if (prefersReducedMotion) {
          st.hoverVal = isHovered ? 1 : 0;
        } else {
          if (isHovered) {
            st.hoverVal += (1 - st.hoverVal) * 0.18;
          } else {
            st.hoverVal += (0 - st.hoverVal) * 0.042;
          }
        }

        const hVal = st.hoverVal;
        const scale = 1 + hVal * 0.035;
        const w = st.w * scale;
        const h = st.h * scale;
        const left = sx - w / 2;
        const top = sy - h / 2;

        ctx.save();

        // VIBRANT GLOW ON HOVER
        if (hVal > 0.04) {
          ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
          ctx.shadowBlur = 14 + hVal * 24;
        }

        // Translucent body
        const bgAlpha = 0.08 + hVal * 0.32;
        ctx.fillStyle = `rgba(6, 12, 26, ${bgAlpha})`;
        ctx.beginPath();
        ctx.roundRect(left, top, w, h, 4);
        ctx.fill();

        // Edge illumination
        const borderAlpha = 0.09 + hVal * 0.85;
        ctx.strokeStyle = hVal > 0.5
          ? `rgba(186, 230, 253, ${borderAlpha})`
          : `rgba(56, 189, 248, ${borderAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Abstract technical geometric accents (NO HUD/TEXT)
        ctx.save();
        const detailAlpha = 0.12 + hVal * 0.82;
        ctx.strokeStyle = `rgba(56, 189, 248, ${detailAlpha})`;
        ctx.lineWidth = 1;

        if (st.style === 'corner-bracket') {
          const notch = 6 + hVal * 2;
          ctx.beginPath();
          // 4 corner brackets
          ctx.moveTo(left, top + notch);
          ctx.lineTo(left, top);
          ctx.lineTo(left + notch, top);

          ctx.moveTo(left + w - notch, top);
          ctx.lineTo(left + w, top);
          ctx.lineTo(left + w, top + notch);

          ctx.moveTo(left, top + h - notch);
          ctx.lineTo(left, top + h);
          ctx.lineTo(left + notch, top + h);

          ctx.moveTo(left + w - notch, top + h);
          ctx.lineTo(left + w, top + h);
          ctx.lineTo(left + w, top + h - notch);
          ctx.stroke();

          // Delicate center dot
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${0.2 + hVal * 0.8})`;
          ctx.fill();

          if (hVal > 0.25) {
            ctx.beginPath();
            ctx.moveTo(sx - 4, sy);
            ctx.lineTo(sx - 2, sy);
            ctx.moveTo(sx + 2, sy);
            ctx.lineTo(sx + 4, sy);
            ctx.moveTo(sx, sy - 4);
            ctx.lineTo(sx, sy - 2);
            ctx.moveTo(sx, sy + 2);
            ctx.lineTo(sx, sy + 4);
            ctx.stroke();
          }
        } else if (st.style === 'slender-cell') {
          ctx.beginPath();
          ctx.moveTo(left + 4, top + h * 0.33);
          ctx.lineTo(left + w - 4, top + h * 0.33);
          ctx.moveTo(left + 4, top + h * 0.66);
          ctx.lineTo(left + w - 4, top + h * 0.66);
          ctx.stroke();
        } else if (st.style === 'fragmented-frame') {
          ctx.beginPath();
          ctx.moveTo(left + 7, top);
          ctx.lineTo(left + w - 7, top);
          ctx.moveTo(left, top + 7);
          ctx.lineTo(left, top + h - 7);
          ctx.moveTo(left + w, top + 7);
          ctx.lineTo(left + w, top + h - 7);
          ctx.stroke();

          if (hVal > 0.15) {
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(Math.PI / 4);
            ctx.strokeStyle = `rgba(186, 230, 253, ${hVal * 0.85})`;
            ctx.strokeRect(-2.5, -2.5, 5, 5);
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // ----------------------------------------------------
      // 2. SLOW AMBIENT PARTICLES (2–3 PARTICLES MAXIMUM)
      // ----------------------------------------------------
      ambientParticles.forEach((p, idx) => {
        if (!prefersReducedMotion) {
          p.history.unshift({ x: p.x, y: p.y });
          if (p.history.length > p.maxHistory) {
            p.history.pop();
          }

          p.x += p.vx;
          p.y += p.vy;

          // Gentle continuous physical curve
          p.phase += p.curveSpeed;
          p.vx += Math.sin(p.phase) * p.curveAmp;
          p.vy += Math.cos(p.phase) * p.curveAmp;

          // Maintain deliberate slow speed
          const curSpeed = Math.hypot(p.vx, p.vy);
          if (curSpeed > 0.05) {
            p.vx = (p.vx / curSpeed) * p.speed;
            p.vy = (p.vy / curSpeed) * p.speed;
          }

          p.age++;

          // Respawn offscreen
          const off = p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30;
          if (off || p.age > p.lifespan) {
            ambientParticles[idx] = createAmbientParticle(width, height, false);
            return;
          }
        }

        // Soft, fading velocity trail behind the particle
        if (p.history.length > 1 && !prefersReducedMotion) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          for (let i = 0; i < p.history.length; i++) {
            ctx.lineTo(p.history[i].x, p.history[i].y);
          }

          const tail = p.history[p.history.length - 1];
          const grad = ctx.createLinearGradient(p.x, p.y, tail.x, tail.y);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
          grad.addColorStop(0.4, 'rgba(96, 165, 250, 0.20)');
          grad.addColorStop(1, 'rgba(167, 139, 250, 0.0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }

        // Leading head
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.restore();
      });

      // ----------------------------------------------------
      // 3. THE ACTUAL FORMULA-TRACING PARTICLE (THE PEN)
      // ----------------------------------------------------
      if (!prefersReducedMotion) {
        if (writer.status === 'idle') {
          writer.cooldownFrames--;
          if (writer.cooldownFrames <= 0) {
            startFormulaEvent();
          }
        } else if (writer.status === 'approaching') {
          // Glides toward stroke 0's start position
          writer.airT += 0.035;
          const t = Math.min(1, writer.airT);
          // Ease-in-out curve
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          writer.x = writer.airStart.x + (writer.airTarget.x - writer.airStart.x) * ease;
          writer.y = writer.airStart.y + (writer.airTarget.y - writer.airStart.y) * ease;

          if (t >= 1) {
            writer.status = 'drawing';
            writer.strokeIndex = 0;
            writer.strokeProgressDist = 0;
            writer.currentStrokeDrawnPoints = [{ ...writer.airTarget }];
          }
        } else if (writer.status === 'drawing' && writer.formula) {
          const currentStroke = writer.formula.strokes[writer.strokeIndex];
          if (currentStroke) {
            // Deliberate drawing speed: 1.15 px/frame (easy to follow with the eye)
            const drawSpeed = 1.15;
            writer.strokeProgressDist += drawSpeed;

            const pos = getPointAlongStroke(currentStroke.points, writer.strokeProgressDist);
            writer.x = pos.x;
            writer.y = pos.y;
            writer.currentStrokeDrawnPoints.push(pos);

            // Check if this stroke finished
            if (writer.strokeProgressDist >= currentStroke.totalLength) {
              // Stroke complete! Save to completedStrokes
              writer.completedStrokes.push([...writer.currentStrokeDrawnPoints]);
              writer.currentStrokeDrawnPoints = [];

              const nextIndex = writer.strokeIndex + 1;
              if (nextIndex < writer.formula.totalStrokes) {
                // Lift pen and glide to the start of the next stroke (air-travel)
                const nextStroke = writer.formula.strokes[nextIndex];
                writer.airStart = { x: writer.x, y: writer.y };
                writer.airTarget = { ...nextStroke.points[0] };
                writer.airT = 0;
                writer.strokeIndex = nextIndex;
                writer.strokeProgressDist = 0;
                writer.status = 'air-travel';
              } else {
                // Entire formula complete!
                writer.status = 'lingering';
                writer.lingerFrames = 220; // Remains visible for ~3.6 seconds
                // Particle arcs away as regular particle
                const exitAngle = Math.random() * Math.PI * 2;
                writer.vx = Math.cos(exitAngle) * 0.9;
                writer.vy = Math.sin(exitAngle) * 0.9;
              }
            }
          }
        } else if (writer.status === 'air-travel') {
          // Pen lifted: repositioning to next stroke start
          writer.airT += 0.055; // Slightly faster glide between strokes
          const t = Math.min(1, writer.airT);
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          writer.x = writer.airStart.x + (writer.airTarget.x - writer.airStart.x) * ease;
          writer.y = writer.airStart.y + (writer.airTarget.y - writer.airStart.y) * ease;

          if (t >= 1) {
            writer.status = 'drawing';
            writer.strokeProgressDist = 0;
            writer.currentStrokeDrawnPoints = [{ ...writer.airTarget }];
          }
        } else if (writer.status === 'lingering') {
          writer.lingerFrames--;
          // Particle gently glides away
          writer.x += writer.vx;
          writer.y += writer.vy;

          if (writer.lingerFrames <= 0) {
            writer.status = 'fading';
            writer.fadeFrames = 110; // ~1.8 second fade out
          }
        } else if (writer.status === 'fading') {
          writer.fadeFrames--;
          writer.opacity = Math.max(0, writer.fadeFrames / 110);
          writer.x += writer.vx;
          writer.y += writer.vy;

          if (writer.fadeFrames <= 0) {
            writer.status = 'idle';
            writer.formula = null;
            writer.completedStrokes = [];
            writer.currentStrokeDrawnPoints = [];
            // Next formula event occurs in ~16 to 24 seconds (rare discovery)
            writer.cooldownFrames = 950 + Math.floor(Math.random() * 500);
          }
        }

        // RENDER THE FORMULA INK TRACES
        if (writer.status !== 'idle') {
          const alpha = writer.opacity;

          ctx.save();
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // 1. Draw all already completed vector strokes (fading slightly toward the oldest)
          writer.completedStrokes.forEach((strokePts) => {
            if (strokePts.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(strokePts[0].x, strokePts[0].y);
            for (let i = 1; i < strokePts.length; i++) {
              ctx.lineTo(strokePts[i].x, strokePts[i].y);
            }
            // Ambient luminous ink
            ctx.strokeStyle = `rgba(186, 230, 253, ${0.88 * alpha})`;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
            ctx.shadowBlur = 8;
            ctx.stroke();
          });

          // 2. Draw the currently actively emerging stroke up to the particle's pen tip
          if (writer.currentStrokeDrawnPoints.length > 1) {
            ctx.beginPath();
            ctx.moveTo(
              writer.currentStrokeDrawnPoints[0].x,
              writer.currentStrokeDrawnPoints[0].y
            );
            for (let i = 1; i < writer.currentStrokeDrawnPoints.length; i++) {
              ctx.lineTo(
                writer.currentStrokeDrawnPoints[i].x,
                writer.currentStrokeDrawnPoints[i].y
              );
            }
            ctx.strokeStyle = `rgba(224, 242, 254, ${0.95 * alpha})`;
            ctx.shadowColor = 'rgba(56, 189, 248, 1.0)';
            ctx.shadowBlur = 10;
            ctx.stroke();
          }

          // 3. Very faint repositioning guide during air travel (so user sees the pen lifting)
          if (writer.status === 'air-travel' && alpha > 0.3) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(writer.airStart.x, writer.airStart.y);
            ctx.lineTo(writer.airTarget.x, writer.airTarget.y);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.setLineDash([2, 4]);
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.restore();
          }

          // 4. Draw the glowing pen-tip particle itself (while drawing or traveling)
          if (
            writer.status === 'approaching' ||
            writer.status === 'drawing' ||
            writer.status === 'air-travel' ||
            (writer.status === 'lingering' && writer.lingerFrames > 120)
          ) {
            ctx.beginPath();
            ctx.arc(writer.x, writer.y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(56, 189, 248, 1.0)';
            ctx.shadowBlur = 12;
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[1]"
      aria-hidden="true"
      role="presentation"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
