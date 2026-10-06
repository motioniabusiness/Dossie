"use client";

import type { CSSProperties } from "react";
import IconePista, { ROTULO_TIPO } from "./IconePista";
import ModalBase from "./ModalBase";
import type { Pista } from "@/lib/tipos";

interface Props {
  pista: Pista;
  /** Número de arquivo exibido no cabeçalho (ex.: "04/08"). */
  numero: string;
  onFechar: () => void;
}

/** Parágrafos preservados: a IA devolve texto com linhas em branco. */
function paragrafos(texto: string) {
  return texto.split(/\n{2,}/).filter((p) => p.trim());
}

/**
 * Arquivo aberto. Cada tipo aparece como o objeto que é: documento
 * datilografado, transcrição de depoimento, polaroide da perícia, etiqueta
 * de evidência. O conteúdo é o mesmo; a leitura fica muito mais física.
 */
export default function ModalPista({ pista, numero, onFechar }: Props) {
  return (
    <ModalBase
      tom="papel"
      titulo={pista.titulo}
      onFechar={onFechar}
      etiqueta={
        <>
          <IconePista tipo={pista.tipo} className="h-5 w-5" />
          {ROTULO_TIPO[pista.tipo]} · arquivo {numero}
        </>
      }
    >
      {pista.tipo === "depoimento" ? (
        <Depoimento pista={pista} />
      ) : pista.tipo === "foto" ? (
        <Fotografia pista={pista} numero={numero} />
      ) : pista.tipo === "objeto" ? (
        <Objeto pista={pista} numero={numero} />
      ) : (
        <Documento pista={pista} />
      )}
    </ModalBase>
  );
}

function Documento({ pista }: { pista: Pista }) {
  return (
    <div className="relative flex flex-col gap-4">
      <span
        className="carimbo pointer-events-none absolute -top-1 right-0 text-xs opacity-60"
        style={{ "--giro": "6deg" } as CSSProperties}
      >
        Cópia de arquivo
      </span>
      {paragrafos(pista.conteudo).map((p, i) => (
        <p
          key={i}
          className="font-mono text-[0.95rem] leading-relaxed whitespace-pre-line text-tinta"
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function Depoimento({ pista }: { pista: Pista }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/50 uppercase">
        Transcrição literal · gravado em sala de depoimento
      </span>
      <blockquote className="relative border-l-4 border-sangue-500 bg-tinta/[0.04] py-3 pr-4 pl-6">
        <span
          aria-hidden="true"
          className="absolute -top-3 left-2 font-maquina text-5xl leading-none text-sangue-500"
        >
          “
        </span>
        {paragrafos(pista.conteudo).map((p, i) => (
          <p
            key={i}
            className="mt-2 font-mono text-[0.95rem] leading-relaxed whitespace-pre-line text-tinta italic first:mt-0"
          >
            {p.replace(/^["“]|["”]$/g, "")}
          </p>
        ))}
      </blockquote>
    </div>
  );
}

function Fotografia({ pista, numero }: { pista: Pista; numero: string }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Polaroide: a foto ainda não foi digitalizada, então o quadro escuro
          traz a descrição da perícia sobre o que aparece nela. */}
      <figure className="mx-auto w-full max-w-md -rotate-1 border border-tinta/20 bg-[#f7f5ef] p-3 pb-4 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.9)]">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-tinta p-5">
          <span className="reticula absolute inset-0 opacity-30 invert" />
          {/* Marcas de enquadramento da perícia */}
          <span className="absolute top-3 left-3 h-5 w-5 border-t-2 border-l-2 border-ambar-400/70" />
          <span className="absolute top-3 right-3 h-5 w-5 border-t-2 border-r-2 border-ambar-400/70" />
          <span className="absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-ambar-400/70" />
          <span className="absolute right-3 bottom-3 h-5 w-5 border-r-2 border-b-2 border-ambar-400/70" />
          <p className="relative text-center font-mono text-sm leading-relaxed text-papel-100 italic">
            {pista.legendaFoto ?? pista.conteudo}
          </p>
        </div>
        <figcaption className="mt-3 flex items-baseline justify-between gap-3">
          <span className="font-maquina text-base text-tinta">{pista.titulo}</span>
          <span className="shrink-0 font-mono text-xs text-tinta/50">foto {numero}</span>
        </figcaption>
      </figure>

      {pista.legendaFoto && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/50 uppercase">
            Anotação da perícia
          </span>
          {paragrafos(pista.conteudo).map((p, i) => (
            <p key={i} className="font-mono text-[0.9rem] leading-relaxed text-tinta">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Objeto({ pista, numero }: { pista: Pista; numero: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Etiqueta de cadeia de custódia */}
      <div className="manila relative border-2 border-tinta p-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]">
        <span className="absolute top-1/2 -left-[9px] h-4 w-4 -translate-y-1/2 rounded-full border-2 border-tinta bg-papel-100" />
        <div className="flex items-center justify-between border-b-2 border-dashed border-tinta/30 pb-2">
          <span className="font-mono text-[0.72rem] font-bold tracking-[0.2em] text-sangue-600 uppercase">
            Evidência · cadeia de custódia
          </span>
          <span className="font-maquina text-sm text-tinta">Item {numero}</span>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {paragrafos(pista.conteudo).map((p, i) => (
            <p key={i} className="font-mono text-[0.95rem] leading-relaxed whitespace-pre-line text-tinta">
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
