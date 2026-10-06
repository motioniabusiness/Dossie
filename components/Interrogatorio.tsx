"use client";

import { useEffect, useState } from "react";
import Botao from "./Botao";
import { IconeAltoFalante, IconeMicrofone, IconePausa } from "./Icones";
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
  prepararVoz,
  suportaVoz,
  temVozNatural,
} from "@/lib/voz";
import type { CasoPublico, Suspeito } from "@/lib/tipos";

/** Sobra menos tempo no relógio do que uma pergunta custa? Só no clique. */
function semTempoParaPerguntar(fimEm: number | null) {
  return fimEm !== null && fimEm - Date.now() <= CUSTO_DA_PERGUNTA_MS;
}

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
    // A dica fala do Edge, então só vale no Windows: no celular não há o que
    // trocar, e o aviso só confundiria.
    void carregarVozes().then(() =>
      setVozRobotica(
        !temVozNatural() && /Windows/i.test(navigator.userAgent),
      ),
    );
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
    // A pergunta é paga com tempo. Sem tempo para pagar, o desconto zeraria o
    // cronômetro e a partida pularia para o veredito no meio da resposta.
    if (semTempoParaPerguntar(estado.fimEm)) {
      setErro(
        `Faltam menos de ${minutos} minutos: não dá mais tempo de interrogar.`,
      );
      return;
    }
    // Ainda dentro do toque: libera o som para a resposta que chega depois.
    prepararVoz();
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

  const primeiroNome = suspeito.nome.split(" ")[0];

  return (
    /* Sala de interrogatório: bloco escuro dentro da ficha de papel, como a
       transcrição de uma fita gravada. */
    <div className="flex flex-col gap-3 border-2 border-tinta bg-tinta px-3.5 py-3.5 text-papel-100 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-maquina text-base text-ambar-400">
          <IconeMicrofone className="h-4 w-4" />
          Interrogatório
        </span>
        <span
          className="flex items-center gap-2 font-mono text-[0.72rem] text-papel-500"
          aria-label={`${estado.perguntasRestantes} de ${PERGUNTAS_POR_CASO} perguntas restantes`}
        >
          <span className="flex gap-0.5">
            {Array.from({ length: PERGUNTAS_POR_CASO }, (_, n) => (
              <span
                key={n}
                className={`h-2.5 w-2.5 border border-ambar-400 ${
                  n < estado.perguntasRestantes ? "bg-ambar-400" : "bg-transparent"
                }`}
              />
            ))}
          </span>
          {minutos} min cada
        </span>
      </div>

      {vozRobotica && trocas.length > 0 && (
        <p className="text-[0.72rem] leading-relaxed text-papel-500">
          Esta máquina só tem as vozes antigas do Windows. Abrindo o jogo no
          Microsoft Edge, os suspeitos falam com vozes naturais.
        </p>
      )}

      {trocas.length > 0 && (
        <ul className="flex flex-col gap-3 border-t border-dashed border-papel-500/30 pt-3">
          {trocas.map((t, i) => (
            <li key={i} className="flex flex-col gap-1.5">
              <p className="font-mono text-[0.8rem] leading-snug">
                <span className="font-bold tracking-[0.1em] text-ambar-400 uppercase">
                  Detetives:{" "}
                </span>
                <span className="text-papel-300">{t.pergunta}</span>
              </p>
              <div className="flex items-start gap-2.5">
                <p className="flex-1 font-mono text-[0.88rem] leading-relaxed">
                  <span className="font-bold tracking-[0.1em] text-sangue-400 uppercase">
                    {primeiroNome}:{" "}
                  </span>
                  <span className="text-papel-50 italic">{t.resposta}</span>
                </p>
                {suportaVoz() && (
                  <button
                    type="button"
                    onClick={() => (falando ? calar() : void ouvir(t.resposta))}
                    aria-label={
                      falando ? "Parar a fala" : "Ouvir esta resposta"
                    }
                    title={falando ? "Parar" : "Ouvir de novo"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-papel-500/50 text-papel-300 transition-colors hover:border-ambar-400 hover:text-ambar-300"
                  >
                    {falando ? <IconePausa /> : <IconeAltoFalante />}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {acabou ? (
        <p className="border-t border-dashed border-papel-500/30 pt-3 font-mono text-[0.8rem] leading-relaxed text-papel-300">
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
            placeholder={`O que você quer perguntar a ${primeiroNome}?`}
            aria-label={`Pergunta para ${suspeito.nome}`}
            className="campo resize-y font-mono text-[0.9rem]"
          />

          {erro && (
            <p role="alert" className="font-mono text-[0.8rem] text-sangue-400">
              {erro}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[0.72rem] text-papel-500">
              Custa {minutos} minutos do relógio.
            </span>
            <Botao
              onClick={perguntar}
              disabled={!podeEnviar}
              className="px-4 text-xs"
            >
              <IconeMicrofone className="h-4 w-4" />
              {carregando ? "Ouvindo..." : "Perguntar"}
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
