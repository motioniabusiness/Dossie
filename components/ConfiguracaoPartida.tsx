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
import { useJogo } from "@/lib/estado/JogoProvider";
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
  const { estado, dispatch } = useJogo();

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

  const pronto = categoria !== null && minutosFinais !== null;

  function iniciar() {
    if (!categoria || minutosFinais === null) return;
    dispatch({
      tipo: "DEFINIR_CONFIG",
      config: { categoria, minutos: minutosFinais, dificuldade, modo },
    });
    // A Fase 3 troca isto pela chamada real a /api/gerar-caso.
    dispatch({ tipo: "IR_PARA", fase: "carregando" });
  }

  return (
    <div className="cascata mx-auto flex w-full max-w-[1500px] flex-col justify-center gap-6 px-5 py-6 sm:px-8 sm:gap-8 md:min-h-[100dvh]">
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

      {/* ---------- Categoria ---------- */}
      <section className="flex flex-col gap-3">
        <h3 className="etiqueta">Categoria do caso</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIAS.map((c) => {
            const ativo = categoria === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoria(c.id)}
                aria-pressed={ativo}
                aria-label={c.nome}
                className={`painel group flex items-start gap-4 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,1)] xl:flex-col ${
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
                  <span className="text-xs leading-relaxed text-papel-500">
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
        <div className="grid gap-4 sm:grid-cols-2">
          {MODOS.map((m) => {
            const ativo = modo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={ativo}
                aria-label={m.nome}
                onClick={() => setModo(m.id)}
                className={`painel flex flex-col gap-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
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
                <span className="text-xs leading-relaxed text-papel-500">
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
        <div className="grid gap-4 sm:grid-cols-3">
          {DIFICULDADES.map((d, i) => {
            const ativo = dificuldade === d.id;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={ativo}
                aria-label={d.nome}
                onClick={() => setDificuldade(d.id)}
                className={`painel flex flex-col gap-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  ativo
                    ? "border-ambar-500/70 bg-ambar-500/[0.07] shadow-[0_0_24px_-8px_rgba(227,171,82,0.35)]"
                    : "hover:border-noite-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  {/* Três marcas: quantas acesas indica o nível. */}
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className={`h-1.5 w-5 rounded-full ${
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
                <span className="text-xs leading-relaxed text-papel-500">
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
        <div className="flex flex-wrap gap-3">
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
                className={`painel flex min-w-36 flex-col gap-1 px-5 py-3 text-left transition-all duration-200 ${
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
            className={`painel flex min-w-36 flex-col gap-1 px-5 py-3 text-left transition-all duration-200 ${
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
              Personalizado
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

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-noite-700 pt-5">
        <Botao
          variante="fantasma"
          onClick={() => dispatch({ tipo: "IR_PARA", fase: "menu" })}
        >
          ← Trocar investigadores
        </Botao>
        <Botao
          onClick={iniciar}
          disabled={!pronto}
          className={pronto ? "animate-brilho" : ""}
        >
          Iniciar Investigação
        </Botao>
      </footer>
    </div>
  );
}
