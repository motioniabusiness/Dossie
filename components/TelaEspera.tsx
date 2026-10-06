"use client";

import type { CSSProperties } from "react";
import Botao from "./Botao";
import RetratoJogador from "./RetratoJogador";
import { useJogo } from "@/lib/estado/JogoProvider";

/**
 * Tela de quem está esperando o outro detetive agir, no modo à distância.
 * O retrato é de quem está com a vez, para ficar claro de quem é a espera.
 */
export default function TelaEspera({
  vezDe,
  titulo,
  texto,
}: {
  /** Quem está com a vez agora. */
  vezDe: 1 | 2;
  titulo: string;
  texto: string;
}) {
  const { online, sairDaSala } = useJogo();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-12">
      <div className="papelzinho animate-assentar relative w-full border-2 border-tinta px-6 pt-8 pb-7 text-center shadow-[7px_7px_0_0_rgba(0,0,0,0.5)]">
        {online && (
          <span
            className="carimbo absolute top-3 right-4 text-sm"
            style={{ "--giro": "8deg" } as CSSProperties}
          >
            Sala {online.codigo}
          </span>
        )}

        <div className="mx-auto w-fit -rotate-2 border-2 border-tinta bg-[#f7f5ef] p-2 pb-2.5 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
          <RetratoJogador jogador={vezDe} className="h-36 w-27 border-0" />
        </div>

        <h2 className="mt-6 font-maquina text-2xl leading-tight text-tinta">{titulo}</h2>
        <p className="mt-3 font-mono text-[0.88rem] leading-relaxed text-tinta/70">{texto}</p>

        {/* Três pontos acendendo em sequência: está vivo, só esperando. */}
        <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 animate-pulse border border-tinta bg-ambar-400"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </div>
      </div>

      <Botao variante="fantasma" onClick={sairDaSala}>
        Sair da sala
      </Botao>
    </div>
  );
}
