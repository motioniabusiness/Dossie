import Anthropic from "@anthropic-ai/sdk";

/**
 * Modelo e esforço usados para gerar e julgar os casos.
 *
 * O custo de uma partida é dominado pelos tokens de SAÍDA, e a maior parte da
 * saída é o modelo raciocinando antes de escrever. Por isso os dois botões que
 * importam são estes:
 *
 *   MODELO_IA=claude-opus-5   → casos mais elaborados, cerca de 3x o preço
 *   ESFORCO_IA=medium|high    → mais raciocínio, mais tempo, mais custo
 *
 * Ambos podem ser trocados no .env.local sem mexer no código.
 */
export const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

export type Esforco = "low" | "medium" | "high";
export const ESFORCO = (process.env.ESFORCO_IA ?? "low") as Esforco;

/**
 * Fallback server-side: se um classificador de segurança recusar o pedido, a
 * própria API repete a chamada em outro modelo em vez de devolver a recusa.
 *
 * Só existe nos modelos da linha Opus 5 / Fable. Mandar o parâmetro para o
 * Sonnet 5 devolve 400, então ele entra apenas quando o modelo aceita.
 */
const MODELOS_COM_FALLBACK = new Set([
  "claude-opus-5",
  "claude-fable-5",
  "claude-mythos-5",
]);

export function extrasDeFallback() {
  if (!MODELOS_COM_FALLBACK.has(MODELO)) return {};
  return {
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default" as const,
  };
}

/**
 * Preço por milhão de tokens, em dólares. Uso a tabela cheia de propósito: o
 * Sonnet 5 está com preço promocional mais baixo até 31/08/2026, então o número
 * registrado aqui é o teto, nunca uma surpresa para cima.
 */
const PRECOS: Record<string, { entrada: number; saida: number }> = {
  "claude-sonnet-5": { entrada: 3, saida: 15 },
  "claude-opus-5": { entrada: 5, saida: 25 },
  "claude-haiku-4-5": { entrada: 1, saida: 5 },
};

interface UsoBruto {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
}

/**
 * Registra no console do servidor quanto custou a chamada. É a forma honesta de
 * saber o gasto real: a cobrança da Anthropic é por token, não por "crédito".
 */
export function registrarCusto(etiqueta: string, uso: UsoBruto, segundos: number) {
  const preco = PRECOS[MODELO] ?? PRECOS["claude-opus-5"];
  const entrada = uso.input_tokens + (uso.cache_read_input_tokens ?? 0);
  const custo =
    (entrada / 1_000_000) * preco.entrada +
    (uso.output_tokens / 1_000_000) * preco.saida;
  console.log(
    `[${etiqueta}] ${MODELO}/${ESFORCO} · ${segundos.toFixed(0)}s · entrada ${entrada} tokens · saída ${uso.output_tokens} tokens · US$ ${custo.toFixed(4)}`,
  );
  return custo;
}

export class ErroConfiguracao extends Error {}

/** Cliente da Anthropic. Só pode ser usado em código de servidor. */
export function clienteAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ErroConfiguracao(
      "ANTHROPIC_API_KEY não configurada. Crie o arquivo .env.local com a chave e reinicie o servidor.",
    );
  }
  return new Anthropic({ apiKey });
}
