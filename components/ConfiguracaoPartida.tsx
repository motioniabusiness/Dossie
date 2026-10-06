"use client";

import { useState } from "react";
import Botao from "./Botao";
import IconeCategoria from "./IconesCategoria";
import {
  CATEGORIAS,
  DIFICULDADES,
  MAX_MINUTOS,
  MIN_MINUTOS,
  TEMPOS_PADRAO,
} from "@/lib/categorias";
import CartaoSala from "./CartaoSala";
import TelaEspera from "./TelaEspera";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import type { Categoria, Dificuldade, ModoJogo } from "@/lib/tipos";

const MODOS: { id: ModoJogo; nome: string; descricao: string }[] = [
  {
    id: "duelo",
    nome: "Duelo",
    descricao:
      "Cada um recebe dois arquivos secretos e escreve a sua própria versão. O júri compara e aponta quem chegou mais perto.",
  },
  {
    id: "cooperativo",
    nome: "Cooperativo",
    descricao:
      "Todos os arquivos são de mesa aberta e vocês entregam uma teoria só. A nota é da dupla, contra o caso.",
  },
];

export default function ConfiguracaoPartida() {
  const { estado, dispatch, sairDaSala } = useJogo();
  const papel = usePapel();

  const [categoria, setCategoria] = useState<Categoria | null>(
    estado.config?.categoria ?? null,
  );
  // `minutos` guarda o preset selecionado; `personalizado` só é usado no modo livre.
  const [minutos, setMinutos] = useState<number | null>(
    estado.config?.minutos ?? 40,
  );
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  const [personalizado, setPersonalizado] = useState("45");
  const [dificuldade, setDificuldade] = useState<Dificuldade>(
    estado.config?.dificuldade ?? "medio",
  );
  const [modo, setModo] = useState<ModoJogo>(estado.config?.modo ?? "duelo");

  const minutosPersonalizados = Number.parseInt(personalizado, 10);
  const personalizadoValido =
    Number.isFinite(minutosPersonalizados) &&
    minutosPersonalizados >= MIN_MINUTOS &&
    minutosPersonalizados <= MAX_MINUTOS;

  const minutosFinais = modoPersonalizado
    ? personalizadoValido
      ? minutosPersonalizados
      : null
    : minutos;

  /** À distância, só começa com os dois na sala. */
  const faltaConvidado = papel.online && !estado.convidadoPresente;
  const pronto =
    categoria !== null && minutosFinais !== null && !faltaConvidado;

  function iniciar() {
    if (!categoria || minutosFinais === null) return;
    dispatch({
      tipo: "DEFINIR_CONFIG",
      config: { categoria, minutos: minutosFinais, dificuldade, modo },
    });
    dispatch({ tipo: "IR_PARA", fase: "carregando" });
  }

  // Quem entrou pelo código espera: o caso é escolhido no aparelho de quem
  // criou a sala, e os dois conversam pela ligação enquanto isso.
  if (papel.online && !papel.anfitriao) {
    return (
      <TelaEspera
        vezDe={1}
        titulo={`${estado.jogador1} está escolhendo o caso`}
        texto="Categoria, dificuldade e tempo são definidos no aparelho de quem criou a sala. Assim que a investigação começar, o quadro abre aqui sozinho."
      />
    );
  }

  return (
    <div className="cascata mx-auto flex w-full max-w-[1500px] flex-col justify-center gap-6 px-4 pt-6 pb-0 sm:gap-8 sm:px-8 sm:pb-6 md:min-h-[100dvh]">
      <header className="flex flex-col gap-3">
        <span className="etiqueta">Etapa 2 · Parâmetros da investigação</span>
        <h2 className="font-mono text-2xl tracking-[0.08em] text-papel-50 sm:text-3xl">
          Abrir novo caso
        </h2>
        <p className="text-sm text-papel-300">
          <span className="text-ambar-400">{estado.jogador1}</span>
          <span className="mx-2 text-papel-500">vs</span>
          <span className="text-ambar-400">{estado.jogador2}</span>
        </p>
      </header>

      <CartaoSala />

      {/* ---------- Categoria ---------- */}
      <section className="flex flex-col gap-3">
        <h3 className="etiqueta">Categoria do caso</h3>
        {/* No celular vira grade 2x2 só com ícone e nome: as descrições
            empurravam o botão de iniciar para três telas abaixo. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {CATEGORIAS.map((c) => {
            const ativo = categoria === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                aria-pressed={ativo}
                aria-label={c.nome}
                className={`painel group flex flex-col items-start gap-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,1)] sm:flex-row sm:gap-4 sm:p-5 xl:flex-col ${
                  ativo
                    ? "border-ambar-500/70 bg-ambar-500/[0.07] shadow-[0_0_24px_-8px_rgba(227,171,82,0.35)]"
                    : "hover:border-noite-500"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 transition-colors ${
                    ativo
                      ? "text-ambar-400"
                      : "text-papel-500 group-hover:text-papel-300"
                  }`}
                >
                  <IconeCategoria categoria={c.id} />
                </span>
                <span className="flex flex-col gap-1">
                  <span
                    className={`text-sm font-medium ${
                      ativo ? "text-papel-50" : "text-papel-100"
                    }`}
                  >
                    {c.nome}
                  </span>
                  <span className="hidden text-xs leading-relaxed text-papel-500 sm:block">
                    {c.descricao}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Modo ---------- */}
      <section className="flex flex-col gap-3">
        <h3 className="etiqueta">Como vão jogar</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {MODOS.map((m) => {
            const ativo = modo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={ativo}
                aria-label={m.nome}
                onClick={() => setModo(m.id)}
                className={`painel flex flex-col gap-2 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${
                  ativo
                    ? "border-ambar-500/70 bg-ambar-500/[0.07] shadow-[0_0_24px_-8px_rgba(227,171,82,0.35)]"
                    : "hover:border-noite-500"
                }`}
              >
                <span
                  className={`font-mono text-base ${
                    ativo ? "text-ambar-300" : "text-papel-100"
                  }`}
                >
                  {m.nome}
                </span>
                <span className="text-[0.6875rem] leading-relaxed text-papel-500 sm:text-xs">
                  {m.descricao}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Dificuldade ---------- */}
      <section className="flex flex-col gap-3">
        <h3 className="etiqueta">Dificuldade do caso</h3>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {DIFICULDADES.map((d, i) => {
            const ativo = dificuldade === d.id;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={ativo}
                aria-label={d.nome}
                onClick={() => setDificuldade(d.id)}
                className={`painel flex flex-col gap-2 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${
                  ativo
                    ? "border-ambar-500/70 bg-ambar-500/[0.07] shadow-[0_0_24px_-8px_rgba(227,171,82,0.35)]"
                    : "hover:border-noite-500"
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  {/* Três marcas: quantas acesas indica o nível. */}
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 w-4 rounded-full sm:w-5 ${
                        n <= i
                          ? ativo
                            ? "bg-ambar-400"
                            : "bg-papel-500"
                          : "bg-noite-700"
                      }`}
                    />
                  ))}
                </span>
                <span
                  className={`font-mono text-base ${
                    ativo ? "text-ambar-300" : "text-papel-100"
                  }`}
                >
                  {d.nome}
                </span>
                <span className="hidden text-xs leading-relaxed text-papel-500 sm:block">
                  {d.descricao}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- Tempo ---------- */}
      <section className="flex flex-col gap-3">
        <h3 className="etiqueta">Tempo de investigação</h3>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">
          {TEMPOS_PADRAO.map((t) => {
            const ativo = !modoPersonalizado && minutos === t.minutos;
            return (
              <button
                key={t.minutos}
                type="button"
                aria-pressed={ativo}
                aria-label={`${t.minutos} minutos`}
                onClick={() => {
                  setModoPersonalizado(false);
                  setMinutos(t.minutos);
                }}
                className={`painel flex flex-col gap-1 px-3 py-3 text-left transition-all duration-200 sm:min-w-36 sm:px-5 ${
                  ativo
                    ? "border-ambar-500/70 bg-ambar-500/[0.07]"
                    : "hover:border-noite-500"
                }`}
              >
                <span
                  className={`font-mono text-base ${
                    ativo ? "text-ambar-300" : "text-papel-100"
                  }`}
                >
                  {t.rotulo}
                </span>
                <span className="text-xs text-papel-500">{t.nota}</span>
              </button>
            );
          })}

          <button
            type="button"
            aria-pressed={modoPersonalizado}
            aria-label="Tempo personalizado"
            onClick={() => setModoPersonalizado(true)}
            className={`painel flex flex-col gap-1 px-3 py-3 text-left transition-all duration-200 sm:min-w-36 sm:px-5 ${
              modoPersonalizado
                ? "border-ambar-500/70 bg-ambar-500/[0.07]"
                : "hover:border-noite-500"
            }`}
          >
            <span
              className={`font-mono text-base ${
                modoPersonalizado ? "text-ambar-300" : "text-papel-100"
              }`}
            >
              <span className="sm:hidden">Outro</span>
              <span className="hidden sm:inline">Personalizado</span>
            </span>
            <span className="text-xs text-papel-500">Você define</span>
          </button>
        </div>

        {modoPersonalizado && (
          <div className="animate-entrada flex flex-wrap items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_MINUTOS}
              max={MAX_MINUTOS}
              value={personalizado}
              onChange={(e) => setPersonalizado(e.target.value)}
              className="campo w-28 font-mono"
              aria-label="Minutos de investigação"
            />
            <span className="text-sm text-papel-300">minutos</span>
            {!personalizadoValido && (
              <span className="text-xs text-sangue-400">
                Escolha um valor entre {MIN_MINUTOS} e {MAX_MINUTOS}.
              </span>
            )}
          </div>
        )}
      </section>

      {/* No celular o rodapé gruda embaixo: o botão de iniciar fica sempre
          visível, sem precisar rolar até o fim da página. */}
      <footer
        className="sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-3 border-t border-noite-700 bg-noite-950/95 px-4 pt-3 backdrop-blur-md sm:static sm:mx-0 sm:flex-wrap sm:gap-4 sm:bg-transparent sm:px-0 sm:pt-5 sm:pb-0 sm:backdrop-blur-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Botao
          variante="fantasma"
          onClick={() =>
            papel.online
              ? sairDaSala()
              : dispatch({ tipo: "IR_PARA", fase: "menu" })
          }
          className="shrink-0 px-2 sm:px-5"
        >
          ←{" "}
          <span className="hidden sm:inline">
            {papel.online ? "Sair da sala" : "Trocar investigadores"}
          </span>
          <span className="sm:hidden">{papel.online ? "Sair" : "Voltar"}</span>
        </Botao>
        <Botao
          onClick={iniciar}
          disabled={!pronto}
          className={`flex-1 sm:flex-none ${pronto ? "animate-brilho" : ""}`}
        >
          {faltaConvidado
            ? `Aguardando ${estado.jogador2.split(" ").pop()}`
            : "Iniciar Investigação"}
        </Botao>
      </footer>
    </div>
  );
}
