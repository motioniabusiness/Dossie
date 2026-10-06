"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconeFechar } from "./Icones";
import { somPapel } from "@/lib/efeitos";

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

  // Só na abertura: o efeito de baixo reroda se o `onFechar` mudar.
  useEffect(() => {
    somPapel();
  }, []);

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

  /**
   * Vai direto para o <body>: a troca de fase anima a página com escala e
   * desfoque, e qualquer elemento `fixed` lá dentro passaria a se posicionar
   * pelo bloco animado, não pela tela.
   *
   * No celular o arquivo sobe de baixo como uma folha e rola por dentro, com
   * o cabeçalho parado: o botão de fechar nunca some no meio de uma ficha
   * comprida. No computador continua centralizado.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-noite-950/80 backdrop-blur-[3px] sm:items-center sm:p-6"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
        onClick={(e) => e.stopPropagation()}
        className={`animate-entrada flex max-h-[92dvh] w-full flex-col overflow-hidden ${larguraMax} rounded-t-[10px] border-2 sm:max-h-[calc(100dvh-3rem)] sm:rounded-[3px] ${
          papel
            ? "papelzinho border-tinta sm:shadow-[7px_7px_0_0_rgba(0,0,0,0.55)]"
            : "painel border-[#2b3441] sm:shadow-[7px_7px_0_0_rgba(0,0,0,0.55)]"
        }`}
      >
        {/* Alça da folha, só no celular */}
        <span
          aria-hidden="true"
          className={`mx-auto mt-2 h-1 w-10 shrink-0 rounded-full sm:hidden ${
            papel ? "bg-tinta/25" : "bg-noite-600"
          }`}
        />
        <header
          className={`flex shrink-0 items-start justify-between gap-4 border-b-2 px-5 py-3 sm:px-6 sm:py-4 ${
            papel ? "border-dashed border-tinta/25" : "border-noite-700"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <span
              className={`etiqueta flex items-center gap-2 ${
                papel ? "text-tinta/55" : ""
              }`}
            >
              {etiqueta}
            </span>
            <h3
              id="titulo-modal"
              className={`font-maquina text-xl leading-tight sm:text-2xl ${
                papel ? "text-tinta" : "text-papel-50"
              }`}
            >
              {titulo}
            </h3>
          </div>

          <button
            ref={botaoFechar}
            onClick={onFechar}
            aria-label="Fechar arquivo"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px] border-2 transition-[transform,box-shadow,color] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
              papel
                ? "border-tinta bg-papel-50 text-tinta shadow-[3px_3px_0_0_var(--color-tinta)] hover:text-sangue-500"
                : "border-tinta bg-noite-800 text-papel-100 shadow-[3px_3px_0_0_rgba(0,0,0,0.7)] hover:text-ambar-300"
            }`}
          >
            <IconeFechar />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
