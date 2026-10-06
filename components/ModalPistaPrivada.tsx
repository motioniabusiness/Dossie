"use client";

import Botao from "./Botao";
import RetratoJogador from "./RetratoJogador";
import ModalBase from "./ModalBase";

/**
 * Portão de um arquivo privado. O conteúdo só aparece depois que o dono do
 * arquivo confirma que está com o aparelho, então o outro detetive nunca lê
 * aquilo: ele vai ter que ouvir a versão contada.
 */
export default function ModalPistaPrivada({
  dono,
  nomeDono,
  nomeOutro,
  numero,
  onConfirmar,
  onFechar,
  bloqueado = false,
}: {
  dono: 1 | 2;
  nomeDono: string;
  nomeOutro: string;
  numero: string;
  onConfirmar: () => void;
  onFechar: () => void;
  /**
   * À distância, o arquivo é de quem está no outro aparelho: aqui ele não
   * abre de jeito nenhum, só lá.
   */
  bloqueado?: boolean;
}) {
  if (bloqueado) {
    return (
      <ModalBase
        titulo="Arquivo lacrado"
        etiqueta={<>Acesso restrito · arquivo {numero}</>}
        onFechar={onFechar}
        larguraMax="max-w-lg"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <RetratoJogador jogador={dono} ativo className="h-32 w-24" />
          <div className="flex flex-col gap-2">
            <p className="font-mono text-lg text-papel-50">
              Este arquivo é de {nomeDono}
            </p>
            <p className="text-sm leading-relaxed text-papel-300">
              Ele só abre no aparelho de {nomeDono}. Se quiser saber o que tem
              aqui, pergunte. Se a resposta vai ser verdadeira, é outra
              história.
            </p>
          </div>
          <Botao variante="secundario" onClick={onFechar}>
            Fechar
          </Botao>
        </div>
      </ModalBase>
    );
  }

  return (
    <ModalBase
      titulo="Arquivo lacrado"
      etiqueta={<>Acesso restrito · arquivo {numero}</>}
      onFechar={onFechar}
      larguraMax="max-w-lg"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <RetratoJogador jogador={dono} ativo className="h-32 w-24" />

        <div className="flex flex-col gap-2">
          <p className="font-mono text-lg text-papel-50">
            Este arquivo é de {nomeDono}
          </p>
          <p className="text-sm leading-relaxed text-papel-300">
            {nomeOutro}, olhe para o lado. O que estiver aqui só {nomeDono} vai
            ler, e depois vai ter que contar com as próprias palavras. Ou não
            contar.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Botao variante="fantasma" onClick={onFechar}>
            Deixar lacrado
          </Botao>
          <Botao onClick={onConfirmar}>Sou {nomeDono}, abrir o arquivo</Botao>
        </div>
      </div>
    </ModalBase>
  );
}
