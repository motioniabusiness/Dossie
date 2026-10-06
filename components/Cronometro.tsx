"use client";

import { useEffect, useRef, useState } from "react";

/** Últimos 5 minutos entram em alerta visual. */
const LIMITE_ALERTA_MS = 5 * 60 * 1000;

interface Props {
  /** Instante (epoch ms) em que o tempo acaba. */
  fimEm: number;
  onTempoEsgotado: () => void;
}

function formatar(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

/**
 * Contagem regressiva baseada em `Date.now()` — e não em incrementos de 1s —
 * para não atrasar quando o navegador estrangula os timers da aba. Roda em um
 * componente próprio, então segue contando com modais abertos.
 */
export default function Cronometro({ fimEm, onTempoEsgotado }: Props) {
  const [restante, setRestante] = useState(() => Math.max(0, fimEm - Date.now()));
  // Garante que o callback de fim dispare uma única vez.
  const disparado = useRef(false);

  useEffect(() => {
    disparado.current = false;

    function tique() {
      const ms = Math.max(0, fimEm - Date.now());
      setRestante(ms);
      if (ms === 0 && !disparado.current) {
        disparado.current = true;
        onTempoEsgotado();
      }
    }

    tique();
    const id = setInterval(tique, 500);
    return () => clearInterval(id);
  }, [fimEm, onTempoEsgotado]);

  const alerta = restante <= LIMITE_ALERTA_MS;

  return (
    <div
      role="timer"
      aria-label="Tempo restante de investigação"
      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors duration-500 ${
        alerta
          ? "border-sangue-500/70 bg-sangue-600/15"
          : "border-noite-600 bg-noite-900/70"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          alerta ? "animate-pulse bg-sangue-400" : "bg-ambar-400"
        }`}
      />
      <span
        className={`font-mono text-lg leading-none tabular-nums ${
          alerta ? "text-sangue-400" : "text-papel-50"
        }`}
      >
        {formatar(restante)}
      </span>
    </div>
  );
}
