import type { ModoJogo, Pista } from "./tipos";

export interface DivisaoPrivada {
  jogador1: string[];
  jogador2: string[];
}

/**
 * Reparte alguns arquivos entre os dois detetives no modo duelo: cada um recebe
 * arquivos que só ele pode abrir. Nenhum dos dois fica com o caso completo, e é
 * isso que obriga os dois a conversarem em vez de lerem em silêncio.
 *
 * A divisão é simétrica de propósito: mesma quantidade para cada lado, sorteada
 * sem olhar o conteúdo. Nem eu nem a IA sabemos qual arquivo é o decisivo, então
 * ninguém sai em vantagem.
 */
export function dividirPistasPrivadas(
  pistas: Pista[],
  modo: ModoJogo,
  porJogador: number,
): DivisaoPrivada {
  const vazio = { jogador1: [], jogador2: [] };
  if (modo !== "duelo") return vazio;

  // Deixa ao menos dois arquivos públicos, senão a mesa comum fica vazia.
  const maximo = Math.floor((pistas.length - 2) / 2);
  const quantidade = Math.max(0, Math.min(porJogador, maximo));
  if (quantidade === 0) return vazio;

  const embaralhadas = [...pistas];
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]];
  }

  return {
    jogador1: embaralhadas.slice(0, quantidade).map((p) => p.id),
    jogador2: embaralhadas.slice(quantidade, quantidade * 2).map((p) => p.id),
  };
}

/** Devolve de quem é o arquivo, ou null se for de mesa aberta. */
export function donoDaPista(
  pistaId: string,
  privadas: DivisaoPrivada,
): "jogador1" | "jogador2" | null {
  if (privadas.jogador1.includes(pistaId)) return "jogador1";
  if (privadas.jogador2.includes(pistaId)) return "jogador2";
  return null;
}
