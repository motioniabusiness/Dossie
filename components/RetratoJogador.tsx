import Image from "next/image";

/**
 * Retratos ilustrados da dupla, no lugar das silhuetas genéricas.
 * As artes vivem em /public e têm proporção 3:4 (896x1200).
 */
const RETRATOS = {
  1: { src: "/detetive-claudio.png", alt: "Retrato do detetive à esquerda" },
  2: { src: "/detetive-bianca.jpg", alt: "Retrato da detetive à direita" },
} as const;

interface Props {
  jogador: 1 | 2;
  /** `retrato` mantém a proporção 3:4; `selo` recorta em quadrado no rosto. */
  formato?: "retrato" | "selo";
  /** Realce âmbar — usado no jogador ativo e no vencedor. */
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
      className={`relative overflow-hidden border bg-noite-900 transition-colors duration-300 ${
        ativo ? "border-ambar-500/70" : "border-noite-600"
      } ${formato === "selo" ? "rounded-md" : "rounded-lg"} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={prioridade}
        sizes={formato === "selo" ? "64px" : "200px"}
        // O rosto fica no terço superior das artes: recortar pelo topo evita
        // cortar a cabeça nos formatos quadrados.
        className="object-cover object-top"
      />
      {/* Escurece a base para o nome escrito por cima continuar legível */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noite-950/70 via-transparent to-transparent" />
    </div>
  );
}
