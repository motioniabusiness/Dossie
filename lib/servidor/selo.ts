import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * "Selo": embrulho autenticado (AES-256-GCM) para dados que precisam ir até o
 * cliente e voltar sem que ele consiga ler — no nosso caso a `solucaoSecreta`.
 *
 * Por que não simplesmente guardar a solução em memória no servidor: a v1 não
 * tem banco, e memória de processo morre a cada reinício do dev server (e não
 * existe entre instâncias em produção). O selo resolve os dois casos: o cliente
 * carrega um blob opaco e a rota de julgamento o abre com a chave do servidor.
 */

const SAL = "dossie-duelo:selo:v1";
const TAMANHO_IV = 12;
const TAMANHO_TAG = 16;

let chaveEmCache: Buffer | null = null;

function chave(): Buffer {
  if (chaveEmCache) return chaveEmCache;
  // Sem segredo dedicado, deriva da própria chave da API — que já é o segredo
  // do servidor. Defina SEGREDO_SELO no .env.local se preferir separar os dois.
  const segredo = process.env.SEGREDO_SELO ?? process.env.ANTHROPIC_API_KEY;
  if (!segredo) {
    throw new Error("Nenhum segredo disponível para selar a solução do caso.");
  }
  chaveEmCache = scryptSync(segredo, SAL, 32);
  return chaveEmCache;
}

export function selar(dados: unknown): string {
  const iv = randomBytes(TAMANHO_IV);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const corpo = Buffer.concat([
    cifra.update(JSON.stringify(dados), "utf8"),
    cifra.final(),
  ]);
  return Buffer.concat([iv, cifra.getAuthTag(), corpo]).toString("base64url");
}

/** Lança se o selo foi adulterado, truncado ou gerado com outro segredo. */
export function abrir<T>(selo: string): T {
  const bruto = Buffer.from(selo, "base64url");
  if (bruto.length <= TAMANHO_IV + TAMANHO_TAG) {
    throw new Error("Selo inválido.");
  }
  const decifra = createDecipheriv(
    "aes-256-gcm",
    chave(),
    bruto.subarray(0, TAMANHO_IV),
  );
  decifra.setAuthTag(bruto.subarray(TAMANHO_IV, TAMANHO_IV + TAMANHO_TAG));
  const texto = Buffer.concat([
    decifra.update(bruto.subarray(TAMANHO_IV + TAMANHO_TAG)),
    decifra.final(),
  ]).toString("utf8");
  return JSON.parse(texto) as T;
}
