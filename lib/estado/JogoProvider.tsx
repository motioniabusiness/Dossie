"use client";

import {
  createContext,
  useContext,
  useEffect,
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
  julgamento: null,
  solucao: null,
};

export type AcaoJogo =
  | { tipo: "HIDRATAR"; estado: EstadoJogo }
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
        config: null,
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

interface ContextoJogo {
  estado: EstadoJogo;
  dispatch: Dispatch<AcaoJogo>;
}

const Contexto = createContext<ContextoJogo | null>(null);

const CHAVE_SESSAO = "dossie:partida";

export function ProvedorJogo({ children }: { children: ReactNode }) {
  const [estado, dispatch] = useReducer(redutor, estadoInicial);
  // A primeira renderização precisa ser igual à do servidor (menu inicial); só
  // depois de montar lemos o sessionStorage e restauramos a partida em curso.
  const primeiroCiclo = useRef(true);

  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_SESSAO);
      if (salvo) {
        dispatch({
          tipo: "HIDRATAR",
          estado: { ...estadoInicial, ...(JSON.parse(salvo) as EstadoJogo) },
        });
      }
    } catch {
      // Sessão corrompida ou storage bloqueado: começa do zero, sem drama.
    }
  }, []);

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

  return (
    <Contexto.Provider value={{ estado, dispatch }}>
      {children}
    </Contexto.Provider>
  );
}

export function useJogo(): ContextoJogo {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useJogo precisa estar dentro de <ProvedorJogo>.");
  }
  return ctx;
}
