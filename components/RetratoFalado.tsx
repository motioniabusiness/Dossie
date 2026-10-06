"use client";

import { useId } from "react";
import type { Retrato, Suspeito } from "@/lib/tipos";

/**
 * Retrato falado: um rosto desenhado em SVG a partir dos traços que a IA
 * escolheu para o suspeito. Sem geração de imagem — cada combinação de
 * formato, cabelo, barba, óculos e idade produz um rosto diferente, no estilo
 * de esboço de perícia que combina com o resto do dossiê.
 */

const FORMATOS: Retrato["formatoRosto"][] = [
  "oval",
  "redondo",
  "quadrado",
  "alongado",
];
const CABELOS: Retrato["cabelo"][] = [
  "raspado",
  "curto",
  "medio",
  "longo",
  "preso",
  "calvo",
];
const PELOS: Retrato["pelosFaciais"][] = [
  "nenhum",
  "nenhum",
  "bigode",
  "cavanhaque",
  "barba_curta",
  "barba_cheia",
];
const OCULOS: Retrato["oculos"][] = ["nenhum", "nenhum", "armacao", "redondo"];
const IDADES: Retrato["idadeAparente"][] = [
  "jovem",
  "adulto",
  "maduro",
  "idoso",
];
const TONS: Retrato["tomPele"][] = ["claro", "medio", "escuro"];
const MARCAS: Retrato["marca"][] = [
  "nenhuma",
  "nenhuma",
  "cicatriz",
  "sinal",
  "brinco",
];

/** Hash estável: o mesmo nome sempre gera o mesmo rosto. */
function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Usado só para casos antigos, gerados antes de a IA passar a mandar o retrato. */
function tracosDeFallback(nome: string): Retrato {
  const s = semente(nome);
  const em = <T,>(lista: T[], deslocamento: number) =>
    lista[Math.floor(s / 7 ** deslocamento) % lista.length];
  return {
    // O desenho é neutro o bastante para não depender do gênero; o campo existe
    // para o acervo de fotos, então aqui só precisa de um valor válido.
    genero: "masculino",
    formatoRosto: em(FORMATOS, 1),
    cabelo: em(CABELOS, 2),
    pelosFaciais: em(PELOS, 3),
    oculos: em(OCULOS, 4),
    idadeAparente: em(IDADES, 5),
    tomPele: em(TONS, 6),
    marca: em(MARCAS, 7),
  };
}

const MEDIDAS: Record<Retrato["formatoRosto"], { l: number; a: number }> = {
  oval: { l: 34, a: 44 },
  redondo: { l: 38, a: 39 },
  quadrado: { l: 36, a: 43 },
  alongado: { l: 31, a: 48 },
};

const CX = 50;
const CY = 55;

function caminhoRosto(formato: Retrato["formatoRosto"]) {
  const { l, a } = MEDIDAS[formato];
  const e = CX - l / 2;
  const d = CX + l / 2;
  const topo = CY - a / 2;
  const queixo = CY + a / 2;

  if (formato === "quadrado") {
    return `M${e},${topo + 10} Q${e},${topo} ${e + 9},${topo} L${d - 9},${topo} Q${d},${topo} ${d},${topo + 10} L${d},${queixo - 13} Q${d},${queixo} ${d - 12},${queixo} L${e + 12},${queixo} Q${e},${queixo} ${e},${queixo - 13} Z`;
  }
  return `M${e},${CY - 3} C${e},${topo - 3} ${d},${topo - 3} ${d},${CY - 3} C${d},${queixo - 8} ${CX + 8},${queixo} ${CX},${queixo} C${CX - 8},${queixo} ${e},${queixo - 8} ${e},${CY - 3} Z`;
}

interface DesenhoCabelo {
  calota: string | null;
  laterais: string | null;
  comprido: string | null;
  /** Cabelo raspado: mesma calota, com menos tinta. */
  rala?: boolean;
  coque?: { cx: number; cy: number; r: number };
}

function caminhoCabelo(traco: Retrato): DesenhoCabelo {
  const { l, a } = MEDIDAS[traco.formatoRosto];
  const e = CX - l / 2 - 1;
  const d = CX + l / 2 + 1;
  const topo = CY - a / 2 - 2;
  const linhaCabelo = topo + 11;

  // Calota que cobre o crânio até a linha do cabelo, com entradas laterais.
  const calota = `M${e},${linhaCabelo} C${e - 1},${topo - 4} ${d + 1},${topo - 4} ${d},${linhaCabelo} C${d - 4},${linhaCabelo - 5} ${CX + 6},${linhaCabelo - 2} ${CX},${linhaCabelo - 3} C${CX - 8},${linhaCabelo - 4} ${e + 5},${linhaCabelo - 6} ${e},${linhaCabelo} Z`;

  switch (traco.cabelo) {
    case "calvo":
      return { calota: null, laterais: null, comprido: null };
    case "raspado":
      return { calota, laterais: null, comprido: null, rala: true };
    case "curto":
      return { calota, laterais: null, comprido: null };
    case "medio":
      return {
        calota,
        laterais: `M${e},${linhaCabelo - 2} L${e - 2},${CY + 14} L${e + 4},${CY + 10} Z M${d},${linhaCabelo - 2} L${d + 2},${CY + 14} L${d - 4},${CY + 10} Z`,
        comprido: null,
      };
    case "longo":
      return {
        calota,
        laterais: null,
        comprido: `M${e},${linhaCabelo - 4} C${e - 7},${CY + 10} ${e - 6},${CY + 28} ${e - 2},${CY + 38} L${e + 6},${CY + 34} C${e + 2},${CY + 20} ${e + 3},${CY + 4} ${e + 4},${CY - 6} Z M${d},${linhaCabelo - 4} C${d + 7},${CY + 10} ${d + 6},${CY + 28} ${d + 2},${CY + 38} L${d - 6},${CY + 34} C${d - 2},${CY + 20} ${d - 3},${CY + 4} ${d - 4},${CY - 6} Z`,
      };
    case "preso":
      return {
        calota,
        laterais: null,
        comprido: null,
        coque: { cx: d + 3, cy: topo + 12, r: 7 },
      };
  }
}

function caminhoBarba(traco: Retrato) {
  const { l, a } = MEDIDAS[traco.formatoRosto];
  const e = CX - l / 2;
  const d = CX + l / 2;
  const queixo = CY + a / 2;

  switch (traco.pelosFaciais) {
    case "nenhum":
      return null;
    case "bigode":
      return `M${CX - 8},${CY + 14} Q${CX},${CY + 11} ${CX + 8},${CY + 14} Q${CX},${CY + 18} ${CX - 8},${CY + 14} Z`;
    case "cavanhaque":
      return `M${CX - 5},${CY + 20} Q${CX},${CY + 18} ${CX + 5},${CY + 20} Q${CX + 4},${queixo - 1} ${CX},${queixo} Q${CX - 4},${queixo - 1} ${CX - 5},${CY + 20} Z`;
    case "barba_curta":
    case "barba_cheia": {
      const altura = traco.pelosFaciais === "barba_cheia" ? CY + 2 : CY + 9;
      return `M${e + 1},${altura} C${e + 2},${queixo - 2} ${CX - 8},${queixo + 1} ${CX},${queixo + 1} C${CX + 8},${queixo + 1} ${d - 2},${queixo - 2} ${d - 1},${altura} C${d - 4},${CY + 16} ${CX + 7},${CY + 21} ${CX},${CY + 21} C${CX - 7},${CY + 21} ${e + 4},${CY + 16} ${e + 1},${altura} Z`;
    }
  }
}

interface Props {
  suspeito: Pick<Suspeito, "nome" | "retrato">;
  className?: string;
}

export default function RetratoFalado({ suspeito, className = "" }: Props) {
  const id = useId();
  const t = suspeito.retrato ?? tracosDeFallback(suspeito.nome);
  const cabelo = caminhoCabelo(t);
  const barba = caminhoBarba(t);
  const { a } = MEDIDAS[t.formatoRosto];
  const queixo = CY + a / 2;

  const tinta = "#1b2230";
  const opacidadePele =
    t.tomPele === "escuro" ? 0.3 : t.tomPele === "medio" ? 0.15 : 0.05;
  const linhasIdade = t.idadeAparente === "idoso" ? 3 : t.idadeAparente === "maduro" ? 2 : 0;

  return (
    <svg
      viewBox="0 0 100 125"
      className={className}
      role="img"
      aria-label={`Retrato falado de ${suspeito.nome}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${id}-papel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe9db" />
          <stop offset="100%" stopColor="#d8d0be" />
        </linearGradient>
        <clipPath id={`${id}-rosto`}>
          <path d={caminhoRosto(t.formatoRosto)} />
        </clipPath>
      </defs>

      <rect width="100" height="125" fill={`url(#${id}-papel)`} />

      <g
        stroke={tinta}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ombros e gola */}
        <path
          d={`M4,125 C8,103 28,95 50,95 C72,95 92,103 96,125`}
          fill={tinta}
          fillOpacity="0.9"
        />
        <path
          d={`M40,97 L50,112 L60,97`}
          stroke="#efe9db"
          strokeWidth="1.6"
          fill="none"
        />
        {/* Pescoço */}
        <path
          d={`M43,${queixo - 3} L43,97 M57,${queixo - 3} L57,97`}
          fill="none"
        />

        {/* Rosto */}
        <path
          d={caminhoRosto(t.formatoRosto)}
          fill={tinta}
          fillOpacity={opacidadePele}
        />

        {/* Sombreado hachurado do lado direito */}
        <g clipPath={`url(#${id}-rosto)`} strokeWidth="0.7" opacity="0.35">
          {Array.from({ length: t.tomPele === "claro" ? 2 : 5 }).map((_, i) => (
            <line
              key={i}
              x1={62 + i * 3}
              y1={36}
              x2={54 + i * 3}
              y2={82}
            />
          ))}
        </g>

        {/* Orelhas */}
        <path
          d={`M${CX - MEDIDAS[t.formatoRosto].l / 2},${CY + 1} q-5,1 -4,7 q1,5 4,4`}
        />
        <path
          d={`M${CX + MEDIDAS[t.formatoRosto].l / 2},${CY + 1} q5,1 4,7 q-1,5 -4,4`}
        />

        {/* Sobrancelhas */}
        <path
          d={
            t.idadeAparente === "idoso"
              ? `M${CX - 15},${CY - 5} q6,-4 11,-1 M${CX + 4},${CY - 6} q5,-3 11,1`
              : `M${CX - 14},${CY - 4} q5,-3 10,-1 M${CX + 4},${CY - 5} q5,-2 10,1`
          }
          strokeWidth="1.7"
        />

        {/* Olhos */}
        <path d={`M${CX - 13},${CY + 2} q4,-4 9,0 q-4,4 -9,0 Z`} />
        <path d={`M${CX + 4},${CY + 2} q5,-4 9,0 q-5,4 -9,0 Z`} />
        <circle cx={CX - 8.5} cy={CY + 2} r="1.7" fill={tinta} stroke="none" />
        <circle cx={CX + 8.5} cy={CY + 2} r="1.7" fill={tinta} stroke="none" />

        {/* Nariz */}
        <path d={`M${CX - 1},${CY + 4} l-2,8 q3,2 6,0`} />

        {/* Boca */}
        <path
          d={
            t.idadeAparente === "jovem"
              ? `M${CX - 7},${CY + 17} q7,3 14,0`
              : `M${CX - 7},${CY + 17} q7,2 14,0`
          }
        />

        {/* Marcas de idade */}
        {linhasIdade > 0 && (
          <g strokeWidth="0.8" opacity="0.7">
            <path d={`M${CX - 10},${CY + 10} q-2,5 0,8`} />
            <path d={`M${CX + 10},${CY + 10} q2,5 0,8`} />
            {linhasIdade > 2 && (
              <path
                d={`M${CX - 12},${CY - 12} q12,-3 24,0 M${CX - 10},${CY - 16} q10,-2 20,0`}
                opacity="0.5"
              />
            )}
          </g>
        )}

        {/* Barba / bigode */}
        {barba && (
          <path d={barba} fill={tinta} fillOpacity="0.82" stroke="none" />
        )}

        {/* Cabelo */}
        {cabelo.comprido && (
          <path
            d={cabelo.comprido}
            fill={tinta}
            fillOpacity="0.88"
            stroke="none"
          />
        )}
        {cabelo.laterais && (
          <path
            d={cabelo.laterais}
            fill={tinta}
            fillOpacity="0.88"
            stroke="none"
          />
        )}
        {cabelo.coque && (
          <circle
            cx={cabelo.coque.cx}
            cy={cabelo.coque.cy}
            r={cabelo.coque.r}
            fill={tinta}
            fillOpacity="0.88"
            stroke="none"
          />
        )}
        {cabelo.calota && (
          <path
            d={cabelo.calota}
            fill={tinta}
            fillOpacity={cabelo.rala ? 0.45 : 0.9}
            stroke="none"
          />
        )}

        {/* Óculos */}
        {t.oculos !== "nenhum" &&
          (t.oculos === "redondo" ? (
            <g strokeWidth="1.2">
              <circle cx={CX - 8.5} cy={CY + 2} r="6.5" />
              <circle cx={CX + 8.5} cy={CY + 2} r="6.5" />
              <path
                d={`M${CX - 2},${CY + 2} h4 M${CX - 15},${CY + 1} l-4,-2 M${CX + 15},${CY + 1} l4,-2`}
              />
            </g>
          ) : (
            <g strokeWidth="1.2">
              <rect x={CX - 15} y={CY - 3} width="13" height="10" rx="2.5" />
              <rect x={CX + 2} y={CY - 3} width="13" height="10" rx="2.5" />
              <path
                d={`M${CX - 2},${CY + 1} h4 M${CX - 15},${CY - 1} l-4,-2 M${CX + 15},${CY - 1} l4,-2`}
              />
            </g>
          ))}

        {/* Sinal particular */}
        {t.marca === "cicatriz" && (
          <path d={`M${CX + 12},${CY + 6} l-2,7`} strokeWidth="1" />
        )}
        {t.marca === "sinal" && (
          <circle
            cx={CX + 11}
            cy={CY + 12}
            r="1.1"
            fill={tinta}
            stroke="none"
          />
        )}
        {t.marca === "brinco" && (
          <circle
            cx={CX + MEDIDAS[t.formatoRosto].l / 2 + 1}
            cy={CY + 12}
            r="1.6"
            strokeWidth="1"
          />
        )}
      </g>
    </svg>
  );
}
