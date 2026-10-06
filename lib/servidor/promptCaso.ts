import { z } from "zod";
import type { Categoria, Dificuldade } from "../tipos";

/** Traços do retrato falado. O código desenha; a IA só escolhe as peças. */
const EsquemaRetrato = z.object({
  genero: z
    .enum(["masculino", "feminino"])
    .describe("Gênero do personagem, coerente com o nome que você deu a ele"),
  formatoRosto: z.enum(["oval", "redondo", "quadrado", "alongado"]),
  cabelo: z.enum(["raspado", "curto", "medio", "longo", "preso", "calvo"]),
  pelosFaciais: z.enum([
    "nenhum",
    "bigode",
    "cavanhaque",
    "barba_curta",
    "barba_cheia",
  ]),
  oculos: z.enum(["nenhum", "armacao", "redondo"]),
  idadeAparente: z.enum(["jovem", "adulto", "maduro", "idoso"]),
  tomPele: z.enum(["claro", "medio", "escuro"]),
  marca: z.enum(["nenhuma", "cicatriz", "sinal", "brinco"]),
});

/**
 * Esquema do caso gerado pela IA. Usado como *structured output* — a API
 * garante que a resposta obedece este formato, então não há JSON malformado
 * para tratar (só validamos e completamos campos que preenchemos no servidor).
 *
 * Campos opcionais foram evitados de propósito: no modo estrito é mais seguro
 * pedir string sempre e tratar "" como ausente.
 */
export const EsquemaCasoIA = z.object({
  titulo: z.string().describe("Título curto e evocativo do caso, sem subtítulo"),
  resumo: z
    .string()
    .describe(
      "Uma frase (máx. 25 palavras) resumindo caso e solução. Uso interno: evitar repetir casos.",
    ),
  contexto: z
    .string()
    .describe(
      "2 a 4 parágrafos apresentando o caso aos jogadores, separados por linha em branco. Não revele a solução.",
    ),
  suspeitos: z
    .array(
      z.object({
        nome: z.string().describe("Nome fictício completo"),
        idade: z.string().describe('Ex.: "43 anos"'),
        ocupacao: z.string().describe("Função ou profissão"),
        relacao: z
          .string()
          .describe("Vínculo com a vítima ou com o caso, em uma linha"),
        descricao: z
          .string()
          .describe("2 a 3 frases: perfil, motivo plausível e comportamento"),
        alibi: z.string().describe("O que a pessoa alega, com horários"),
        aparencia: z
          .string()
          .describe(
            "Uma frase de descrição física, como num boletim: altura, porte, traços marcantes, jeito de se vestir.",
          ),
        retrato: EsquemaRetrato.describe(
          "Traços do retrato falado, coerentes com a aparência descrita. Varie entre os suspeitos — nada de cinco rostos iguais.",
        ),
      }),
    )
    .describe("De 3 a 5 suspeitos"),
  pistas: z
    .array(
      z.object({
        titulo: z.string().describe("Nome do arquivo de evidência"),
        tipo: z.enum(["documento", "depoimento", "foto", "objeto"]),
        conteudo: z
          .string()
          .describe(
            "O conteúdo da pista. Depoimentos entre aspas, na voz da pessoa. Documentos com dados concretos (horários, números, nomes).",
          ),
        legendaFoto: z
          .string()
          .describe(
            'Apenas quando tipo = "foto": descrição visual detalhada da imagem. Nos outros tipos, string vazia.',
          ),
      }),
    )
    .describe("De 6 a 9 pistas, sendo pelo menos uma do tipo foto"),
  solucaoSecreta: z.object({
    culpado: z
      .string()
      .describe("Nome exato de um dos suspeitos listados acima"),
    comoAconteceu: z
      .string()
      .describe(
        "O que de fato ocorreu, com motivo, método e como as pistas se encaixam",
      ),
    pontosChave: z
      .array(z.string())
      .describe(
        "4 a 6 fatos que uma boa teoria precisa acertar. Cada um verificável contra as pistas.",
      ),
  }),
});

export type CasoIA = z.infer<typeof EsquemaCasoIA>;

const ORIENTACAO_CATEGORIA: Record<Categoria, string> = {
  furto_roubo:
    "FURTO/ROUBO: algo de valor desapareceu de um lugar com acesso controlado. O interesse está em como saiu de lá, não em violência.",
  assassinato:
    "ASSASSINATO: uma morte que a explicação oficial não cobre. Trate com sobriedade, sem crueldade gratuita nem detalhes gráficos.",
  fraude:
    "FRAUDE: dinheiro, documentos ou números manipulados. Inclua pelo menos um documento com dados que o jogador possa cruzar.",
  desaparecimento:
    "DESAPARECIMENTO: uma pessoa sumiu. Deixe claro se houve crime ou não, a solução precisa ser definitiva.",
};

export const SISTEMA = `Você é o roteirista-chefe de um jogo de investigação para dois jogadores. Cada partida usa um caso novo, inventado por você, que os dois analistas investigam juntos antes de escrever, cada um, a sua versão do que aconteceu.

REGRAS DO CASO
1. Cem por cento ficcional e original. Nunca use nomes de pessoas reais, nem retrate crimes reais específicos. Pode se inspirar em arquétipos (roubo de arte, herança disputada, acidente suspeito), jamais em um caso concreto.
2. Enxuto porém denso. Poucos elementos, fortemente interligados: a solução só aparece para quem cruzar informações de pistas diferentes. Nada de caso longo e diluído.
3. A solução tem de ser dedutível a partir das pistas apresentadas. Se um fato é necessário para resolver o caso, ele está em alguma pista, direta ou indiretamente. Nada de informação que só você conhece.
4. Inclua ao menos uma pista que aponte, de forma convincente, para a pessoa errada, e algo no conjunto que permita descartá-la.
5. Um álibi que parece cobrir a pessoa mas cobre o horário errado vale mais que um álibi falso.
6. Dificuldade equilibrada: solucionável, mas não óbvia. Se o culpado for o suspeito mais evidente, dê uma razão que só o cruzamento de pistas revela.
7. Escreva em português do Brasil, em tom sóbrio de dossiê. Sem gírias, sem emoji, sem se dirigir ao jogador.
8. Datas, horários e números precisam ser consistentes entre todas as pistas. Confira antes de responder.
9. Preencha todos os campos. As listas de suspeitos e de pistas nunca podem vir vazias, sem elas não existe jogo. O culpado tem de ser um dos suspeitos listados, escrito exatamente com o mesmo nome.
10. PONTUAÇÃO: nunca use travessão nem meia-risca (os sinais "—" e "–") em nenhum texto. Prefira vírgula, ponto, dois-pontos ou parênteses. Isso vale para todos os campos, inclusive depoimentos e documentos.`;

/** Limites que tornam um caso jogável. A rota rejeita e refaz o que sair fora. */
export const MIN_SUSPEITOS = 3;
export const MIN_PISTAS = 5;

function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * O modelo às vezes escreve o culpado com o nome completo ("Teodoro Anselmo
 * Vasques") enquanto o suspeito está listado de forma mais curta ("Teodoro
 * Vasques"). Isso não é erro de lógica, é de digitação, e refazer o caso por
 * causa disso custa dinheiro e mais de um minuto de espera. Aqui tentamos
 * casar os dois pelos nomes em comum; só desistimos se ficar ambíguo.
 */
export function conciliarCulpado(caso: CasoIA): CasoIA {
  const alvo = semAcento(caso.solucaoSecreta.culpado);
  if (caso.suspeitos.some((s) => semAcento(s.nome) === alvo)) return caso;

  const partesAlvo = new Set(alvo.split(/\s+/).filter((p) => p.length > 2));
  const candidatos = caso.suspeitos.filter((s) => {
    const partes = semAcento(s.nome)
      .split(/\s+/)
      .filter((p) => p.length > 2);
    // Exige pelo menos dois nomes em comum (normalmente prenome + sobrenome).
    return partes.filter((p) => partesAlvo.has(p)).length >= 2;
  });

  if (candidatos.length !== 1) return caso;

  return {
    ...caso,
    solucaoSecreta: {
      ...caso.solucaoSecreta,
      culpado: candidatos[0].nome,
    },
  };
}

/**
 * Confere o caso devolvido pela IA. O formato já vem garantido pelo structured
 * output; aqui checamos o que o esquema não cobre: listas vazias e culpado que
 * não é nenhum dos suspeitos.
 */
export function problemaNoCaso(caso: CasoIA): string | null {
  if (caso.suspeitos.length < MIN_SUSPEITOS) {
    return `veio com ${caso.suspeitos.length} suspeito(s)`;
  }
  if (caso.pistas.length < MIN_PISTAS) {
    return `veio com ${caso.pistas.length} pista(s)`;
  }
  const nomes = caso.suspeitos.map((s) => semAcento(s.nome));
  if (!nomes.includes(semAcento(caso.solucaoSecreta.culpado))) {
    return `o culpado "${caso.solucaoSecreta.culpado}" não está entre os suspeitos`;
  }
  if (!caso.solucaoSecreta.pontosChave.length) {
    return "a solução veio sem pontos-chave";
  }
  return null;
}

const ORIENTACAO_DIFICULDADE: Record<Dificuldade, string> = {
  facil:
    "FÁCIL: uma única linha de dedução. 3 suspeitos e 6 pistas. Cada pista é clara por si só e a solução aparece ao juntar duas ou três delas. Uma falsa pista, e que se desfaça com facilidade. O culpado não pode ser adivinhado de cara, mas o caminho até ele é reto.",
  medio:
    "MÉDIO: duas camadas. 4 suspeitos e 7 ou 8 pistas. Pelo menos um fato só aparece cruzando duas pistas de tipos diferentes (um documento com um depoimento, por exemplo). Uma falsa pista convincente, sustentada por evidência física, que exige uma terceira pista para ser descartada.",
  dificil:
    "DIFÍCIL: reviravolta. 5 suspeitos e 8 ou 9 pistas. Uma das pistas muda completamente o sentido de outra quando lida direito (um horário errado, um registro adulterado, uma identidade trocada). Duas falsas pistas independentes, uma delas incriminando alguém com evidência física forte. Nenhuma pista entrega a solução sozinha, e a peça decisiva é discreta: não pode estar no primeiro arquivo.",
};

export function mensagemUsuario(
  categoria: Categoria,
  minutos: number,
  dificuldade: Dificuldade,
  resumosVistos: string[],
): string {
  const calibragem = `${ORIENTACAO_DIFICULDADE[dificuldade]}
A dupla tem ${minutos} minutos de investigação: ajuste o tamanho dos textos a esse tempo, sem mexer no número de camadas definido pela dificuldade.`;

  const evitar = resumosVistos.length
    ? `\nJá jogamos os casos abaixo. Não repita nenhum deles: nem o cenário, nem o método, nem a mesma reviravolta.\n${resumosVistos
        .map((r) => `- ${r}`)
        .join("\n")}`
    : "";

  return `Crie um caso novo.

CATEGORIA: ${ORIENTACAO_CATEGORIA[categoria]}

DIFICULDADE: ${calibragem}${evitar}`;
}
