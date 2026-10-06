"use client";

import type { CSSProperties } from "react";
import IconePista, { ROTULO_TIPO } from "./IconePista";
import RetratoSuspeito from "./RetratoSuspeito";
import type { CasoPublico } from "@/lib/tipos";

/**
 * Quadro de detetive: retratos, arquivos e o caso no centro, pregados no feltro
 * e ligados por barbante vermelho. Tudo é clicável e abre a ficha/arquivo
 * correspondente. Coordenadas em % do quadro, então escala junto com a largura.
 */

/**
 * Vagas fixas para as pistas, em ordem de preferência (6 a 9 por caso).
 * A ordem deixa o quadro simétrico em qualquer quantidade: primeiro as
 * laterais, depois os pares da fileira de baixo, de fora para dentro.
 */
const VAGAS_PISTAS = [
  { x: 7, y: 48 },
  { x: 93, y: 48 },
  { x: 22, y: 84 },
  { x: 78, y: 84 },
  { x: 36, y: 84 },
  { x: 64, y: 84 },
  { x: 50, y: 84 },
  { x: 24, y: 60 },
  { x: 76, y: 60 },
];

/** Inclinação determinística: mesmo caso, mesmo quadro — nada tremendo a cada render. */
function inclinacao(semente: number, amplitude = 4) {
  const passo = ((semente * 37) % (amplitude * 2 + 1)) - amplitude;
  return `${passo}deg`;
}

function vagaSuspeito(i: number, total: number) {
  const x = total > 1 ? 10 + i * (80 / (total - 1)) : 50;
  // Duas alturas alternadas: o quadro respira e nada encosta na moldura.
  const y = i % 2 === 1 ? 27 : 20;
  return { x, y };
}

function vagaPista(i: number) {
  const vaga = VAGAS_PISTAS[i % VAGAS_PISTAS.length];
  // Casos com mais pistas que vagas (não deve acontecer) ganham um leve deslocamento.
  const volta = Math.floor(i / VAGAS_PISTAS.length);
  return { x: vaga.x, y: vaga.y - volta * 4 };
}

/** `--rot` é lido pela classe `.objeto` no CSS. */
function posicao(x: number, y: number, rot: string): CSSProperties {
  return { left: `${x}%`, top: `${y}%`, "--rot": rot } as CSSProperties;
}

interface Props {
  caso: CasoPublico;
  /** Rostos sorteados, na ordem do elenco. */
  fotos: string[];
  /** Iniciais de quem é dono de cada arquivo privado, por id de pista. */
  donos: Record<string, string>;
  pistasVistas: string[];
  onAbrirSuspeito: (indice: number) => void;
  onAbrirPista: (id: string) => void;
  onAbrirBriefing: () => void;
  className?: string;
}

export default function QuadroInvestigacao({
  caso,
  fotos,
  donos,
  pistasVistas,
  onAbrirSuspeito,
  onAbrirPista,
  onAbrirBriefing,
  className = "",
}: Props) {
  const totalSuspeitos = caso.suspeitos.length;
  const totalPistas = caso.pistas.length;

  return (
    <div
      /**
       * Ocupa todo o retângulo disponível, sem proporção fixa: numa tela
       * 16:9 isso dá muito mais respiro entre os objetos do que forçar 4:3.
       * Os tamanhos internos são em `cqh`, então nada estoura a altura.
       */
      className={`quadro h-full w-full ${className}`}
      role="group"
      aria-label="Quadro de investigação"
    >
      {/* Barbante: sai do caso no centro e vai até cada objeto. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {caso.suspeitos.map((s, i) => {
          const { x, y } = vagaSuspeito(i, totalSuspeitos);
          return (
            <line
              key={s.nome}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="var(--color-sangue-500)"
              strokeOpacity="0.8"
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {caso.pistas.map((p, i) => {
          const { x, y } = vagaPista(i);
          return (
            <line
              key={p.id}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="var(--color-sangue-600)"
              strokeOpacity="0.4"
              strokeWidth="1"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Etiqueta do quadro, presa no canto livre da moldura */}
      <span className="lembrete pointer-events-none absolute bottom-[1.5cqh] left-[1.5cqh] z-20 -rotate-2 px-[1cqh] py-[0.4cqh] font-mono text-[1cqh] tracking-[0.18em] uppercase">
        Caso aberto
      </span>

      {/* ---------- Retratos dos suspeitos ---------- */}
      {caso.suspeitos.map((s, i) => {
        const { x, y } = vagaSuspeito(i, totalSuspeitos);
        return (
          <button
            key={s.nome}
            type="button"
            onClick={() => onAbrirSuspeito(i)}
            aria-label={`Abrir ficha de investigação de ${s.nome}`}
            className="papelzinho objeto z-10 w-[20cqh] cursor-pointer p-[0.8cqh] pb-[1.2cqh]"
            style={posicao(x, y, inclinacao(i + 1))}
          >
            <span className="pino" aria-hidden="true" />
            <RetratoSuspeito
              suspeito={s}
              fotoId={fotos[i]}
              className="aspect-square w-full"
            />
            <span className="mt-[0.8cqh] block truncate text-center font-mono text-[1.25cqh] tracking-[0.08em] text-noite-900 uppercase">
              {s.nome}
            </span>
          </button>
        );
      })}

      {/* ---------- O caso, no centro ---------- */}
      <button
        type="button"
        onClick={onAbrirBriefing}
        aria-label="Abrir briefing completo do caso"
        className="papelzinho objeto z-20 w-[32cqh] cursor-pointer px-[1.6cqh] py-[1.6cqh] text-center"
        style={posicao(50, 52, "1deg")}
      >
        <span className="pino pino-ambar" aria-hidden="true" />
        <span className="block text-[1.05cqh] tracking-[0.2em] text-sangue-600 uppercase">
          O caso
        </span>
        <span className="mt-[0.6cqh] block font-mono text-[1.7cqh] leading-tight text-noite-900">
          {caso.titulo}
        </span>
        <span className="mt-[1cqh] block border-t border-noite-900/20 pt-[0.8cqh] text-[1.05cqh] tracking-[0.14em] text-noite-900/60 uppercase">
          Ler briefing
        </span>
      </button>

      {/* ---------- Arquivos / evidências ---------- */}
      {caso.pistas.map((p, i) => {
        const { x, y } = vagaPista(i);
        const vista = pistasVistas.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onAbrirPista(p.id)}
            aria-label={`Abrir ${ROTULO_TIPO[p.tipo].toLowerCase()}: ${p.titulo}`}
            className="papelzinho objeto z-10 flex w-[27cqh] cursor-pointer flex-col gap-[0.5cqh] p-[1cqh]"
            style={posicao(x, y, inclinacao(i + 3, 5))}
          >
            <span className="pino" aria-hidden="true" />
            <span className="flex items-center justify-between gap-1">
              <span className="text-sangue-600">
                <IconePista tipo={p.tipo} className="h-[1.9cqh] w-[1.9cqh]" />
              </span>
              {/* Arquivo privado: mostra de quem é, sem mostrar o conteúdo. */}
              {donos[p.id] ? (
                <span className="rounded-sm bg-sangue-600 px-[0.5cqh] py-[0.2cqh] font-mono text-[0.9cqh] tracking-[0.1em] text-papel-50 uppercase">
                  {donos[p.id]}
                </span>
              ) : (
                <span className="font-mono text-[0.95cqh] tracking-[0.14em] text-noite-900/50">
                  {String(i + 1).padStart(2, "0")}/
                  {String(totalPistas).padStart(2, "0")}
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-left text-[1.4cqh] leading-tight font-medium text-noite-900">
              {p.titulo}
            </span>
            {/* Prévia do conteúdo, exceto nos arquivos privados: ali nem a
                primeira linha pode aparecer para quem não é o dono. */}
            <span className="line-clamp-3 text-left text-[1.15cqh] leading-snug text-noite-900/65 italic">
              {donos[p.id]
                ? "Arquivo lacrado. Só o detetive indicado pode abrir."
                : `${(p.tipo === "foto" && p.legendaFoto ? p.legendaFoto : p.conteudo).slice(0, 120)}…`}
            </span>
            <span className="mt-auto flex items-center justify-between gap-1 border-t border-noite-900/15 pt-[0.5cqh] text-[0.95cqh] tracking-[0.14em] text-noite-900/55 uppercase">
              {ROTULO_TIPO[p.tipo]}
              {vista && (
                <span className="-rotate-6 font-mono text-sangue-600/80">
                  ✓ visto
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
