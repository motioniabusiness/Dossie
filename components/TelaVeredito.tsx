"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Botao from "./Botao";
import { IconeSelo, IconeVisto } from "./Icones";
import { numeroDoCaso } from "./QuadroInvestigacao";
import RetratoJogador from "./RetratoJogador";
import RetratoSuspeito from "./RetratoSuspeito";
import TelaEspera from "./TelaEspera";
import { somCarimbo } from "@/lib/efeitos";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import type { CasoPublico } from "@/lib/tipos";

/** Mínimo para uma teoria valer avaliação, evita "foi o mordomo" e ponto. */
const MINIMO_CARACTERES = 120;

type Etapa = "passa1" | "escreve1" | "passa2" | "escreve2";

/** Palavras com peso, para o roteiro reconhecer o que o texto já cobre. */
function palavrasDe(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 5);
}

/**
 * Roteiro de um bom veredito, marcado sozinho conforme o texto avança. É uma
 * ajuda, não uma trava: o júri lê o texto inteiro de qualquer jeito.
 */
function roteiro(texto: string, caso: CasoPublico | null) {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const nomes = (caso?.suspeitos ?? []).flatMap((s) => palavrasDe(s.nome));
  const termosDePista = new Set(
    (caso?.pistas ?? []).flatMap((p) => palavrasDe(p.titulo)),
  );
  return [
    {
      titulo: "Quem",
      dica: "o nome de quem fez",
      feito: nomes.some((n) => t.includes(n)),
    },
    {
      titulo: "Como",
      dica: "o passo a passo do crime",
      feito: /\b(como|usou|trocou|colocou|pegou|levou|entrou|saiu|escondeu|envenen|matou|roubou|forjou|falsific|apagou|mentiu|esperou)/.test(t),
    },
    {
      titulo: "Por quê",
      dica: "o motivo",
      feito: /\b(porque|por causa|motivo|queria|para nao|para que|medo|divida|vinganca|herança|heranca|ciume|dinheiro)/.test(t),
    },
    {
      titulo: "Provas",
      dica: "as pistas que sustentam",
      feito: palavrasDe(t).some((p) => termosDePista.has(p)),
    },
  ];
}

/**
 * No duelo, cada jogador escreve a sua versão sem ver a do outro, com uma tela
 * neutra de "passe o aparelho" entre os dois: é o que garante o sigilo no
 * mesmo aparelho. No cooperativo existe uma teoria só, escrita a quatro mãos.
 */
export default function TelaVeredito() {
  const { estado, dispatch } = useJogo();
  const papel = usePapel();
  const cooperativo = estado.config?.modo === "cooperativo";
  const [etapa, setEtapa] = useState<Etapa>(() =>
    // À distância não há troca de mãos: cada aparelho já é de uma pessoa.
    papel.online && !cooperativo
      ? papel.eu === 2
        ? "escreve2"
        : "escreve1"
      : cooperativo
        ? "escreve1"
        : "passa1",
  );
  const [texto, setTexto] = useState("");
  /** À distância: a versão deste aparelho já saiu, mesmo antes de voltar da sala. */
  const [enviada, setEnviada] = useState(false);
  const avancou = useRef(false);
  const campo = useRef<HTMLTextAreaElement>(null);

  const escrevendo = etapa === "escreve1" ? 1 : 2;
  const nome = escrevendo === 1 ? estado.jogador1 : estado.jogador2;
  const caracteres = texto.trim().length;
  const suficiente = caracteres >= MINIMO_CARACTERES;

  const { jogador1: teoria1, jogador2: teoria2 } = estado.teorias;
  const duasSeladas = teoria1.length > 0 && teoria2.length > 0;

  // À distância, quando as duas versões estão na sala, quem criou a sala leva
  // a partida para o júri. Uma vez só, mesmo que o efeito rode de novo.
  useEffect(() => {
    if (!papel.online || cooperativo || !papel.anfitriao) return;
    if (!duasSeladas || avancou.current) return;
    avancou.current = true;
    dispatch({ tipo: "IR_PARA", fase: "resultado" });
  }, [papel.online, papel.anfitriao, cooperativo, duasSeladas, dispatch]);

  /** Insere um nome onde o cursor estiver, sem perder o resto do texto. */
  function inserir(trecho: string) {
    const el = campo.current;
    const inicio = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    const antes = texto.slice(0, inicio);
    const espaco = antes && !/\s$/.test(antes) ? " " : "";
    const novo = `${antes}${espaco}${trecho}${texto.slice(fim)}`;
    setTexto(novo);
    requestAnimationFrame(() => {
      const pos = (antes + espaco + trecho).length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  function selar() {
    if (!suficiente) return;
    const limpo = texto.trim();
    somCarimbo(1.1);

    if (papel.online && !cooperativo) {
      dispatch({
        tipo: "DEFINIR_TEORIA",
        jogador: papel.eu === 2 ? "jogador2" : "jogador1",
        texto: limpo,
      });
      setEnviada(true);
      return;
    }

    if (cooperativo) {
      // A mesma teoria vai nos dois campos: o julgamento cooperativo lê a
      // primeira, e guardar nas duas mantém a tela de resultado simples.
      dispatch({ tipo: "DEFINIR_TEORIA", jogador: "jogador1", texto: limpo });
      dispatch({ tipo: "DEFINIR_TEORIA", jogador: "jogador2", texto: limpo });
      dispatch({ tipo: "IR_PARA", fase: "resultado" });
      return;
    }

    dispatch({
      tipo: "DEFINIR_TEORIA",
      jogador: escrevendo === 1 ? "jogador1" : "jogador2",
      texto: limpo,
    });
    setTexto("");
    if (escrevendo === 1) {
      setEtapa("passa2");
    } else {
      dispatch({ tipo: "IR_PARA", fase: "resultado" });
    }
  }

  // ---------- À distância: esperas ----------
  if (papel.online) {
    const minhaJaFoi =
      enviada || (papel.eu === 2 ? teoria2 : teoria1).length > 0;

    if (cooperativo && !papel.anfitriao) {
      return (
        <TelaEspera
          vezDe={1}
          titulo={`${estado.jogador1} está escrevendo a teoria da dupla`}
          texto="No cooperativo a versão é uma só e sai do aparelho de quem criou a sala. Vão ditando pela ligação: quem fez, como fez, por que fez e quais pistas provam."
        />
      );
    }

    if (!cooperativo && minhaJaFoi) {
      return (
        <TelaEspera
          vezDe={papel.eu === 2 ? 1 : 2}
          titulo={
            duasSeladas
              ? "As duas versões estão seladas"
              : `Sua versão está selada. Falta ${papel.nomeDoOutro}`
          }
          texto={
            duasSeladas
              ? "Entregando ao júri."
              : "Ninguém lê a versão do outro antes do resultado. Assim que a outra chegar, o júri começa a ler."
          }
        />
      );
    }
  }

  // ---------- Tela neutra de troca de mãos (só no duelo) ----------
  if (etapa === "passa1" || etapa === "passa2") {
    const primeiro = etapa === "passa1";
    const proximo = primeiro ? estado.jogador1 : estado.jogador2;

    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-12">
        {/* Envelope confidencial com o retrato de quem escreve agora */}
        <div className="papelzinho animate-assentar relative w-full border-2 border-tinta px-6 pt-10 pb-7 text-center shadow-[7px_7px_0_0_rgba(0,0,0,0.5)]">
          {/* Aba do envelope */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-10 border-b-2 border-tinta/25 bg-papel-300/40"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
          <span
            className="carimbo animate-carimbar absolute top-3 right-4 text-sm"
            style={{ "--giro": "10deg" } as CSSProperties}
          >
            Confidencial
          </span>

          <div className="relative mx-auto mt-2 w-fit -rotate-2 border-2 border-tinta bg-[#f7f5ef] p-2 pb-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
            <RetratoJogador jogador={primeiro ? 1 : 2} className="h-40 w-30 border-0" />
            <span className="mt-2 block font-maquina text-sm text-tinta">{proximo}</span>
          </div>

          <h2 className="mt-6 font-maquina text-2xl leading-tight text-tinta">
            Passe o aparelho para {proximo.split(" ").pop()}
          </h2>
          <p className="mt-3 font-mono text-[0.88rem] leading-relaxed text-tinta/70">
            {primeiro
              ? "A investigação acabou. Agora cada um escreve a sua versão em separado, e ninguém lê a do outro."
              : `A versão de ${estado.jogador1} está selada. ${proximo}, sua vez: escreva sem consultar quem já escreveu.`}
          </p>

          <Botao
            onClick={() => setEtapa(primeiro ? "escreve1" : "escreve2")}
            className="mt-6 w-full"
          >
            Sou {proximo.split(" ").pop()}, estou com o aparelho
          </Botao>
        </div>
      </div>
    );
  }

  // ---------- Redação da teoria ----------
  const itens = roteiro(texto, estado.caso);
  const caso = estado.caso;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pt-5 sm:px-8 lg:h-[100dvh] lg:flex-none lg:overflow-hidden lg:pb-5">
      <header className="animate-entrada flex flex-wrap items-end justify-between gap-3 border-b-2 border-noite-700 pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="etiqueta">
            {cooperativo
              ? "Veredito da dupla · uma teoria só"
              : `Versão ${escrevendo} de 2 · privada`}
          </span>
          <h1 className="font-maquina text-2xl leading-tight text-papel-50 sm:text-3xl">
            {cooperativo
              ? `${estado.jogador1.split(" ").pop()} e ${estado.jogador2.split(" ").pop()}, o que aconteceu?`
              : `${nome}, o que aconteceu?`}
          </h1>
        </div>
        <RetratoJogador
          jogador={cooperativo ? 1 : escrevendo}
          formato="selo"
          ativo
          className="hidden h-12 w-12 sm:block"
        />
      </header>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-5 lg:min-h-0 lg:grid-cols-[1fr_17rem] lg:grid-rows-[minmax(0,1fr)]">
        {/* ---------- O relatório, em papel pautado ---------- */}
        <div className="papelzinho animate-assentar relative flex min-h-[22rem] flex-col border-2 border-tinta shadow-[7px_7px_0_0_rgba(0,0,0,0.5)] lg:min-h-0">
          <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-tinta/25 px-5 py-3">
            <span className="font-mono text-[0.72rem] font-bold tracking-[0.18em] text-tinta/60 uppercase">
              Relatório final{caso ? ` · caso ${numeroDoCaso(caso.id)}` : ""}
            </span>
            <span
              className="carimbo text-[0.7rem]"
              style={{ "--giro": "6deg" } as CSSProperties}
            >
              Confidencial
            </span>
          </div>
          <textarea
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            autoFocus
            spellCheck
            placeholder={
              cooperativo
                ? "Nós acreditamos que aconteceu assim, por causa de..."
                : "Eu acredito que aconteceu assim, por causa de..."
            }
            className="min-h-0 flex-1 resize-none bg-transparent px-5 pt-[0.35rem] font-mono text-[1rem] leading-[1.9rem] text-tinta outline-none placeholder:text-tinta/35"
            style={{
              // Pauta alinhada à altura da linha, com a margem vermelha
              backgroundImage:
                "linear-gradient(90deg, transparent 0.85rem, rgba(184,58,44,0.45) 0.85rem, rgba(184,58,44,0.45) 0.95rem, transparent 0.95rem), repeating-linear-gradient(transparent 0 1.84rem, rgba(60,90,130,0.2) 1.84rem 1.9rem)",
              backgroundAttachment: "local",
            }}
            aria-label={cooperativo ? "Teoria da dupla" : `Teoria de ${nome}`}
          />
          {/* Medidor de tinta até o mínimo */}
          <div className="flex items-center gap-3 border-t-2 border-dashed border-tinta/25 px-5 py-2.5">
            <div className="h-2 flex-1 border border-tinta/60 bg-papel-50">
              <div
                className={`h-full transition-[width] duration-300 ${suficiente ? "bg-ambar-500" : "bg-sangue-500"}`}
                style={{ width: `${Math.min(100, (caracteres / MINIMO_CARACTERES) * 100)}%` }}
              />
            </div>
            <span className={`font-mono text-xs tabular-nums ${suficiente ? "text-tinta/55" : "text-sangue-600"}`}>
              {suficiente ? `${caracteres} caracteres` : `${caracteres}/${MINIMO_CARACTERES}`}
            </span>
          </div>
        </div>

        {/* ---------- Roteiro e nomes ---------- */}
        <aside className="flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex flex-col gap-2">
            <span className="etiqueta">Um bom veredito tem</span>
            <ul className="flex flex-col gap-1.5">
              {itens.map((item) => (
                <li
                  key={item.titulo}
                  className={`flex items-center gap-2.5 border-2 px-3 py-2 transition-colors ${
                    item.feito
                      ? "border-ambar-400 bg-ambar-500/10"
                      : "border-noite-700 bg-noite-850"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                      item.feito ? "border-ambar-400 bg-ambar-400 text-tinta" : "border-noite-500"
                    }`}
                  >
                    {item.feito && <IconeVisto className="h-3.5 w-3.5" />}
                  </span>
                  <span className="font-maquina text-base leading-none text-papel-50">
                    {item.titulo}
                  </span>
                  <span className="truncate text-xs text-papel-500">{item.dica}</span>
                </li>
              ))}
            </ul>
          </div>

          {caso && (
            <div className="flex flex-col gap-2">
              <span className="etiqueta">Toque para escrever o nome</span>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {caso.suspeitos.map((s, i) => (
                  <button
                    key={s.nome}
                    type="button"
                    onClick={() => inserir(s.nome)}
                    className="cartao flex items-center gap-2.5 p-1.5 pr-3"
                  >
                    <RetratoSuspeito
                      suspeito={s}
                      fotoId={estado.fotosSuspeitos[i]}
                      className="h-9 w-9 shrink-0 border border-tinta"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[0.82rem] font-bold text-papel-100">
                        {s.nome}
                      </span>
                      {s.ocupacao && (
                        <span className="block truncate text-[0.7rem] text-papel-500">
                          {s.ocupacao}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ---------- Ação ----------
          No celular fica preso embaixo, acima do teclado. */}
      <footer
        className="sticky bottom-0 z-30 -mx-4 flex items-center justify-end gap-4 border-t-2 border-noite-700 bg-noite-950/95 px-4 pt-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <span className="hidden font-mono text-xs text-papel-500 sm:inline">
          Depois de selada, a versão não pode ser alterada.
        </span>
        <Botao onClick={selar} disabled={!suficiente} className="flex-1 sm:flex-none sm:px-7">
          <IconeSelo className="h-5 w-5" />
          {cooperativo
            ? "Entregar ao júri"
            : escrevendo === 1
              ? "Selar minha versão"
              : "Selar e entregar ao júri"}
        </Botao>
      </footer>
    </div>
  );
}
