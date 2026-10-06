import { sortearRetratos } from "./retratos";
import type { CasoPublico, ConfigPartida } from "./tipos";

/**
 * Caso seguinte, gerado em segundo plano enquanto a dupla lê o resultado.
 *
 * O pedido em andamento fica guardado aqui, fora do React, porque ele precisa
 * sobreviver à troca de tela: se vocês clicam em "Novo caso" antes de ele
 * chegar, a geração espera por este mesmo pedido em vez de pagar outro.
 */

export interface CasoAdiantado {
  caso: CasoPublico;
  solucaoSelada: string;
  fotos: string[];
  retratosUsados: string[];
  config: ConfigPartida;
}

/** Duas configurações produzem casos equivalentes? */
export function mesmaConfig(a: ConfigPartida, b: ConfigPartida) {
  return (
    a.categoria === b.categoria &&
    a.dificuldade === b.dificuldade &&
    a.modo === b.modo
  );
}

let emAndamento: {
  config: ConfigPartida;
  promessa: Promise<CasoAdiantado | null>;
} | null = null;

/** Começa a gerar o próximo caso. Não repete se já houver um a caminho. */
export function adiantar(
  config: ConfigPartida,
  resumosVistos: string[],
  retratosUsados: string[],
): Promise<CasoAdiantado | null> {
  if (emAndamento && mesmaConfig(emAndamento.config, config)) {
    return emAndamento.promessa;
  }

  const promessa = (async () => {
    try {
      const resposta = await fetch("/api/gerar-caso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: config.categoria,
          minutos: config.minutos,
          dificuldade: config.dificuldade,
          resumosVistos,
        }),
      });
      if (!resposta.ok) return null;
      const corpo = (await resposta.json()) as {
        caso: CasoPublico;
        solucaoSelada: string;
      };
      // Sorteio aqui, fora do redutor: aleatoriedade não entra em função pura.
      const { fotos, usados } = sortearRetratos(
        corpo.caso.suspeitos,
        retratosUsados,
      );
      return {
        caso: corpo.caso,
        solucaoSelada: corpo.solucaoSelada,
        fotos,
        retratosUsados: usados,
        config,
      };
    } catch {
      // Falhou em segundo plano: a próxima partida simplesmente gera na hora.
      return null;
    }
  })();

  emAndamento = { config, promessa };
  return promessa;
}

/**
 * Entrega o caso adiantado para esta configuração, se houver um pronto ou a
 * caminho, e o tira da fila: um caso adiantado serve uma vez só.
 */
export function consumirAdiantado(
  config: ConfigPartida,
): Promise<CasoAdiantado | null> | null {
  if (!emAndamento || !mesmaConfig(emAndamento.config, config)) return null;
  const { promessa } = emAndamento;
  emAndamento = null;
  return promessa;
}

/** O caso adiantado já entrou por outro caminho (o estado guardado). */
export function descartarAdiantado() {
  emAndamento = null;
}
