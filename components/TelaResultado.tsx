"use client";

import Botao from "./Botao";
import RetratoJogador from "./RetratoJogador";
import { useJogo } from "@/lib/estado/JogoProvider";
import type { AvaliacaoJogador, CasoPublico, Julgamento, SolucaoSecreta } from "@/lib/tipos";

function CartaoNota({
  nome,
  avaliacao,
  teoria,
  vencedor,
  jogador,
  duplaCooperativa = false,
}: {
  nome: string;
  avaliacao: AvaliacaoJogador;
  teoria: string;
  vencedor: boolean;
  jogador: 1 | 2;
  /** No cooperativo o cartão é um só e mostra os dois retratos. */
  duplaCooperativa?: boolean;
}) {
  return (
    <article
      className={`painel flex flex-col gap-4 p-5 sm:p-6 ${
        vencedor ? "border-ambar-500/70 bg-ambar-500/[0.05]" : ""
      }`}
    >
      <header className="flex items-center gap-4">
        <div className="flex shrink-0 gap-2">
          <RetratoJogador
            jogador={jogador}
            formato="selo"
            ativo={vencedor}
            className="h-14 w-14 shrink-0"
          />
          {duplaCooperativa && (
            <RetratoJogador
              jogador={2}
              formato="selo"
              ativo={vencedor}
              className="h-14 w-14 shrink-0"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-mono text-base text-papel-50">{nome}</h3>
          <span className="etiqueta">
            {duplaCooperativa
              ? "Nota da dupla"
              : vencedor
                ? "Chegou mais perto"
                : "Analista"}
          </span>
        </div>
        <span
          className={`font-mono text-3xl leading-none tabular-nums ${
            vencedor ? "text-ambar-300" : "text-papel-100"
          }`}
        >
          {avaliacao.nota}
          <span className="text-sm text-papel-500">/100</span>
        </span>
      </header>

      {/* Barra da nota */}
      <div className="h-1.5 overflow-hidden rounded-full bg-noite-800">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${
            vencedor ? "bg-ambar-500" : "bg-noite-500"
          }`}
          style={{ width: `${avaliacao.nota}%` }}
        />
      </div>

      <p className="text-sm leading-relaxed text-papel-100">
        {avaliacao.justificativa}
      </p>

      {avaliacao.acertos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="etiqueta">Acertou</span>
          <ul className="flex flex-col gap-1.5">
            {avaliacao.acertos.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-papel-100">
                <span className="text-ambar-400">✓</span>
                <span className="leading-snug">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {avaliacao.erros.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="etiqueta">Escorregou</span>
          <ul className="flex flex-col gap-1.5">
            {avaliacao.erros.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm text-papel-300">
                <span className="text-sangue-400">✕</span>
                <span className="leading-snug">{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="border-t border-noite-700 pt-3">
        <summary className="etiqueta cursor-pointer hover:text-ambar-300">
          {duplaCooperativa ? "Reler a teoria da dupla" : `Reler a versão de ${nome}`}
        </summary>
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-papel-300">
          {teoria}
        </p>
      </details>
    </article>
  );
}

/** Manchete do modo cooperativo: a nota é da dupla, não de um dos dois. */
function notaDaDupla(nota: number) {
  if (nota >= 85) return "Caso resolvido";
  if (nota >= 60) return "Caso resolvido pela metade";
  if (nota >= 35) return "Vocês passaram perto";
  return "O caso venceu vocês";
}

interface Props {
  caso: CasoPublico;
  julgamento: Julgamento;
  solucao: SolucaoSecreta;
}

export default function TelaResultado({ caso, julgamento, solucao }: Props) {
  const { estado, dispatch, online, sairDaSala } = useJogo();

  const anuncio =
    julgamento.modo === "cooperativo"
      ? notaDaDupla(julgamento.dupla.nota)
      : julgamento.vencedor === "empate"
        ? "Empate técnico"
        : `${
            julgamento.vencedor === "jogador1"
              ? estado.jogador1
              : estado.jogador2
          } chegou mais perto da verdade`;

  return (
    <div className="cascata mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="selo">Caso encerrado</span>
        <h1 className="font-mono text-2xl tracking-[0.06em] text-papel-50 sm:text-3xl">
          {anuncio}
        </h1>
        <p className="text-sm text-papel-300">{caso.titulo}</p>
      </header>

      {/* Solução à esquerda, notas à direita: em tela larga cabe quase tudo
          de uma vez, em vez de virar uma página comprida. */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr] xl:items-start">
      {/* ---------- A verdade ---------- */}
      <section className="painel flex flex-col gap-5 border-ambar-500/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="etiqueta">Solução do caso</span>
          <span className="font-mono text-xs text-papel-500">
            arquivo lacrado até agora
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="etiqueta">Responsável</span>
          <p className="font-mono text-xl text-sangue-400">{solucao.culpado}</p>
        </div>

        {solucao.comoAconteceu.split(/\n{2,}/).map((paragrafo, i) => (
          <p key={i} className="text-sm leading-relaxed text-papel-100">
            {paragrafo}
          </p>
        ))}

        <div className="flex flex-col gap-2 border-t border-noite-700 pt-4">
          <span className="etiqueta">O que estava em jogo</span>
          <ul className="flex flex-col gap-2">
            {solucao.pontosChave.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm leading-snug text-papel-100">
                <span className="font-mono text-xs text-ambar-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Notas ---------- */}
      {julgamento.modo === "cooperativo" ? (
        <section>
          <CartaoNota
            nome={`${estado.jogador1} e ${estado.jogador2}`}
            avaliacao={julgamento.dupla}
            teoria={estado.teorias.jogador1}
            vencedor={julgamento.dupla.nota >= 60}
            jogador={1}
            duplaCooperativa
          />
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
          <CartaoNota
            nome={estado.jogador1}
            avaliacao={julgamento.jogador1}
            teoria={estado.teorias.jogador1}
            vencedor={julgamento.vencedor === "jogador1"}
            jogador={1}
          />
          <CartaoNota
            nome={estado.jogador2}
            avaliacao={julgamento.jogador2}
            teoria={estado.teorias.jogador2}
            vencedor={julgamento.vencedor === "jogador2"}
            jogador={2}
          />
        </section>
      )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-noite-700 pt-5">
        <Botao
          variante="fantasma"
          // À distância, sair é só deste aparelho: mandar REINICIAR para a
          // sala jogaria o outro detetive de volta ao menu sem aviso.
          onClick={() =>
            online ? sairDaSala() : dispatch({ tipo: "REINICIAR" })
          }
        >
          {online ? "Sair da sala" : "Encerrar a sessão"}
        </Botao>
        <Botao onClick={() => dispatch({ tipo: "NOVA_PARTIDA" })}>
          Novo caso
        </Botao>
      </footer>
    </div>
  );
}
