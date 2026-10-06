import { NextResponse } from "next/server";
import {
  SalaIndisponivel,
  armazem,
  codigoValido,
} from "@/lib/servidor/salas";

export const runtime = "nodejs";

/**
 * Ações que um aparelho pode publicar na sala. HIDRATAR fica de fora: ela
 * substitui o estado inteiro e só faz sentido dentro de um aparelho.
 */
const PERMITIDAS = new Set([
  "CONVIDADO_ENTROU",
  "DEFINIR_JOGADORES",
  "DEFINIR_CONFIG",
  "DEFINIR_CASO",
  "GUARDAR_CASO_PREPARADO",
  "REGISTRAR_INTERROGATORIO",
  "INICIAR_TEMPO",
  "ABRIR_PISTA",
  "PULAR_CASO",
  "IR_PARA",
  "DEFINIR_TEORIA",
  "DEFINIR_JULGAMENTO",
  "NOVA_PARTIDA",
  "REINICIAR",
]);

/** Um caso inteiro com a solução selada cabe folgado nisto. */
const TAMANHO_MAXIMO = 300_000;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

async function tratar<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SalaIndisponivel) {
      console.error("[sala]", e.message);
      return erro("A sala está fora do ar agora.", 503);
    }
    throw e;
  }
}

/** Lê as ações a partir da posição `desde`. É a consulta repetida dos dois aparelhos. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const codigo = (await params).codigo.toUpperCase();
  if (!codigoValido(codigo)) return erro("Código de sala inválido.", 400);

  const desde = Math.max(
    0,
    Number.parseInt(new URL(req.url).searchParams.get("desde") ?? "0", 10) || 0,
  );

  return tratar(async () => {
    const salas = armazem();
    const acoes = await salas.ler(codigo, desde);
    if (desde === 0 && acoes.length === 0 && !(await salas.existe(codigo))) {
      return erro("Sala não encontrada. Confira o código.", 404);
    }
    return NextResponse.json(
      { desde, acoes: acoes.map((a) => JSON.parse(a) as unknown) },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

/** Publica uma ação e devolve tudo o que chegou desde `desde`, incluindo ela. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const codigo = (await params).codigo.toUpperCase();
  if (!codigoValido(codigo)) return erro("Código de sala inválido.", 400);

  const texto = await req.text();
  if (texto.length > TAMANHO_MAXIMO) return erro("Ação grande demais.", 413);

  let corpo: { acao?: { tipo?: unknown }; desde?: unknown };
  try {
    corpo = JSON.parse(texto) as typeof corpo;
  } catch {
    return erro("Pedido inválido.", 400);
  }

  const acao = corpo.acao;
  if (!acao || typeof acao.tipo !== "string" || !PERMITIDAS.has(acao.tipo)) {
    return erro("Ação não permitida.", 400);
  }
  const desde =
    typeof corpo.desde === "number" && corpo.desde >= 0 ? corpo.desde : 0;

  return tratar(async () => {
    const salas = armazem();
    if (!(await salas.existe(codigo))) {
      return erro("Esta sala expirou ou não existe mais.", 404);
    }
    await salas.anexar(codigo, JSON.stringify(acao));
    const acoes = await salas.ler(codigo, desde);
    return NextResponse.json({
      desde,
      acoes: acoes.map((a) => JSON.parse(a) as unknown),
    });
  });
}
