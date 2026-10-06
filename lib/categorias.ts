import type { Categoria, Dificuldade } from "./tipos";

export interface DefinicaoCategoria {
  id: Categoria;
  nome: string;
  descricao: string;
}

export const CATEGORIAS: DefinicaoCategoria[] = [
  {
    id: "furto_roubo",
    nome: "Furto / Roubo",
    descricao: "Algo valioso saiu de uma sala trancada por dentro.",
  },
  {
    id: "assassinato",
    nome: "Assassinato",
    descricao: "Uma morte que a versão oficial não explica.",
  },
  {
    id: "fraude",
    nome: "Fraude",
    descricao: "Números que não fecham, assinaturas que não batem.",
  },
  {
    id: "desaparecimento",
    // Hífen invisível: no celular a palavra quebra em duas linhas, com hífen.
    nome: "Desapareci­mento",
    descricao: "Alguém sumiu, e alguém sabe exatamente por quê.",
  },
];

/** Tempos oferecidos como atalho na configuração da partida. */
export const TEMPOS_PADRAO = [
  { minutos: 40, rotulo: "40 min", nota: "Caso direto" },
  { minutos: 60, rotulo: "1 hora", nota: "Com reviravolta" },
];

export const MIN_MINUTOS = 10;
export const MAX_MINUTOS = 180;

export interface DefinicaoDificuldade {
  id: Dificuldade;
  nome: string;
  /** Classificação do arquivo, como num carimbo de pasta policial. */
  sigilo: string;
  descricao: string;
}

export const DIFICULDADES: DefinicaoDificuldade[] = [
  {
    id: "facil",
    nome: "Fácil",
    sigilo: "Rotina",
    descricao:
      "Uma linha de dedução. As pistas dizem quase tudo, falta juntar duas ou três.",
  },
  {
    id: "medio",
    nome: "Médio",
    sigilo: "Sigiloso",
    descricao:
      "Duas camadas e uma falsa pista convincente. Exige cruzar horários e depoimentos.",
  },
  {
    id: "dificil",
    nome: "Difícil",
    sigilo: "Ultras­secreto",
    descricao:
      "Reviravolta, duas falsas pistas e uma peça que só faz sentido no fim. Sem piedade.",
  },
];

export function nomeDificuldade(id: Dificuldade): string {
  return DIFICULDADES.find((d) => d.id === id)?.nome ?? id;
}

export function nomeCategoria(id: Categoria): string {
  return CATEGORIAS.find((c) => c.id === id)?.nome ?? id;
}
