"use client";

import type { ReactNode } from "react";
import Botao from "./Botao";
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
  const { estado, online, conexao, sairDaSala } = useJogo();

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

  // Sala que expirou (um dia parada) ou foi apagada: não há o que sincronizar.
  if (online && conexao === "expirada") {
    return (
      <div className="animate-entrada mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
        <span className="selo">Sala {online.codigo}</span>
        <h2 className="font-mono text-xl text-papel-50">
          Esta sala não existe mais
        </h2>
        <p className="text-sm leading-relaxed text-papel-300">
          Salas paradas por mais de um dia são arquivadas. Volte ao menu e
          crie uma nova.
        </p>
        <Botao onClick={sairDaSala}>Voltar ao menu</Botao>
      </div>
    );
  }

  return (
    <>
      {/* Aviso discreto quando a internet oscila; o jogo tenta sozinho. */}
      {online && conexao === "instavel" && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[60] bg-sangue-600/90 px-4 py-1.5 text-center text-xs text-papel-50"
          style={{ paddingTop: "max(0.375rem, env(safe-area-inset-top))" }}
        >
          Conexão com a sala instável. Tentando de novo...
        </div>
      )}
      {/**
       * A `key` na fase remonta o bloco a cada troca, e a animação faz a tela
       * nova entrar desfocada e subindo. Sem isso a mudança era um corte seco.
       */}
      <div
        key={estado.fase}
        className="animate-troca-fase flex flex-1 flex-col"
      >
        {tela()}
      </div>
    </>
  );
}
