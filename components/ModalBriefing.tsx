"use client";

import ModalBase from "./ModalBase";
import { nomeCategoria } from "@/lib/categorias";
import type { CasoPublico } from "@/lib/tipos";

export default function ModalBriefing({
  caso,
  onFechar,
}: {
  caso: CasoPublico;
  onFechar: () => void;
}) {
  return (
    <ModalBase
      titulo={caso.titulo}
      etiqueta={<>Briefing do caso · {nomeCategoria(caso.categoria)}</>}
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-5">
        {caso.contexto.split(/\n{2,}/).map((paragrafo, i) => (
          <p key={i} className="text-sm leading-relaxed text-papel-100">
            {paragrafo}
          </p>
        ))}
      </div>
    </ModalBase>
  );
}
