"use client";

import Image from "next/image";
import { useState } from "react";
import Botao from "./Botao";
import { useJogo } from "@/lib/estado/JogoProvider";

/**
 * Menu principal montado sobre a arte do escritório. A ficha de papel com os
 * campos reais fica na metade de baixo do quadro de cortiça, deixando o título
 * e as fotos de cima à mostra, com um foco escuro por baixo para dar leitura.
 *
 * A arte é posicionada num quadro 16:9 fixo, e não em `cover` de tela cheia,
 * porque as etiquetas com os nomes são presas em coordenadas relativas aos dois
 * personagens: mudar a proporção desalinharia as etiquetas.
 */
export default function MenuInicial() {
  const { estado, dispatch, criarSala, entrarNaSala } = useJogo();
  const [nome1, setNome1] = useState(estado.jogador1);
  const [nome2, setNome2] = useState(estado.jogador2);
  const [modo, setModo] = useState<ModoMenu>("local");
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nomesProntos = nome1.trim().length > 0 && nome2.trim().length > 0;
  const pronto =
    !ocupado && (modo === "entrar" ? codigo.length === 4 : nomesProntos);

  async function continuar(e: React.FormEvent) {
    e.preventDefault();
    if (!pronto) return;
    setErro(null);

    if (modo === "local") {
      dispatch({
        tipo: "DEFINIR_JOGADORES",
        jogador1: nome1.trim(),
        jogador2: nome2.trim(),
      });
      return;
    }

    setOcupado(true);
    try {
      if (modo === "criar") await criarSala(nome1.trim(), nome2.trim());
      else await entrarNaSala(codigo);
    } catch (falha) {
      setErro(
        falha instanceof Error && falha.message
          ? falha.message
          : "Não foi possível conectar à sala.",
      );
      setOcupado(false);
    }
  }

  const ficha: PropsFicha = {
    nome1,
    nome2,
    setNome1,
    setNome2,
    modo,
    setModo: (m) => {
      setModo(m);
      setErro(null);
    },
    codigo,
    setCodigo,
    pronto,
    ocupado,
    erro,
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      {/* ---------- Cenário ---------- */}
      {/**
       * 43:24 é a proporção exata da arte (1376x768): sem recorte, as etiquetas
       * em porcentagem caem sempre no mesmo ponto do desenho.
       *
       * A largura para em 1376 px, o tamanho real do arquivo. Passar disso
       * obrigava o navegador a ampliar e comia o traço fino do desenho. Ela
       * também para na altura da janela: em telas baixas (1366x700) a arte
       * inteira passava da dobra e a página ganhava rolagem.
       */}
      <div
        className="relative aspect-[43/24] w-full overflow-hidden palco:rounded-xl palco:border palco:border-noite-700"
        style={{ maxWidth: "min(1376px, calc(100dvh * 43 / 24))" }}
      >
        {/* Arte e etiquetas no mesmo bloco animado: assim o leve movimento de
            câmera não desgruda os nomes dos personagens. */}
        <div className="animate-panorama absolute inset-0">
          <Image
            src="/menu.jpg"
            alt="Escritório de investigação com os dois detetives diante do quadro de evidências"
            width={1376}
            height={768}
            priority
            /**
             * Sem passar pelo otimizador: ele recomprimia a arte com qualidade
             * 75 e ainda pedia uma variante de 3840 px, ampliada a partir de
             * 1376. Servindo o arquivo original, o desenho chega exatamente
             * como saiu do Gemini. São 850 KB carregados uma vez e cacheados.
             */
            unoptimized
            className="h-full w-full object-cover"
          />
          <span
            className="cracha animate-entrada absolute hidden -rotate-2 palco:block"
            style={{ left: "9%", top: "80%", animationDelay: "0.5s" }}
          >
            Detetive Claudio
          </span>
          <span
            className="cracha animate-entrada absolute hidden rotate-2 palco:block"
            style={{ right: "9%", top: "80%", animationDelay: "0.62s" }}
          >
            Detetive Bianca
          </span>
        </div>

        {/* Vinheta: encaixa a arte no fundo da página e aumenta o contraste */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_45%,transparent_35%,rgba(7,10,16,0.55)_78%,rgba(7,10,16,0.95)_100%)]" />
        {/* Foco escuro atrás da ficha, para ela destacar do quadro */}
        <div
          className="pointer-events-none absolute inset-0 hidden palco:block"
          style={{
            backgroundImage:
              "radial-gradient(28% 42% at 50% 64%, rgba(7,10,16,0.8) 45%, transparent 100%)",
          }}
        />

        {/* ---------- Ficha real, na metade de baixo do quadro ---------- */}
        <form
          onSubmit={continuar}
          className="papelzinho animate-assentar absolute left-1/2 hidden w-[min(30%,26rem)] min-w-72 -translate-x-1/2 -translate-y-1/2 rounded-sm px-5 py-5 palco:block"
          // 56%: com os seletores do modo à distância a ficha cresceu, e mais
          // abaixo ela passava da borda da arte nas telas de 650 px de altura.
          style={{ top: "56%" }}
        >
          <span className="pino pino-ambar" aria-hidden="true" />
          <FichaDeDupla {...ficha} />
        </form>
      </div>

      {/* ---------- Mesma ficha, embaixo da arte, no celular ---------- */}
      <form
        onSubmit={continuar}
        className="papelzinho animate-entrada -mt-10 w-[calc(100%-2.5rem)] max-w-md rounded-sm px-5 py-5 palco:hidden"
      >
        <FichaDeDupla {...ficha} />
      </form>
    </div>
  );
}

/**
 * `local`: os dois no mesmo aparelho. `criar`: este aparelho abre uma sala à
 * distância. `entrar`: este aparelho entra na sala de quem já criou.
 */
type ModoMenu = "local" | "criar" | "entrar";

interface PropsFicha {
  nome1: string;
  nome2: string;
  setNome1: (v: string) => void;
  setNome2: (v: string) => void;
  modo: ModoMenu;
  setModo: (m: ModoMenu) => void;
  codigo: string;
  setCodigo: (v: string) => void;
  pronto: boolean;
  ocupado: boolean;
  erro: string | null;
}

/** Botões lado a lado em que só um fica marcado, no estilo da ficha. */
function Alternador<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { id: T; nome: string }[];
  valor: T;
  onChange: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="grid grid-flow-col gap-1 rounded-sm border border-noite-900/20 bg-noite-900/[0.05] p-1"
    >
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={valor === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-[2px] px-2 py-1.5 font-mono text-[0.6875rem] tracking-[0.06em] transition-colors ${
            valor === o.id
              ? "bg-noite-900 text-papel-50"
              : "text-noite-900/60 hover:text-noite-900"
          }`}
        >
          {o.nome}
        </button>
      ))}
    </div>
  );
}

/** Conteúdo da ficha. Mesmo bloco no desktop (sobre a arte) e no celular. */
function FichaDeDupla({
  nome1,
  nome2,
  setNome1,
  setNome2,
  modo,
  setModo,
  codigo,
  setCodigo,
  pronto,
  ocupado,
  erro,
}: PropsFicha) {
  const distancia = modo !== "local";

  return (
    <div className="cascata flex flex-col gap-3.5">
      <div className="flex flex-col gap-1 text-center">
        <span className="font-mono text-[0.625rem] tracking-[0.22em] text-sangue-600 uppercase">
          Novo caso
        </span>
        <span className="font-mono text-lg leading-tight text-noite-900">
          Quem investiga hoje?
        </span>
      </div>

      <Alternador
        rotulo="Onde vocês estão"
        valor={distancia ? "distancia" : "local"}
        onChange={(v) => setModo(v === "local" ? "local" : "criar")}
        opcoes={[
          { id: "local", nome: "Mesmo aparelho" },
          { id: "distancia", nome: "À distância" },
        ]}
      />

      {distancia && (
        <Alternador
          rotulo="Criar ou entrar"
          valor={modo}
          onChange={setModo}
          opcoes={[
            { id: "criar", nome: "Criar sala" },
            { id: "entrar", nome: "Tenho um código" },
          ]}
        />
      )}

      {modo === "entrar" ? (
        <div className="flex flex-col gap-1">
          <label
            htmlFor="codigo-sala"
            className="font-mono text-[0.5625rem] tracking-[0.18em] text-noite-900/55 uppercase"
          >
            Código da sala
          </label>
          <input
            id="codigo-sala"
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 4),
              )
            }
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            placeholder="ABCD"
            className="w-full rounded-sm border border-noite-900/25 bg-papel-50/70 px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] text-noite-900 uppercase outline-none transition-colors placeholder:text-noite-900/25 focus:border-sangue-600/60 focus:bg-papel-50"
          />
          <p className="text-[0.6875rem] leading-relaxed text-noite-900/55">
            Peça o código para quem criou a sala.
          </p>
        </div>
      ) : (
        <>
          <CampoNome
            id="detetive-1"
            rotulo={modo === "criar" ? "Você" : "Detetive 1"}
            placeholder="Detetive Claudio"
            valor={nome1}
            onChange={setNome1}
          />
          <CampoNome
            id="detetive-2"
            rotulo={modo === "criar" ? "Quem vai entrar" : "Detetive 2"}
            placeholder="Detetive Bianca"
            valor={nome2}
            onChange={setNome2}
          />
        </>
      )}

      {erro && (
        <p role="alert" className="text-center text-xs text-sangue-600">
          {erro}
        </p>
      )}

      <Botao
        type="submit"
        disabled={!pronto}
        className={`w-full ${pronto ? "animate-brilho" : ""}`}
      >
        {ocupado
          ? "Conectando..."
          : modo === "criar"
            ? "Criar sala"
            : modo === "entrar"
              ? "Entrar na sala"
              : "Abrir a sala de investigação"}
      </Botao>

      <p className="text-center text-[0.6875rem] leading-relaxed text-noite-900/60">
        {distancia
          ? "Cada um no seu celular, o mesmo caso ao vivo. Fiquem numa ligação para conversar."
          : "Dois analistas, o mesmo caso, uma única verdade. No fim cada um escreve a sua versão, e apenas uma chega mais perto."}
      </p>
    </div>
  );
}

function CampoNome({
  id,
  rotulo,
  placeholder,
  valor,
  onChange,
}: {
  id: string;
  rotulo: string;
  placeholder: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-mono text-[0.5625rem] tracking-[0.18em] text-noite-900/55 uppercase"
      >
        {rotulo}
      </label>
      <input
        id={id}
        value={valor}
        placeholder={placeholder}
        maxLength={24}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-noite-900/25 bg-papel-50/70 px-3 py-2 font-mono text-sm text-noite-900 outline-none transition-colors placeholder:text-noite-900/35 focus:border-sangue-600/60 focus:bg-papel-50"
      />
    </div>
  );
}
