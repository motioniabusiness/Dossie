"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  CasoPublico,
  ConfigPartida,
  FaseJogo,
  Julgamento,
  SolucaoSecreta,
  TrocaDeInterrogatorio,
} from "../tipos";

/** Quantas perguntas a dupla pode fazer por caso, e o que cada uma custa. */
export const PERGUNTAS_POR_CASO = 3;
export const CUSTO_DA_PERGUNTA_MS = 3 * 60_000;

/** Quantos arquivos ficam privados para cada detetive, no modo duelo. */
export const PISTAS_PRIVADAS_POR_JOGADOR = 2;

/**
 * Estado único da partida. v1 não tem banco de dados: vive em memória e é
 * espelhado no `sessionStorage` para sobreviver a um F5 acidental.
 */
export interface EstadoJogo {
  fase: FaseJogo;
  jogador1: string;
  jogador2: string;
  config: ConfigPartida | null;
  caso: CasoPublico | null;
  /**
   * Solução do caso cifrada pelo servidor. O cliente não consegue ler; apenas
   * devolve na hora do julgamento. Ver lib/servidor/selo.ts.
   */
  solucaoSelada: string | null;
  /** Resumos dos casos já vistos nesta sessão — enviados à IA para não repetir. */
  resumosVistos: string[];
  /**
   * Instante (epoch ms) em que o cronômetro zera. Fica no estado — e não dentro
   * do componente — para sobreviver a recarregamentos e a "pular caso".
   */
  fimEm: number | null;
  /** IDs das pistas já abertas, para marcar o cartão como analisado. */
  pistasVistas: string[];
  /** Rosto do acervo escolhido para cada suspeito, na ordem do elenco. */
  fotosSuspeitos: string[];
  /**
   * Arquivos que só um dos detetives pode abrir (modo duelo). O outro nunca vê
   * o conteúdo, o que obriga os dois a contarem um ao outro o que leram.
   */
  pistasPrivadas: { jogador1: string[]; jogador2: string[] };
  /** Perguntas de interrogatório ainda disponíveis nesta partida. */
  perguntasRestantes: number;
  /** Tudo que já foi perguntado e respondido, para exibir nas fichas. */
  interrogatorios: TrocaDeInterrogatorio[];
  /**
   * Próximo caso, gerado em segundo plano durante o veredito. Só é aproveitado
   * se a configuração da próxima partida for a mesma.
   */
  casoPreparado: {
    caso: CasoPublico;
    solucaoSelada: string;
    fotos: string[];
    retratosUsados: string[];
    config: ConfigPartida;
  } | null;
  /**
   * Rostos já usados enquanto o jogo está aberto, para não repetir entre
   * partidas seguidas. Vive no sessionStorage, então fechar o jogo zera.
   */
  retratosUsados: string[];
  teorias: { jogador1: string; jogador2: string };
  /** Modo à distância: o segundo detetive já entrou na sala. */
  convidadoPresente: boolean;
  julgamento: Julgamento | null;
  /** Solução aberta pelo servidor — só existe a partir da tela de resultado. */
  solucao: SolucaoSecreta | null;
}

/** A dupla da casa. Os campos continuam editáveis no menu. */
export const DETETIVE_1 = "Detetive Claudio";
export const DETETIVE_2 = "Detetive Bianca";

const estadoInicial: EstadoJogo = {
  fase: "menu",
  jogador1: DETETIVE_1,
  jogador2: DETETIVE_2,
  config: null,
  caso: null,
  solucaoSelada: null,
  resumosVistos: [],
  fimEm: null,
  pistasVistas: [],
  fotosSuspeitos: [],
  retratosUsados: [],
  pistasPrivadas: { jogador1: [], jogador2: [] },
  perguntasRestantes: PERGUNTAS_POR_CASO,
  interrogatorios: [],
  casoPreparado: null,
  teorias: { jogador1: "", jogador2: "" },
  convidadoPresente: false,
  julgamento: null,
  solucao: null,
};

export type AcaoJogo =
  | { tipo: "HIDRATAR"; estado: EstadoJogo }
  /** Modo à distância: o convidado chegou pelo código da sala. */
  | { tipo: "CONVIDADO_ENTROU" }
  | { tipo: "DEFINIR_JOGADORES"; jogador1: string; jogador2: string }
  | { tipo: "DEFINIR_CONFIG"; config: ConfigPartida }
  | {
      tipo: "DEFINIR_CASO";
      caso: CasoPublico;
      solucaoSelada: string;
      /** Rostos sorteados para este elenco. */
      fotos: string[];
      /** Acervo já gasto na sessão, incluindo os rostos deste caso. */
      retratosUsados: string[];
      /** Divisão dos arquivos privados; vazia no modo cooperativo. */
      pistasPrivadas: { jogador1: string[]; jogador2: string[] };
    }
  | {
      tipo: "GUARDAR_CASO_PREPARADO";
      preparado: NonNullable<EstadoJogo["casoPreparado"]>;
    }
  | {
      tipo: "REGISTRAR_INTERROGATORIO";
      troca: TrocaDeInterrogatorio;
    }
  | { tipo: "INICIAR_TEMPO"; fimEm: number }
  | { tipo: "ABRIR_PISTA"; pistaId: string }
  /** Descarta o caso atual e volta para a geração — o cronômetro continua. */
  | { tipo: "PULAR_CASO" }
  | { tipo: "IR_PARA"; fase: FaseJogo }
  | { tipo: "DEFINIR_TEORIA"; jogador: "jogador1" | "jogador2"; texto: string }
  | {
      tipo: "DEFINIR_JULGAMENTO";
      julgamento: Julgamento;
      solucao: SolucaoSecreta;
    }
  /** Novo caso: mantém nomes e histórico de casos vistos, limpa a partida. */
  | { tipo: "NOVA_PARTIDA" }
  /** Volta ao menu inicial e zera tudo. */
  | { tipo: "REINICIAR" };

function redutor(estado: EstadoJogo, acao: AcaoJogo): EstadoJogo {
  switch (acao.tipo) {
    case "HIDRATAR":
      return acao.estado;

    case "CONVIDADO_ENTROU":
      return { ...estado, convidadoPresente: true };

    case "DEFINIR_JOGADORES":
      return {
        ...estado,
        jogador1: acao.jogador1,
        jogador2: acao.jogador2,
        fase: "configuracao",
      };

    case "DEFINIR_CONFIG":
      return { ...estado, config: acao.config };

    case "DEFINIR_CASO":
      return {
        ...estado,
        caso: acao.caso,
        solucaoSelada: acao.solucaoSelada,
        fotosSuspeitos: acao.fotos,
        retratosUsados: acao.retratosUsados,
        pistasPrivadas: acao.pistasPrivadas,
        perguntasRestantes: PERGUNTAS_POR_CASO,
        interrogatorios: [],
        pistasVistas: [],
        // Consumido: sem isto, o próximo "pular caso" devolveria este mesmo.
        casoPreparado: null,
        // Guarda o resumo para que a IA não gere um caso parecido de novo.
        resumosVistos: [...estado.resumosVistos, acao.caso.resumo],
      };

    case "GUARDAR_CASO_PREPARADO":
      return { ...estado, casoPreparado: acao.preparado };

    case "REGISTRAR_INTERROGATORIO":
      return {
        ...estado,
        perguntasRestantes: Math.max(0, estado.perguntasRestantes - 1),
        interrogatorios: [...estado.interrogatorios, acao.troca],
        // A pergunta é paga com tempo de investigação.
        fimEm:
          estado.fimEm === null
            ? null
            : estado.fimEm - CUSTO_DA_PERGUNTA_MS,
      };

    case "INICIAR_TEMPO":
      return { ...estado, fimEm: acao.fimEm };

    case "ABRIR_PISTA":
      return estado.pistasVistas.includes(acao.pistaId)
        ? estado
        : { ...estado, pistasVistas: [...estado.pistasVistas, acao.pistaId] };

    case "PULAR_CASO":
      return {
        ...estado,
        fase: "carregando",
        caso: null,
        solucaoSelada: null,
        fotosSuspeitos: [],
        pistasPrivadas: { jogador1: [], jogador2: [] },
        interrogatorios: [],
        pistasVistas: [],
      };

    case "IR_PARA":
      return { ...estado, fase: acao.fase };

    case "DEFINIR_TEORIA":
      return {
        ...estado,
        teorias: { ...estado.teorias, [acao.jogador]: acao.texto },
      };

    case "DEFINIR_JULGAMENTO":
      return { ...estado, julgamento: acao.julgamento, solucao: acao.solucao };

    case "NOVA_PARTIDA":
      return {
        ...estado,
        fase: "configuracao",
        // A configuração anterior fica: a tela já abre com as mesmas escolhas,
        // e o caso adiantado (gerado com elas) entra na hora.
        config: estado.config,
        caso: null,
        solucaoSelada: null,
        fimEm: null,
        pistasVistas: [],
        fotosSuspeitos: [],
        pistasPrivadas: { jogador1: [], jogador2: [] },
        perguntasRestantes: PERGUNTAS_POR_CASO,
        interrogatorios: [],
        teorias: { jogador1: "", jogador2: "" },
        julgamento: null,
        solucao: null,
      };

    case "REINICIAR":
      // `retratosUsados` sobrevive: a regra é zerar quando o jogo fecha, e
      // fechar o jogo já limpa o sessionStorage inteiro.
      return { ...estadoInicial, retratosUsados: estado.retratosUsados };
  }
}

/** Modo à distância: em que sala este aparelho está e qual detetive ele é. */
export interface SessaoOnline {
  codigo: string;
  eu: 1 | 2;
}

/** Saúde da ligação com a sala, para avisar quando a internet oscila. */
export type Conexao = "ok" | "instavel" | "expirada";

interface ContextoJogo {
  estado: EstadoJogo;
  /**
   * No modo local aplica a ação na hora. No modo à distância publica na sala
   * e a ação só entra no estado quando volta de lá, na mesma ordem para os
   * dois aparelhos.
   */
  dispatch: Dispatch<AcaoJogo>;
  online: SessaoOnline | null;
  conexao: Conexao;
  criarSala: (jogador1: string, jogador2: string) => Promise<void>;
  entrarNaSala: (codigo: string) => Promise<void>;
  /** Sai só deste aparelho; a sala continua de pé para o outro. */
  sairDaSala: () => void;
}

const Contexto = createContext<ContextoJogo | null>(null);

const CHAVE_SESSAO = "dossie:partida";
const CHAVE_ONLINE = "dossie:online";
/** De quanto em quanto tempo cada aparelho pergunta à sala se há novidade. */
const INTERVALO_CONSULTA_MS = 1000;

/** Erro com a mensagem pronta para mostrar na tela. */
async function mensagemDeErro(resposta: Response, padrao: string) {
  const corpo: unknown = await resposta.json().catch(() => null);
  return corpo &&
    typeof corpo === "object" &&
    "erro" in corpo &&
    typeof corpo.erro === "string"
    ? corpo.erro
    : padrao;
}

export function ProvedorJogo({ children }: { children: ReactNode }) {
  const [estado, aplicar] = useReducer(redutor, estadoInicial);
  const [online, definirOnline] = useReducer(
    (_: SessaoOnline | null, nova: SessaoOnline | null) => nova,
    null,
  );
  const [conexao, definirConexao] = useReducer(
    (_: Conexao, nova: Conexao) => nova,
    "ok",
  );
  // A primeira renderização precisa ser igual à do servidor (menu inicial); só
  // depois de montar lemos o sessionStorage e restauramos a partida em curso.
  const primeiroCiclo = useRef(true);

  /**
   * Espelhos para as funções assíncronas: o `online` do render pode estar um
   * passo atrás de quem acabou de criar ou entrar numa sala.
   */
  const sessao = useRef<SessaoOnline | null>(null);
  /** Quantas ações da sala este aparelho já aplicou. */
  const aplicadas = useRef(0);
  /** Envios em fila: ações disparadas em sequência chegam à sala na ordem. */
  const fila = useRef<Promise<void>>(Promise.resolve());

  /** Aplica um trecho da lista da sala que começa na posição `desde`. */
  const aplicarDaSala = useCallback((desde: number, acoes: AcaoJogo[]) => {
    const jaVistas = aplicadas.current - desde;
    // Buraco na sequência não acontece na prática; se acontecer, a próxima
    // consulta pede a partir do ponto certo e preenche.
    if (jaVistas < 0) return;
    const novas = acoes.slice(jaVistas);
    for (const acao of novas) aplicar(acao);
    aplicadas.current += novas.length;
  }, []);

  const entrarEmModoOnline = useCallback((nova: SessaoOnline) => {
    sessao.current = nova;
    aplicadas.current = 0;
    aplicar({ tipo: "HIDRATAR", estado: estadoInicial });
    definirOnline(nova);
    definirConexao("ok");
    try {
      sessionStorage.setItem(CHAVE_ONLINE, JSON.stringify(nova));
    } catch {
      // Sem storage: a sala funciona até a aba ser recarregada.
    }
  }, []);

  const publicar = useCallback(
    (acao: AcaoJogo) => {
      fila.current = fila.current.then(async () => {
        const atual = sessao.current;
        if (!atual) return;
        // Três tentativas: no celular a rede some por um instante e volta.
        for (let tentativa = 0; tentativa < 3; tentativa++) {
          try {
            const resposta = await fetch(`/api/sala/${atual.codigo}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ acao, desde: aplicadas.current }),
            });
            if (resposta.status === 404) {
              definirConexao("expirada");
              return;
            }
            if (resposta.ok) {
              const corpo = (await resposta.json()) as {
                desde: number;
                acoes: AcaoJogo[];
              };
              if (sessao.current === atual) {
                aplicarDaSala(corpo.desde, corpo.acoes);
              }
              definirConexao("ok");
              return;
            }
          } catch {
            // Tenta de novo logo abaixo.
          }
          definirConexao("instavel");
          await new Promise((r) => setTimeout(r, 800 * (tentativa + 1)));
        }
      });
    },
    [aplicarDaSala],
  );

  const dispatch = useCallback<Dispatch<AcaoJogo>>(
    (acao) => {
      if (sessao.current && acao.tipo !== "HIDRATAR") publicar(acao);
      else aplicar(acao);
    },
    [publicar],
  );

  const criarSala = useCallback(
    async (jogador1: string, jogador2: string) => {
      const resposta = await fetch("/api/sala", { method: "POST" });
      if (!resposta.ok) {
        throw new Error(
          await mensagemDeErro(resposta, "Não foi possível criar a sala."),
        );
      }
      const { codigo } = (await resposta.json()) as { codigo: string };
      entrarEmModoOnline({ codigo, eu: 1 });
      publicar({ tipo: "DEFINIR_JOGADORES", jogador1, jogador2 });
    },
    [entrarEmModoOnline, publicar],
  );

  const entrarNaSala = useCallback(
    async (codigoDigitado: string) => {
      const codigo = codigoDigitado.trim().toUpperCase();
      const resposta = await fetch(`/api/sala/${codigo}?desde=0`, {
        cache: "no-store",
      });
      if (!resposta.ok) {
        throw new Error(
          await mensagemDeErro(resposta, "Não foi possível entrar na sala."),
        );
      }
      const corpo = (await resposta.json()) as {
        desde: number;
        acoes: AcaoJogo[];
      };
      entrarEmModoOnline({ codigo, eu: 2 });
      aplicarDaSala(corpo.desde, corpo.acoes);
      publicar({ tipo: "CONVIDADO_ENTROU" });
    },
    [entrarEmModoOnline, aplicarDaSala, publicar],
  );

  const sairDaSala = useCallback(() => {
    sessao.current = null;
    aplicadas.current = 0;
    definirOnline(null);
    definirConexao("ok");
    try {
      sessionStorage.removeItem(CHAVE_ONLINE);
    } catch {
      // Nada a limpar.
    }
    aplicar({ tipo: "REINICIAR" });
  }, []);

  useEffect(() => {
    try {
      // Aba recarregada no meio de uma partida à distância: volta para a mesma
      // sala e reaplica a lista inteira, em vez de confiar no estado guardado.
      const salaSalva = sessionStorage.getItem(CHAVE_ONLINE);
      if (salaSalva) {
        entrarEmModoOnline(JSON.parse(salaSalva) as SessaoOnline);
        return;
      }
      const salvo = sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) {
        aplicar({
          tipo: "HIDRATAR",
          estado: { ...estadoInicial, ...(JSON.parse(salvo) as EstadoJogo) },
        });
      }
    } catch {
      // Sessão corrompida ou storage bloqueado: começa do zero, sem drama.
    }
  }, [entrarEmModoOnline]);

  // Consulta a sala enquanto este aparelho estiver nela.
  useEffect(() => {
    if (!online) return;
    let ativo = true;
    let emVoo = false;

    async function consultar() {
      // Aba escondida não consulta: economiza bateria e o limite do Redis.
      if (emVoo || document.hidden) return;
      emVoo = true;
      try {
        const resposta = await fetch(
          `/api/sala/${online!.codigo}?desde=${aplicadas.current}`,
          { cache: "no-store" },
        );
        if (!ativo) return;
        if (resposta.status === 404) {
          definirConexao("expirada");
        } else if (resposta.ok) {
          const corpo = (await resposta.json()) as {
            desde: number;
            acoes: AcaoJogo[];
          };
          if (ativo && sessao.current?.codigo === online!.codigo) {
            aplicarDaSala(corpo.desde, corpo.acoes);
          }
          definirConexao("ok");
        } else {
          definirConexao("instavel");
        }
      } catch {
        if (ativo) definirConexao("instavel");
      } finally {
        emVoo = false;
      }
    }

    void consultar();
    const id = setInterval(consultar, INTERVALO_CONSULTA_MS);
    // Voltou para o app: busca na hora, sem esperar o próximo ciclo.
    const aoVoltar = () => {
      if (!document.hidden) void consultar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      ativo = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [online, aplicarDaSala]);

  useEffect(() => {
    // Pula a montagem: nesse instante `estado` ainda é o inicial e gravá-lo
    // apagaria a partida salva antes do HIDRATAR ser aplicado.
    if (primeiroCiclo.current) {
      primeiroCiclo.current = false;
      return;
    }
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(estado));
    } catch {
      // Sem persistência disponível — o jogo continua funcionando em memória.
    }
  }, [estado]);

  const valor = useMemo(
    () => ({
      estado,
      dispatch,
      online,
      conexao,
      criarSala,
      entrarNaSala,
      sairDaSala,
    }),
    [estado, dispatch, online, conexao, criarSala, entrarNaSala, sairDaSala],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useJogo(): ContextoJogo {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useJogo precisa estar dentro de <ProvedorJogo>.");
  }
  return ctx;
}

/**
 * Qual papel este aparelho tem na partida.
 *
 * `anfitriao` é quem dispara o que custa dinheiro (gerar caso, julgar,
 * adiantar o próximo caso): no modo à distância só o aparelho de quem criou a
 * sala faz isso, para nada sair em dobro. No modo local o único aparelho é o
 * anfitrião.
 */
export function usePapel() {
  const { online, estado } = useJogo();
  const eu = online?.eu ?? null;
  return {
    online: online !== null,
    eu,
    anfitriao: eu === null || eu === 1,
    /** Nome deste aparelho e do outro, no modo à distância. */
    meuNome: eu === 2 ? estado.jogador2 : estado.jogador1,
    nomeDoOutro: eu === 2 ? estado.jogador1 : estado.jogador2,
  };
}
