"use client";

import Botao from "./Botao";

interface Props {
  mensagem?: string;
  /** Linha de apoio embaixo da animação. */
  nota?: string;
  /** Preenchido quando a chamada à IA falha. */
  erro?: string | null;
  onTentarNovamente?: () => void;
}

export default function TelaCarregando({
  mensagem = "Montando o dossiê",
  nota = "Cruzando depoimentos, laudos e horários. Nenhum caso se repete.",
  erro = null,
  onTentarNovamente,
}: Props) {
  return (
    <div className="animate-entrada mx-auto flex w-full max-w-md flex-col items-center gap-6 px-5 py-24 text-center">
      {erro ? (
        <>
          <span className="selo">Falha no arquivo</span>
          <p className="text-sm leading-relaxed text-papel-300">{erro}</p>
          {onTentarNovamente && (
            <Botao onClick={onTentarNovamente}>Tentar de novo</Botao>
          )}
        </>
      ) : (
        <>
          {/* Lupa girando devagar: sinal de trabalho em curso, sem estridência */}
          <svg
            viewBox="0 0 48 48"
            className="h-12 w-12 animate-[spin_3.2s_linear_infinite] text-ambar-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="13" strokeOpacity="0.35" />
            <path d="M20 7a13 13 0 0 1 13 13" />
            <path d="M29.5 29.5 41 41" strokeLinecap="round" />
          </svg>

          <p className="font-mono text-sm tracking-[0.16em] text-papel-100 uppercase">
            {mensagem}
            <span className="animate-pulse">...</span>
          </p>

          <div className="h-px w-40 overflow-hidden bg-noite-700">
            <div className="animate-varredura h-full w-1/3 bg-ambar-500" />
          </div>

          <p className="text-xs leading-relaxed text-papel-500">{nota}</p>
        </>
      )}
    </div>
  );
}
