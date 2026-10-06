/**
 * Salas do modo à distância.
 *
 * Uma sala não guarda o estado do jogo: guarda a lista de ações da partida, na
 * ordem em que aconteceram. O redutor do jogo é puro, então cada aparelho que
 * reaplica a mesma lista chega exatamente ao mesmo estado. Isso dispensa
 * qualquer lógica de jogo aqui no servidor e resolve sozinho o caso de os dois
 * agirem ao mesmo tempo: o Redis enfileira e a ordem vale para os dois.
 *
 * Armazenamento: Redis da Upstash pela API REST (criado na aba Storage da
 * Vercel). Sem as variáveis, em desenvolvimento usa a memória do processo, que
 * basta para testar com duas abas; publicado, recusa, porque na Vercel cada
 * chamada pode cair numa máquina diferente.
 */

/** Uma sala esquecida some sozinha depois de um dia. */
const VALIDADE_S = 60 * 60 * 24;
/** Sem 0/O e 1/I: o código é lido em voz alta numa ligação. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class SalaIndisponivel extends Error {}

interface Armazem {
  criar(codigo: string): Promise<boolean>;
  existe(codigo: string): Promise<boolean>;
  anexar(codigo: string, acao: string): Promise<number>;
  ler(codigo: string, desde: number): Promise<string[]>;
}

// ---------- Upstash (produção) ----------

function credenciaisRedis() {
  // A integração da Vercel cria as KV_*; quem cria direto na Upstash recebe
  // as UPSTASH_*. Aceito as duas.
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

function armazemUpstash(url: string, token: string): Armazem {
  /** Vários comandos numa ida só, na ordem. */
  async function pipeline(comandos: (string | number)[][]) {
    const resposta = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comandos),
      cache: "no-store",
    });
    if (!resposta.ok) {
      throw new SalaIndisponivel(`Redis respondeu ${resposta.status}`);
    }
    const corpo = (await resposta.json()) as {
      result?: unknown;
      error?: string;
    }[];
    const falha = corpo.find((r) => r.error);
    if (falha) throw new SalaIndisponivel(falha.error);
    return corpo.map((r) => r.result);
  }

  const chave = (codigo: string) => `sala:${codigo}`;
  const lista = (codigo: string) => `sala:${codigo}:acoes`;

  return {
    async criar(codigo) {
      // NX: se o código sorteado já existir, não sobrescreve a sala de alguém.
      const [ok] = await pipeline([
        ["SET", chave(codigo), String(Date.now()), "NX", "EX", VALIDADE_S],
      ]);
      return ok === "OK";
    },
    async existe(codigo) {
      const [n] = await pipeline([["EXISTS", chave(codigo)]]);
      return n === 1;
    },
    async anexar(codigo, acao) {
      const [total] = await pipeline([
        ["RPUSH", lista(codigo), acao],
        ["EXPIRE", lista(codigo), VALIDADE_S],
        ["EXPIRE", chave(codigo), VALIDADE_S],
      ]);
      return Number(total);
    },
    async ler(codigo, desde) {
      const [itens] = await pipeline([["LRANGE", lista(codigo), desde, -1]]);
      return (itens as string[] | null) ?? [];
    },
  };
}

// ---------- Memória (só desenvolvimento) ----------

const globalComSalas = globalThis as unknown as {
  __salasDossie?: Map<string, string[]>;
};

function armazemMemoria(): Armazem {
  const salas = (globalComSalas.__salasDossie ??= new Map());
  return {
    async criar(codigo) {
      if (salas.has(codigo)) return false;
      salas.set(codigo, []);
      return true;
    },
    async existe(codigo) {
      return salas.has(codigo);
    },
    async anexar(codigo, acao) {
      const acoes = salas.get(codigo) ?? [];
      acoes.push(acao);
      salas.set(codigo, acoes);
      return acoes.length;
    },
    async ler(codigo, desde) {
      return (salas.get(codigo) ?? []).slice(desde);
    },
  };
}

export function armazem(): Armazem {
  const credenciais = credenciaisRedis();
  if (credenciais) return armazemUpstash(credenciais.url, credenciais.token);
  if (process.env.NODE_ENV !== "production") return armazemMemoria();
  throw new SalaIndisponivel(
    "Modo à distância sem banco configurado (Upstash Redis).",
  );
}

export function sortearCodigo(): string {
  let codigo = "";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  for (const b of bytes) codigo += ALFABETO[b % ALFABETO.length];
  return codigo;
}

export function codigoValido(codigo: string): boolean {
  return new RegExp(`^[${ALFABETO}]{4}$`).test(codigo);
}
