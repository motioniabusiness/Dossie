"use client";

import { useCallback, useState } from "react";
import Botao from "./Botao";
import Cronometro from "./Cronometro";
import FichaSuspeito from "./FichaSuspeito";
import IconePista, { ROTULO_TIPO } from "./IconePista";
import ModalBriefing from "./ModalBriefing";
import ModalPista from "./ModalPista";
import ModalPistaPrivada from "./ModalPistaPrivada";
import QuadroInvestigacao from "./QuadroInvestigacao";
import RetratoSuspeito from "./RetratoSuspeito";
import { nomeCategoria, nomeDificuldade } from "@/lib/categorias";
import { useJogo } from "@/lib/estado/JogoProvider";
import { donoDaPista } from "@/lib/pistasPrivadas";
import type { CasoPublico } from "@/lib/tipos";

/** Numeração de arquivo no formato 03/08, usada nos cartões e nos modais. */
function numeroArquivo(indice: number, total: number) {
  return `${String(indice + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

/** O que está aberto por cima do quadro. */
type Aberto =
  | { tipo: "pista"; id: string }
  /** Arquivo privado aguardando o dono confirmar que está com o aparelho. */
  | { tipo: "lacrado"; id: string; dono: "jogador1" | "jogador2" }
  | { tipo: "suspeito"; indice: number }
  | { tipo: "briefing" }
  | null;

interface Props {
  caso: CasoPublico;
  /** Instante em que o cronômetro zera; garantido pelo `GerarCaso`. */
  fimEm: number;
}

export default function SalaInvestigacao({ caso, fimEm }: Props) {
  const { estado, dispatch } = useJogo();
  const [aberto, setAberto] = useState<Aberto>(null);
  const [confirmandoVeredito, setConfirmandoVeredito] = useState(false);

  // Estável: evita recriar o intervalo do cronômetro a cada render.
  const irParaVeredito = useCallback(() => {
    dispatch({ tipo: "IR_PARA", fase: "veredito" });
  }, [dispatch]);

  const fecharModal = useCallback(() => setAberto(null), []);

  function revelarPista(id: string) {
    setAberto({ tipo: "pista", id });
    dispatch({ tipo: "ABRIR_PISTA", pistaId: id });
  }

  /**
   * Arquivo de mesa aberta vai direto. Arquivo privado passa pelo portão, para
   * o dono confirmar que é ele quem está com o aparelho.
   */
  function abrirPista(id: string) {
    const dono = donoDaPista(id, estado.pistasPrivadas);
    if (dono) setAberto({ tipo: "lacrado", id, dono });
    else revelarPista(id);
  }

  const indicePistaAberta =
    aberto?.tipo === "pista"
      ? caso.pistas.findIndex((p) => p.id === aberto.id)
      : -1;

  const indiceLacrada =
    aberto?.tipo === "lacrado"
      ? caso.pistas.findIndex((p) => p.id === aberto.id)
      : -1;

  /** Primeiro nome de quem é dono de cada arquivo privado, para o selo no cartão. */
  const donos: Record<string, string> = {};
  for (const id of estado.pistasPrivadas.jogador1) {
    donos[id] = estado.jogador1.split(" ").pop() ?? estado.jogador1;
  }
  for (const id of estado.pistasPrivadas.jogador2) {
    donos[id] = estado.jogador2.split(" ").pop() ?? estado.jogador2;
  }

  return (
    /**
     * A sala ocupa exatamente a altura da janela e não rola: o quadro é o
     * elemento elástico e se ajusta ao espaço que sobra entre cabeçalho e
     * rodapé. No celular a lista continua rolando, que é o esperado ali.
     */
    <div className="flex w-full flex-col md:h-[100dvh] md:overflow-hidden">
      {/* ---------- Cabeçalho: caso + cronômetro ---------- */}
      <header className="sticky top-0 z-40 shrink-0 border-b border-noite-700 bg-noite-950/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="min-w-0">
            <p className="etiqueta truncate">
              {nomeCategoria(caso.categoria)}
              {estado.config
                ? ` · ${nomeDificuldade(estado.config.dificuldade)}`
                : ""}{" "}
              · {estado.jogador1} vs {estado.jogador2}
            </p>
            <h1 className="truncate font-mono text-base text-papel-50 sm:text-lg">
              {caso.titulo}
            </h1>
          </div>
          <Cronometro fimEm={fimEm} onTempoEsgotado={irParaVeredito} />
        </div>
      </header>

      <div className="animate-entrada mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-5 py-4 sm:px-8 md:min-h-0">
        <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-3">
          <p className="etiqueta">
            Quadro de investigação · clique em qualquer item para abrir
          </p>
          <span className="font-mono text-xs text-papel-500">
            {estado.pistasVistas.length}/{caso.pistas.length} evidências
            analisadas
          </span>
        </div>

        {/* ---------- Quadro (telas médias para cima) ---------- */}
        <div className="hidden min-h-0 flex-1 justify-center md:flex">
          <QuadroInvestigacao
            caso={caso}
            fotos={estado.fotosSuspeitos}
            donos={donos}
            pistasVistas={estado.pistasVistas}
            onAbrirSuspeito={(indice) => setAberto({ tipo: "suspeito", indice })}
            onAbrirPista={abrirPista}
            onAbrirBriefing={() => setAberto({ tipo: "briefing" })}
          />
        </div>

        {/* ---------- Lista equivalente no celular ---------- */}
        <div className="flex flex-col gap-8 md:hidden">
          <button
            type="button"
            onClick={() => setAberto({ tipo: "briefing" })}
            className="painel flex flex-col items-start gap-2 p-5 text-left"
          >
            <span className="etiqueta">O caso · ler briefing</span>
            <span className="font-mono text-base text-papel-50">
              {caso.titulo}
            </span>
            <span className="line-clamp-2 text-xs leading-relaxed text-papel-300">
              {caso.contexto}
            </span>
          </button>

          <section className="flex flex-col gap-4">
            <h2 className="etiqueta">Suspeitos ({caso.suspeitos.length})</h2>
            <div className="grid grid-cols-2 gap-4">
              {caso.suspeitos.map((s, i) => (
                <button
                  key={s.nome}
                  type="button"
                  onClick={() => setAberto({ tipo: "suspeito", indice: i })}
                  className="papelzinho flex flex-col gap-2 rounded-sm p-2 text-left"
                >
                  <RetratoSuspeito
                    suspeito={s}
                    fotoId={estado.fotosSuspeitos[i]}
                    className="aspect-square w-full"
                  />
                  <span className="truncate font-mono text-[0.6875rem] tracking-[0.08em] text-noite-900 uppercase">
                    {s.nome}
                  </span>
                  <span className="text-[0.625rem] tracking-[0.14em] text-noite-900/55 uppercase">
                    Abrir ficha
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="etiqueta">Evidências ({caso.pistas.length})</h2>
            <div className="flex flex-col gap-3">
              {caso.pistas.map((p, i) => {
                const vista = estado.pistasVistas.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => abrirPista(p.id)}
                    className={`painel flex items-center gap-3 p-4 text-left ${
                      vista ? "border-noite-600 bg-noite-800/40" : ""
                    }`}
                  >
                    <span
                      className={vista ? "text-ambar-400" : "text-papel-500"}
                    >
                      <IconePista tipo={p.tipo} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug font-medium text-papel-50">
                        {p.titulo}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-snug text-papel-300">
                        {donos[p.id]
                          ? `Arquivo lacrado, só ${donos[p.id]} pode abrir.`
                          : p.tipo === "foto" && p.legendaFoto
                            ? p.legendaFoto
                            : p.conteudo}
                      </span>
                      <span className="etiqueta mt-1.5 block">
                        {ROTULO_TIPO[p.tipo]} ·{" "}
                        {donos[p.id]
                          ? `restrito a ${donos[p.id]}`
                          : numeroArquivo(i, caso.pistas.length)}
                        {vista ? " · ✓ analisado" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* ---------- Ações ---------- */}
        <footer className="flex shrink-0 flex-col gap-4 border-t border-noite-700 pt-4">
          {confirmandoVeredito ? (
            <div className="painel animate-entrada flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-papel-100">
                Encerrar a investigação agora? Os arquivos não podem ser
                reabertos depois do veredito.
              </p>
              <div className="flex shrink-0 gap-3">
                <Botao
                  variante="fantasma"
                  onClick={() => setConfirmandoVeredito(false)}
                >
                  Voltar ao caso
                </Botao>
                <Botao onClick={irParaVeredito}>Sim, encerrar</Botao>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Botao
                variante="secundario"
                onClick={() => dispatch({ tipo: "PULAR_CASO" })}
                title="Descarta este caso e gera outro; o cronômetro continua correndo."
              >
                Já conheço este caso, pular
              </Botao>
              <Botao onClick={() => setConfirmandoVeredito(true)}>
                Estamos prontos para o veredito
              </Botao>
            </div>
          )}
        </footer>
      </div>

      {/* ---------- Arquivos abertos ---------- */}
      {indicePistaAberta >= 0 && (
        <ModalPista
          pista={caso.pistas[indicePistaAberta]}
          numero={numeroArquivo(indicePistaAberta, caso.pistas.length)}
          onFechar={fecharModal}
        />
      )}

      {indiceLacrada >= 0 && aberto?.tipo === "lacrado" && (
        <ModalPistaPrivada
          dono={aberto.dono === "jogador1" ? 1 : 2}
          nomeDono={
            aberto.dono === "jogador1" ? estado.jogador1 : estado.jogador2
          }
          nomeOutro={
            aberto.dono === "jogador1" ? estado.jogador2 : estado.jogador1
          }
          numero={numeroArquivo(indiceLacrada, caso.pistas.length)}
          onConfirmar={() => revelarPista(aberto.id)}
          onFechar={fecharModal}
        />
      )}

      {aberto?.tipo === "suspeito" && (
        <FichaSuspeito
          suspeito={caso.suspeitos[aberto.indice]}
          fotoId={estado.fotosSuspeitos[aberto.indice]}
          numero={numeroArquivo(aberto.indice, caso.suspeitos.length)}
          caso={caso}
          onFechar={fecharModal}
        />
      )}

      {aberto?.tipo === "briefing" && (
        <ModalBriefing caso={caso} onFechar={fecharModal} />
      )}
    </div>
  );
}
