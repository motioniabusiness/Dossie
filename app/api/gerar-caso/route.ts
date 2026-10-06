import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { randomUUID } from "node:crypto";
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
  type CasoIA,
  EsquemaCasoIA,
  SISTEMA,
  conciliarCulpado,
  mensagemUsuario,
  problemaNoCaso,
} from "@/lib/servidor/promptCaso";
import { selar } from "@/lib/servidor/selo";
import type { CasoPublico, Pista } from "@/lib/tipos";

// `node:crypto` (selo) exige runtime Node, não Edge.
export const runtime = "nodejs";
// Tempo máximo da função na Vercel, em segundos.
export const maxDuration = 300;

const EsquemaPedido = z.object({
  categoria: z.enum([
    "furto_roubo",
    "assassinato",
    "fraude",
    "desaparecimento",
  ]),
  minutos: z.number().int().min(10).max(180),
  dificuldade: z.enum(["facil", "medio", "dificil"]).default("medio"),
  /** Resumos dos casos já vistos na sessão, para a IA não repetir. */
  resumosVistos: z.array(z.string()).default([]),
});

/** Teto generoso: o modelo pensa antes de escrever, e o limite cobre os dois. */
const MAX_TOKENS = 16000;

/**
 * Quantas vezes tentar. O structured output garante o formato, mas não o
 * conteúdo: já vimos o modelo devolver um caso com as listas de suspeitos e
 * pistas vazias. Nesse caso a partida seria injogável — melhor refazer.
 */
const TENTATIVAS = 2;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function POST(req: Request) {
  let pedido: z.infer<typeof EsquemaPedido>;
  try {
    pedido = EsquemaPedido.parse(await req.json());
  } catch {
    return erro("Pedido inválido: categoria ou tempo fora do esperado.", 400);
  }

  try {
    const cliente = clienteAnthropic();
    const conteudo = mensagemUsuario(
      pedido.categoria,
      pedido.minutos,
      pedido.dificuldade,
      // Limita o histórico para não inflar o prompt em sessões longas.
      pedido.resumosVistos.slice(-15).map((r) => r.slice(0, 300)),
    );

    let casoIA: CasoIA | null = null;

    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      const inicio = Date.now();
      const resposta = await cliente.beta.messages.parse({
        model: MODELO,
        max_tokens: MAX_TOKENS,
        ...extrasDeFallback(),
        system: SISTEMA,
        output_config: {
          effort: ESFORCO,
          format: betaZodOutputFormat(EsquemaCasoIA),
        },
        messages: [{ role: "user", content: conteudo }],
      });

      registrarCusto(
        `gerar-caso ${pedido.categoria}/${pedido.dificuldade}`,
        resposta.usage,
        (Date.now() - inicio) / 1000,
      );

      if (resposta.stop_reason === "refusal") {
        return erro(
          "O modelo recusou este pedido. Tente outra categoria ou gere novamente.",
          502,
        );
      }

      const candidato = resposta.parsed_output
        ? conciliarCulpado(resposta.parsed_output)
        : null;
      const problema = !candidato
        ? "a resposta não pôde ser lida"
        : resposta.stop_reason === "max_tokens"
          ? "a resposta foi cortada no limite de tokens"
          : problemaNoCaso(candidato);

      if (!problema && candidato) {
        casoIA = candidato;
        break;
      }
      console.warn(
        `[gerar-caso] tentativa ${tentativa}/${TENTATIVAS} descartada: ${problema}`,
      );
    }

    if (!casoIA) {
      return erro(
        "O caso veio incompleto duas vezes seguidas. Tente de novo.",
        502,
      );
    }

    // IDs de pista são nossos: garantem unicidade e a ordem exibida no quadro.
    const pistas: Pista[] = casoIA.pistas.map((p, i) => ({
      id: `p${i + 1}`,
      titulo: p.titulo,
      tipo: p.tipo,
      conteudo: p.conteudo,
      legendaFoto: p.legendaFoto.trim() ? p.legendaFoto : undefined,
    }));

    const caso: CasoPublico = {
      id: randomUUID(),
      titulo: casoIA.titulo,
      categoria: pedido.categoria,
      contexto: casoIA.contexto,
      resumo: casoIA.resumo,
      suspeitos: casoIA.suspeitos,
      pistas,
    };

    // A solução vai lacrada: o cliente a carrega sem poder ler, e devolve
    // no /api/julgar (Fase 5), onde o servidor a abre.
    return NextResponse.json({
      caso,
      solucaoSelada: selar(casoIA.solucaoSecreta),
    });
  } catch (e) {
    const { mensagem, status } = erroDaIA(e, "gerar-caso");
    return erro(mensagem, status);
  }
}
