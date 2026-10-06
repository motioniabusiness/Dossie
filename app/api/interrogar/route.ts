import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ESFORCO,
  erroDaIA,
  MODELO,
  clienteAnthropic,
  extrasDeFallback,
  registrarCusto,
} from "@/lib/servidor/anthropic";
import {
  SISTEMA_INTERROGATORIO,
  mensagemInterrogatorio,
} from "@/lib/servidor/promptInterrogatorio";
import { abrir } from "@/lib/servidor/selo";
import type { CasoPublico, SolucaoSecreta } from "@/lib/tipos";

export const runtime = "nodejs";
// Tempo máximo da função na Vercel, em segundos.
export const maxDuration = 60;

const EsquemaPedido = z.object({
  solucaoSelada: z.string().min(1),
  /** O caso público volta do cliente: o servidor não guarda estado entre chamadas. */
  caso: z.object({
    titulo: z.string(),
    contexto: z.string(),
    suspeitos: z.array(z.record(z.string(), z.unknown())),
    pistas: z.array(z.record(z.string(), z.unknown())),
  }),
  suspeito: z.string().min(1),
  pergunta: z.string().min(3).max(500),
  anteriores: z
    .array(z.object({ pergunta: z.string(), resposta: z.string() }))
    .max(10)
    .default([]),
});

/** Resposta curta: duas a cinco frases mais o raciocínio do modelo. */
const MAX_TOKENS = 2000;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function POST(req: Request) {
  let pedido: z.infer<typeof EsquemaPedido>;
  try {
    pedido = EsquemaPedido.parse(await req.json());
  } catch {
    return erro("Pergunta inválida.", 400);
  }

  let solucao: SolucaoSecreta;
  try {
    solucao = abrir<SolucaoSecreta>(pedido.solucaoSelada);
  } catch {
    return erro("Não foi possível abrir os autos deste caso.", 400);
  }

  const caso = pedido.caso as unknown as CasoPublico;
  const suspeito = caso.suspeitos.find((s) => s.nome === pedido.suspeito);
  if (!suspeito) {
    return erro("Esse suspeito não está neste caso.", 400);
  }

  try {
    const cliente = clienteAnthropic();
    const inicio = Date.now();

    const resposta = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      ...extrasDeFallback(),
      system: SISTEMA_INTERROGATORIO,
      output_config: { effort: ESFORCO },
      messages: [
        {
          role: "user",
          content: mensagemInterrogatorio(
            caso,
            solucao,
            suspeito,
            pedido.pergunta,
            pedido.anteriores,
          ),
        },
      ],
    });

    registrarCusto(
      `interrogar ${pedido.suspeito}`,
      resposta.usage,
      (Date.now() - inicio) / 1000,
    );

    if (resposta.stop_reason === "refusal") {
      return erro("O suspeito se recusou a responder isso.", 502);
    }

    const texto = resposta.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!texto) {
      return erro("O suspeito ficou calado. Tente perguntar de outro jeito.", 502);
    }

    return NextResponse.json({ resposta: texto });
  } catch (e) {
    const { mensagem, status } = erroDaIA(e, "interrogar");
    return erro(mensagem, status);
  }
}
