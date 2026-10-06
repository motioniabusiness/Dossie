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

/**
 * Traduz qualquer falha de uma chamada à IA em mensagem para a tela e status
 * HTTP. Fica num lugar só para as três rotas falarem a mesma língua.
 *
 * O caso que mais importa: créditos esgotados. A API devolve um 400 genérico,
 * e sem tradução o jogador via "Falha na API (400)" sem saber o que fazer.
 */
export function erroDaIA(
  e: unknown,
  etiqueta: string,
): { mensagem: string; status: number } {
  if (e instanceof ErroConfiguracao) return { mensagem: e.message, status: 500 };

  if (e instanceof Anthropic.APIError) {
    const texto = `${e.message} ${JSON.stringify(e.error ?? "")}`;
    if (/credit balance|billing|purchase credits/i.test(texto)) {
      console.error(`[${etiqueta}] créditos esgotados`);
      return {
        mensagem:
          "Os créditos da IA acabaram. Recarregue em console.anthropic.com, na área de Billing, e tente de novo.",
        status: 402,
      };
    }
    if (e instanceof Anthropic.RateLimitError) {
      return { mensagem: "Muitas chamadas seguidas à IA. Aguarde um instante e tente de novo.", status: 429 };
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return { mensagem: "A chave da IA foi recusada. Confira a ANTHROPIC_API_KEY.", status: 401 };
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return { mensagem: "Sem conexão com a IA agora. Tente de novo.", status: 503 };
    }
    if (e.status === 529 || e.status === 503) {
      return { mensagem: "A IA está sobrecarregada neste momento. Tente de novo em instantes.", status: 503 };
    }
    // Sem isto no log, um 400 de parâmetro fica indistinguível de um 400 de conteúdo.
    console.error(`[${etiqueta}] APIError ${e.status}: ${e.message}`);
    return { mensagem: `A IA respondeu com erro (${e.status}). Tente de novo.`, status: 502 };
  }

  console.error(`[${etiqueta}] erro inesperado:`, e);
  return { mensagem: "Erro inesperado. Tente de novo.", status: 500 };
}

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
