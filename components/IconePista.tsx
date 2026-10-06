import type { TipoPista } from "@/lib/tipos";

/**
 * Ícones dos tipos de pista, no mesmo traço das categorias: duas cores com
 * contorno de tinta. Legíveis sobre o papel do quadro e sobre o fundo escuro.
 */

const T = "var(--color-tinta)";
const M = "var(--color-ambar-400)";
const C = "var(--color-papel-50)";
const V = "var(--color-sangue-500)";

export const ROTULO_TIPO: Record<TipoPista, string> = {
  documento: "Documento",
  depoimento: "Depoimento",
  foto: "Fotografia",
  objeto: "Objeto",
};

const linha = {
  stroke: T,
  strokeWidth: 1.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

export default function IconePista({
  tipo,
  className = "h-5 w-5",
}: {
  tipo: TipoPista;
  className?: string;
}) {
  switch (tipo) {
    // Folha com dobra no canto e clipe
    case "documento":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M5 2.5h10l4 4v15H5z" fill={C} {...linha} />
          <path d="M15 2.5v4h4z" fill={M} {...linha} />
          <path d="M8 11h8M8 14h8M8 17h5" {...linha} strokeWidth="1.2" opacity="0.6" />
          <path d="M8.2 1.4v5.4a1.5 1.5 0 0 0 3 0V3" fill="none" stroke={V} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    // Balão de fala com aspas: o que alguém declarou
    case "depoimento":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M3 4h18v11.5h-9.5L6.5 20v-4.5H3z" fill={C} {...linha} />
          {/* Aspas de abertura: bolinha cheia com a cauda subindo */}
          <circle cx="9" cy="11.3" r="1.75" fill={V} />
          <path d="M7.4 10.8c0-1.9 1-3.2 2.9-3.7" fill="none" stroke={V} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14.6" cy="11.3" r="1.75" fill={V} />
          <path d="M13 10.8c0-1.9 1-3.2 2.9-3.7" fill="none" stroke={V} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // Polaroide da perícia
    case "foto":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <rect x="3.5" y="2.5" width="17" height="19" fill={C} {...linha} />
          <rect x="5.5" y="4.5" width="13" height="11" fill={T} />
          <circle cx="15.2" cy="7.6" r="1.6" fill={M} />
          <path d="M5.5 15.5l4-5 3 3.4 2-2 4 3.6" fill="none" stroke={M} strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      );

    // Saco de evidência lacrado, com etiqueta
    case "objeto":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path d="M4.5 5.5h15v16h-15z" fill="rgba(230,225,213,0.75)" {...linha} />
          <rect x="4.5" y="5.5" width="15" height="2.8" fill={V} {...linha} strokeWidth="1.2" />
          <g transform="rotate(-8 15 16)">
            <rect x="11.3" y="12.5" width="7.4" height="6" fill={M} {...linha} strokeWidth="1.2" />
            <circle cx="13" cy="15.5" r="0.8" fill={T} />
            <path d="M14.6 14.6h2.6M14.6 16.4h2" stroke={T} strokeWidth="0.9" />
          </g>
        </svg>
      );
  }
}
