"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  /** Linha superior pequena: tipo do arquivo, numeração, etc. */
  etiqueta: ReactNode;
  titulo: string;
  onFechar: () => void;
  /** `papel` para fichas (fundo claro), `escuro` para arquivos do dossiê. */
  tom?: "escuro" | "papel";
  larguraMax?: string;
  children: ReactNode;
}

/**
 * Casca comum dos arquivos abertos: fundo, ESC, travamento de scroll e foco.
 * Concentrada num só lugar para que pista, ficha e briefing se comportem igual.
 */
export default function ModalBase({
  etiqueta,
  titulo,
  onFechar,
  tom = "escuro",
  larguraMax = "max-w-2xl",
  children,
}: Props) {
  const botaoFechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botaoFechar.current?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onFechar]);

  const papel = tom === "papel";

  return (
    /**
     * No celular o arquivo sobe de baixo como uma folha e rola por dentro, com
     * o cabeçalho parado: o botão de fechar nunca some no meio de uma ficha
     * comprida. No computador continua centralizado.
     */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-noite-950/85 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        onClick={(e) => e.stopPropagation()}
        className={`animate-entrada flex max-h-[92dvh] w-full flex-col overflow-hidden ${larguraMax} rounded-t-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-lg ${
          papel
            ? "papelzinho border border-madeira-700/40"
            : "painel rounded-b-none sm:rounded-b-lg"
        }`}
      >
        {/* Alça da folha, só no celular */}
        <span
          aria-hidden="true"
          className={`mx-auto mt-2 h-1 w-10 shrink-0 rounded-full sm:hidden ${
            papel ? "bg-noite-900/25" : "bg-noite-600"
          }`}
        />
        <header
          className={`flex shrink-0 items-start justify-between gap-4 border-b px-5 py-3 sm:px-6 sm:py-4 ${
            papel ? "border-noite-900/20" : "border-noite-700"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <span
              className={`etiqueta flex items-center gap-2 ${
                papel ? "text-noite-600" : ""
              }`}
            >
              {etiqueta}
            </span>
            <h3
              id="titulo-modal"
              className={`font-mono text-lg leading-snug ${
                papel ? "text-noite-900" : "text-papel-50"
              }`}
            >
              {titulo}
            </h3>
          </div>

          <button
            ref={botaoFechar}
            onClick={onFechar}
            aria-label="Fechar arquivo"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ambar-500/60 ${
              papel
                ? "border-noite-900/25 text-noite-700 hover:border-sangue-500 hover:text-sangue-600"
                : "border-noite-600 text-papel-300 hover:border-ambar-500/60 hover:text-ambar-300"
            }`}
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
