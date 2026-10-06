"use client";

import { useEffect, useRef, useState } from "react";
import TelaCarregando from "./TelaCarregando";
import {
  PISTAS_PRIVADAS_POR_JOGADOR,
  useJogo,
  usePapel,
} from "@/lib/estado/JogoProvider";
import { dividirPistasPrivadas } from "@/lib/pistasPrivadas";
import { sortearRetratos } from "@/lib/retratos";
import type { CasoPublico, ConfigPartida } from "@/lib/tipos";

interface RespostaGeracao {
  caso: CasoPublico;
  solucaoSelada: string;
}

/** Duas configurações produzem casos equivalentes? */
export function mesmaConfig(a: ConfigPartida, b: ConfigPartida) {
  return (
    a.categoria === b.categoria &&
    a.dificuldade === b.dificuldade &&
    a.modo === b.modo
  );
}

/**
 * Etapa de geração: chama /api/gerar-caso com a categoria, o tempo, a
 * dificuldade e os resumos dos casos já vistos. A chave da API fica só no
 * servidor; daqui saem apenas os parâmetros da partida.
 *
 * Se o caso seguinte já veio adiantado durante o veredito anterior, entra na
 * hora e ninguém espera.
 */
export default function GerarCaso() {
  const { estado, dispatch } = useJogo();
  const { anfitriao } = usePapel();
  const [erro, setErro] = useState<string | null>(null);
  /** Incrementar reexecuta o efeito, é o botão "tentar de novo". */
  const [tentativa, setTentativa] = useState(0);
  /**
   * Última tentativa já enviada. Gerar um caso custa tempo e tokens, e o
   * StrictMode do desenvolvimento roda o efeito duas vezes: sem esta trava o
   * pedido sairia em dobro. Também não abortamos o fetch na limpeza, porque a
   * única saída desta fase é o caso chegar.
   */
  const enviada = useRef(-1);

  const config = estado.config;
  const minutos = config?.minutos ?? 40;

  useEffect(() => {
    // À distância, só o aparelho de quem criou a sala gera: o caso chega ao
    // outro pela sala, e a geração não é paga duas vezes.
    if (!anfitriao) return;
    if (!config || enviada.current === tentativa) return;
    enviada.current = tentativa;

    function entrarNaSala(
      caso: CasoPublico,
      solucaoSelada: string,
      fotos: string[],
      retratosUsados: string[],
    ) {
      dispatch({
        tipo: "DEFINIR_CASO",
        caso,
        solucaoSelada,
        fotos,
        retratosUsados,
        pistasPrivadas: dividirPistasPrivadas(
          caso.pistas,
          config!.modo,
          PISTAS_PRIVADAS_POR_JOGADOR,
        ),
      });

      // O cronômetro só começa no primeiro caso da partida; pular caso não o reinicia.
      if (estado.fimEm === null) {
        dispatch({
          tipo: "INICIAR_TEMPO",
          fimEm: Date.now() + minutos * 60_000,
        });
      }

      dispatch({ tipo: "IR_PARA", fase: "investigacao" });
    }

    // Caso adiantado durante o veredito anterior, se serve para esta partida.
    const pronto = estado.casoPreparado;
    if (pronto && mesmaConfig(pronto.config, config)) {
      entrarNaSala(
        pronto.caso,
        pronto.solucaoSelada,
        pronto.fotos,
        pronto.retratosUsados,
      );
      return;
    }

    async function gerar() {
      setErro(null);
      try {
        const resposta = await fetch("/api/gerar-caso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoria: config!.categoria,
            minutos,
            dificuldade: config!.dificuldade,
            resumosVistos: estado.resumosVistos,
          }),
        });

        const corpo: unknown = await resposta.json().catch(() => null);

        if (!resposta.ok) {
          const mensagem =
            corpo &&
            typeof corpo === "object" &&
            "erro" in corpo &&
            typeof corpo.erro === "string"
              ? corpo.erro
              : "Não foi possível gerar o caso.";
          setErro(mensagem);
          return;
        }

        const { caso, solucaoSelada } = corpo as RespostaGeracao;

        // Sorteia aqui, e não no redutor: envolve aleatoriedade, que não pode
        // entrar numa função pura.
        const { fotos, usados } = sortearRetratos(
          caso.suspeitos,
          estado.retratosUsados,
        );

        entrarNaSala(caso, solucaoSelada, fotos, usados);
      } catch (e) {
        setErro(
          e instanceof Error && e.message
            ? `Falha na comunicação: ${e.message}`
            : "Falha na comunicação com o servidor.",
        );
      }
    }

    void gerar();
    // Dispara na entrada da fase e a cada "tentar de novo". As demais
    // dependências são lidas no momento da chamada, sem reexecutar o efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  if (!anfitriao) {
    return (
      <TelaCarregando
        nota={`O caso está sendo aberto no aparelho de ${estado.jogador1}. Ele chega aqui sozinho, em cerca de um minuto.`}
      />
    );
  }

  return (
    <TelaCarregando
      erro={erro}
      onTentarNovamente={() => setTentativa((t) => t + 1)}
    />
  );
}
