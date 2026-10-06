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
 * quadrada e deslocando-a até a célula certa. Assim cada folha é uma única
 * imagem otimizada pelo Next, e não nove arquivos.
 */
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
        src={`/retratos/${String(foto.folha).padStart(2, "0")}.png`}
        alt={`Retrato de ${suspeito.nome}`}
        width={1024}
        height={1024}
        sizes="600px"
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
