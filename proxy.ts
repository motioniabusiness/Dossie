import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_ACESSO,
  cookieValido,
  senhaConfigurada,
} from "@/lib/servidor/acesso";

/**
 * Porteiro do jogo publicado. Cada caso gerado gasta créditos da Anthropic,
 * então nada passa daqui sem a sessão aberta na tela /entrar.
 *
 * Página sem sessão vai para /entrar; chamada de API sem sessão recebe 401.
 *
 * Sem SENHA_ACESSO: em desenvolvimento passa direto; publicado, fecha a porta,
 * para um esquecimento na configuração não abrir as rotas pagas.
 */

/** O que precisa abrir sem sessão: a própria tela de entrada e quem a atende. */
const LIVRES = ["/entrar", "/api/entrar"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!senhaConfigurada()) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Jogo sem senha configurada (SENHA_ACESSO).", {
      status: 503,
    });
  }

  const liberado = cookieValido(request.cookies.get(COOKIE_ACESSO)?.value);

  if (LIVRES.includes(pathname)) {
    // Quem já entrou e abre /entrar de novo vai direto para o jogo.
    if (liberado && pathname === "/entrar") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (liberado) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { erro: "Sessão expirada. Recarregue a página e entre de novo." },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  // Fica de fora o que não tem nada de sensível e que a tela de entrada usa:
  // arquivos de build, imagens, fontes e a trilha.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|mp3|woff2?)$).*)",
  ],
};
