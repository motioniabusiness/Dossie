import type { Categoria } from "@/lib/tipos";

/**
 * Ilustrações das categorias, no traço das artes do menu: preenchimento
 * mostarda e creme, contorno de tinta preta e um detalhe em vermelho. Cada
 * peça tem uma sombra dura deslocada, a mesma dos botões.
 *
 * Funcionam sobre fundo claro e escuro: o contorno some no escuro, mas os
 * preenchimentos seguram a silhueta.
 */

const T = "var(--color-tinta)";
const M = "var(--color-ambar-400)";
const C = "var(--color-papel-50)";
const V = "var(--color-sangue-500)";

const contorno = {
  stroke: T,
  strokeWidth: 2,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

export default function IconeCategoria({
  categoria,
  className = "h-12 w-12",
}: {
  categoria: Categoria;
  className?: string;
}) {
  switch (categoria) {
    // Cofre arrombado, porta aberta e moedas à mostra
    case "furto_roubo":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <rect x="7" y="9" width="28" height="30" rx="2" fill={T} opacity="0.85" />
          <rect x="5" y="7" width="28" height="30" rx="2" fill={M} {...contorno} />
          <rect x="9" y="11" width="20" height="22" fill={T} />
          <line x1="9" y1="22" x2="29" y2="22" stroke={M} strokeWidth="1.2" opacity="0.5" />
          <circle cx="14" cy="29.5" r="2.6" fill={M} stroke={T} strokeWidth="1.1" />
          <circle cx="19.5" cy="29.5" r="2.6" fill={M} stroke={T} strokeWidth="1.1" />
          <circle cx="16.8" cy="25.6" r="2.6" fill={M} stroke={T} strokeWidth="1.1" />
          <path d="M33 9 L43.5 5 L43.5 41 L33 35 Z" fill={C} {...contorno} />
          <circle cx="38.3" cy="22" r="3.6" fill={M} {...contorno} strokeWidth="1.6" />
          <line x1="38.3" y1="22" x2="38.3" y2="19.2" stroke={T} strokeWidth="1.4" />
          <path d="M36.2 13.5 l4 -1.4" stroke={V} strokeWidth="2" strokeLinecap="round" />
          <rect x="7" y="37" width="5" height="3.4" fill={T} />
          <rect x="26" y="37" width="5" height="3.4" fill={T} />
        </svg>
      );

    // Faca com a lâmina manchada e gotas no chão
    case "assassinato":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <g transform="rotate(-38 24 22)">
            <path d="M23 21.5 L41 21.5 C44 22 46.5 23.6 48 26 L23 29.5 Z" fill={T} opacity="0.85" transform="translate(1.6 1.6)" />
            <path d="M21 19.5 L39 19.5 C42 20 44.5 21.6 46 24 L21 27.5 Z" fill={C} {...contorno} />
            <path d="M39.5 20.2 C42.2 21 44.4 22.4 45.6 24 L38.2 25.1 C39.5 23.6 39.9 22 39.5 20.2 Z" fill={V} />
            <line x1="24" y1="22.6" x2="37" y2="22.6" stroke={T} strokeWidth="1" opacity="0.35" />
            <rect x="18.5" y="15.5" width="3.6" height="16" rx="1" fill={M} {...contorno} strokeWidth="1.8" />
            <rect x="3.5" y="19.5" width="15.5" height="8" rx="3" fill={T} />
            <circle cx="8.5" cy="23.5" r="1.2" fill={M} />
            <circle cx="14" cy="23.5" r="1.2" fill={M} />
          </g>
          <path d="M14 34.5 C14 34.5 10.6 38.6 10.6 40.6 a3.4 3.4 0 0 0 6.8 0 C17.4 38.6 14 34.5 14 34.5 Z" fill={V} stroke={T} strokeWidth="1.6" />
          <path d="M22.5 40 C22.5 40 20.8 42 20.8 43 a1.7 1.7 0 0 0 3.4 0 C24.2 42 22.5 40 22.5 40 Z" fill={V} stroke={T} strokeWidth="1.2" />
        </svg>
      );

    // Documento com assinatura imitada, examinado pela lupa
    case "fraude":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <path d="M10 7 H30 L37 14 V43 H10 Z" fill={T} opacity="0.85" />
          <path d="M8 5 H28 L35 12 V41 H8 Z" fill={C} {...contorno} />
          <path d="M28 5 V12 H35 Z" fill={M} {...contorno} strokeWidth="1.6" />
          <line x1="12" y1="15" x2="25" y2="15" stroke={T} strokeWidth="1.6" opacity="0.55" />
          <line x1="12" y1="19.5" x2="28" y2="19.5" stroke={T} strokeWidth="1.6" opacity="0.55" />
          <line x1="12" y1="24" x2="22" y2="24" stroke={T} strokeWidth="1.6" opacity="0.55" />
          <path d="M11.5 33.5 c2 -5 3.6 4.6 5.6 -0.2 s2.6 -3.6 3.8 0.8 s2.4 0.6 4.6 -2.4" fill="none" stroke={V} strokeWidth="1.9" strokeLinecap="round" />
          <line x1="11.5" y1="36.6" x2="24" y2="36.6" stroke={T} strokeWidth="1.2" />
          <line x1="37.5" y1="36" x2="44" y2="42.5" stroke={T} strokeWidth="5.4" strokeLinecap="round" />
          <line x1="37.5" y1="36" x2="44" y2="42.5" stroke={M} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="32.5" cy="30.5" r="7.4" fill="rgba(242,202,133,0.32)" stroke={T} strokeWidth="2.6" />
          <path d="M28.6 27.6 a4.6 4.6 0 0 1 3.2 -2" fill="none" stroke={C} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    // Cartaz de desaparecido, preso por um alfinete
    case "desaparecimento":
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <g transform="rotate(-4 24 24)">
            <rect x="11" y="7" width="30" height="38" fill={T} opacity="0.85" />
            <rect x="9" y="5" width="30" height="38" fill={C} {...contorno} />
            <rect x="9" y="5" width="30" height="8.5" fill={V} {...contorno} />
            <line x1="13" y1="9.3" x2="35" y2="9.3" stroke={C} strokeWidth="2.2" strokeDasharray="3.2 1.4" />
            <circle cx="24" cy="21.5" r="4.6" fill={T} />
            <path d="M15.2 34.5 C15.2 27.4 32.8 27.4 32.8 34.5 Z" fill={T} />
            <text x="24" y="24.3" fontSize="7.5" fill={M} textAnchor="middle" fontFamily="var(--font-maquina), monospace">?</text>
            <line x1="13" y1="38.4" x2="35" y2="38.4" stroke={T} strokeWidth="1.4" opacity="0.5" />
            <circle cx="24" cy="5.6" r="2.4" fill={M} stroke={T} strokeWidth="1.5" />
          </g>
        </svg>
      );
  }
}
