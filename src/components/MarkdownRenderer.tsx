import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Preprocesses raw text to normalize physics & mathematical notation,
 * Greek letters (e.g. \hbar, \omega, \theta, \lambda, \epsilon, \nabla),
 * quantum/field operators, derivatives, constants, and causal arrows.
 */
export function formatPhysicsMathAndOperators(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Reversible reaction arrows & operators
  text = text
    .replace(/\\xrightleftharpoons(\[[^\]]*\])?(\{[^}]*\})?/g, ' ⇌ ')
    .replace(/\\rightleftharpoons/g, ' ⇌ ')
    .replace(/\$\\rightarrow\$/g, ' → ')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\$\\leftarrow\$/g, ' ← ')
    .replace(/\\leftarrow/g, ' ← ')
    .replace(/\$\\leftrightarrow\$/g, ' ↔ ')
    .replace(/\\leftrightarrow/g, ' ↔ ')
    .replace(/\$\\uparrow\$/g, ' ↑')
    .replace(/\\uparrow/g, ' ↑')
    .replace(/\$\\downarrow\$/g, ' ↓')
    .replace(/\\downarrow/g, ' ↓')
    .replace(/\$\\times\$/g, ' × ')
    .replace(/\\times/g, ' × ')
    .replace(/\$\\cdot\$/g, ' · ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\$\\div\$/g, ' ÷ ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\$\\pm\$/g, ' ± ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\$\\approx\$/g, ' ≈ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\$\\propto\$/g, ' ∝ ')
    .replace(/\\propto/g, ' ∝ ')
    .replace(/\$\\leq\$/g, ' ≤ ')
    .replace(/\\leq/g, ' ≤ ')
    .replace(/\$\\geq\$/g, ' ≥ ')
    .replace(/\\geq/g, ' ≥ ')
    .replace(/\$\\neq\$/g, ' ≠ ')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\$\\Delta\$/g, 'Δ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\$\\nabla\$/g, '∇')
    .replace(/\\nabla/g, '∇')
    .replace(/\$\\partial\$/g, '∂')
    .replace(/\\partial/g, '∂')
    .replace(/\$\\hbar\$/g, 'ħ')
    .replace(/\\hbar/g, 'ħ')
    .replace(/\$\\mu\$/g, 'µ')
    .replace(/\\mu/g, 'µ')
    .replace(/\$\\alpha\$/g, 'α')
    .replace(/\\alpha/g, 'α')
    .replace(/\$\\beta\$/g, 'β')
    .replace(/\\beta/g, 'β')
    .replace(/\$\\gamma\$/g, 'γ')
    .replace(/\\gamma/g, 'γ')
    .replace(/\$\\theta\$/g, 'θ')
    .replace(/\\theta/g, 'θ')
    .replace(/\$\\lambda\$/g, 'λ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\$\\omega\$/g, 'ω')
    .replace(/\\omega/g, 'ω')
    .replace(/\$\\Omega\$/g, 'Ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\$\\psi\$/g, 'ψ')
    .replace(/\\psi/g, 'ψ')
    .replace(/\$\\Psi\$/g, 'Ψ')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\$\\phi\$/g, 'ϕ')
    .replace(/\\phi/g, 'ϕ')
    .replace(/\$\\Phi\$/g, 'Φ')
    .replace(/\\Phi/g, 'Φ')
    .replace(/\$\\sigma\$/g, 'σ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\$\\pi\$/g, 'π')
    .replace(/\\pi/g, 'π')
    .replace(/\$\\rho\$/g, 'ρ')
    .replace(/\\rho/g, 'ρ')
    .replace(/\$\\tau\$/g, 'τ')
    .replace(/\\tau/g, 'τ')
    .replace(/\$\\infty\$/g, '∞')
    .replace(/\\infty/g, '∞');

  // 2. Physics fundamental constants & field notations
  text = text
    .replace(/\$\\epsilon_0\$/g, 'ε₀')
    .replace(/\$\\mu_0\$/g, 'μ₀')
    .replace(/\$k_B\$/g, '*k*<sub>B</sub>')
    .replace(/\$k_\{B\}\$/g, '*k*<sub>B</sub>')
    .replace(/\$v_f\$/g, '*v*<sub>f</sub>')
    .replace(/\$v_0\$/g, '*v*<sub>0</sub>')
    .replace(/\$v_i\$/g, '*v*<sub>i</sub>')
    .replace(/\$a_c\$/g, '*a*<sub>c</sub>')
    .replace(/\$T_c\$/g, '*T*<sub>c</sub>')
    .replace(/\$V_H\$/g, '*V*<sub>H</sub>')
    .replace(/\$E_n\$/g, '*E*<sub>n</sub>')
    .replace(/\$p_x\$/g, '*p*<sub>x</sub>')
    .replace(/\$p_y\$/g, '*p*<sub>y</sub>')
    .replace(/\$p_z\$/g, '*p*<sub>z</sub>');

  // 3. Specific fix for group expressions like ($I_{Kr}, I_{Ks}$) or $I_{Kr}, I_{Ks}$
  text = text.replace(
    /\(\s*\$I_\{([A-Za-z0-9, ]+)\}\s*,\s*I_\{([A-Za-z0-9, ]+)\}\s*\$\)/g,
    '(*I*<sub>$1</sub>, *I*<sub>$2</sub>)'
  );
  text = text.replace(
    /\$I_\{([A-Za-z0-9, ]+)\}\s*,\s*I_\{([A-Za-z0-9, ]+)\}\$/g,
    '*I*<sub>$1</sub>, *I*<sub>$2</sub>'
  );
  text = text.replace(
    /\(\s*\$I_\{([A-Za-z0-9, ]+)\}\$\s*,\s*\$I_\{([A-Za-z0-9, ]+)\}\$\s*\)/g,
    '(*I*<sub>$1</sub>, *I*<sub>$2</sub>)'
  );

  // 4. Single current & subscript expressions: $I_x$, $I_{Ca}$, etc.
  text = text.replace(/\$I_\{([A-Za-z0-9, ]+)\}\$/g, '*I*<sub>$1</sub>');
  text = text.replace(/\$I_([A-Za-z0-9]+)\$/g, '*I*<sub>$1</sub>');

  // 5. Common ion and particle notation: $Ca^{2+}$, $Na^+$, $e^-$, etc.
  text = text
    .replace(/\$e\^-\$/g, 'e⁻')
    .replace(/\$e\^\{-\}\$/g, 'e⁻')
    .replace(/\$e\^\+\$/g, 'e⁺')
    .replace(/\$Ca\^\{?2\+\}?/g, 'Ca²⁺')
    .replace(/\$Na\^\+/g, 'Na⁺')
    .replace(/\$K\^\+/g, 'K⁺')
    .replace(/\$Cl\^-/g, 'Cl⁻')
    .replace(/\$H\^\+/g, 'H⁺')
    .replace(/\$Mg\^\{?2\+\}?/g, 'Mg²⁺')
    .replace(/\$HCO_3\^-/g, 'HCO₃⁻')
    .replace(/\$HCO_3\^\{-\}/g, 'HCO₃⁻')
    .replace(/\$CO_2\$/g, 'CO₂')
    .replace(/\$H_2O\$/g, 'H₂O');

  // Clean trailing dollar signs for ion/particle superscripts if any left
  text = text.replace(/(e⁻|e⁺|Ca²⁺|Na⁺|K⁺|Cl⁻|H⁺|Mg²⁺|HCO₃⁻)\$/g, '$1');

  // 6. General subscript pattern $X_{abc}$ or $X_a$ where X is a letter, if not already captured
  text = text.replace(/\$([A-Za-z])_\{([A-Za-z0-9,]+)\}\$/g, '*$1*<sub>$2</sub>');

  return text;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const sanitizedContent = useMemo(() => formatPhysicsMathAndOperators(content), [content]);

  return (
    <div className={`markdown-body space-y-3 leading-relaxed text-sm md:text-base text-slate-200 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg md:text-xl font-bold font-sans tracking-tight text-slate-100 border-b border-white/[0.08] pb-2 mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base md:text-lg font-bold font-sans tracking-tight text-slate-100 mt-4 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-sky-300 mt-3 mb-1 uppercase tracking-wider font-mono">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-slate-200 my-2 leading-relaxed text-sm md:text-[15px]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 text-slate-200 my-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-200 my-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:text-sky-400">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          sub: ({ children }) => (
            <sub className="text-[0.8em] font-normal leading-none bottom-[-0.2em] relative text-sky-300">
              {children}
            </sub>
          ),
          sup: ({ children }) => (
            <sup className="text-[0.8em] font-normal leading-none top-[-0.3em] relative text-sky-300">
              {children}
            </sup>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-sky-400 pl-3.5 py-1.5 my-3 bg-[#101420] text-slate-300 italic rounded-r border-t-0 border-b-0 border-r-0">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-white/[0.08] bg-[#0c0e16]">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#101420] text-slate-200 font-semibold border-b border-white/[0.08]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/[0.06]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/[0.02] transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-medium text-slate-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-300">{children}</td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="font-mono text-xs md:text-sm px-1.5 py-0.5 rounded bg-[#101420] text-sky-300 border border-white/[0.08]">
                  {children}
                </code>
              );
            }
            return (
              <pre className="overflow-x-auto p-3.5 rounded-lg bg-[#0a0c14] border border-white/[0.08] text-slate-200 font-mono text-xs my-2.5">
                <code>{children}</code>
              </pre>
            );
          },
          hr: () => (
            <hr className="border-white/[0.08] my-4" />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

