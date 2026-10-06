import type { TipoPista } from "@/lib/tipos";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ROTULO_TIPO: Record<TipoPista, string> = {
  documento: "Documento",
  depoimento: "Depoimento",
  foto: "Fotografia",
  objeto: "Objeto",
};

export default function IconePista({
  tipo,
  className = "h-5 w-5",
}: {
  tipo: TipoPista;
  className?: string;
}) {
  switch (tipo) {
    case "documento":
      return (
        <svg {...base} className={className}>
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
          <path d="M9 12h6M9 15.5h4" />
        </svg>
      );

    case "depoimento":
      return (
        <svg {...base} className={className}>
          <path d="M4 5h16v11H12l-5 4v-4H4z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );

    case "foto":
      return (
        <svg {...base} className={className}>
          <path d="M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3z" />
          <circle cx="12" cy="14" r="3.6" />
        </svg>
      );

    case "objeto":
      return (
        <svg {...base} className={className}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
      );
  }
}
