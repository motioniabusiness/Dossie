/**
 * Efeitos sonoros do escritório: carimbo, papel e máquina de escrever.
 *
 * Tudo é sintetizado na hora com a Web Audio API, sem arquivo para baixar:
 * ruído filtrado para o papel, um baque grave para o carimbo, um estalo curto
 * para a tecla. O volume é baixo de propósito, é ambiente, não alarme.
 *
 * Respeita o mesmo "silenciar" da trilha sonora (localStorage dossie:mudo).
 */

let contexto: AudioContext | null = null;
let ruido: AudioBuffer | null = null;

function silenciado() {
  try {
    return localStorage.getItem("dossie:mudo") === "1";
  } catch {
    return false;
  }
}

function audio(): AudioContext | null {
  if (typeof window === "undefined" || silenciado()) return null;
  try {
    contexto ??= new AudioContext();
    // Só destrava depois de um toque; antes disso fica mudo, sem erro.
    if (contexto.state === "suspended") void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

/** Meio segundo de ruído branco, gerado uma vez e reaproveitado. */
function bufferDeRuido(ctx: AudioContext) {
  if (ruido) return ruido;
  ruido = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
  const dados = ruido.getChannelData(0);
  for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
  return ruido;
}

/** Rajada de ruído filtrado, com ataque e queda rápidos. */
function rajada(
  ctx: AudioContext,
  { tipo, frequencia, q = 1, duracao, volume, atraso = 0 }: {
    tipo: BiquadFilterType;
    frequencia: number;
    q?: number;
    duracao: number;
    volume: number;
    atraso?: number;
  },
) {
  const t = ctx.currentTime + atraso;
  const fonte = ctx.createBufferSource();
  fonte.buffer = bufferDeRuido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = frequencia;
  filtro.Q.value = q;
  const ganho = ctx.createGain();
  ganho.gain.setValueAtTime(0.0001, t);
  ganho.gain.exponentialRampToValueAtTime(volume, t + 0.006);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
  fonte.connect(filtro).connect(ganho).connect(ctx.destination);
  fonte.start(t, Math.random() * 0.3);
  fonte.stop(t + duracao + 0.02);
}

/** Carimbo batendo na mesa: baque grave e o estalo da borracha no papel. */
export function somCarimbo(intensidade = 1, atraso = 0) {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime + atraso;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(42, t + 0.16);
  const ganho = ctx.createGain();
  ganho.gain.setValueAtTime(0.0001, t);
  ganho.gain.exponentialRampToValueAtTime(0.32 * intensidade, t + 0.008);
  ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(ganho).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
  rajada(ctx, { tipo: "bandpass", frequencia: 1400, q: 0.8, duracao: 0.07, volume: 0.18 * intensidade, atraso });
}

/** Folha sendo puxada: ruído agudo e curto. */
export function somPapel() {
  const ctx = audio();
  if (!ctx) return;
  rajada(ctx, { tipo: "highpass", frequencia: 2600, duracao: 0.16, volume: 0.07 });
  rajada(ctx, { tipo: "bandpass", frequencia: 5200, q: 0.7, duracao: 0.1, volume: 0.04, atraso: 0.05 });
}

/** Tecla de máquina de escrever: estalo seco. */
export function somTecla() {
  const ctx = audio();
  if (!ctx) return;
  rajada(ctx, { tipo: "bandpass", frequencia: 3200, q: 2.5, duracao: 0.035, volume: 0.12 });
  rajada(ctx, { tipo: "lowpass", frequencia: 600, duracao: 0.05, volume: 0.06, atraso: 0.008 });
}
