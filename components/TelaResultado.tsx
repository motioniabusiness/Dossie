"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Botao from "./Botao";
import { IconeErro, IconePasta, IconeVisto } from "./Icones";
import PrepararProximoCaso from "./PrepararProximoCaso";
import { numeroDoCaso } from "./QuadroInvestigacao";
import RetratoJogador from "./RetratoJogador";
import RetratoSuspeito from "./RetratoSuspeito";
import { somCarimbo } from "@/lib/efeitos";
import { useJogo } from "@/lib/estado/JogoProvider";
import type {
  AvaliacaoJogador,
  CasoPublico,
  Julgamento,
  SolucaoSecreta,
} from "@/lib/tipos";

/** Atraso de entrada de cada bloco, para a revelação acontecer em sequência. */
function atraso(segundos: number): CSSProperties {
  return { animationDelay: `${segundos}s` };
}

/** Nota que conta de zero até o valor, como um placar mecânico. */
function NotaAnimada({ valor, inicio }: { valor: number; inicio: number }) {
  const [mostrada, setMostrada] = useState(0);

  useEffect(() => {
    let quadro = 0;
    const comeco = performance.now() + inicio * 1000;
    const duracao = 1100;
    function passo(agora: number) {
      const t = Math.min(1, Math.max(0, (agora - comeco) / duracao));
      // Desacelera no fim, como um ponteiro assentando.
      setMostrada(Math.round(valor * (1 - Math.pow(1 - t, 3))));
      if (t < 1) quadro = requestAnimationFrame(passo);
    }
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, inicio]);

  return <>{mostrada}</>;
}

function Boletim({
  nome,
  avaliacao,
  teoria,
  vencedor,
  jogador,
  duplaCooperativa = false,
  entrada,
}: {
  nome: string;
  avaliacao: AvaliacaoJogador;
  teoria: string;
  vencedor: boolean;
  jogador: 1 | 2;
  /** No cooperativo o boletim é um só e mostra os dois retratos. */
  duplaCooperativa?: boolean;
  /** Segundos até este boletim entrar. */
  entrada: number;
}) {
  return (
    <article
      className={`animate-entrada relative flex flex-col gap-4 border-2 p-5 ${
        vencedor
          ? "border-ambar-400 bg-noite-850 shadow-[6px_6px_0_0_var(--color-ambar-600)]"
          : "border-[#2b3441] bg-noite-850 shadow-[6px_6px_0_0_rgba(0,0,0,0.55)]"
      }`}
      style={atraso(entrada)}
    >
      <header className="flex items-center gap-4">
        <div className="flex shrink-0">
          <RetratoJogador
            jogador={jogador}
            formato="selo"
            ativo={vencedor}
            className="h-14 w-14 -rotate-2"
          />
          {duplaCooperativa && (
            <RetratoJogador
              jogador={2}
              formato="selo"
              ativo={vencedor}
              className="-ml-3 h-14 w-14 rotate-3"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-maquina text-xl leading-tight text-papel-50">
            {nome}
          </h3>
          <span className="etiqueta">
            {duplaCooperativa ? "Nota da dupla" : "Boletim do investigador"}
          </span>
        </div>

        {/* Nota como um selo carimbado */}
        <div
          className={`relative flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-full border-[3px] ${
            vencedor ? "border-ambar-400 text-ambar-300" : "border-papel-500 text-papel-100"
          }`}
        >
          <span className="font-maquina text-3xl leading-none tabular-nums">
            <NotaAnimada valor={avaliacao.nota} inicio={entrada + 0.2} />
          </span>
          <span className="font-mono text-[0.6rem] tracking-[0.1em] text-papel-500">/100</span>
        </div>
      </header>

      {vencedor && !duplaCooperativa && (
        <span
          className="carimbo carimbo-claro animate-carimbar absolute -top-4 left-24 bg-noite-850 text-sm"
          style={{ "--giro": "-6deg", ...atraso(entrada + 1.2) } as CSSProperties}
        >
          Mais perto da verdade
        </span>
      )}

      <p className="font-mono text-[0.9rem] leading-relaxed text-papel-100">
        {avaliacao.justificativa}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {avaliacao.acertos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="etiqueta text-ambar-400">Acertou</span>
            <ul className="flex flex-col gap-1.5">
              {avaliacao.acertos.map((a, i) => (
                <li key={i} className="flex gap-2 text-[0.85rem] leading-snug text-papel-100">
                  <IconeVisto className="mt-0.5 h-4 w-4 shrink-0 text-ambar-400" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {avaliacao.erros.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="etiqueta text-sangue-400">Escorregou</span>
            <ul className="flex flex-col gap-1.5">
              {avaliacao.erros.map((e, i) => (
                <li key={i} className="flex gap-2 text-[0.85rem] leading-snug text-papel-300">
                  <IconeErro className="mt-0.5 h-4 w-4 shrink-0 text-sangue-400" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <details className="group border-t-2 border-dashed border-noite-700 pt-3">
        <summary className="etiqueta cursor-pointer list-none hover:text-ambar-300">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>{" "}
          {duplaCooperativa ? "Reler a teoria da dupla" : `Reler a versão de ${nome}`}
        </summary>
        <p className="mt-3 font-mono text-[0.85rem] leading-relaxed whitespace-pre-line text-papel-300">
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

/** Acha o culpado no elenco pelo nome, tolerando diferença de caixa e espaços. */
function indiceDoCulpado(caso: CasoPublico, culpado: string) {
  const alvo = culpado.trim().toLowerCase();
  const exato = caso.suspeitos.findIndex((s) => s.nome.trim().toLowerCase() === alvo);
  if (exato >= 0) return exato;
  return caso.suspeitos.findIndex(
    (s) => alvo.includes(s.nome.trim().toLowerCase()) || s.nome.trim().toLowerCase().includes(alvo),
  );
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
        : `${(julgamento.vencedor === "jogador1" ? estado.jogador1 : estado.jogador2)
            .split(" ")
            .pop()} chegou mais perto da verdade`;

  // Os carimbos da revelação, no mesmo compasso das animações.
  useEffect(() => {
    somCarimbo(1, 0.05);
    somCarimbo(1.25, 1.05);
    if (julgamento.modo === "duelo" && julgamento.vencedor !== "empate") {
      somCarimbo(0.8, 2.5);
    }
    // Só na entrada da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iCulpado = indiceDoCulpado(caso, solucao.culpado);
  const culpado = iCulpado >= 0 ? caso.suspeitos[iCulpado] : { nome: solucao.culpado };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 pt-6 sm:px-8 lg:h-[100dvh] lg:flex-none lg:overflow-hidden">
      {/* Próximo caso começa a ser escrito agora, enquanto vocês leem. */}
      <PrepararProximoCaso />

      <header className="flex flex-col items-center gap-3 text-center">
        <span
          className="carimbo carimbo-claro animate-carimbar text-lg sm:text-xl"
          style={{ "--giro": "-4deg" } as CSSProperties}
        >
          Caso encerrado
        </span>
        <h1
          className="animate-entrada font-maquina text-2xl leading-tight text-papel-50 sm:text-4xl"
          style={atraso(0.35)}
        >
          {anuncio}
        </h1>
        <p className="animate-entrada font-mono text-sm text-papel-500" style={atraso(0.45)}>
          Caso {numeroDoCaso(caso.id)} · {caso.titulo}
        </p>
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-6 pb-4 lg:min-h-0 lg:grid-cols-[0.95fr_1.05fr] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        {/* ---------- A verdade: ficha do culpado ---------- */}
        <section className="flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <div
            className="papelzinho animate-entrada relative border-2 border-tinta p-5 shadow-[7px_7px_0_0_rgba(0,0,0,0.5)]"
            style={atraso(0.55)}
          >
            <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/55 uppercase">
              Solução do caso · arquivo lacrado até agora
            </span>

            <div className="mt-4 flex items-start gap-5">
              {/* Foto de ficha policial sobre a régua de altura */}
              <div className="relative shrink-0">
                <div
                  className="border-2 border-tinta p-2"
                  style={{
                    backgroundColor: "#d9d4c7",
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent 0 11px, rgba(11,13,16,0.35) 11px 12px)",
                  }}
                >
                  <RetratoSuspeito
                    suspeito={culpado}
                    fotoId={iCulpado >= 0 ? estado.fotosSuspeitos[iCulpado] : undefined}
                    className="h-32 w-32 border-2 border-tinta sm:h-40 sm:w-40"
                  />
                </div>
                <span
                  className="carimbo animate-carimbar absolute -right-6 bottom-6 bg-papel-50/85 text-2xl sm:text-3xl"
                  style={{ "--giro": "-16deg", ...atraso(1.05) } as CSSProperties}
                >
                  Culpado
                </span>
              </div>

              <div className="flex min-w-0 flex-col gap-1 pt-1">
                <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-sangue-600 uppercase">
                  Responsável
                </span>
                <p className="font-maquina text-2xl leading-tight text-tinta sm:text-3xl">
                  {solucao.culpado}
                </p>
                {"ocupacao" in culpado && culpado.ocupacao && (
                  <p className="font-mono text-sm text-tinta/60">{culpado.ocupacao}</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t-2 border-dashed border-tinta/25 pt-4">
              <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/55 uppercase">
                Como aconteceu
              </span>
              {solucao.comoAconteceu.split(/\n{2,}/).map((paragrafo, i) => (
                <p key={i} className="font-mono text-[0.92rem] leading-relaxed text-tinta">
                  {paragrafo}
                </p>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t-2 border-dashed border-tinta/25 pt-4">
              <span className="font-mono text-[0.7rem] font-bold tracking-[0.2em] text-tinta/55 uppercase">
                O que estava em jogo
              </span>
              <ol className="flex flex-col gap-2">
                {solucao.pontosChave.map((p, i) => (
                  <li key={i} className="flex gap-3 font-mono text-[0.88rem] leading-snug text-tinta">
                    <span className="font-maquina text-base leading-none text-sangue-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- Os boletins ---------- */}
        <section className="flex flex-col gap-6 pt-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {julgamento.modo === "cooperativo" ? (
            <Boletim
              nome={`${estado.jogador1.split(" ").pop()} e ${estado.jogador2.split(" ").pop()}`}
              avaliacao={julgamento.dupla}
              teoria={estado.teorias.jogador1}
              vencedor={julgamento.dupla.nota >= 60}
              jogador={1}
              duplaCooperativa
              entrada={1.3}
            />
          ) : (
            <>
              <Boletim
                nome={estado.jogador1}
                avaliacao={julgamento.jogador1}
                teoria={estado.teorias.jogador1}
                vencedor={julgamento.vencedor === "jogador1"}
                jogador={1}
                entrada={1.3}
              />
              <Boletim
                nome={estado.jogador2}
                avaliacao={julgamento.jogador2}
                teoria={estado.teorias.jogador2}
                vencedor={julgamento.vencedor === "jogador2"}
                jogador={2}
                entrada={1.55}
              />
            </>
          )}
        </section>
      </div>

      <footer
        className="sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-4 border-t-2 border-noite-700 bg-noite-950/95 px-4 pt-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-5 lg:backdrop-blur-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
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
        <Botao onClick={() => dispatch({ tipo: "NOVA_PARTIDA" })} className="sm:px-7">
          <IconePasta />
          Abrir outro caso
        </Botao>
      </footer>
    </div>
  );
}
