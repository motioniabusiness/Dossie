import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
// Tempo máximo da função na Vercel, em segundos.
export const maxDuration = 30;

/**
 * Converte a fala de um suspeito em áudio usando a Azure Speech, que tem vozes
 * neurais muito melhores que as do navegador.
 *
 * A chave nunca chega ao cliente: o navegador pede o áudio aqui e recebe um
 * MP3 pronto. Sem chave configurada, a rota devolve 503 e o jogo cai sozinho na
 * voz do navegador.
 */

const EsquemaPedido = z.object({
  texto: z.string().min(1).max(2000),
  genero: z.enum(["masculino", "feminino"]),
  /** Define qual voz da lista e a variação de tom. Mesmo nome, mesma voz. */
  nome: z.string().min(1),
});

/**
 * Vozes neurais em português do Brasil. Se a Azure recusar alguma (o catálogo
 * muda de tempos em tempos), a rota repete o pedido com a voz padrão.
 */
const VOZES = {
  masculino: [
    "pt-BR-AntonioNeural",
    "pt-BR-DonatoNeural",
    "pt-BR-FabioNeural",
    "pt-BR-HumbertoNeural",
    "pt-BR-JulioNeural",
    "pt-BR-NicolauNeural",
    "pt-BR-ValerioNeural",
  ],
  feminino: [
    "pt-BR-FranciscaNeural",
    "pt-BR-BrendaNeural",
    "pt-BR-ElzaNeural",
    "pt-BR-GiovannaNeural",
    "pt-BR-LeilaNeural",
    "pt-BR-LeticiaNeural",
    "pt-BR-ManuelaNeural",
    "pt-BR-YaraNeural",
  ],
} as const;

const PADRAO = {
  masculino: "pt-BR-AntonioNeural",
  feminino: "pt-BR-FranciscaNeural",
} as const;

function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function escaparXml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function montarSsml(texto: string, voz: string, s: number) {
  // Variação pequena e determinística, para dois suspeitos não soarem iguais.
  const velocidade = -8 + (s % 9); // de -8% a 0%
  const tom = -6 + (Math.floor(s / 9) % 13); // de -6% a +6%
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR"><voice name="${voz}"><prosody rate="${velocidade}%" pitch="${tom}%">${escaparXml(texto)}</prosody></voice></speak>`;
}

async function pedirAudio(ssml: string, chave: string, regiao: string) {
  return fetch(
    `https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": chave,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "dossie-duelo",
      },
      body: ssml,
    },
  );
}

export async function POST(req: Request) {
  const chave = process.env.AZURE_SPEECH_KEY;
  const regiao = process.env.AZURE_SPEECH_REGION;

  if (!chave || !regiao) {
    // Não é erro: só significa que o jogo deve usar a voz do navegador.
    return NextResponse.json(
      { erro: "Voz por servidor não configurada." },
      { status: 503 },
    );
  }

  let pedido: z.infer<typeof EsquemaPedido>;
  try {
    pedido = EsquemaPedido.parse(await req.json());
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  const s = semente(pedido.nome);
  const lista = VOZES[pedido.genero];
  const voz = lista[s % lista.length];

  try {
    let resposta = await pedirAudio(
      montarSsml(pedido.texto, voz, s),
      chave,
      regiao,
    );

    // Voz recusada ou aposentada: tenta de novo com a padrão do gênero.
    if (!resposta.ok && voz !== PADRAO[pedido.genero]) {
      console.warn(`[voz] ${voz} recusada (${resposta.status}), usando a padrão`);
      resposta = await pedirAudio(
        montarSsml(pedido.texto, PADRAO[pedido.genero], s),
        chave,
        regiao,
      );
    }

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => "");
      console.error(`[voz] Azure ${resposta.status}: ${detalhe.slice(0, 300)}`);
      return NextResponse.json(
        { erro: `A Azure recusou o pedido (${resposta.status}).` },
        { status: 502 },
      );
    }

    const audio = await resposta.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[voz] falha ao falar com a Azure:", e);
    return NextResponse.json(
      { erro: "Não foi possível gerar o áudio." },
      { status: 502 },
    );
  }
}
