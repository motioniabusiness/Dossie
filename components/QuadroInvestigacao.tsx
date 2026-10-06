"use client";

import type { CSSProperties, ReactNode } from "react";
import IconePista, { ROTULO_TIPO } from "./IconePista";
import RetratoSuspeito from "./RetratoSuspeito";
import type { CasoPublico, Pista } from "@/lib/tipos";

/**
 * Quadro de detetive: retratos, arquivos e o caso no centro, pregados no feltro
 * e ligados por barbante vermelho. Tudo é clicável e abre a ficha ou o arquivo.
 *
 * Cada tipo de pista tem um objeto físico próprio, para o quadro ser lido de
 * relance: documento com dobra no canto, depoimento em ficha pautada,
 * fotografia em polaroide, objeto em saco de evidência.
 *
 * Coordenadas em % do quadro e tamanhos em `cqh` (altura do quadro): o quadro
 * inteiro escala junto com a janela, sem rolagem.
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

/** Inclinação determinística: mesmo caso, mesmo quadro, nada tremendo a cada render. */
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

/** Número de protocolo estável, derivado do id do caso. */
export function numeroDoCaso(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return String(h % 9000 + 1000);
}

/** Carimbo pequeno no canto de um objeto do quadro. */
function CarimboCanto({ children, giro = "-12deg" }: { children: ReactNode; giro?: string }) {
  return (
    <span
      className="carimbo animate-carimbar pointer-events-none absolute -right-[0.8cqh] -bottom-[0.6cqh] z-10 bg-papel-50/70 text-[0.95cqh]"
      style={{ "--giro": giro } as CSSProperties}
    >
      {children}
    </span>
  );
}

/** Corpo de cada tipo de pista. O botão em volta é comum a todos. */
function CorpoPista({
  pista,
  lacrada,
  dono,
}: {
  pista: Pista;
  lacrada: boolean;
  dono?: string;
}) {
  const previa = lacrada
    ? "Conteúdo restrito."
    : `${(pista.tipo === "foto" && pista.legendaFoto ? pista.legendaFoto : pista.conteudo).slice(0, 110)}…`;

  const titulo = (
    <span className="line-clamp-2 text-left font-mono text-[1.55cqh] leading-tight font-bold text-tinta">
      {pista.titulo}
    </span>
  );

  switch (pista.tipo) {
    case "foto":
      return (
        <span className="flex flex-col gap-[0.7cqh]">
          <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-tinta">
            <span className="reticula absolute inset-0 opacity-40 invert" />
            {lacrada ? (
              <span className="font-maquina text-[1.3cqh] tracking-[0.2em] text-papel-300 uppercase">
                Lacrada
              </span>
            ) : (
              <span className="line-clamp-4 px-[1cqh] text-center text-[1.2cqh] leading-snug text-papel-300 italic">
                {pista.legendaFoto ?? pista.conteudo}
              </span>
            )}
          </span>
          <span className="line-clamp-2 text-center font-maquina text-[1.5cqh] leading-tight text-tinta">
            {pista.titulo}
          </span>
          {dono && <SeloDono nome={dono} />}
        </span>
      );

    case "depoimento":
      return (
        <span className="flex flex-col gap-[0.5cqh] pl-[1.6cqh]">
          <span className="flex items-center justify-between gap-1">
            <IconePista tipo="depoimento" className="h-[2cqh] w-[2cqh]" />
            {dono ? <SeloDono nome={dono} /> : null}
          </span>
          {titulo}
          <span className="line-clamp-2 text-left font-mono text-[1.25cqh] leading-snug text-tinta/70 italic">
            “{previa}”
          </span>
        </span>
      );

    case "objeto":
      return (
        <span className="flex flex-col">
          {/* Faixa vermelha do lacre do saco */}
          <span className="-mx-[1cqh] -mt-[1cqh] mb-[0.8cqh] flex items-center justify-between bg-sangue-500 px-[1cqh] py-[0.35cqh] font-mono text-[0.9cqh] font-bold tracking-[0.22em] text-papel-50 uppercase">
            Evidência
            {dono ? <span className="text-papel-50/80">{dono}</span> : <IconePista tipo="objeto" className="h-[1.6cqh] w-[1.6cqh]" />}
          </span>
          {/* Etiqueta de cartolina dentro do saco */}
          <span className="manila flex flex-col gap-[0.4cqh] border border-tinta/40 px-[0.9cqh] py-[0.7cqh] shadow-none">
            {titulo}
            <span className="line-clamp-2 text-left font-mono text-[1.2cqh] leading-snug text-tinta/70">
              {previa}
            </span>
          </span>
        </span>
      );

    default:
      return (
        <span className="flex flex-col gap-[0.5cqh]">
          <span className="flex items-center justify-between gap-1 pr-[2cqh]">
            <IconePista tipo="documento" className="h-[2cqh] w-[2cqh]" />
            {dono ? <SeloDono nome={dono} /> : null}
          </span>
          {titulo}
          <span className="line-clamp-2 text-left font-mono text-[1.25cqh] leading-snug text-tinta/65">
            {previa}
          </span>
        </span>
      );
  }
}

/** Etiqueta de dono de um arquivo privado. */
function SeloDono({ nome }: { nome: string }) {
  return (
    <span className="inline-flex items-center gap-[0.3cqh] self-start bg-sangue-500 px-[0.5cqh] py-[0.15cqh] font-mono text-[0.85cqh] font-bold tracking-[0.12em] text-papel-50 uppercase">
      Só {nome}
    </span>
  );
}

/** Aparência física de cada tipo: papel, ficha pautada, polaroide, saco. */
const ESTILO_TIPO: Record<Pista["tipo"], { classe: string; estilo?: CSSProperties }> = {
  documento: {
    classe: "papelzinho p-[1cqh]",
    // Canto superior direito dobrado
    estilo: {
      clipPath:
        "polygon(0 0, calc(100% - 2.4cqh) 0, 100% 2.4cqh, 100% 100%, 0 100%)",
    },
  },
  depoimento: {
    classe: "p-[1cqh]",
    estilo: {
      backgroundColor: "#f4f0e4",
      backgroundImage:
        "linear-gradient(90deg, transparent 1.9cqh, rgba(184,58,44,0.5) 1.9cqh, rgba(184,58,44,0.5) 2.05cqh, transparent 2.05cqh), repeating-linear-gradient(transparent 0 1.55cqh, rgba(60,90,130,0.18) 1.55cqh 1.65cqh)",
      boxShadow: "0 14px 26px -16px rgba(0,0,0,0.95)",
    },
  },
  foto: {
    classe: "p-[0.9cqh] pb-[1.2cqh]",
    estilo: {
      backgroundColor: "#f7f5ef",
      boxShadow: "0 14px 26px -16px rgba(0,0,0,0.95)",
    },
  },
  objeto: {
    classe: "p-[1cqh] pt-[1cqh] overflow-hidden",
    estilo: {
      // Plástico translúcido com reflexo
      backgroundColor: "rgba(214,220,224,0.9)",
      backgroundImage:
        "linear-gradient(115deg, rgba(255,255,255,0.55) 0 18%, transparent 30% 62%, rgba(255,255,255,0.3) 75%, transparent 90%)",
      boxShadow: "0 14px 26px -16px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(0,0,0,0.12)",
    },
  },
};

interface Props {
  caso: CasoPublico;
  /** Rostos sorteados, na ordem do elenco. */
  fotos: string[];
  /** Primeiro nome de quem é dono de cada arquivo privado, por id de pista. */
  donos: Record<string, string>;
  /** Arquivos privados que este aparelho não pode abrir. */
  lacradas?: Set<string>;
  pistasVistas: string[];
  /** Suspeitos que já responderam a pelo menos uma pergunta. */
  interrogados?: Set<string>;
  onAbrirSuspeito: (indice: number) => void;
  onAbrirPista: (id: string) => void;
  onAbrirBriefing: () => void;
  className?: string;
}

export default function QuadroInvestigacao({
  caso,
  fotos,
  donos,
  lacradas,
  pistasVistas,
  interrogados,
  onAbrirSuspeito,
  onAbrirPista,
  onAbrirBriefing,
  className = "",
}: Props) {
  const totalSuspeitos = caso.suspeitos.length;

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
              strokeOpacity="0.85"
              strokeWidth="1.8"
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
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Etiqueta do quadro, presa no canto livre da moldura */}
      <span className="lembrete pointer-events-none absolute bottom-[1.5cqh] left-[1.5cqh] z-20 -rotate-2 border border-tinta/60 px-[1cqh] py-[0.4cqh] font-maquina text-[1.15cqh] tracking-[0.16em] uppercase">
        Caso aberto · {numeroDoCaso(caso.id)}
      </span>

      {/* ---------- Retratos dos suspeitos ---------- */}
      {caso.suspeitos.map((s, i) => {
        const { x, y } = vagaSuspeito(i, totalSuspeitos);
        const ouvido = interrogados?.has(s.nome);
        return (
          <button
            key={s.nome}
            type="button"
            onClick={() => onAbrirSuspeito(i)}
            aria-label={`Abrir ficha de investigação de ${s.nome}`}
            className="papelzinho objeto z-10 w-[20cqh] cursor-pointer p-[0.8cqh] pb-[1cqh]"
            style={posicao(x, y, inclinacao(i + 1))}
          >
            <span className="pino" aria-hidden="true" />
            <span className="relative block">
              <RetratoSuspeito
                suspeito={s}
                fotoId={fotos[i]}
                className="aspect-square w-full"
              />
              {/* Régua de altura de ficha policial, no rodapé da foto */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.8cqh] bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute bottom-[0.3cqh] left-[0.6cqh] font-mono text-[0.9cqh] font-bold tracking-[0.15em] text-papel-50/90">
                N.º {String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <span className="mt-[0.7cqh] block truncate text-center font-maquina text-[1.6cqh] leading-tight text-tinta">
              {s.nome}
            </span>
            {s.ocupacao && (
              <span className="block truncate text-center font-mono text-[1.1cqh] tracking-[0.06em] text-tinta/55 uppercase">
                {s.ocupacao}
              </span>
            )}
            {ouvido && <CarimboCanto giro="10deg">Ouvido</CarimboCanto>}
          </button>
        );
      })}

      {/* ---------- O caso, no centro: pasta de cartolina ---------- */}
      <button
        type="button"
        onClick={onAbrirBriefing}
        aria-label="Abrir briefing completo do caso"
        className="objeto z-20 w-[34cqh] cursor-pointer text-center"
        style={posicao(50, 52, "1deg")}
      >
        {/* Aba da pasta */}
        <span className="manila ml-[2cqh] block w-[12cqh] rounded-t-[0.6cqh] px-[1cqh] pt-[0.5cqh] pb-[0.2cqh] text-left font-mono text-[0.95cqh] font-bold tracking-[0.18em] uppercase shadow-none">
          Caso {numeroDoCaso(caso.id)}
        </span>
        <span className="manila relative block rounded-[0.4cqh] rounded-tl-none border border-tinta/25 px-[1.8cqh] pt-[1.6cqh] pb-[1.4cqh]">
          <span className="pino pino-ambar" aria-hidden="true" />
          <span className="block font-mono text-[1.05cqh] font-bold tracking-[0.24em] text-sangue-600 uppercase">
            Arquivo confidencial
          </span>
          <span className="mt-[0.6cqh] block font-maquina text-[2.1cqh] leading-tight text-tinta">
            {caso.titulo}
          </span>
          <span className="mt-[1cqh] block border-t border-tinta/25 pt-[0.8cqh] font-mono text-[1.05cqh] font-bold tracking-[0.16em] text-tinta/65 uppercase">
            Ler o briefing
          </span>
        </span>
      </button>

      {/* ---------- Arquivos / evidências ---------- */}
      {caso.pistas.map((p, i) => {
        const { x, y } = vagaPista(i);
        const vista = pistasVistas.includes(p.id);
        const lacrada = lacradas?.has(p.id) ?? Boolean(donos[p.id]);
        const { classe, estilo } = ESTILO_TIPO[p.tipo];
        // Polaroides e fichas vão com fita; papéis e sacos, com alfinete.
        const comFita = p.tipo === "foto" || p.tipo === "depoimento";
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onAbrirPista(p.id)}
            aria-label={`Abrir ${ROTULO_TIPO[p.tipo].toLowerCase()}: ${p.titulo}${donos[p.id] ? `, arquivo de ${donos[p.id]}` : ""}`}
            className={`objeto z-10 flex cursor-pointer flex-col ${
              p.tipo === "foto" ? "w-[21cqh]" : "w-[27cqh]"
            }`}
            style={posicao(x, y, inclinacao(i + 3, 5))}
          >
            <span className={`relative block w-full ${classe}`} style={estilo}>
              {/* Dobra do canto do documento */}
              {p.tipo === "documento" && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 h-[2.4cqh] w-[2.4cqh] bg-papel-300"
                  style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
                />
              )}
              <CorpoPista pista={p} lacrada={lacrada} dono={donos[p.id]} />
            </span>

            {comFita ? (
              <span
                className="fita left-1/2 -top-[0.9cqh] h-[1.8cqh] w-[7cqh] -translate-x-1/2"
                style={{ "--giro": inclinacao(i + 7, 6) } as CSSProperties}
              />
            ) : (
              <span className="pino" aria-hidden="true" />
            )}

            {vista && <CarimboCanto>Analisado</CarimboCanto>}
          </button>
        );
      })}
    </div>
  );
}
