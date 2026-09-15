import React, { useEffect, useRef, useState } from 'react';

// Vertex shader: Full-screen quad
const VERT_SRC = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader: Multi-octave domain-warping fluid field with MECHANISM palette
const FRAG_SRC = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

// Pseudo-random and noise primitives
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractional Brownian Motion with rotation to eliminate grid artifacts
mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000 * noise(p); p = rot * p * 2.02;
  f += 0.2500 * noise(p); p = rot * p * 2.03;
  f += 0.1250 * noise(p); p = rot * p * 2.01;
  f += 0.0625 * noise(p);
  return f;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  // Slow time scaling for glacial fluid movement
  float t = u_time * 0.055;

  // Domain warping layer 1: organic drift & curl
  vec2 q = vec2(
    fbm(p * 0.85 + vec2(0.0, 0.0) + vec2(t * 0.45, t * 0.35)),
    fbm(p * 0.85 + vec2(5.2, 1.3) + vec2(-t * 0.38, t * 0.48))
  );

  // Domain warping layer 2: stretching, compressing, and circulating currents
  vec2 r = vec2(
    fbm(p * 1.1 + 3.2 * q + vec2(1.7, 9.2) + vec2(t * 0.3, -t * 0.22)),
    fbm(p * 1.1 + 3.2 * q + vec2(8.3, 2.8) + vec2(-t * 0.26, t * 0.34))
  );

  // Fluid field density
  float f = fbm(p * 0.95 + 3.6 * r);

  // Normalization to 0..1
  float fluid = clamp((f * f * 4.0 + 4.0 * f + 1.0) * 0.2, 0.0, 1.0);

  // MECHANISM Color Palette:
  // Base atmosphere: deep charcoal / near-black / midnight navy
  vec3 col_deep_base  = vec3(0.024, 0.035, 0.075); // #060913
  vec3 col_abyss_blue = vec3(0.038, 0.068, 0.155); // #0a1127

  // Subtle fluid currents:
  vec3 col_cyan_glow  = vec3(0.05, 0.42, 0.55);   // Controlled cyan
  vec3 col_blue_core  = vec3(0.09, 0.23, 0.52);   // Technical cobalt/blue
  vec3 col_violet_low = vec3(0.24, 0.14, 0.42);   // Subdued violet/purple

  // Layered blending of liquid gradients
  vec3 color = mix(col_deep_base, col_abyss_blue, clamp(length(q), 0.0, 1.0));
  color = mix(color, col_blue_core, clamp(length(r.x), 0.0, 1.0) * 0.85);
  color = mix(color, col_violet_low, clamp(length(r.y) * 0.75, 0.0, 1.0) * 0.7);
  color = mix(color, col_cyan_glow, smoothstep(0.4, 0.95, fluid) * 0.55);

  // Soft atmospheric luminosity
  float lum = smoothstep(0.3, 0.85, fluid) * 0.18;
  color += vec3(0.02, 0.06, 0.12) * lum;

  // Center radial vignette to ensure crystal-clear text readability behind login card
  vec2 center = st - vec2(0.5, 0.5);
  float dist = length(center);
  float vignette = smoothstep(0.9, 0.25, dist);
  // Soften contrast in center area for maximum typography clarity
  color = mix(color * 0.78, color, smoothstep(0.1, 0.65, dist));

  // Global tone clamp to keep saturation calm and analytical
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

interface FluidBackgroundProps {
  className?: string;
}

export const FluidBackground: React.FC<FluidBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webGlFailed, setWebGlFailed] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebGlFailed(true);
      return;
    }

    // Compile helper
    const createShader = (type: number, source: string) => {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile failed', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) {
      setWebGlFailed(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebGlFailed(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link failed', gl.getProgramInfoLog(program));
      setWebGlFailed(true);
      return;
    }

    gl.useProgram(program);

    // Full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');

    let animationFrameId: number;
    let startTime = performance.now();

    // Scale canvas to half resolution for buttery-smooth fluid simulation with zero GPU drag
    const resize = () => {
      if (!canvas || !gl) return;
      const scale = 0.5; // Downscaled render buffer + bilinear upscale = natural liquid diffusion
      const width = Math.max(320, Math.floor(window.innerWidth * scale));
      const height = Math.max(240, Math.floor(window.innerHeight * scale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (now: number) => {
      if (!gl || !canvas) return;

      const elapsed = prefersReducedMotion ? 12.0 : (now - startTime) * 0.001;

      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uIntensity, 1.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Trigger initial render
    render(performance.now());

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(positionBuffer);
      }
    };
  }, [prefersReducedMotion]);

  if (webGlFailed) {
    // Fallback: Multi-layer CSS organic fluid gradients
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden bg-[#050811] ${className}`} aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,20,38,0.7)_0%,rgba(5,8,17,0.95)_70%,#050811_100%)]" />
        <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-cyan-600/12 via-blue-700/10 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-violet-700/12 via-indigo-600/10 to-transparent blur-[110px]" />
        <div className="absolute top-[35%] left-[30%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-r from-blue-600/8 via-cyan-500/6 to-violet-600/8 blur-[90px]" />

        {/* Faint Physics Coordinate Grid & Instrument Markers */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden bg-[#050811] ${className}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
      />
      {/* Subtle overlay scrim for depth and central high contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,8,17,0.7)_0%,rgba(5,8,17,0.88)_65%,#050811_100%)] pointer-events-none" />

      {/* Physics Laboratory Environmental Grid & Dimension Crosshairs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-[size:54px_54px] pointer-events-none" />

      {/* Faint Phase Space Orbital Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50%" cy="50%" r="220" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8" className="text-cyan-400" />
        <circle cx="50%" cy="50%" r="380" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 12" className="text-blue-400" />
        <circle cx="50%" cy="50%" r="560" fill="none" stroke="currentColor" strokeWidth="1" className="text-indigo-400" />
        {/* Subtle coordinate ticks */}
        <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 16" className="text-cyan-300" />
        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 16" className="text-cyan-300" />
      </svg>
    </div>
  );
};
