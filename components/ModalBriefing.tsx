"use client";

import ModalBase from "./ModalBase";
import { numeroDoCaso } from "./QuadroInvestigacao";
import { nomeCategoria } from "@/lib/categorias";
import type { CasoPublico } from "@/lib/tipos";

/**
 * Briefing do caso como o relatório inicial que chega à mesa do detetive:
 * cabeçalho de protocolo, texto datilografado e o elenco no rodapé.
 */
export default function ModalBriefing({
  caso,
  onFechar,
}: {
  caso: CasoPublico;
  onFechar: () => void;
}) {
  return (
    <ModalBase
      tom="papel"
      titulo={caso.titulo}
      etiqueta={
        <>
          Relatório inicial · caso {numeroDoCaso(caso.id)} · {nomeCategoria(caso.categoria)}
        </>
      }
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-4">
        {caso.contexto.split(/\n{2,}/).map((paragrafo, i) => (
          <p
            key={i}
            className="font-mono text-[0.95rem] leading-relaxed text-tinta first-letter:font-maquina first-letter:text-2xl"
          >
            {paragrafo}
          </p>
        ))}

        <div className="mt-2 border-t-2 border-dashed border-tinta/25 pt-4">
          <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/50 uppercase">
            Pessoas no local
          </span>
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {caso.suspeitos.map((s) => (
              <li key={s.nome} className="flex items-baseline gap-2 font-mono text-sm text-tinta">
                <span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] bg-sangue-500" />
                <span className="font-bold">{s.nome}</span>
                {s.ocupacao && <span className="truncate text-tinta/55">{s.ocupacao}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ModalBase>
  );
}
