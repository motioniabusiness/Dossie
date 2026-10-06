import type { Retrato } from "./tipos";

/**
 * Acervo de retratos ilustrados. Cada folha em /public/retratos é uma grade
 * 3x3 com nove rostos, e cada entrada abaixo aponta para uma célula.
 *
 * O catálogo foi escrito olhando as folhas uma por uma: gênero e faixa de
 * idade de cada rosto. É o que permite dar rosto de homem a nome de homem e
 * aproximar a idade do que a IA escreveu para o suspeito.
 */

export type GeneroRetrato = "masculino" | "feminino";

export interface RetratoDoAcervo {
  /** Ex.: "f1c0" = folha 1, célula 0 (canto superior esquerdo). */
  id: string;
  folha: number;
  /** 0 a 8, da esquerda para a direita e de cima para baixo. */
  celula: number;
  genero: GeneroRetrato;
  idade: Retrato["idadeAparente"];
}

/** Colunas e linhas de cada folha. */
export const GRADE = 3;

function entrada(
  folha: number,
  celula: number,
  genero: GeneroRetrato,
  idade: Retrato["idadeAparente"],
): RetratoDoAcervo {
  return { id: `f${folha}c${celula}`, folha, celula, genero, idade };
}

export const ACERVO: RetratoDoAcervo[] = [
  // ---------- Folha 01 ----------
  entrada(1, 0, "masculino", "adulto"), // cabelo curto escuro, terno claro
  entrada(1, 1, "feminino", "adulto"), // cabelo longo ondulado
  entrada(1, 2, "masculino", "idoso"), // calvo, bigode, óculos escuros
  entrada(1, 3, "feminino", "idoso"), // coque grisalho, óculos redondos
  entrada(1, 4, "masculino", "adulto"), // barba cheia
  entrada(1, 5, "feminino", "jovem"), // chanel escuro
  entrada(1, 6, "masculino", "idoso"), // cabelo branco ralo
  entrada(1, 7, "feminino", "maduro"), // pele escura, cabelo preso
  entrada(1, 8, "masculino", "adulto"), // raspado, cavanhaque, jaqueta

  // ---------- Folha 02 ----------
  entrada(2, 0, "feminino", "idoso"), // cabelo branco, echarpe
  entrada(2, 1, "masculino", "jovem"), // cabelo médio, jaqueta de couro
  entrada(2, 2, "feminino", "maduro"), // dreads, óculos
  entrada(2, 3, "masculino", "idoso"), // cabelo branco, terno
  entrada(2, 4, "feminino", "adulto"), // curto ruivo
  entrada(2, 5, "masculino", "adulto"), // pele escura, cavanhaque
  entrada(2, 6, "feminino", "idoso"), // cabelo branco preso
  entrada(2, 7, "masculino", "adulto"), // cabelo longo, barba
  entrada(2, 8, "masculino", "idoso"), // capuz, rosto marcado

  // ---------- Folha 03 ----------
  entrada(3, 0, "feminino", "idoso"), // turbante
  entrada(3, 1, "masculino", "jovem"), // cabelo claro curto
  entrada(3, 2, "masculino", "maduro"), // grisalho com barba
  entrada(3, 3, "feminino", "adulto"), // cabelo curto escuro
  entrada(3, 4, "masculino", "idoso"), // cabelo branco, gola alta
  entrada(3, 5, "feminino", "adulto"), // chanel, óculos
  entrada(3, 6, "masculino", "adulto"), // cacheado, barba, capuz
  entrada(3, 7, "masculino", "jovem"), // pele escura, bigode fino
  entrada(3, 8, "feminino", "maduro"), // cabelo branco curto, blazer

  // ---------- Folha 04 ----------
  entrada(4, 0, "masculino", "maduro"), // calvo, cicatriz
  entrada(4, 1, "feminino", "adulto"), // chanel escuro, anel
  entrada(4, 2, "masculino", "adulto"), // barba escura, gola alta
  entrada(4, 3, "masculino", "adulto"), // ruivo, tatuagem
  entrada(4, 4, "feminino", "idoso"), // óculos escuros, sorriso
  entrada(4, 5, "masculino", "idoso"), // desgrenhado, monóculo
  entrada(4, 6, "masculino", "adulto"), // cacheado, capuz
  entrada(4, 7, "feminino", "adulto"), // curto repicado
  entrada(4, 8, "masculino", "maduro"), // grisalho, severo

  // ---------- Folha 05 ----------
  entrada(5, 0, "masculino", "maduro"), // óculos, terno
  entrada(5, 1, "feminino", "adulto"), // cabelo longo, lenço
  entrada(5, 2, "masculino", "idoso"), // pele escura, barba branca
  entrada(5, 3, "feminino", "jovem"), // curto ruivo vibrante
  entrada(5, 4, "masculino", "maduro"), // tapa-olho
  entrada(5, 5, "feminino", "idoso"), // coque alto branco
  entrada(5, 6, "masculino", "adulto"), // óculos redondos, cabelo longo
  entrada(5, 7, "feminino", "maduro"), // pele escura, colar de pérolas
  entrada(5, 8, "masculino", "idoso"), // muito idoso, óculos redondos
];

const POR_ID = new Map(ACERVO.map((r) => [r.id, r]));

export function retratoPorId(id: string): RetratoDoAcervo | undefined {
  return POR_ID.get(id);
}

/** Posição da célula na folha, em porcentagem, para recortar a grade. */
export function posicaoNaFolha(celula: number) {
  return { coluna: celula % GRADE, linha: Math.floor(celula / GRADE) };
}

function sortear<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

interface Sorteio {
  /** Um id do acervo por suspeito, na mesma ordem. */
  fotos: string[];
  /** Lista de usados atualizada, para a próxima partida da sessão. */
  usados: string[];
}

/**
 * Distribui rostos para os suspeitos de um caso.
 *
 * Regras: o rosto tem de bater com o gênero do personagem, a idade é
 * aproximada quando possível, e nada se repete enquanto o jogo estiver aberto.
 * Quando o acervo de um gênero se esgota (são 26 masculinos e 19 femininos,
 * ou seja umas 5 partidas), a lista daquele gênero é liberada de novo.
 */
export function sortearRetratos(
  suspeitos: { retrato?: Retrato }[],
  usadosAntes: string[],
): Sorteio {
  const usados = new Set(usadosAntes);
  const fotos: string[] = [];

  for (const suspeito of suspeitos) {
    const genero: GeneroRetrato =
      suspeito.retrato?.genero === "feminino" ? "feminino" : "masculino";
    const idade = suspeito.retrato?.idadeAparente;

    const doGenero = ACERVO.filter((r) => r.genero === genero);
    let livres = doGenero.filter((r) => !usados.has(r.id));

    if (livres.length === 0) {
      // Acervo do gênero esgotado nesta sessão: libera e recomeça.
      for (const r of doGenero) usados.delete(r.id);
      livres = doGenero;
    }

    // Preferência pela faixa de idade; se não houver, qualquer um do gênero.
    const naIdade = idade ? livres.filter((r) => r.idade === idade) : [];
    const escolhido = sortear(naIdade.length > 0 ? naIdade : livres);

    usados.add(escolhido.id);
    fotos.push(escolhido.id);
  }

  return { fotos, usados: [...usados] };
}
