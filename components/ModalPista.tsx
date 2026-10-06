"use client";

import IconePista, { ROTULO_TIPO } from "./IconePista";
import ModalBase from "./ModalBase";
import MolduraEvidencia from "./MolduraEvidencia";
import type { Pista } from "@/lib/tipos";

interface Props {
  pista: Pista;
  /** Número de arquivo exibido no cabeçalho (ex.: "04/08"). */
  numero: string;
  onFechar: () => void;
}

export default function ModalPista({ pista, numero, onFechar }: Props) {
  return (
    <ModalBase
      titulo={pista.titulo}
      onFechar={onFechar}
      etiqueta={
        <>
          <span className="text-ambar-400">
            <IconePista tipo={pista.tipo} className="h-4 w-4" />
          </span>
          {ROTULO_TIPO[pista.tipo]} · arquivo {numero}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Parágrafos preservados: a IA devolve texto com \n\n */}
        {pista.conteudo.split(/\n{2,}/).map((paragrafo, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed whitespace-pre-line text-papel-100"
          >
            {paragrafo}
          </p>
        ))}

        {pista.tipo === "foto" && pista.legendaFoto && (
          <MolduraEvidencia legenda={pista.legendaFoto} numero={numero} />
        )}
      </div>
    </ModalBase>
  );
}
