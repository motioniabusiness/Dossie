"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Botao from "./Botao";
import Cronometro from "./Cronometro";
import FichaSuspeito from "./FichaSuspeito";
import IconePista, { ROTULO_TIPO } from "./IconePista";
import ModalBriefing from "./ModalBriefing";
import ModalPista from "./ModalPista";
import ModalPistaPrivada from "./ModalPistaPrivada";
import { IconeLupa, IconeMicrofone, IconeSelo } from "./Icones";
import QuadroInvestigacao, { numeroDoCaso } from "./QuadroInvestigacao";
import RetratoSuspeito from "./RetratoSuspeito";
import { nomeCategoria, nomeDificuldade } from "@/lib/categorias";
import {
  PERGUNTAS_POR_CASO,
  useJogo,
  usePapel,
} from "@/lib/estado/JogoProvider";
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
  const { estado, dispatch, online } = useJogo();
  const papel = usePapel();
  const [aberto, setAberto] = useState<Aberto>(null);
  const [confirmandoVeredito, setConfirmandoVeredito] = useState(false);
  /** No celular o polegar esbarra fácil: pular também pede confirmação. */
  const [confirmandoPulo, setConfirmandoPulo] = useState(false);
  /** Aba visível no celular, onde o quadro vira lista. */
  const [aba, setAba] = useState<"suspeitos" | "evidencias">("suspeitos");

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
    // À distância cada aparelho é de uma pessoa: o dono abre direto, sem o
    // portão de "olhe para o lado", e o outro encontra o arquivo lacrado.
    const meu = papel.eu === 1 ? "jogador1" : "jogador2";
    if (dono && papel.online && dono === meu) revelarPista(id);
    else if (dono) setAberto({ tipo: "lacrado", id, dono });
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

  /**
   * Arquivos que não mostram prévia neste aparelho. No mesmo aparelho, todos
   * os privados (o dono abre pelo portão). À distância, só os do outro.
   */
  const minhas = papel.online
    ? papel.eu === 2
      ? estado.pistasPrivadas.jogador2
      : estado.pistasPrivadas.jogador1
    : [];
  const lacradas = new Set(
    Object.keys(donos).filter((id) => !minhas.includes(id)),
  );
  const interrogados = new Set(estado.interrogatorios.map((t) => t.suspeito));

  return (
    /**
     * A sala ocupa exatamente a altura da janela e não rola: o quadro é o
     * elemento elástico e se ajusta ao espaço que sobra entre cabeçalho e
     * rodapé. No celular a lista continua rolando, que é o esperado ali.
     */
    <div className="flex w-full flex-col md:h-[100dvh] md:overflow-hidden">
      {/* ---------- Cabeçalho: caso + cronômetro ---------- */}
      <header
        className="sticky top-0 z-40 shrink-0 border-b border-noite-700 bg-noite-950/85 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Aba de pasta com o número do caso */}
            <span className="manila hidden shrink-0 border-2 border-tinta px-2 py-1 text-center font-mono text-[0.68rem] leading-tight font-bold tracking-[0.14em] uppercase shadow-[3px_3px_0_0_rgba(0,0,0,0.6)] sm:block">
              Caso
              <span className="block font-maquina text-base tracking-[0.06em]">
                {numeroDoCaso(caso.id)}
              </span>
            </span>
            <div className="min-w-0">
              <p className="etiqueta truncate">
                {nomeCategoria(caso.categoria)}
                {estado.config
                  ? ` · ${nomeDificuldade(estado.config.dificuldade)}`
                  : ""}
                {online && (
                  <span className="text-ambar-400"> · sala {online.codigo}</span>
                )}
              </p>
              <h1 className="truncate font-maquina text-lg leading-tight text-papel-50 sm:text-2xl">
                {caso.titulo}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            {/* Placar da investigação: o que já foi lido e quantas perguntas sobram */}
            <div className="hidden items-center gap-5 lg:flex">
              <div className="flex flex-col items-end gap-0.5" title="Evidências analisadas">
                <span className="etiqueta">Evidências</span>
                <span className="flex items-center gap-1.5 font-maquina text-lg leading-none text-papel-50">
                  <IconeLupa className="h-4 w-4 text-ambar-400" />
                  {estado.pistasVistas.length}
                  <span className="text-papel-500">/{caso.pistas.length}</span>
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5" title="Perguntas de interrogatório restantes">
                <span className="etiqueta">Perguntas</span>
                <span className="flex gap-0.5" aria-label={`${estado.perguntasRestantes} de ${PERGUNTAS_POR_CASO} perguntas restantes`}>
                  {Array.from({ length: PERGUNTAS_POR_CASO }, (_, n) => (
                    <IconeMicrofone
                      key={n}
                      className={`h-[18px] w-[18px] ${
                        n < estado.perguntasRestantes ? "text-ambar-400" : "text-noite-600"
                      }`}
                    />
                  ))}
                </span>
              </div>
            </div>
            <Cronometro
              fimEm={fimEm}
              totalMs={(estado.config?.minutos ?? 40) * 60_000}
              onTempoEsgotado={irParaVeredito}
            />
          </div>
        </div>

        {/* Abas do celular: presas no cabeçalho, sempre à mão do polegar */}
        <div
          role="tablist"
          aria-label="Seções do caso"
          className="grid grid-cols-2 border-t border-noite-800 md:hidden"
        >
          {(
            [
              ["suspeitos", `Suspeitos · ${caso.suspeitos.length}`],
              [
                "evidencias",
                `Evidências · ${estado.pistasVistas.length}/${caso.pistas.length}`,
              ],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`border-b-2 py-2.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase transition-colors ${
                aba === id
                  ? "border-ambar-500 text-ambar-300"
                  : "border-transparent text-papel-500"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </header>

      <div className="animate-entrada mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 pt-4 pb-32 sm:px-8 md:min-h-0 md:pb-4">
        {/* ---------- Quadro (telas médias para cima) ---------- */}
        <div className="hidden min-h-0 flex-1 justify-center md:flex">
          <QuadroInvestigacao
            caso={caso}
            fotos={estado.fotosSuspeitos}
            donos={donos}
            lacradas={lacradas}
            interrogados={interrogados}
            pistasVistas={estado.pistasVistas}
            onAbrirSuspeito={(indice) => setAberto({ tipo: "suspeito", indice })}
            onAbrirPista={abrirPista}
            onAbrirBriefing={() => setAberto({ tipo: "briefing" })}
          />
        </div>

        {/* ---------- Lista equivalente no celular ---------- */}
        <div className="flex flex-col gap-5 md:hidden">
          {/* O caso, como a pasta de cartolina do quadro */}
          <button
            type="button"
            onClick={() => setAberto({ tipo: "briefing" })}
            className="manila relative flex flex-col items-start gap-1.5 border-2 border-tinta px-4 pt-3 pb-3.5 text-left shadow-[4px_4px_0_0_rgba(0,0,0,0.6)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <span className="font-mono text-[0.68rem] font-bold tracking-[0.22em] text-sangue-600 uppercase">
              Caso {numeroDoCaso(caso.id)} · toque para o briefing
            </span>
            <span className="line-clamp-2 font-mono text-[0.8rem] leading-snug text-tinta/80">
              {caso.contexto}
            </span>
          </button>

          {aba === "suspeitos" && (
          <section className="animate-entrada flex flex-col gap-3">
            <h2 className="sr-only">Suspeitos</h2>
            <div className="grid grid-cols-2 gap-3">
              {caso.suspeitos.map((s, i) => (
                <button
                  key={s.nome}
                  type="button"
                  onClick={() => setAberto({ tipo: "suspeito", indice: i })}
                  className={`papelzinho relative flex flex-col gap-1.5 p-2 pb-2.5 text-left active:scale-[0.98] ${
                    i % 2 ? "rotate-[0.8deg]" : "-rotate-[0.8deg]"
                  }`}
                >
                  <RetratoSuspeito
                    suspeito={s}
                    fotoId={estado.fotosSuspeitos[i]}
                    className="aspect-square w-full"
                  />
                  <span className="truncate font-maquina text-[0.95rem] leading-tight text-tinta">
                    {s.nome}
                  </span>
                  <span className="truncate font-mono text-[0.65rem] tracking-[0.08em] text-tinta/55 uppercase">
                    {s.ocupacao ?? "Abrir ficha"}
                  </span>
                  {interrogados.has(s.nome) && (
                    <span
                      className="carimbo absolute top-3 right-2 bg-papel-50/80 text-[0.62rem]"
                      style={{ "--giro": "10deg" } as React.CSSProperties}
                    >
                      Ouvido
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
          )}

          {aba === "evidencias" && (
          <section className="animate-entrada flex flex-col gap-3">
            <h2 className="sr-only">Evidências</h2>
            <div className="flex flex-col gap-2.5">
              {caso.pistas.map((p, i) => {
                const vista = estado.pistasVistas.includes(p.id);
                const lacrada = lacradas.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => abrirPista(p.id)}
                    className="papelzinho relative flex items-start gap-3 px-3.5 py-3 text-left active:scale-[0.99]"
                  >
                    <IconePista tipo={p.tipo} className="mt-0.5 h-6 w-6 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block pr-14 font-mono text-[0.9rem] leading-snug font-bold text-tinta">
                        {p.titulo}
                      </span>
                      <span className="mt-1 line-clamp-2 font-mono text-[0.75rem] leading-snug text-tinta/65">
                        {donos[p.id]
                          ? lacrada
                            ? `Arquivo lacrado. Só ${donos[p.id]} pode abrir.`
                            : "Arquivo secreto seu. Só você vê o que tem aqui."
                          : p.tipo === "foto" && p.legendaFoto
                            ? p.legendaFoto
                            : p.conteudo}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-tinta/50 uppercase">
                        {ROTULO_TIPO[p.tipo]} · {numeroArquivo(i, caso.pistas.length)}
                        {donos[p.id] && (
                          <span className="bg-sangue-500 px-1.5 py-px text-papel-50">
                            Só {donos[p.id]}
                          </span>
                        )}
                      </span>
                    </span>
                    {vista && (
                      <span
                        className="carimbo absolute top-2.5 right-2 text-[0.6rem]"
                        style={{ "--giro": "8deg" } as React.CSSProperties}
                      >
                        Analisado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
          )}
        </div>

        {/* ---------- Ações (computador) ---------- */}
        <footer className="hidden shrink-0 items-center justify-between gap-4 border-t-2 border-noite-700 pt-3.5 md:flex">
          {confirmandoVeredito || confirmandoPulo ? (
            <div className="animate-entrada flex w-full items-center justify-between gap-4">
              <p className="font-mono text-sm text-papel-100">
                {confirmandoVeredito
                  ? "Encerrar a investigação agora? Os arquivos não podem ser reabertos depois do veredito."
                  : "Descartar este caso e gerar outro? O cronômetro continua correndo."}
              </p>
              <div className="flex shrink-0 gap-3">
                <Botao
                  variante="fantasma"
                  onClick={() => {
                    setConfirmandoVeredito(false);
                    setConfirmandoPulo(false);
                  }}
                >
                  Voltar ao caso
                </Botao>
                {confirmandoVeredito ? (
                  <Botao onClick={irParaVeredito}>
                    <IconeSelo className="h-4 w-4" />
                    Sim, encerrar
                  </Botao>
                ) : (
                  <Botao onClick={() => dispatch({ tipo: "PULAR_CASO" })}>
                    Pular caso
                  </Botao>
                )}
              </div>
            </div>
          ) : (
            <>
              <Botao
                variante="fantasma"
                onClick={() => setConfirmandoPulo(true)}
                title="Descarta este caso e gera outro; o cronômetro continua correndo."
              >
                Já conheço este caso, pular
              </Botao>
              <Botao onClick={() => setConfirmandoVeredito(true)} className="px-7">
                <IconeSelo className="h-4 w-4" />
                Estamos prontos para o veredito
              </Botao>
            </>
          )}
        </footer>
      </div>

      {/* ---------- Ações (celular): barra presa embaixo ----------
          Vai para o <body> pelo mesmo motivo das janelas (ver ModalBase):
          dentro do bloco animado da troca de fase, `fixed` sairia do lugar.
          A sala só existe no navegador, então `document` sempre está lá. */}
      {createPortal(
      <nav
        aria-label="Ações da investigação"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-noite-700 bg-noite-950/95 px-4 pt-3 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {confirmandoVeredito ? (
          <div className="animate-entrada flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-papel-100">
              Encerrar agora? Os arquivos não podem ser reabertos depois do
              veredito.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Botao
                variante="fantasma"
                onClick={() => setConfirmandoVeredito(false)}
              >
                Voltar
              </Botao>
              <Botao onClick={irParaVeredito}>Encerrar</Botao>
            </div>
          </div>
        ) : confirmandoPulo ? (
          <div className="animate-entrada flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-papel-100">
              Descartar este caso e gerar outro? O cronômetro continua correndo.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Botao
                variante="fantasma"
                onClick={() => setConfirmandoPulo(false)}
              >
                Voltar
              </Botao>
              <Botao onClick={() => dispatch({ tipo: "PULAR_CASO" })}>
                Pular caso
              </Botao>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Botao
              variante="secundario"
              onClick={() => setConfirmandoPulo(true)}
              className="shrink-0 px-4"
            >
              Pular
            </Botao>
            <Botao
              onClick={() => setConfirmandoVeredito(true)}
              className="flex-1"
            >
              Ir para o veredito
            </Botao>
          </div>
        )}
      </nav>,
      document.body,
      )}

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
          bloqueado={papel.online}
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
