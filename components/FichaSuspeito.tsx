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
      className={`border-2 border-tinta/20 bg-papel-50/50 px-3 py-2 ${className}`}
    >
      <span className="block font-mono text-[0.66rem] font-bold tracking-[0.16em] text-tinta/50 uppercase">
        {rotulo}
      </span>
      <span className="block font-mono text-[0.95rem] leading-snug text-tinta">
        {valor?.trim() ? valor : "não consta"}
      </span>
    </div>
  );
}

/** Bloco de texto longo sobre linhas pautadas, como um formulário preenchido à mão. */
function Bloco({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <div className="border-2 border-tinta/20 bg-papel-50/50 px-3 pt-2 pb-1">
      <span className="block font-mono text-[0.66rem] font-bold tracking-[0.16em] text-tinta/50 uppercase">
        {rotulo}
      </span>
      <p className="pauta font-mono text-[0.9rem] leading-[1.6rem] text-tinta">
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

          {/* Foto de ficha policial, presa com fita */}
          <figure className="relative flex w-28 shrink-0 rotate-2 flex-col gap-1.5 sm:w-36">
            <span
              className="fita -top-2 left-1/2 -translate-x-1/2"
              style={{ "--giro": "-6deg" } as React.CSSProperties}
            />
            <div className="border-2 border-tinta bg-[#f7f5ef] p-1.5 pb-2 shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]">
              <RetratoSuspeito
                suspeito={suspeito}
                fotoId={fotoId}
                className="aspect-square w-full"
              />
              <figcaption className="mt-1.5 text-center font-maquina text-[0.7rem] leading-tight text-tinta">
                {suspeito.nome}
              </figcaption>
            </div>
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
        <div className="relative mt-1 flex items-end justify-between gap-4 border-t-2 border-dashed border-tinta/25 pt-3">
          <p className="font-mono text-[0.72rem] leading-relaxed text-tinta/55">
            Documento de trabalho da dupla de analistas. Álibi declarado não é
            álibi verificado.
          </p>
          <span
            className="carimbo shrink-0 text-[0.8rem]"
            style={{ "--giro": "-7deg" } as React.CSSProperties}
          >
            Sob apuração
          </span>
        </div>
      </div>
    </ModalBase>
  );
}
