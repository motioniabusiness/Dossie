"use client";

import type { ReactNode } from "react";
import ConfiguracaoPartida from "./ConfiguracaoPartida";
import GerarCaso from "./GerarCaso";
import Julgamento from "./Julgamento";
import MenuInicial from "./MenuInicial";
import SalaInvestigacao from "./SalaInvestigacao";
import TelaResultado from "./TelaResultado";
import TelaVeredito from "./TelaVeredito";
import { useJogo } from "@/lib/estado/JogoProvider";

/** Roteador de fases do jogo. Tudo acontece numa única rota. */
export default function Jogo() {
  const { estado } = useJogo();

  function tela(): ReactNode {
    switch (estado.fase) {
      case "menu":
        return <MenuInicial key={`${estado.jogador1}|${estado.jogador2}`} />;

      case "configuracao":
        return <ConfiguracaoPartida />;

      case "carregando":
        return <GerarCaso />;

      case "investigacao":
        // Sessão restaurada sem caso (ou sem cronômetro) em memória: volta a gerar.
        return estado.caso && estado.fimEm !== null ? (
          <SalaInvestigacao caso={estado.caso} fimEm={estado.fimEm} />
        ) : (
          <GerarCaso />
        );

      case "veredito":
        return <TelaVeredito />;

      case "resultado":
        // Julga na entrada da fase; depois só exibe o que voltou.
        return estado.caso && estado.julgamento && estado.solucao ? (
          <TelaResultado
            caso={estado.caso}
            julgamento={estado.julgamento}
            solucao={estado.solucao}
          />
        ) : (
          <Julgamento />
        );
    }
  }

  return (
    /**
     * A `key` na fase remonta o bloco a cada troca, e a animação faz a tela
     * nova entrar desfocada e subindo. Sem isso a mudança era um corte seco.
     */
    <div
      key={estado.fase}
      className="animate-troca-fase flex flex-1 flex-col"
    >
      {tela()}
    </div>
  );
}
