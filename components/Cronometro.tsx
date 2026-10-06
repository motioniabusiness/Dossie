"use client";

import { useEffect, useRef, useState } from "react";

/** Últimos 5 minutos entram em alerta visual. */
const LIMITE_ALERTA_MS = 5 * 60 * 1000;

interface Props {
  /** Instante (epoch ms) em que o tempo acaba. */
  fimEm: number;
  /** Duração total da investigação, para o anel mostrar quanto já foi. */
  totalMs?: number;
  onTempoEsgotado: () => void;
}

function formatar(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutos = Math.floor(total / 60);
  const segundos = total % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

/**
 * Relógio da investigação. A contagem é baseada em `Date.now()`, e não em
 * incrementos de 1s, para não atrasar quando o navegador estrangula os timers
 * da aba. Roda num componente próprio, então segue contando com modais abertos.
 *
 * O anel em volta esvazia conforme o tempo passa: dá para saber quanto resta
 * de relance, sem ler os números.
 */
export default function Cronometro({ fimEm, totalMs, onTempoEsgotado }: Props) {
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
  const fracao = totalMs ? Math.min(1, restante / totalMs) : 1;
  const raio = 15;
  const circunferencia = 2 * Math.PI * raio;

  return (
    <div
      role="timer"
      aria-label={`Tempo restante de investigação: ${formatar(restante)}`}
      className={`flex items-center gap-2 border-2 py-1 pr-3 pl-1 transition-colors duration-500 ${
        alerta
          ? "border-sangue-500 bg-sangue-600/20 shadow-[3px_3px_0_0_var(--color-sangue-600)]"
          : "border-tinta bg-noite-900 shadow-[3px_3px_0_0_rgba(0,0,0,0.6)]"
      } rounded-[3px]`}
    >
      <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={raio} fill="none" stroke="var(--color-noite-700)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r={raio}
          fill="none"
          stroke={alerta ? "var(--color-sangue-400)" : "var(--color-ambar-400)"}
          strokeWidth="4"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - fracao)}
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
        <circle cx="18" cy="18" r="2.2" fill={alerta ? "var(--color-sangue-400)" : "var(--color-papel-100)"} />
      </svg>
      <span
        className={`font-maquina text-xl leading-none tabular-nums sm:text-2xl ${
          alerta ? "animate-pulse text-sangue-400" : "text-papel-50"
        }`}
      >
        {formatar(restante)}
      </span>
    </div>
  );
}
