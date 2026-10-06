import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sessão de acesso ao jogo publicado. Quem acerta a senha recebe um cookie com
 * uma assinatura derivada dela; o Proxy só confere a assinatura.
 *
 * A senha nunca vai para o cookie. E como a assinatura depende da senha, trocar
 * SENHA_ACESSO na Vercel derruba na hora todas as sessões abertas.
 */

export const COOKIE_ACESSO = "dossie_acesso";
/** Trinta dias: no celular ninguém quer digitar senha a cada partida. */
export const DURACAO_ACESSO_S = 60 * 60 * 24 * 30;

export function senhaConfigurada(): string | null {
  return process.env.SENHA_ACESSO || null;
}

/** Assinatura que vai no cookie. Mesma senha, mesma assinatura. */
export function assinaturaDeAcesso(senha: string): string {
  return createHmac("sha256", senha).update("dossie-acesso-v1").digest("hex");
}

/** Comparação em tempo constante, para não vazar nada pelo relógio. */
export function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function cookieValido(valor: string | undefined): boolean {
  const senha = senhaConfigurada();
  if (!senha || !valor) return false;
  return iguais(valor, assinaturaDeAcesso(senha));
}
