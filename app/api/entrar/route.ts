import { NextResponse } from "next/server";
import {
  COOKIE_ACESSO,
  DURACAO_ACESSO_S,
  assinaturaDeAcesso,
  iguais,
  senhaConfigurada,
} from "@/lib/servidor/acesso";

export const runtime = "nodejs";

/**
 * Confere a senha da tela /entrar e, se bater, abre a sessão num cookie que o
 * JavaScript da página não consegue ler.
 */
export async function POST(req: Request) {
  const senha = senhaConfigurada();
  if (!senha) {
    return NextResponse.json(
      { erro: "Jogo sem senha configurada." },
      { status: 503 },
    );
  }

  let tentativa = "";
  try {
    const corpo: unknown = await req.json();
    if (corpo && typeof corpo === "object" && "senha" in corpo) {
      tentativa = String(corpo.senha ?? "");
    }
  } catch {
    // Corpo inválido conta como senha errada.
  }

  if (!iguais(tentativa, senha)) {
    // Uma pausa a cada erro deixa tentativa por força bruta impraticável.
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
  }

  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set({
    name: COOKIE_ACESSO,
    value: assinaturaDeAcesso(senha),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_ACESSO_S,
  });
  return resposta;
}
