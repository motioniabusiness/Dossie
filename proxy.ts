import { NextResponse, type NextRequest } from "next/server";

/**
 * Porteiro do jogo publicado. Cada caso gerado gasta créditos da Anthropic,
 * então ninguém passa daqui sem a senha de SENHA_ACESSO.
 *
 * Uso a autenticação básica do próprio navegador: ele pede a senha uma vez,
 * guarda enquanto a aba estiver aberta e a reenvia sozinho em toda chamada,
 * inclusive nos `fetch` para /api. O campo de usuário é ignorado.
 *
 * Sem a variável definida: em desenvolvimento passa direto; publicado, fecha a
 * porta, para um esquecimento na configuração não abrir as rotas pagas.
 */
export function proxy(request: NextRequest) {
  const senha = process.env.SENHA_ACESSO;

  if (!senha) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Jogo sem senha configurada (SENHA_ACESSO).", {
      status: 503,
    });
  }

  const cabecalho = request.headers.get("authorization") ?? "";
  if (cabecalho.startsWith("Basic ")) {
    try {
      // "usuario:senha". A senha pode conter ":", então corto só no primeiro.
      const credenciais = atob(cabecalho.slice(6));
      const recebida = credenciais.slice(credenciais.indexOf(":") + 1);
      if (iguais(recebida, senha)) return NextResponse.next();
    } catch {
      // Cabeçalho malformado: cai no pedido de senha abaixo.
    }
  }

  return new NextResponse("Senha necessária.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dossie", charset="UTF-8"',
    },
  });
}

/** Comparação em tempo constante, para não vazar a senha pelo relógio. */
function iguais(a: string, b: string) {
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diferenca |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diferenca === 0;
}

export const config = {
  // Tudo, menos os arquivos internos de build, que não têm nada de sensível.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
