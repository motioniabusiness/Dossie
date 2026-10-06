"use client";

import Interrogatorio from "./Interrogatorio";
import ModalBase from "./ModalBase";
import RetratoSuspeito from "./RetratoSuspeito";
import type { CasoPublico, Suspeito } from "@/lib/tipos";

/** Célula da ficha: rótulo miúdo em cima, valor datilografado embaixo. */
function Campo({
  rotulo,
  valor,
  className = "",
}: {
  rotulo: string;
  valor?: string;
  className?: string;
}) {
  return (
    <div
      className={`border border-noite-900/25 bg-noite-900/[0.035] px-3 py-2 ${className}`}
    >
      <span className="block text-[0.625rem] tracking-[0.16em] text-noite-900/55 uppercase">
        {rotulo}
      </span>
      <span className="block font-mono text-sm leading-snug text-noite-900">
        {valor?.trim() ? valor : "não consta"}
      </span>
    </div>
  );
}

/** Bloco de texto longo sobre linhas pautadas, como um formulário preenchido à mão. */
function Bloco({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <div className="border border-noite-900/25 bg-noite-900/[0.035] px-3 pt-2 pb-1">
      <span className="block text-[0.625rem] tracking-[0.16em] text-noite-900/55 uppercase">
        {rotulo}
      </span>
      <p className="pauta font-mono text-[0.8125rem] leading-[1.6rem] text-noite-900">
        {texto}
      </p>
    </div>
  );
}

interface Props {
  suspeito: Suspeito;
  /** Numeração da ficha no elenco, ex.: "03/04". */
  numero: string;
  /** Rosto sorteado para este suspeito. */
  fotoId?: string;
  /** Necessário para o interrogatório: o suspeito responde dentro do caso. */
  caso: CasoPublico;
  onFechar: () => void;
}

export default function FichaSuspeito({
  suspeito,
  numero,
  fotoId,
  caso,
  onFechar,
}: Props) {
  return (
    <ModalBase
      tom="papel"
      titulo="Ficha de Investigação"
      etiqueta={<>Elenco de suspeitos · ficha {numero}</>}
      onFechar={onFechar}
    >
      <div className="flex flex-col gap-3">
        {/* Cabeçalho: identificação + retrato */}
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Campo rotulo="Nome" valor={suspeito.nome} />
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Idade" valor={suspeito.idade} />
              <Campo rotulo="Ficha nº" valor={numero} />
            </div>
            <Campo rotulo="Ocupação" valor={suspeito.ocupacao} />
          </div>

          <figure className="flex w-28 shrink-0 flex-col gap-1.5 sm:w-32">
            <div className="border border-noite-900/30 bg-papel-100 p-1">
              <RetratoSuspeito
                suspeito={suspeito}
                fotoId={fotoId}
                className="aspect-square w-full"
              />
            </div>
            <figcaption className="text-center font-mono text-[0.625rem] leading-tight tracking-[0.1em] text-noite-900/70 uppercase">
              Retrato de arquivo
            </figcaption>
          </figure>
        </div>

        <Campo rotulo="Relação com o caso" valor={suspeito.relacao} />
        {suspeito.aparencia && (
          <Campo rotulo="Descrição física" valor={suspeito.aparencia} />
        )}
        <Bloco rotulo="Perfil e antecedentes" texto={suspeito.descricao} />
        <Bloco rotulo="Álibi declarado" texto={suspeito.alibi} />

        <Interrogatorio caso={caso} suspeito={suspeito} />

        {/* Rodapé: situação + carimbo */}
        <div className="relative mt-1 flex items-end justify-between gap-4 border-t border-noite-900/20 pt-3">
          <p className="text-[0.6875rem] leading-relaxed text-noite-900/60">
            Documento de trabalho da dupla de analistas. Álibi declarado não é
            álibi verificado.
          </p>
          <span className="shrink-0 -rotate-6 border-2 border-sangue-600/60 px-2 py-1 font-mono text-[0.625rem] tracking-[0.22em] text-sangue-600/80 uppercase">
            Sob apuração
          </span>
        </div>
      </div>
    </ModalBase>
  );
}
