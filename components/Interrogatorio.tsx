"use client";

import { useEffect, useState } from "react";
import Botao from "./Botao";
import {
  CUSTO_DA_PERGUNTA_MS,
  PERGUNTAS_POR_CASO,
  useJogo,
} from "@/lib/estado/JogoProvider";
import {
  abafarTrilha,
  calarVoz,
  carregarVozes,
  falar,
  suportaVoz,
  temVozNatural,
} from "@/lib/voz";
import type { CasoPublico, Suspeito } from "@/lib/tipos";

/**
 * Interrogatório dentro da ficha do suspeito. Cada pergunta custa minutos do
 * cronômetro, então o relógio deixa de ser só pressão e passa a ser moeda: vale
 * gastar três minutos para ouvir esta pessoa mentir?
 */
export default function Interrogatorio({
  caso,
  suspeito,
}: {
  caso: CasoPublico;
  suspeito: Suspeito;
}) {
  const { estado, dispatch } = useJogo();
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [falando, setFalando] = useState(false);
  const [vozRobotica, setVozRobotica] = useState(false);

  // A lista de vozes do navegador chega de forma assíncrona.
  useEffect(() => {
    void carregarVozes().then(() => setVozRobotica(!temVozNatural()));
    return () => {
      calarVoz();
      abafarTrilha(false);
    };
  }, []);

  /** Lê a resposta em voz alta e abaixa a trilha enquanto isso. */
  async function ouvir(texto: string) {
    abafarTrilha(true);
    setFalando(true);
    const origem = await falar(texto, {
      genero: suspeito.retrato?.genero === "feminino" ? "feminino" : "masculino",
      nome: suspeito.nome,
      onFim: () => {
        setFalando(false);
        abafarTrilha(false);
      },
    });
    // Com voz do servidor não faz sentido sugerir trocar de navegador.
    if (origem === "servidor") setVozRobotica(false);
    if (origem === "nenhum") {
      setFalando(false);
      abafarTrilha(false);
    }
  }

  function calar() {
    calarVoz();
    setFalando(false);
    abafarTrilha(false);
  }

  const trocas = estado.interrogatorios.filter(
    (t) => t.suspeito === suspeito.nome,
  );
  const minutos = Math.round(CUSTO_DA_PERGUNTA_MS / 60_000);
  const acabou = estado.perguntasRestantes <= 0;
  const podeEnviar = pergunta.trim().length >= 5 && !carregando && !acabou;

  async function perguntar() {
    if (!podeEnviar || !estado.solucaoSelada) return;
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/interrogar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solucaoSelada: estado.solucaoSelada,
          caso: {
            titulo: caso.titulo,
            contexto: caso.contexto,
            suspeitos: caso.suspeitos,
            pistas: caso.pistas,
          },
          suspeito: suspeito.nome,
          pergunta: pergunta.trim(),
          anteriores: trocas.map((t) => ({
            pergunta: t.pergunta,
            resposta: t.resposta,
          })),
        }),
      });

      const corpo: unknown = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErro(
          corpo &&
            typeof corpo === "object" &&
            "erro" in corpo &&
            typeof corpo.erro === "string"
            ? corpo.erro
            : "Não foi possível interrogar agora.",
        );
        return;
      }

      const { resposta: fala } = corpo as { resposta: string };
      dispatch({
        tipo: "REGISTRAR_INTERROGATORIO",
        troca: { suspeito: suspeito.nome, pergunta: pergunta.trim(), resposta: fala },
      });
      setPergunta("");
      // A resposta sai falada na hora: o interrogatório vira cena, não leitura.
      void ouvir(fala);
    } catch {
      setErro("Falha na comunicação com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-noite-900/25 bg-noite-900/[0.06] px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[0.625rem] tracking-[0.16em] text-noite-900/55 uppercase">
          Interrogatório
        </span>
        <span className="font-mono text-[0.6875rem] text-noite-900/60">
          {estado.perguntasRestantes} de {PERGUNTAS_POR_CASO} perguntas ·{" "}
          {minutos} min cada
        </span>
      </div>

      {vozRobotica && trocas.length > 0 && (
        <p className="text-[0.6875rem] leading-relaxed text-noite-900/45">
          Esta máquina só tem as vozes antigas do Windows. Abrindo o jogo no
          Microsoft Edge, os suspeitos falam com vozes naturais.
        </p>
      )}

      {trocas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {trocas.map((t, i) => (
            <li key={i} className="flex flex-col gap-1">
              <p className="font-mono text-[0.75rem] text-noite-900/70">
                Detetives: {t.pergunta}
              </p>
              <div className="flex items-start gap-2 border-l-2 border-sangue-600/40 pl-3">
                <p className="flex-1 text-[0.8125rem] leading-relaxed text-noite-900 italic">
                  {t.resposta}
                </p>
                {suportaVoz() && (
                  <button
                    type="button"
                    onClick={() => (falando ? calar() : void ouvir(t.resposta))}
                    aria-label={
                      falando ? "Parar a fala" : "Ouvir esta resposta"
                    }
                    title={falando ? "Parar" : "Ouvir de novo"}
                    className="shrink-0 rounded-sm border border-noite-900/25 p-1 text-noite-900/60 transition-colors hover:border-sangue-600/60 hover:text-sangue-600"
                  >
                    {falando ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 9v6h4l5 4V5L8 9H4z" />
                        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {acabou ? (
        <p className="text-[0.75rem] leading-relaxed text-noite-900/60">
          As três perguntas deste caso já foram usadas. O que não foi perguntado
          vai ter que ser deduzido.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder={`O que você quer perguntar a ${suspeito.nome.split(" ")[0]}?`}
            aria-label={`Pergunta para ${suspeito.nome}`}
            className="w-full resize-y rounded-sm border border-noite-900/25 bg-papel-50/70 px-3 py-2 font-mono text-[0.8125rem] text-noite-900 outline-none transition-colors placeholder:text-noite-900/35 focus:border-sangue-600/60 focus:bg-papel-50"
          />

          {erro && (
            <p className="text-[0.75rem] text-sangue-600">{erro}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.6875rem] text-noite-900/50">
              Custa {minutos} minutos do cronômetro.
            </span>
            <Botao
              onClick={perguntar}
              disabled={!podeEnviar}
              className="px-4 py-1.5 text-xs"
            >
              {carregando ? "Ouvindo..." : "Perguntar"}
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
