"use client";

import { useEffect, useRef, useState } from "react";
import { IconeAltoFalante } from "./Icones";
import { useJogo } from "@/lib/estado/JogoProvider";
import type { FaseJogo } from "@/lib/tipos";

/**
 * Trilha de fundo por fase. Os arquivos ficam em /public/audio e são
 * opcionais: se não existirem, o jogo simplesmente segue em silêncio, sem erro
 * no console e sem o controle na tela.
 *
 * O volume e o mudo ficam no localStorage, então a preferência atravessa
 * sessões, diferente do resto do estado do jogo.
 */
const TEMA = "/audio/tema.mp3";

/**
 * Fase sem entrada aqui toca em silêncio. A sala de investigação é silêncio
 * absoluto de propósito: é onde a dupla lê, cruza horários e discute, e música
 * ali só atrapalha.
 */
const TRILHAS: Partial<Record<FaseJogo, string>> = {
  menu: TEMA,
  configuracao: TEMA,
  carregando: TEMA,
  veredito: TEMA,
  resultado: TEMA,
};

const CHAVE_VOLUME = "dossie:volume";
const CHAVE_MUDO = "dossie:mudo";
const DURACAO_FADE = 600;

function lerPreferencia(chave: string, padrao: number): number {
  if (typeof window === "undefined") return padrao;
  try {
    const valor = localStorage.getItem(chave);
    return valor === null ? padrao : Number(valor);
  } catch {
    return padrao;
  }
}

export default function TrilhaSonora() {
  const { estado } = useJogo();
  const audio = useRef<HTMLAudioElement | null>(null);
  // Lidos na inicialização, e não num efeito: o controle só aparece depois que
  // a trilha começa a tocar, então não há risco de divergir do HTML do servidor.
  const [volume, setVolume] = useState(() => lerPreferencia(CHAVE_VOLUME, 0.35));
  const [mudo, setMudo] = useState(
    () => lerPreferencia(CHAVE_MUDO, 0) === 1,
  );
  /** Só mostra o controle depois de confirmar que existe áudio para tocar. */
  const [temTrilha, setTemTrilha] = useState(false);
  const [aberto, setAberto] = useState(false);
  /** Alguém está falando: a música sai da frente. */
  const [abafado, setAbafado] = useState(false);
  /** Faixa que deveria estar tocando agora, ou null nas fases silenciosas. */
  const faixaDesejada = useRef<string | null>(null);
  /** Espelho do volume e do mudo, para o destravamento não ler valor velho. */
  const preferencias = useRef({ volume, mudo });

  // Troca de faixa quando a fase muda, com esmaecimento entre elas.
  useEffect(() => {
    const caminho = TRILHAS[estado.fase];

    let cancelado = false;
    const el = audio.current ?? new Audio();
    audio.current = el;
    el.loop = true;

    const passos = 10;
    faixaDesejada.current = caminho ?? null;

    async function esmaecer(ate: number) {
      const inicial = el.volume;
      for (let i = 1; i <= passos; i++) {
        if (cancelado) return;
        el.volume = Math.max(0, Math.min(1, inicial + (ate - inicial) * (i / passos)));
        await new Promise((r) => setTimeout(r, DURACAO_FADE / passos));
      }
    }

    async function trocar() {
      // Fase silenciosa: baixa até zero e pausa, sem perder o ponto da música.
      if (!caminho) {
        if (!el.paused) {
          await esmaecer(0);
          if (!cancelado) el.pause();
        }
        return;
      }

      const jaTocando = el.src.endsWith(caminho) && !el.paused;
      if (jaTocando) return;

      // Faixa diferente: esmaece a atual antes de trocar o arquivo.
      const trocaDeFaixa = el.src !== "" && !el.src.endsWith(caminho);
      if (trocaDeFaixa && !el.paused) await esmaecer(0);
      if (cancelado) return;

      if (!el.src.endsWith(caminho)) el.src = caminho;
      el.volume = 0;
      try {
        await el.play();
      } catch {
        // Arquivo ausente, ou o navegador ainda não liberou o áudio. Quem
        // cuida da segunda hipótese é o efeito de destravamento, mais abaixo.
        return;
      }
      if (cancelado) return;
      setTemTrilha(true);
      await esmaecer(mudo ? 0 : volume);
    }

    void trocar();
    return () => {
      cancelado = true;
    };
    // Volume e mudo são aplicados no efeito abaixo, sem reiniciar a faixa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.fase]);

  /**
   * Destravamento do áudio. Navegador nenhum toca som antes do primeiro gesto
   * do usuário, então a tentativa feita no carregamento da página quase sempre
   * falha. Este ouvinte fica de pé a sessão inteira e, ao primeiro clique ou
   * tecla, põe para tocar a faixa que deveria estar tocando.
   *
   * Ficou num efeito próprio, sem dependências, de propósito: quando ele vivia
   * dentro do efeito de troca de faixa, cada nova execução cancelava o
   * fechamento anterior e o ouvinte registrado virava um ouvinte morto.
   */
  useEffect(() => {
    function destravar() {
      const el = audio.current;
      const caminho = faixaDesejada.current;
      if (!el || !caminho || !el.paused) return;

      if (!el.src.endsWith(caminho)) el.src = caminho;
      const { volume: v, mudo: m } = preferencias.current;
      el.volume = m ? 0 : v;
      el.muted = m;
      el.play().then(
        () => setTemTrilha(true),
        () => {
          /* segue mudo: provavelmente o arquivo não existe */
        },
      );
    }

    window.addEventListener("pointerdown", destravar);
    window.addEventListener("keydown", destravar);
    return () => {
      window.removeEventListener("pointerdown", destravar);
      window.removeEventListener("keydown", destravar);
    };
  }, []);

  /**
   * Enquanto um suspeito fala, a música cai para um quinto do volume. Quem
   * avisa é o interrogatório, por um evento de janela: a trilha vive fora da
   * árvore da sala e não teria como saber disso de outro jeito.
   */
  useEffect(() => {
    function aoAbafar(e: Event) {
      const ativo = (e as CustomEvent<{ ativo: boolean }>).detail?.ativo;
      setAbafado(Boolean(ativo));
    }
    window.addEventListener("dossie:abafar", aoAbafar);
    return () => window.removeEventListener("dossie:abafar", aoAbafar);
  }, []);

  // Volume e mudo, aplicados sem cortar a música.
  useEffect(() => {
    preferencias.current = { volume, mudo };
    if (audio.current) {
      audio.current.volume = mudo ? 0 : abafado ? volume * 0.2 : volume;
      // No iPhone o volume de um <audio> é só leitura e fica sempre em 100%:
      // sem `muted`, o botão de silenciar não faria nada por lá.
      audio.current.muted = mudo;
    }
    try {
      localStorage.setItem(CHAVE_VOLUME, String(volume));
      localStorage.setItem(CHAVE_MUDO, mudo ? "1" : "0");
    } catch {
      // Sem persistência: a preferência vale só para esta sessão.
    }
  }, [volume, mudo, abafado]);

  // Silencia ao sair da aba, para não tocar sozinho no fundo.
  useEffect(() => {
    function aoTrocarDeAba() {
      const el = audio.current;
      if (!el) return;
      if (document.hidden) el.pause();
      // Só volta se a fase atual tem música: na sala de investigação, voltar
      // de outro app no celular não pode religar a trilha.
      else if (!mudo && faixaDesejada.current) void el.play().catch(() => {});
    }
    document.addEventListener("visibilitychange", aoTrocarDeAba);
    return () => document.removeEventListener("visibilitychange", aoTrocarDeAba);
  }, [mudo]);

  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, []);

  // Nas fases silenciosas o controle sai da frente: no celular ele cobria a
  // barra de ações da sala de investigação.
  if (!temTrilha || !TRILHAS[estado.fase]) return null;

  return (
    <div
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      className="fixed right-4 z-50 flex items-center gap-3 rounded-[3px] border-2 border-tinta bg-noite-900/95 px-2.5 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        type="button"
        onClick={() => setMudo((m) => !m)}
        aria-label={mudo ? "Ligar a trilha" : "Silenciar a trilha"}
        title={mudo ? "Ligar a música" : "Silenciar a música"}
        className={`relative transition-colors hover:text-ambar-300 ${mudo ? "text-papel-500" : "text-ambar-400"}`}
      >
        <IconeAltoFalante className="h-5 w-5" />
        {mudo && (
          <span className="absolute top-1/2 left-1/2 h-[2.5px] w-6 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-sangue-400" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={mudo ? 0 : volume}
        onChange={(e) => {
          setVolume(Number(e.target.value));
          if (mudo) setMudo(false);
        }}
        aria-label="Volume da trilha"
        className={`h-1 cursor-pointer appearance-none bg-noite-600 accent-ambar-500 transition-all duration-300 ${
          aberto ? "w-24 opacity-100" : "w-0 opacity-0"
        }`}
      />
    </div>
  );
}
