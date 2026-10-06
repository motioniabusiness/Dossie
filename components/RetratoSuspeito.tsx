import Image from "next/image";
import RetratoFalado from "./RetratoFalado";
import { GRADE, posicaoNaFolha, retratoPorId } from "@/lib/retratos";
import type { Suspeito } from "@/lib/tipos";

/**
 * Rosto do suspeito. Usa o retrato ilustrado do acervo quando há um sorteado
 * para ele; se não houver (caso antigo na sessão, ou acervo indisponível), cai
 * no retrato falado desenhado, para nunca ficar um quadrado vazio.
 *
 * O recorte é feito exibindo a folha inteira ampliada dentro de uma janela
 * quadrada e deslocando-a até a célula certa. Assim cada folha é um único
 * arquivo, baixado uma vez e reaproveitado por todos os rostos dela.
 *
 * As folhas já estão em WebP de ~200 KB no tamanho certo: passar pelo
 * otimizador do Next só gerava variantes de 3840 px de uma imagem de 1024.
 */

/** Endereço da folha de rostos. */
function folha(n: number) {
  return `/retratos/${String(n).padStart(2, "0")}.webp`;
}

/**
 * Baixa as cinco folhas antes de o quadro abrir (chamado durante a geração
 * do caso): os rostos aparecem junto com a sala, sem quadrados vazios.
 */
export function precarregarRetratos() {
  if (typeof window === "undefined") return;
  for (let n = 1; n <= 5; n++) {
    const img = new window.Image();
    img.decoding = "async";
    img.src = folha(n);
  }
}
export default function RetratoSuspeito({
  suspeito,
  fotoId,
  className = "",
}: {
  suspeito: Pick<Suspeito, "nome" | "retrato">;
  fotoId?: string;
  className?: string;
}) {
  const foto = fotoId ? retratoPorId(fotoId) : undefined;

  if (!foto) {
    return (
      <div className={`overflow-hidden bg-papel-100 ${className}`}>
        <RetratoFalado suspeito={suspeito} className="h-full w-full" />
      </div>
    );
  }

  const { coluna, linha } = posicaoNaFolha(foto.celula);
  const porcentagem = 100 * GRADE;

  return (
    <div className={`relative overflow-hidden bg-noite-900 ${className}`}>
      <Image
        src={folha(foto.folha)}
        alt={`Retrato de ${suspeito.nome}`}
        width={1024}
        height={1024}
        unoptimized
        // Os cinco rostos aparecem juntos assim que a sala abre: adiar o
        // carregamento só produziria cinco quadrados vazios piscando.
        loading="eager"
        className="absolute top-0 left-0 max-w-none"
        style={{
          width: `${porcentagem}%`,
          height: `${porcentagem}%`,
          transform: `translate(-${coluna * (100 / GRADE)}%, -${linha * (100 / GRADE)}%)`,
        }}
      />
    </div>
  );
}
