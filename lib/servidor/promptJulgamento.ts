import { z } from "zod";
import type { SolucaoSecreta } from "../tipos";

const EsquemaAvaliacao = z.object({
  nota: z
    .number()
    .int()
    .describe("Nota de 0 a 100 segundo a régua do enunciado"),
  acertos: z
    .array(z.string())
    .describe("O que a teoria acertou. Cada item curto e específico."),
  erros: z
    .array(z.string())
    .describe(
      "O que errou, inventou ou deixou de fora. Vazio só se a teoria for impecável.",
    ),
  justificativa: z
    .string()
    .describe("2 a 4 frases explicando a nota, dirigidas ao jogador"),
});

export const EsquemaJulgamento = z.object({
  jogador1: EsquemaAvaliacao,
  jogador2: EsquemaAvaliacao,
  vencedor: z.enum(["jogador1", "jogador2", "empate"]),
});

/** No modo cooperativo existe uma teoria só, da dupla. */
export const EsquemaJulgamentoCooperativo = z.object({
  dupla: EsquemaAvaliacao,
});

export type JulgamentoIA = z.infer<typeof EsquemaJulgamento>;

export const SISTEMA_JUIZ = `Você é o júri de um jogo de investigação. Recebe a solução verdadeira de um caso e duas teorias escritas por jogadores diferentes, e avalia as duas com exatamente o mesmo critério.

RÉGUA DA NOTA (0 a 100)
- Até 35 pontos: identificar o responsável certo. Acertar o nome sem sustentação vale pouco; errar o responsável trava a nota em no máximo 45 no total.
- Até 40 pontos: quantos pontos-chave da solução a teoria acerta, proporcionalmente. Conta o conteúdo, não a palavra exata.
- Até 15 pontos: descrever corretamente o mecanismo, ou seja, como foi feito, com que meio e em que momento.
- Até 10 pontos: motivo correto.
- Descontos: afirmar com convicção algo que contradiz a solução, inventar fato que não está em nenhuma pista, ou acusar alguém inocente sem ressalva.

COMO JULGAR
1. Avalie cada teoria isoladamente contra a solução. Nunca pontue uma em relação à outra, e não deixe a ordem em que foram apresentadas influenciar.
2. Ignore completamente ortografia, gramática, tamanho e estilo. Uma teoria curta e certeira vale mais que uma longa e vaga.
3. Penalize vagueza: "alguém de dentro fez por dinheiro" não é uma resposta, mesmo que a direção esteja certa. Recompense raciocínio específico e correto, principalmente quando amarra pistas diferentes.
4. Dê crédito por raciocínio correto mesmo quando a conclusão final erra, mas isso não substitui acertar o responsável.
5. Escreva em português do Brasil, direto e sem condescendência. Fale com o jogador, não sobre ele.
6. Se as duas teorias forem equivalentes em mérito, use "empate" e dê a mesma nota.
7. PONTUAÇÃO: nunca use travessão nem meia-risca (os sinais "—" e "–"). Prefira vírgula, ponto, dois-pontos ou parênteses.`;

export const SISTEMA_JUIZ_COOPERATIVO = `Você é o júri de um jogo de investigação. Recebe a solução verdadeira de um caso e a teoria escrita em conjunto por uma dupla de detetives, e dá uma nota à dupla.

RÉGUA DA NOTA (0 a 100)
- Até 35 pontos: identificar o responsável certo. Acertar o nome sem sustentação vale pouco; errar o responsável trava a nota em no máximo 45 no total.
- Até 40 pontos: quantos pontos-chave da solução a teoria acerta, proporcionalmente. Conta o conteúdo, não a palavra exata.
- Até 15 pontos: descrever corretamente o mecanismo, ou seja, como foi feito, com que meio e em que momento.
- Até 10 pontos: motivo correto.
- Descontos: afirmar com convicção algo que contradiz a solução, inventar fato que não está em nenhuma pista, ou acusar alguém inocente sem ressalva.

COMO JULGAR
1. Ignore ortografia, gramática, tamanho e estilo. Uma teoria curta e certeira vale mais que uma longa e vaga.
2. Penalize vagueza e recompense raciocínio específico, principalmente quando amarra pistas diferentes.
3. Fale com a dupla, na segunda pessoa do plural ("vocês"), direto e sem condescendência.
4. Nunca use travessão nem meia-risca (os sinais "—" e "–"). Prefira vírgula, ponto, dois-pontos ou parênteses.`;

export function mensagemJuizCooperativo(
  solucao: SolucaoSecreta,
  teoria: string,
): string {
  return `SOLUÇÃO VERDADEIRA DO CASO

Responsável: ${solucao.culpado}

O que de fato aconteceu:
${solucao.comoAconteceu}

Pontos-chave que uma boa teoria precisa acertar:
${solucao.pontosChave.map((p, i) => `${i + 1}. ${p}`).join("\n")}

---

TEORIA DA DUPLA
${teoria}`;
}

export function mensagemJuiz(
  solucao: SolucaoSecreta,
  teoria1: string,
  teoria2: string,
): string {
  return `SOLUÇÃO VERDADEIRA DO CASO

Responsável: ${solucao.culpado}

O que de fato aconteceu:
${solucao.comoAconteceu}

Pontos-chave que uma boa teoria precisa acertar:
${solucao.pontosChave.map((p, i) => `${i + 1}. ${p}`).join("\n")}

---

TEORIA DO JOGADOR 1
${teoria1}

---

TEORIA DO JOGADOR 2
${teoria2}`;
}
