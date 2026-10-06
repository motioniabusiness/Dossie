import type { CasoCompleto } from "./tipos";

/**
 * Caso de demonstração. Não é mais usado pelo jogo — a partir da Fase 3 os
 * casos vêm de `/api/gerar-caso`. Mantido como fixture: serve para mexer na UI
 * da sala de investigação sem gastar chamada de API (importe em SalaInvestigacao
 * temporariamente) e como referência do nível de detalhe esperado da IA.
 */
export const CASO_MOCK: CasoCompleto = {
  id: "mock-teatro-aurora",
  titulo: "O Último Ensaio",
  categoria: "assassinato",
  resumo:
    "Maestro morto no camarim do Teatro Aurora após ensaio geral; overdose de digoxina disfarçada de parada cardíaca.",
  contexto: `Na noite de quinta-feira, o Teatro Aurora fez o ensaio geral da temporada. Às 22h04, a faxineira encontrou o maestro Otávio Brandão, 63 anos, caído na poltrona do camarim principal, já sem vida. Sobre a penteadeira: uma caneca de chá pela metade e o porta-comprimidos semanal aberto.

O laudo inicial da casa falou em "parada cardíaca" — o maestro tratava uma arritmia havia anos e tomava digoxina todas as noites. A companhia queria fechar o caso assim e estrear no sábado. O conselho do teatro pediu uma segunda leitura.

Quatro pessoas estavam no prédio entre 20h30 e 22h. Todas tinham motivo para querer o maestro fora do caminho. Só uma tinha como transformar um remédio em arma.`,
  suspeitos: [
    {
      nome: "Helena Reis",
      idade: "44 anos",
      ocupacao: "Primeira violinista",
      relacao: "Subordinada direta da vítima havia onze anos",
      descricao:
        "Primeira violinista há onze anos. Foi preterida na vaga de solista na semana passada, em decisão pessoal do maestro, e ouviu a recusa na frente da orquestra inteira.",
      alibi:
        "Afinando no palco com dois colegas até 21h10; ambos confirmam sem hesitar.",
    },
    {
      nome: "Dante Almeida",
      idade: "51 anos",
      ocupacao: "Produtor da temporada",
      relacao: "Sócio contratual da vítima; atrito aberto sobre custos",
      descricao:
        "Produtor da temporada, endividado depois de dois espetáculos que não vingaram. Brigava com o maestro sobre custos de orquestra.",
      alibi:
        "Chamada com um patrocinador das 20h50 às 21h25, registrada na operadora.",
    },
    {
      nome: "Sônia Vidal",
      idade: "38 anos",
      ocupacao: "Assistente de camarim (enfermeira de formação)",
      relacao: "Cuidava da rotina e da medicação da vítima havia seis anos",
      descricao:
        "Assistente de camarim, enfermeira de formação. Preparava o chá e organizava a medicação do maestro todas as noites havia seis anos.",
      alibi:
        "Saiu para buscar o jantar; recibo da cafeteria da esquina às 21h02.",
    },
    {
      nome: "Rui Bettencourt",
      idade: "29 anos",
      ocupacao: "Maestro assistente",
      relacao: "Sucessor imediato da vítima na regência",
      descricao:
        "Maestro assistente, 29 anos. Assumiria a regência da temporada em caso de ausência do titular — e assumiu, no dia seguinte.",
      alibi: "Revisando partituras no fosso, sozinho, entre 20h30 e 21h40.",
    },
  ],
  pistas: [
    {
      id: "p1",
      titulo: "Laudo toxicológico preliminar",
      tipo: "documento",
      conteudo:
        "Causa imediata: fibrilação ventricular. Digoxina sérica em 5,8 ng/mL — cerca de três vezes a faixa terapêutica do paciente. Não há sinais de violência, injeção ou luta. Janela estimada para a ingestão fatal: entre 21h10 e 21h30. Observação do legista: 'a dose não é compatível com o esquema prescrito; ou o paciente errou grosseiramente, ou o conteúdo do comprimido foi alterado'.",
    },
    {
      id: "p2",
      titulo: "Porta-comprimidos semanal",
      tipo: "objeto",
      conteudo:
        "Caixa plástica de sete compartimentos, um por dia. O compartimento de QUINTA está vazio. O de SEXTA contém três comprimidos idênticos, quando a receita prevê um por noite. Os demais dias estão corretos, com um comprimido cada. Só duas pessoas tinham acesso à caixa: o maestro e quem organizava a medicação.",
    },
    {
      id: "p3",
      titulo: "Depoimento de Helena Reis",
      tipo: "depoimento",
      conteudo:
        "\"Ele me humilhou na frente de todo mundo, e eu não vou fingir que chorei. Mas eu queria a vaga, não o caixão. Uma coisa: às 20h40 eu vi o Rui saindo do camarim do maestro, apressado, com alguma coisa na mão. Ele não regeu nada na vida e agora tem uma temporada inteira. Pense nisso.\"",
    },
    {
      id: "p4",
      titulo: "Fotografia da penteadeira",
      tipo: "foto",
      conteudo:
        "Registro da perícia feito às 22h40, antes de qualquer item ser removido do camarim.",
      legendaFoto:
        "Penteadeira de madeira sob luz amarela. Uma caneca de chá pela metade, ainda com uma rodela de limão. Ao lado, o porta-comprimidos aberto no compartimento de quinta. Mais à direita, um papel rasgado em quatro pedaços, empurrado para o canto. No chão, junto à cadeira, uma batuta em seu estojo aberto.",
    },
    {
      id: "p5",
      titulo: "Bilhete rasgado (reconstituído)",
      tipo: "documento",
      conteudo:
        "Papel de carta do teatro, rasgado em quatro partes e remontado pela perícia. Letra do maestro:\n\n\"Sônia — na segunda-feira eu levo isso ao conselho. Seis anos de confiança e você assinou o meu nome. Não me procure antes disso. O.B.\"",
    },
    {
      id: "p6",
      titulo: "Bloco de receitas e via da farmácia",
      tipo: "documento",
      conteudo:
        "O bloco de receituário do médico do maestro, guardado no camarim, está com quatro folhas faltando. A farmácia da avenida apresentou a via arquivada de uma dessas folhas: medicação controlada retirada em nome do maestro em três datas em que ele estava em turnê no exterior. O grafotécnico anotou: 'assinatura imitada, traço lento, apoio interrompido'.",
    },
    {
      id: "p7",
      titulo: "Depoimento de Sônia Vidal",
      tipo: "depoimento",
      conteudo:
        "\"Rotina de sempre: às 20h45 eu deixei o chá na penteadeira e separei a medicação da noite. Às 20h50 saí para buscar o jantar dele na cafeteria — tenho o recibo, 21h02. Quando voltei, às 21h35, a porta estava fechada e eu não quis incomodar; ele odiava ser interrompido depois do ensaio. Sobre o bilhete eu não sei nada. Ele andava confuso, trocava nomes, trocava datas. A idade.\"",
    },
    {
      id: "p8",
      titulo: "Depoimento de Dante Almeida",
      tipo: "depoimento",
      conteudo:
        "\"Eu estava no telefone com o patrocinador, pode checar na operadora, 20h50 às 21h25. E antes que perguntem do seguro: a apólice da temporada cobre cancelamento por doença do titular, não morte. Com ele vivo e internado eu recebia. Morto, eu perco a bilheteria de estreia e ainda pago o velório. Faça a conta.\"",
    },
  ],
  solucaoSecreta: {
    culpado: "Sônia Vidal",
    comoAconteceu:
      "Sônia Vidal falsificava receitas no bloco do maestro havia anos para desviar medicação controlada. Na quinta-feira o maestro confrontou-a por escrito, avisando que levaria o caso ao conselho na segunda-feira — o bilhete que ele mesmo rasgou depois de entregá-lo. Enfermeira, Sônia sabia que uma overdose de digoxina em um paciente arrítmico é indistinguível de morte natural. Às 20h45, ao 'organizar a medicação', ela colocou três comprimidos no compartimento de quinta e deixou o chá pronto; o excesso que sobrou da cartela ela empurrou para o compartimento de sexta, o erro que a entrega. Às 20h50 saiu para buscar o jantar e garantiu um recibo às 21h02. O maestro tomou os comprimidos com o chá por volta de 21h15, como fazia todas as noites, e morreu sozinho. O álibi de Sônia é verdadeiro e irrelevante: a arma foi montada antes de ela sair do prédio.",
    pontosChave: [
      "A culpada é Sônia Vidal, a assistente de camarim.",
      "A morte foi uma overdose de digoxina, não uma parada cardíaca natural — três comprimidos no lugar de um.",
      "A adulteração aconteceu às 20h45, antes de ela sair; por isso o recibo das 21h02 não a exclui — o álibi cobre a hora errada.",
      "Os três comprimidos sobrando no compartimento de sexta mostram manipulação por quem organizava a caixa.",
      "O motivo é a falsificação de receitas no bloco do maestro, que ele descobriu e ia levar ao conselho na segunda (bilhete rasgado + via da farmácia).",
      "A saída de Rui do camarim às 20h40 é falsa pista: ele foi buscar a batuta, que aparece no estojo aberto na foto.",
    ],
  },
};
