"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Botao from "./Botao";
import { IconeVisto } from "./Icones";
import { somTecla } from "@/lib/efeitos";

/** Etapas da montagem de um caso, na ordem em que a IA de fato trabalha. */
const ETAPAS_CASO = [
  "Escolhendo a vítima e o cenário",
  "Criando os suspeitos e seus motivos",
  "Escrevendo os álibis, alguns falsos",
  "Espalhando as pistas pelo quadro",
  "Plantando uma pista enganosa",
  "Conferindo se o caso fecha",
  "Lacrando a solução no envelope",
];

/** Dicas que se revezam embaixo da folha enquanto a espera dura. */
const DICAS = [
  "Álibi com horário exato demais costuma ter sido ensaiado.",
  "Cruze os horários dos depoimentos com o laudo. Quem mente, erra o relógio.",
  "Cada pergunta do interrogatório custa 3 minutos. Gaste com quem desconfia.",
  "Quem é culpado pode mentir. Quem é inocente pode esconder outra coisa.",
  "Arquivo lacrado só o dono lê. O que ele contar pode não ser tudo.",
  "Uma pista enganosa é plantada em todo caso médio ou difícil.",
  "No veredito, diga quem, como, por quê e quais pistas provam. Vago não pontua.",
];

interface Props {
  mensagem?: string;
  /** Linha de apoio, no rodapé da folha. */
  nota?: string;
  /** Etapas mostradas uma a uma; padrão: as da geração de caso. */
  etapas?: string[];
  /** Quanto a espera costuma durar, em segundos, para dosar as etapas. */
  duracaoEstimada?: number;
  /** Preenchido quando a chamada à IA falha. */
  erro?: string | null;
  onTentarNovamente?: () => void;
  /** Saída alternativa quando falha (ex.: voltar à configuração). */
  onVoltar?: () => void;
  rotuloVoltar?: string;
}

function relogio(segundos: number) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

/**
 * Espera da IA como uma folha sendo datilografada: as etapas aparecem uma a
 * uma, a já feita ganha um visto, e uma barra de tinta avança. A barra nunca
 * chega ao fim sozinha (sobe rápido e desacelera), então não mente se a IA
 * demorar mais que o normal.
 */
export default function TelaCarregando({
  mensagem = "Montando o dossiê",
  nota = "Cada caso é inédito, escrito agora, para vocês dois.",
  etapas = ETAPAS_CASO,
  duracaoEstimada = 70,
  erro = null,
  onTentarNovamente,
  onVoltar,
  rotuloVoltar = "Voltar",
}: Props) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (erro) return;
    const inicio = Date.now();
    const id = setInterval(
      () => setSegundos(Math.floor((Date.now() - inicio) / 1000)),
      500,
    );
    return () => clearInterval(id);
  }, [erro]);

  // As etapas se espalham pela duração estimada; a última fica até o fim.
  const porEtapa = duracaoEstimada / etapas.length;
  const atual = Math.min(etapas.length - 1, Math.floor(segundos / porEtapa));
  const progresso = 1 - Math.exp(-segundos / (duracaoEstimada / 2.3));

  // Um estalo de tecla a cada etapa nova datilografada na folha.
  useEffect(() => {
    if (!erro) somTecla();
  }, [atual, erro]);
  const dica = DICAS[Math.floor(segundos / 8) % DICAS.length];

  if (erro) {
    return (
      <div className="animate-entrada mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-5 py-16">
        <div className="papelzinho relative w-full border-2 border-tinta px-6 py-7 shadow-[7px_7px_0_0_rgba(0,0,0,0.5)]">
          <span
            className="carimbo animate-carimbar absolute -top-4 right-5 bg-papel-50 text-xl"
            style={{ "--giro": "8deg" } as CSSProperties}
          >
            Falha
          </span>
          <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/50 uppercase">
            Ocorrência
          </span>
          <p className="mt-2 font-maquina text-xl leading-snug text-tinta">
            O arquivo não chegou à mesa.
          </p>
          <p className="mt-3 font-mono text-[0.92rem] leading-relaxed text-tinta/80">
            {erro}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onVoltar && (
            <Botao variante="fantasma" onClick={onVoltar}>
              {rotuloVoltar}
            </Botao>
          )}
          {onTentarNovamente && (
            <Botao onClick={onTentarNovamente}>Tentar de novo</Botao>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-5 py-12">
      {/* A folha na máquina de escrever */}
      <div className="papelzinho animate-assentar relative w-full border-2 border-tinta px-6 pt-6 pb-5 shadow-[7px_7px_0_0_rgba(0,0,0,0.5)]">
        <span
          className="fita -top-2.5 left-1/2 -translate-x-1/2"
          style={{ "--giro": "-3deg" } as CSSProperties}
        />
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-tinta/25 pb-3">
          <h2 className="font-maquina text-xl leading-none text-tinta sm:text-2xl">
            {mensagem}
          </h2>
          <span className="font-mono text-sm text-tinta/50 tabular-nums">
            {relogio(segundos)}
          </span>
        </div>

        {/* Altura reservada para todas as etapas: a folha não cresce aos trancos */}
        <ol
          className="mt-4 flex flex-col gap-2.5"
          style={{ minHeight: `${etapas.length * 2.1}rem` }}
          aria-live="polite"
        >
          {etapas.slice(0, atual + 1).map((etapa, i) => {
            const feita = i < atual;
            return (
              <li
                key={etapa}
                className="animate-entrada flex items-center gap-3 font-mono text-[0.92rem] text-tinta"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                    feita ? "border-sangue-500 text-sangue-500" : "border-tinta/40"
                  }`}
                >
                  {feita && <IconeVisto className="h-3.5 w-3.5" />}
                </span>
                <span className={feita ? "text-tinta/55 line-through decoration-tinta/25" : ""}>
                  {etapa}
                  {!feita && (
                    <span className="animate-cursor ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[3px] bg-tinta" />
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Barra de tinta */}
        <div className="mt-4 h-3 border-2 border-tinta bg-papel-50">
          <div
            className="reticula h-full bg-ambar-400 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(progresso * 100)}%` }}
          />
        </div>
        <p className="mt-3 font-mono text-[0.75rem] leading-relaxed text-tinta/55">
          {nota}
        </p>
      </div>

      {/* Dica de investigação, trocando a cada poucos segundos */}
      <p
        key={dica}
        className="animate-entrada max-w-md text-center font-mono text-[0.82rem] leading-relaxed text-papel-300"
      >
        <span className="font-bold tracking-[0.14em] text-ambar-400 uppercase">
          Dica ·{" "}
        </span>
        {dica}
      </p>
    </div>
  );
}
