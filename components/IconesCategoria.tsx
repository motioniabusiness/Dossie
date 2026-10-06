import type { Categoria } from "@/lib/tipos";

const props = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Ícone de linha para cada categoria de caso. */
export default function IconeCategoria({
  categoria,
  className = "h-6 w-6",
}: {
  categoria: Categoria;
  className?: string;
}) {
  switch (categoria) {
    // Cadeado arrombado
    case "furto_roubo":
      return (
        <svg {...props} className={className}>
          <rect x="4" y="11" width="16" height="9" rx="2" />
          <path d="M8 11V8.2A4 4 0 0 1 15 5.6" />
          <path d="M12 14.5v2" />
        </svg>
      );

    // Adaga
    case "assassinato":
      return (
        <svg {...props} className={className}>
          <path d="M12 2.5 15 12H9z" />
          <path d="M6.5 13.2h11" />
          <path d="M12 15.5v6" />
        </svg>
      );

    // Documento com carimbo
    case "fraude":
      return (
        <svg {...props} className={className}>
          <path d="M5 3.5h9l3.5 3.5v7" />
          <path d="M5 3.5v17h5" />
          <path d="M8 8h5M8 11.5h6" />
          <circle cx="16" cy="17.5" r="3.5" />
        </svg>
      );

    // Silhueta em contorno tracejado
    case "desaparecimento":
      return (
        <svg {...props} className={className}>
          <circle cx="12" cy="7" r="3.2" strokeDasharray="3 2.6" />
          <path
            d="M5.5 21v-1.8a6.5 6.5 0 0 1 13 0V21"
            strokeDasharray="3 2.6"
          />
        </svg>
      );
  }
}
