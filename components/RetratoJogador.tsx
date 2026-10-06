import Image from "next/image";

/**
 * Retratos ilustrados da dupla. As artes vivem em /public, em WebP 3:4
 * (896x1200), já leves: servidas direto, sem passar pelo otimizador.
 */
const RETRATOS = {
  1: { src: "/detetive-claudio.webp", alt: "Retrato do detetive Claudio" },
  2: { src: "/detetive-bianca.webp", alt: "Retrato da detetive Bianca" },
} as const;

interface Props {
  jogador: 1 | 2;
  /** `retrato` mantém a proporção 3:4; `selo` recorta em quadrado no rosto. */
  formato?: "retrato" | "selo";
  /** Realce âmbar, usado no jogador ativo e no vencedor. */
  ativo?: boolean;
  className?: string;
  /** Só na capa/menu: carrega com prioridade por estar acima da dobra. */
  prioridade?: boolean;
}

export default function RetratoJogador({
  jogador,
  formato = "retrato",
  ativo = false,
  className = "",
  prioridade = false,
}: Props) {
  const { src, alt } = RETRATOS[jogador];

  return (
    <div
      className={`relative overflow-hidden rounded-[3px] border-2 bg-noite-900 transition-colors duration-300 ${
        ativo ? "border-ambar-400" : "border-tinta"
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={prioridade}
        unoptimized
        // O rosto fica no terço superior das artes: recortar pelo topo evita
        // cortar a cabeça nos formatos quadrados.
        className={`object-cover ${formato === "selo" ? "object-[50%_18%]" : "object-top"}`}
      />
    </div>
  );
}
