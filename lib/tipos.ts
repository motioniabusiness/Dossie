/**
 * Tipos compartilhados do jogo.
 *
 * Regra de ouro: a `SolucaoSecreta` só existe no servidor até a tela de
 * resultado. Por isso há dois tipos de caso — `CasoPublico` (o que o cliente
 * recebe) e `CasoCompleto` (o que a IA gera, usado apenas nas rotas de API).
 */

export type Categoria =
  | "furto_roubo"
  | "assassinato"
  | "fraude"
  | "desaparecimento";

export type TipoPista = "documento" | "depoimento" | "foto" | "objeto";

export type Dificuldade = "facil" | "medio" | "dificil";

/**
 * `duelo`: cada um escreve a sua versão e o júri compara. Tem pistas privadas.
 * `cooperativo`: uma teoria só, nota da dupla contra o caso. Sem pistas privadas.
 */
export type ModoJogo = "duelo" | "cooperativo";

/**
 * Traços escolhidos pela IA para o retrato falado do suspeito. São enums porque
 * quem desenha é o código (componente RetratoFalado): cada combinação vira um
 * rosto diferente, sem depender de geração de imagem.
 */
export interface Retrato {
  /**
   * Gênero do personagem, declarado pela IA (que o inventou). Serve para o
   * acervo não dar rosto de mulher a um nome de homem.
   */
  genero: "masculino" | "feminino";
  formatoRosto: "oval" | "redondo" | "quadrado" | "alongado";
  cabelo: "raspado" | "curto" | "medio" | "longo" | "preso" | "calvo";
  pelosFaciais: "nenhum" | "bigode" | "cavanhaque" | "barba_curta" | "barba_cheia";
  oculos: "nenhum" | "armacao" | "redondo";
  idadeAparente: "jovem" | "adulto" | "maduro" | "idoso";
  tomPele: "claro" | "medio" | "escuro";
  marca: "nenhuma" | "cicatriz" | "sinal" | "brinco";
}

export interface Suspeito {
  nome: string;
  descricao: string;
  alibi: string;
  /** Campos da ficha de investigação. Opcionais: casos antigos podem não trazê-los. */
  idade?: string;
  ocupacao?: string;
  /** Vínculo com a vítima / com o caso. */
  relacao?: string;
  /** Descrição física curta, exibida na ficha. */
  aparencia?: string;
  /** Ausente em casos antigos — o componente sorteia a partir do nome. */
  retrato?: Retrato;
}

export interface Pista {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: TipoPista;
  /** Só em pistas do tipo `foto`: descrição textual exibida na moldura de evidência. */
  legendaFoto?: string;
}

export interface SolucaoSecreta {
  culpado: string;
  comoAconteceu: string;
  /** Fatos que uma boa teoria precisa acertar — base da pontuação. */
  pontosChave: string[];
}

/** Caso como o cliente o conhece durante a investigação: sem a solução. */
export interface CasoPublico {
  id: string;
  titulo: string;
  categoria: Categoria;
  contexto: string;
  suspeitos: Suspeito[];
  pistas: Pista[];
  /** Resumo curto usado para instruir a IA a não repetir casos já vistos. */
  resumo: string;
}

/** Caso completo, com solução. Nunca deve atravessar a fronteira servidor→cliente. */
export interface CasoCompleto extends CasoPublico {
  solucaoSecreta: SolucaoSecreta;
}

/** Remove a solução de um caso completo — usada na fronteira servidor→cliente. */
export function paraCasoPublico(caso: CasoCompleto): CasoPublico {
  const { id, titulo, categoria, contexto, suspeitos, pistas, resumo } = caso;
  return { id, titulo, categoria, contexto, suspeitos, pistas, resumo };
}

export interface ConfigPartida {
  categoria: Categoria;
  minutos: number;
  dificuldade: Dificuldade;
  modo: ModoJogo;
}

/** Uma pergunta feita a um suspeito e o que ele respondeu. */
export interface TrocaDeInterrogatorio {
  suspeito: string;
  pergunta: string;
  resposta: string;
}

export interface AvaliacaoJogador {
  nota: number;
  acertos: string[];
  erros: string[];
  justificativa: string;
}

/** O veredito muda de forma conforme o modo da partida. */
export type Julgamento =
  | {
      modo: "duelo";
      jogador1: AvaliacaoJogador;
      jogador2: AvaliacaoJogador;
      vencedor: "jogador1" | "jogador2" | "empate";
    }
  | { modo: "cooperativo"; dupla: AvaliacaoJogador };

export type FaseJogo =
  | "menu"
  | "configuracao"
  | "carregando"
  | "investigacao"
  | "veredito"
  | "resultado";
