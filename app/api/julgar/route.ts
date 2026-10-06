import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ESFORCO,
  ErroConfiguracao,
  MODELO,
  clienteAnthropic,
  extrasDeFallback,
  registrarCusto,
} from "@/lib/servidor/anthropic";
import {
  EsquemaJulgamento,
  EsquemaJulgamentoCooperativo,
  SISTEMA_JUIZ,
  SISTEMA_JUIZ_COOPERATIVO,
  mensagemJuiz,
  mensagemJuizCooperativo,
} from "@/lib/servidor/promptJulgamento";
import { abrir } from "@/lib/servidor/selo";
import type { Julgamento, SolucaoSecreta } from "@/lib/tipos";

export const runtime = "nodejs";
// Tempo máximo da função na Vercel, em segundos.
export const maxDuration = 120;

const EsquemaPedido = z.object({
  /** Solução cifrada devolvida por /api/gerar-caso. */
  solucaoSelada: z.string().min(1),
  modo: z.enum(["duelo", "cooperativo"]).default("duelo"),
  teoria1: z.string().min(1),
  /** Ausente no modo cooperativo: lá existe uma teoria só. */
  teoria2: z.string().default(""),
});

const MAX_TOKENS = 8000;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ erro: mensagem }, { status });
}

/** Notas fora de 0–100 seriam exibidas como barra quebrada. */
function nota(valor: number) {
  return Math.max(0, Math.min(100, Math.round(valor)));
}

export async function POST(req: Request) {
  let pedido: z.infer<typeof EsquemaPedido>;
  try {
    pedido = EsquemaPedido.parse(await req.json());
  } catch {
    return erro("Pedido de julgamento inválido.", 400);
  }

  let solucao: SolucaoSecreta;
  try {
    solucao = abrir<SolucaoSecreta>(pedido.solucaoSelada);
  } catch {
    // Selo adulterado, truncado, ou gerado com outro segredo (ex.: chave trocada).
    return erro(
      "A solução deste caso não pôde ser aberta. Comece um caso novo.",
      400,
    );
  }

  const cooperativo = pedido.modo === "cooperativo";

  try {
    const cliente = clienteAnthropic();
    const inicio = Date.now();

    const resposta = await cliente.beta.messages.parse({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      ...extrasDeFallback(),
      system: cooperativo ? SISTEMA_JUIZ_COOPERATIVO : SISTEMA_JUIZ,
      output_config: {
        effort: ESFORCO,
        format: betaZodOutputFormat(
          cooperativo ? EsquemaJulgamentoCooperativo : EsquemaJulgamento,
        ),
      },
      messages: [
        {
          role: "user",
          content: cooperativo
            ? mensagemJuizCooperativo(solucao, pedido.teoria1.slice(0, 8000))
            : mensagemJuiz(
                solucao,
                pedido.teoria1.slice(0, 6000),
                pedido.teoria2.slice(0, 6000),
              ),
        },
      ],
    });

    registrarCusto(
      `julgar ${pedido.modo}`,
      resposta.usage,
      (Date.now() - inicio) / 1000,
    );

    if (resposta.stop_reason === "refusal") {
      return erro("O júri recusou avaliar este caso.", 502);
    }

    const bruto = resposta.parsed_output;
    if (!bruto) {
      return erro("O júri não conseguiu fechar o veredito. Tente de novo.", 502);
    }

    let julgamento: Julgamento;

    if ("dupla" in bruto) {
      julgamento = {
        modo: "cooperativo",
        dupla: { ...bruto.dupla, nota: nota(bruto.dupla.nota) },
      };
    } else {
      const nota1 = nota(bruto.jogador1.nota);
      const nota2 = nota(bruto.jogador2.nota);
      julgamento = {
        modo: "duelo",
        jogador1: { ...bruto.jogador1, nota: nota1 },
        jogador2: { ...bruto.jogador2, nota: nota2 },
        // Deriva o vencedor das notas: se o modelo se contradissesse, a tela
        // mostraria um vencedor com nota menor.
        vencedor:
          nota1 === nota2 ? "empate" : nota1 > nota2 ? "jogador1" : "jogador2",
      };
    }

    // A solução só é revelada agora, junto do resultado.
    return NextResponse.json({ julgamento, solucao });
  } catch (e) {
    if (e instanceof ErroConfiguracao) return erro(e.message, 500);
    if (e instanceof Anthropic.RateLimitError) {
      return erro("Limite de uso da API atingido. Tente de novo em instantes.", 429);
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return erro("A chave da API foi recusada. Confira o .env.local.", 401);
    }
    if (e instanceof Anthropic.APIConnectionError) {
      return erro("Sem conexão com a API da Anthropic.", 503);
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`[julgar] APIError ${e.status}: ${e.message}`);
      return erro(`Falha na API (${e.status}). Tente de novo.`, 502);
    }
    console.error("[julgar] erro inesperado:", e);
    return erro("Erro inesperado ao julgar as teorias.", 500);
  }
}
