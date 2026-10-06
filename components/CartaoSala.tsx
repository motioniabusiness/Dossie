"use client";

import { useState } from "react";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";

/**
 * Código da sala em destaque, para ler em voz alta na ligação, com um botão
 * que manda o convite pelo WhatsApp (ou copia, no computador). Mostra também
 * se o outro detetive já entrou.
 */
export default function CartaoSala() {
  const { estado, online, conexao } = useJogo();
  const { nomeDoOutro, anfitriao } = usePapel();
  const [copiado, setCopiado] = useState(false);

  if (!online) return null;

  const presente = estado.convidadoPresente;
  const primeiroNome = nomeDoOutro.split(" ").pop() ?? nomeDoOutro;

  async function convidar() {
    const endereco = window.location.origin;
    const texto = `Bora investigar? Entra em ${endereco}, escolhe "À distância", "Tenho um código" e digita ${online!.codigo}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Dossiê", text: texto });
        return;
      }
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Compartilhamento cancelado: nada a fazer.
    }
  }

  return (
    <div className="painel flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="etiqueta">Sala à distância</span>
          <span className="font-mono text-2xl tracking-[0.3em] text-ambar-300">
            {online.codigo}
          </span>
        </div>
        <span
          className={`flex items-center gap-2 text-xs ${
            presente ? "text-papel-100" : "text-papel-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              presente ? "bg-emerald-400" : "animate-pulse bg-ambar-500"
            }`}
          />
          {presente
            ? `${primeiroNome} está na sala`
            : anfitriao
              ? `Aguardando ${primeiroNome} entrar`
              : "Conectando"}
          {conexao === "instavel" && " · conexão instável"}
        </span>
      </div>

      {anfitriao && !presente && (
        <button
          type="button"
          onClick={convidar}
          className="rounded-md border border-noite-600 px-3 py-2 text-xs text-papel-100 transition-colors hover:border-ambar-500/60 hover:text-ambar-300"
        >
          {copiado ? "Convite copiado" : "Enviar convite"}
        </button>
      )}
    </div>
  );
}
