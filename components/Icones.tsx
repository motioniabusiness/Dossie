/**
 * Ícones de interface do jogo, em traço de tinta: linha grossa, pontas
 * retas e a cor de quem os usa (`currentColor`). Substituem os símbolos de
 * texto (✕, ✓, ←), que mudavam de cara em cada celular.
 */

type PropsIcone = { className?: string };

const traco = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

export function IconeFechar({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
    </svg>
  );
}

export function IconeVoltar({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <path d="M20 12H5M11 5.5L4.5 12l6.5 6.5" />
    </svg>
  );
}

export function IconeAvancar({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" />
    </svg>
  );
}

/** Visto de carimbo, levemente torto como feito à mão */
export function IconeVisto({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20.5 5.5" />
    </svg>
  );
}

export function IconeErro({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

export function IconeAltoFalante({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <path d="M4 9.5v5h3.5L12.5 19V5L7.5 9.5z" fill="currentColor" fillOpacity="0.15" />
      <path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.5a7.8 7.8 0 0 1 0 11" strokeLinecap="round" />
    </svg>
  );
}

export function IconePausa({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}

export function IconeCadeado({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <rect x="5" y="10.5" width="14" height="10" fill="currentColor" fillOpacity="0.15" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2.5" />
    </svg>
  );
}

export function IconeOlho({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" fill="currentColor" />
    </svg>
  );
}

export function IconeOlhoFechado({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <path d="M3.5 9.5C5.5 12.4 8.5 14 12 14s6.5-1.6 8.5-4.5" />
      <path d="M12 14v3M7 13l-1.6 2.6M17 13l1.6 2.6" />
    </svg>
  );
}

export function IconeLupa({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <circle cx="10.5" cy="10.5" r="6" fill="currentColor" fillOpacity="0.12" />
      <path d="M15 15l5.5 5.5" strokeWidth="3" />
    </svg>
  );
}

export function IconeMicrofone({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" fillOpacity="0.15" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" />
    </svg>
  );
}

export function IconeCompartilhar({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <path d="M12 3.5v12M7.5 8L12 3.5 16.5 8" />
      <path d="M5 12.5v8h14v-8" />
    </svg>
  );
}

/** Cronômetro mecânico, para o relógio da investigação */
export function IconeCronometro({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className}>
      <circle cx="12" cy="13.5" r="7.5" fill="currentColor" fillOpacity="0.12" />
      <path d="M12 13.5V9.5M10 2.5h4M12 2.5v3.5M18.5 6.5l1.6-1.6" />
    </svg>
  );
}

/** Pasta de arquivo, para "abrir o caso" */
export function IconePasta({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <path d="M3 6.5h6.5l2 2.5H21v10.5H3z" fill="currentColor" fillOpacity="0.15" />
      <path d="M3 11h18" />
    </svg>
  );
}

/** Selo de cera, para lacrar o veredito */
export function IconeSelo({ className = "h-4 w-4" }: PropsIcone) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5l2.2 1.7 2.7-.4 1 2.6 2.5 1.2-.4 2.7L21.5 12l-1.5 2.3.4 2.7-2.5 1.2-1 2.6-2.7-.4L12 21.5l-2.2-1.7-2.7.4-1-2.6-2.5-1.2.4-2.7L2.5 12l1.5-2.3-.4-2.7 2.5-1.2 1-2.6 2.7.4z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="5" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.4" />
      <path d="M9.6 12.2l1.7 1.7 3.2-3.6" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Dois detetives frente a frente, para o modo duelo */
export function IconeDuelo({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <circle cx="6.5" cy="8" r="2.8" fill="currentColor" fillOpacity="0.2" />
      <circle cx="17.5" cy="8" r="2.8" fill="currentColor" fillOpacity="0.2" />
      <path d="M2 19c0-3.6 2-5.6 4.5-5.6S11 15.4 11 19M13 19c0-3.6 2-5.6 4.5-5.6S22 15.4 22 19" />
      <path d="M10.5 4.5l3 3M13.5 4.5l-3 3" strokeWidth="1.8" />
    </svg>
  );
}

/** Dois detetives lado a lado, para o modo cooperativo */
export function IconeCooperativo({ className = "h-5 w-5" }: PropsIcone) {
  return (
    <svg {...traco} className={className} strokeLinejoin="round">
      <circle cx="8.5" cy="8" r="2.8" fill="currentColor" fillOpacity="0.2" />
      <circle cx="15.5" cy="8" r="2.8" fill="currentColor" fillOpacity="0.2" />
      <path d="M3 19.5c0-3.6 2.4-5.6 5.5-5.6s5.5 2 5.5 5.6M10 19.5c0-3.6 2.4-5.6 5.5-5.6s5.5 2 5.5 5.6" />
    </svg>
  );
}
