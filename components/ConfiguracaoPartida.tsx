"use client";

import { useState, type ReactNode } from "react";
import Botao from "./Botao";
import CartaoSala from "./CartaoSala";
import {
  IconeCooperativo,
  IconeCronometro,
  IconeDuelo,
  IconePasta,
  IconeVoltar,
} from "./Icones";
import IconeCategoria from "./IconesCategoria";
import RetratoJogador from "./RetratoJogador";
import TelaEspera from "./TelaEspera";
import {
  CATEGORIAS,
  DIFICULDADES,
  MAX_MINUTOS,
  MIN_MINUTOS,
  TEMPOS_PADRAO,
} from "@/lib/categorias";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import { somCarimbo, somTecla } from "@/lib/efeitos";
import { mesmaConfig } from "@/lib/proximoCaso";
import type { Categoria, Dificuldade, ModoJogo } from "@/lib/tipos";

const MODOS: {
  id: ModoJogo;
  nome: string;
  curta: string;
  icone: ReactNode;
}[] = [
  {
    id: "duelo",
    nome: "Duelo",
    curta: "Dois arquivos secretos para cada um. Duas versões, o júri compara.",
    icone: <IconeDuelo className="h-6 w-6" />,
  },
  {
    id: "cooperativo",
    nome: "Cooperativo",
    curta: "Tudo em mesa aberta. Uma teoria da dupla contra o caso.",
    icone: <IconeCooperativo className="h-6 w-6" />,
  },
];

/** Letra de arquivo de cada categoria, como as gavetas de um fichário. */
const GAVETAS = ["A", "B", "C", "D"];

/** Bloco numerado do formulário: "01 · Natureza do crime". */
function Secao({
  numero,
  titulo,
  children,
  className = "",
}: {
  numero: string;
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex min-h-0 flex-col gap-2.5 ${className}`}>
      <h3 className="flex items-baseline gap-2.5">
        <span className="font-maquina text-sm text-ambar-400">{numero}</span>
        <span className="etiqueta text-papel-300">{titulo}</span>
        <span className="h-px flex-1 translate-y-[-3px] border-b border-dashed border-noite-600" />
      </h3>
      {children}
    </section>
  );
}

/**
 * Requisição de abertura de caso. No computador cabe numa tela só, sem
 * rolagem: as categorias à esquerda, formato, sigilo e prazo à direita. No
 * celular vira uma coluna com o botão de abrir sempre preso embaixo.
 */
export default function ConfiguracaoPartida() {
  const { estado, dispatch, sairDaSala } = useJogo();
  const papel = usePapel();

  const [categoria, setCategoria] = useState<Categoria | null>(
    estado.config?.categoria ?? null,
  );
  // `minutos` guarda o atalho escolhido; `personalizado` só vale no modo livre.
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

  const definicaoDificuldade = DIFICULDADES.find((d) => d.id === dificuldade);

  /** O caso adiantado no resultado anterior serve para estas escolhas? */
  const casoProntoNaHora = Boolean(
    estado.casoPreparado &&
      categoria &&
      mesmaConfig(estado.casoPreparado.config, {
        categoria,
        dificuldade,
        modo,
        minutos: minutosFinais ?? 0,
      }),
  );
  const resumo = [
    CATEGORIAS.find((c) => c.id === categoria)?.nome ?? "Escolha a natureza do crime",
    MODOS.find((m) => m.id === modo)?.nome,
    definicaoDificuldade?.sigilo,
    minutosFinais !== null ? `${minutosFinais} min` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 sm:px-8 lg:h-[100dvh] lg:flex-none lg:overflow-hidden">
      {/* ---------- Cabeçalho do formulário ---------- */}
      <header className="animate-entrada flex items-end justify-between gap-4 border-b-2 border-noite-700 pt-5 pb-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="etiqueta">Formulário 02 · Requisição de investigação</span>
          <h1 className="font-maquina text-3xl leading-none text-papel-50 sm:text-4xl">
            Abrir novo caso
          </h1>
        </div>

        {/* Investigadores designados */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <span className="etiqueta block">Designados</span>
            <span className="font-mono text-sm text-papel-100">
              {estado.jogador1.split(" ").pop()} × {estado.jogador2.split(" ").pop()}
            </span>
          </div>
          <div className="flex">
            <RetratoJogador jogador={1} formato="selo" className="h-11 w-11 -rotate-3 sm:h-12 sm:w-12" />
            <RetratoJogador jogador={2} formato="selo" className="-ml-2 h-11 w-11 rotate-3 sm:h-12 sm:w-12" />
          </div>
        </div>
      </header>

      {papel.online && (
        <div className="pt-4">
          <CartaoSala />
        </div>
      )}

      {/* ---------- Formulário ---------- */}
      <div className="cascata grid flex-1 gap-5 py-5 lg:min-h-0 lg:grid-cols-[1.2fr_1fr] lg:grid-rows-[minmax(0,1fr)] lg:gap-7">
        <Secao numero="01" titulo="Natureza do crime" className="lg:h-full">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:gap-4">
            {CATEGORIAS.map((c, i) => {
              const ativo = categoria === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (categoria !== c.id) somCarimbo(0.55);
                    setCategoria(c.id);
                  }}
                  aria-pressed={ativo}
                  className="cartao group flex flex-col justify-between gap-3 overflow-hidden p-3.5 sm:p-5"
                >
                  <span className="flex items-start justify-between">
                    <span className="font-mono text-[0.68rem] tracking-[0.2em] text-papel-500 uppercase">
                      Gaveta {GAVETAS[i]}
                    </span>
                    {ativo && (
                      <span
                        className="carimbo carimbo-claro animate-carimbar -mt-1 -mr-1 text-[0.6rem] sm:text-[0.7rem]"
                        style={{ "--giro": "9deg" } as React.CSSProperties}
                      >
                        Aberto
                      </span>
                    )}
                  </span>

                  <IconeCategoria
                    categoria={c.id}
                    className="h-12 w-12 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
                  />

                  <span className="flex flex-col gap-1">
                    <span
                      className={`font-maquina text-[1.05rem] leading-tight [overflow-wrap:anywhere] sm:text-xl lg:text-2xl ${
                        ativo ? "text-ambar-300" : "text-papel-50"
                      }`}
                    >
                      {c.nome}
                    </span>
                    <span className="hidden text-xs leading-relaxed text-papel-300 sm:block lg:text-[0.8rem]">
                      {c.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Secao>

        <div className="flex flex-col gap-5 lg:min-h-0 lg:justify-between">
          <Secao numero="02" titulo="Formato da investigação">
            <div className="grid grid-cols-2 gap-3">
              {MODOS.map((m) => {
                const ativo = modo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => {
                      somTecla();
                      setModo(m.id);
                    }}
                    className="cartao flex flex-col gap-1.5 p-3.5 sm:p-4"
                  >
                    <span className={`flex items-center gap-2 ${ativo ? "text-ambar-300" : "text-papel-100"}`}>
                      {m.icone}
                      <span className="font-maquina text-lg leading-none">{m.nome}</span>
                    </span>
                    <span className="text-[0.72rem] leading-snug text-papel-300 sm:text-xs">
                      {m.curta}
                    </span>
                  </button>
                );
              })}
            </div>
          </Secao>

          <Secao numero="03" titulo="Nível de sigilo">
            <div className="grid grid-cols-3 gap-3">
              {DIFICULDADES.map((d, i) => {
                const ativo = dificuldade === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={ativo}
                    aria-label={`${d.nome}: ${d.descricao}`}
                    title={d.descricao}
                    onClick={() => {
                      somTecla();
                      setDificuldade(d.id);
                    }}
                    className="cartao flex flex-col items-start gap-2 p-3 sm:p-3.5"
                  >
                    <span className="flex gap-1" aria-hidden="true">
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          className={`h-2 w-4 -skew-x-12 border border-tinta ${
                            n <= i ? (ativo ? "bg-sangue-500" : "bg-papel-500") : "bg-noite-700"
                          }`}
                        />
                      ))}
                    </span>
                    <span
                      className={`font-maquina text-[0.78rem] leading-tight tracking-[0.04em] uppercase sm:text-sm ${
                        ativo ? "text-sangue-400" : "text-papel-100"
                      }`}
                    >
                      {d.sigilo}
                    </span>
                    <span className="font-mono text-[0.68rem] tracking-[0.12em] text-papel-500 uppercase">
                      {d.nome}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* A descrição completa só do nível marcado, para não lotar a tela */}
            <p className="min-h-[2.5em] text-[0.75rem] leading-snug text-papel-300">
              {definicaoDificuldade?.descricao}
            </p>
          </Secao>

          <Secao numero="04" titulo="Prazo da investigação">
            <div className="grid grid-cols-3 gap-3">
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
                    className="cartao flex flex-col gap-1 p-3 sm:p-3.5"
                  >
                    <span className={`flex items-center gap-1.5 ${ativo ? "text-ambar-300" : "text-papel-100"}`}>
                      <IconeCronometro className="h-4 w-4 shrink-0" />
                      <span className="font-maquina text-base leading-none sm:text-lg">{t.rotulo}</span>
                    </span>
                    <span className="text-[0.7rem] text-papel-500">{t.nota}</span>
                  </button>
                );
              })}

              {modoPersonalizado ? (
                // Já escolhido: vira um campo para digitar os minutos.
                <label className="cartao ativo flex cursor-text flex-col gap-1 p-3 sm:p-3.5">
                  <span className="flex items-baseline gap-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={MIN_MINUTOS}
                      max={MAX_MINUTOS}
                      value={personalizado}
                      autoFocus
                      onChange={(e) => setPersonalizado(e.target.value)}
                      className="w-14 border-b-2 border-ambar-400 bg-transparent font-maquina text-lg leading-none text-ambar-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Minutos de investigação"
                    />
                    <span className="font-mono text-xs text-papel-300">min</span>
                  </span>
                  <span className={`text-[0.7rem] ${personalizadoValido ? "text-papel-500" : "text-sangue-400"}`}>
                    {personalizadoValido ? "Você define" : `De ${MIN_MINUTOS} a ${MAX_MINUTOS}`}
                  </span>
                </label>
              ) : (
                <button
                  type="button"
                  aria-pressed={false}
                  aria-label="Tempo personalizado"
                  onClick={() => setModoPersonalizado(true)}
                  className="cartao flex flex-col gap-1 p-3 sm:p-3.5"
                >
                  <span className="font-maquina text-base leading-none text-papel-100 sm:text-lg">
                    Outro
                  </span>
                  <span className="text-[0.7rem] text-papel-500">Você define</span>
                </button>
              )}
            </div>
          </Secao>
        </div>
      </div>

      {/* ---------- Rodapé: resumo e ação ----------
          No celular gruda embaixo: o botão de abrir fica sempre à mão. */}
      <footer
        className="sticky bottom-0 z-30 -mx-4 flex items-center justify-between gap-3 border-t-2 border-noite-700 bg-noite-950/95 px-4 pt-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-4 lg:pb-5 lg:backdrop-blur-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Botao
            variante="fantasma"
            onClick={() =>
              papel.online
                ? sairDaSala()
                : dispatch({ tipo: "IR_PARA", fase: "menu" })
            }
            className="shrink-0 px-2"
            aria-label={papel.online ? "Sair da sala" : "Voltar ao menu"}
          >
            <IconeVoltar />
            <span className="hidden sm:inline">{papel.online ? "Sair da sala" : "Menu"}</span>
          </Botao>
          <p className="hidden truncate font-mono text-sm text-papel-300 md:block">
            {resumo}
          </p>
        </div>

        {casoProntoNaHora && (
          <span className="hidden shrink-0 items-center gap-1.5 font-mono text-xs text-ambar-300 sm:flex">
            <span className="h-2 w-2 animate-pulse bg-ambar-400" />
            Caso já preparado: abre na hora
          </span>
        )}

        <Botao
          onClick={iniciar}
          disabled={!pronto}
          className={`flex-1 sm:flex-none sm:px-7 ${pronto ? "animate-brilho" : ""}`}
        >
          <IconePasta />
          {faltaConvidado
            ? `Aguardando ${estado.jogador2.split(" ").pop()}`
            : categoria
              ? "Abrir o caso"
              : "Escolha o crime"}
        </Botao>
      </footer>
    </div>
  );
}
