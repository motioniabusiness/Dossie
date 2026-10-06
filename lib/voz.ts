/**
 * Fala dos suspeitos, usando a síntese de voz do próprio navegador
 * (Web Speech API). Não custa nada, não precisa de chave e não sai da máquina.
 *
 * A voz é escolhida pelo gênero do personagem, e o tom e a velocidade variam
 * um pouco conforme o nome, para dois suspeitos do mesmo gênero não soarem
 * idênticos.
 */

export type GeneroVoz = "masculino" | "feminino";

/**
 * Nomes das vozes em português nos sistemas e navegadores mais usados,
 * incluindo as neurais da Microsoft (as "Natural"/"Online", bem melhores que
 * as antigas Maria e Daniel).
 */
const FEMININAS =
  /maria|francisca|thalita|brenda|elza|giovanna|leila|let[ií]cia|manuela|yara|luciana|camila|helo[ií]sa|vit[oó]ria|joana|catarina|fernanda|raquel|in[eê]s|female|mulher/i;
const MASCULINAS =
  /daniel|ant[oó]nio|donato|f[aá]bio|humberto|julio|j[uú]lio|nicolau|val[eé]rio|ricardo|felipe|jo[aã]o|duarte|male|homem/i;

/**
 * Vozes neurais soam muito mais humanas que as antigas SAPI. O Edge expõe as
 * "Online (Natural)" de graça; o Windows 11 permite instalar as "Natural"
 * locais. Quando existir uma dessas, ela ganha.
 */
const NEURAL = /natural|neural|online|google|premium|enhanced|siri/i;

let vozesEmCache: SpeechSynthesisVoice[] = [];

export function suportaVoz(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * As vozes chegam de forma assíncrona no Chrome: na primeira chamada a lista
 * costuma vir vazia e só depois o navegador dispara `voiceschanged`.
 */
export function carregarVozes(): Promise<SpeechSynthesisVoice[]> {
  if (!suportaVoz()) return Promise.resolve([]);

  const agora = window.speechSynthesis.getVoices();
  if (agora.length > 0) {
    vozesEmCache = agora;
    return Promise.resolve(agora);
  }

  return new Promise((resolve) => {
    const aoCarregar = () => {
      vozesEmCache = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener("voiceschanged", aoCarregar);
      resolve(vozesEmCache);
    };
    window.speechSynthesis.addEventListener("voiceschanged", aoCarregar);
    // Rede de segurança: alguns navegadores nunca disparam o evento.
    setTimeout(aoCarregar, 1200);
  });
}

function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function escolherVoz(genero: GeneroVoz, nome: string) {
  const emPortugues = vozesEmCache.filter((v) => v.lang.startsWith("pt"));
  const candidatas = emPortugues.length > 0 ? emPortugues : vozesEmCache;
  if (candidatas.length === 0) return undefined;

  const doGenero = candidatas.filter((v) =>
    genero === "feminino"
      ? FEMININAS.test(v.name)
      : MASCULINAS.test(v.name) || !FEMININAS.test(v.name),
  );
  const lista = doGenero.length > 0 ? doGenero : candidatas;

  // Entre as do gênero certo, fica só com as neurais quando houver alguma.
  const neurais = lista.filter((v) => NEURAL.test(v.name));
  const finais = neurais.length > 0 ? neurais : lista;

  return finais[semente(nome) % finais.length];
}

/** Existe alguma voz neural instalada? Usado para avisar quando não há. */
export function temVozNatural(): boolean {
  return vozesEmCache.some(
    (v) => v.lang.startsWith("pt") && NEURAL.test(v.name),
  );
}

export interface OpcoesDeFala {
  genero: GeneroVoz;
  /** Nome do suspeito: define a voz e a variação de tom. */
  nome: string;
  onFim?: () => void;
}

/** Como a fala saiu, para a interface saber se ainda está na voz robótica. */
export type OrigemDaFala = "servidor" | "navegador" | "nenhum";

/** Áudio vindo do servidor, guardado para poder ser interrompido. */
let audioDoServidor: HTMLAudioElement | null = null;
/**
 * Uma vez que a rota responde 503 (sem chave da Azure configurada), não vale
 * insistir a cada resposta: passa a usar direto a voz do navegador.
 */
let servidorIndisponivel = false;

/**
 * Lê um texto em voz alta. Tenta primeiro a voz neural do servidor e, se ela
 * não estiver disponível, usa a do navegador. Cancela o que estiver falando
 * antes, para duas respostas nunca saírem por cima uma da outra.
 */
export async function falar(
  texto: string,
  opcoes: OpcoesDeFala,
): Promise<OrigemDaFala> {
  calarVoz();

  if (!servidorIndisponivel) {
    const foi = await falarPeloServidor(texto, opcoes);
    if (foi) return "servidor";
  }

  return falarPeloNavegador(texto, opcoes) ? "navegador" : "nenhum";
}

async function falarPeloServidor(
  texto: string,
  opcoes: OpcoesDeFala,
): Promise<boolean> {
  try {
    const resposta = await fetch("/api/voz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto,
        genero: opcoes.genero,
        nome: opcoes.nome,
      }),
    });

    if (resposta.status === 503) {
      servidorIndisponivel = true;
      return false;
    }
    if (!resposta.ok) return false;

    const url = URL.createObjectURL(await resposta.blob());
    const el = new Audio(url);
    audioDoServidor = el;

    const encerrar = () => {
      URL.revokeObjectURL(url);
      if (audioDoServidor === el) audioDoServidor = null;
      opcoes.onFim?.();
    };
    el.onended = encerrar;
    el.onerror = encerrar;

    await el.play();
    return true;
  } catch {
    return false;
  }
}

function falarPeloNavegador(texto: string, opcoes: OpcoesDeFala): boolean {
  if (!suportaVoz()) return false;

  const fala = new SpeechSynthesisUtterance(texto);
  const voz = escolherVoz(opcoes.genero, opcoes.nome);
  if (voz) {
    fala.voice = voz;
    fala.lang = voz.lang;
  } else {
    fala.lang = "pt-BR";
  }

  // Variação pequena e determinística: o mesmo suspeito soa sempre igual.
  // Um pouco abaixo da velocidade padrão, que sai atropelada e mecânica.
  const s = semente(opcoes.nome);
  fala.rate = 0.9 + ((s % 9) / 100);
  fala.pitch = 0.9 + ((Math.floor(s / 9) % 19) / 100);
  fala.volume = 1;

  fala.onend = () => opcoes.onFim?.();
  fala.onerror = () => opcoes.onFim?.();

  window.speechSynthesis.speak(fala);
  return true;
}

export function calarVoz() {
  if (suportaVoz()) window.speechSynthesis.cancel();
  if (audioDoServidor) {
    audioDoServidor.pause();
    audioDoServidor.onended = null;
    audioDoServidor.onerror = null;
    audioDoServidor = null;
  }
}

/**
 * Avisa a trilha sonora para abaixar o volume enquanto alguém fala. Uso um
 * evento de janela em vez de estado compartilhado porque a trilha vive fora da
 * árvore da sala de investigação.
 */
export function abafarTrilha(ativo: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("dossie:abafar", { detail: { ativo } }),
  );
}
