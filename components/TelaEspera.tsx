"use client";

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
    <div className="animate-entrada mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-5 py-12 text-center">
      {online && (
        <span className="selo">Sala {online.codigo}</span>
      )}

      <RetratoJogador jogador={vezDe} ativo className="h-40 w-30" />

      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-xl tracking-[0.04em] text-papel-50 sm:text-2xl">
          {titulo}
        </h2>
        <p className="text-sm leading-relaxed text-papel-300">{texto}</p>
      </div>

      {/* Três pontos acendendo em sequência: está vivo, só esperando. */}
      <div className="flex gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-ambar-500"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
      </div>

      <Botao variante="fantasma" onClick={sairDaSala}>
        Sair da sala
      </Botao>
    </div>
  );
}
