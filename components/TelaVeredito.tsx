"use client";

import { useEffect, useRef, useState } from "react";
import Botao from "./Botao";
import PrepararProximoCaso from "./PrepararProximoCaso";
import RetratoJogador from "./RetratoJogador";
import TelaEspera from "./TelaEspera";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";

/** Mínimo para uma teoria valer avaliação, evita "foi o mordomo" e ponto. */
const MINIMO_CARACTERES = 120;

type Etapa = "passa1" | "escreve1" | "passa2" | "escreve2";

/**
 * No duelo, cada jogador escreve a sua versão sem ver a do outro, com uma tela
 * neutra de "passe o dispositivo" entre os dois: é o que garante o sigilo no
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

  const escrevendo = etapa === "escreve1" ? 1 : 2;
  const nome = escrevendo === 1 ? estado.jogador1 : estado.jogador2;
  const suficiente = texto.trim().length >= MINIMO_CARACTERES;

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

  function selar() {
    if (!suficiente) return;
    const limpo = texto.trim();

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
        <>
          <PrepararProximoCaso />
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
        </>
      );
    }
  }

  // ---------- Tela neutra de troca de mãos (só no duelo) ----------
  if (etapa === "passa1" || etapa === "passa2") {
    const proximo = etapa === "passa1" ? estado.jogador1 : estado.jogador2;
    const primeiro = etapa === "passa1";

    return (
      <div className="animate-entrada mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-5 py-16 text-center">
        <PrepararProximoCaso />
        <span className="selo">Sessão encerrada</span>

        <RetratoJogador
          jogador={primeiro ? 1 : 2}
          ativo
          className="h-40 w-30"
        />

        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-2xl tracking-[0.06em] text-papel-50">
            Passe o dispositivo para {proximo}
          </h2>
          <p className="text-sm leading-relaxed text-papel-300">
            {primeiro
              ? "A investigação acabou. Agora cada um escreve a sua versão em separado, e ninguém lê a do outro."
              : `A versão de ${estado.jogador1} está selada. ${proximo}, sua vez: escreva sem consultar quem já escreveu.`}
          </p>
        </div>

        <Botao onClick={() => setEtapa(primeiro ? "escreve1" : "escreve2")}>
          Sou {proximo}, estou com o aparelho
        </Botao>
      </div>
    );
  }

  // ---------- Redação da teoria ----------
  return (
    <div className="animate-entrada mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-10 sm:px-8">
      <PrepararProximoCaso />

      <header className="flex flex-col gap-2">
        <span className="etiqueta">
          {cooperativo
            ? "Veredito da dupla · uma teoria só"
            : `Versão de ${escrevendo === 1 ? "1" : "2"} de 2 · privada`}
        </span>
        <h2 className="font-mono text-2xl tracking-[0.06em] text-ambar-300">
          {cooperativo
            ? `${estado.jogador1} e ${estado.jogador2}, o que aconteceu?`
            : `${nome}, o que aconteceu?`}
        </h2>
        <p className="text-sm leading-relaxed text-papel-300">
          Escreva por extenso. Um bom veredito responde: quem fez, como fez, por
          que fez, e quais pistas provam isso. Vago não pontua.
        </p>
      </header>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
        spellCheck
        placeholder={
          cooperativo
            ? "Nós acreditamos que aconteceu assim por causa de..."
            : "Eu acredito que aconteceu assim por causa de..."
        }
        className="campo min-h-72 resize-y leading-relaxed"
        aria-label={cooperativo ? "Teoria da dupla" : `Teoria de ${nome}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-noite-700 pt-5">
        <span
          className={`font-mono text-xs ${
            suficiente ? "text-papel-500" : "text-sangue-400"
          }`}
        >
          {texto.trim().length} caracteres
          {suficiente ? "" : ` · mínimo ${MINIMO_CARACTERES}`}
        </span>
        <Botao onClick={selar} disabled={!suficiente}>
          {cooperativo
            ? "Entregar ao júri"
            : escrevendo === 1
              ? "Selar minha versão"
              : "Selar e entregar ao júri"}
        </Botao>
      </div>
    </div>
  );
}
