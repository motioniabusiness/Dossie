"use client";

import { useEffect, useRef, useState } from "react";
import TelaCarregando from "./TelaCarregando";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import type { Julgamento as TipoJulgamento, SolucaoSecreta } from "@/lib/tipos";

interface RespostaJulgamento {
  julgamento: TipoJulgamento;
  solucao: SolucaoSecreta;
}

/**
 * Manda as duas teorias e o selo para /api/julgar. O servidor abre a solução,
 * pontua e devolve tudo junto — é aqui que a solução finalmente vira legível.
 */
export default function Julgamento() {
  const { estado, dispatch } = useJogo();
  const { anfitriao } = usePapel();
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  /** Mesma trava do GerarCaso: o StrictMode não pode julgar duas vezes. */
  const enviada = useRef(-1);

  useEffect(() => {
    // À distância, só quem criou a sala chama o júri; o veredito chega ao
    // outro aparelho pela sala.
    if (!anfitriao) return;
    if (enviada.current === tentativa) return;
    enviada.current = tentativa;

    async function julgar() {
      setErro(null);

      if (!estado.solucaoSelada) {
        setErro("Este caso perdeu a referência da solução. Comece um novo caso.");
        return;
      }

      try {
        const resposta = await fetch("/api/julgar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solucaoSelada: estado.solucaoSelada,
            modo: estado.config?.modo ?? "duelo",
            teoria1: estado.teorias.jogador1,
            teoria2: estado.teorias.jogador2,
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
              : "Não foi possível julgar as teorias.",
          );
          return;
        }

        const { julgamento, solucao } = corpo as RespostaJulgamento;
        dispatch({ tipo: "DEFINIR_JULGAMENTO", julgamento, solucao });
      } catch (e) {
        setErro(
          e instanceof Error && e.message
            ? `Falha na comunicação: ${e.message}`
            : "Falha na comunicação com o servidor.",
        );
      }
    }

    void julgar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  return (
    <TelaCarregando
      mensagem="O júri está lendo"
      nota="As versões são comparadas com a solução do caso, sob o mesmo critério."
      duracaoEstimada={14}
      etapas={
        estado.config?.modo === "cooperativo"
          ? [
              "Abrindo o envelope da solução",
              "Lendo a teoria da dupla",
              "Conferindo cada pista citada",
              "Dando a nota",
            ]
          : [
              "Abrindo o envelope da solução",
              `Lendo a versão de ${estado.jogador1}`,
              `Lendo a versão de ${estado.jogador2}`,
              "Conferindo as pistas citadas",
              "Dando as notas",
            ]
      }
      erro={anfitriao ? erro : null}
      onTentarNovamente={() => setTentativa((t) => t + 1)}
    />
  );
}
