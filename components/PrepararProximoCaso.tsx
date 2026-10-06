"use client";

import { useEffect, useRef } from "react";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import { sortearRetratos } from "@/lib/retratos";
import type { CasoPublico } from "@/lib/tipos";

/**
 * Monta o próximo caso em segundo plano enquanto a dupla escreve as teorias.
 * Escrever leva alguns minutos e o julgamento mais alguns segundos, tempo
 * suficiente para o caso seguinte ficar pronto: a partir da segunda partida a
 * espera vira zero.
 *
 * Roda só no veredito, e não já na investigação, por causa do custo: adiantar
 * um caso gasta uma geração mesmo que vocês parem de jogar depois desta. No
 * veredito a chance de haver uma próxima partida é bem maior.
 *
 * Não renderiza nada.
 */
export default function PrepararProximoCaso() {
  const { estado, dispatch } = useJogo();
  const { anfitriao } = usePapel();
  const disparado = useRef(false);

  useEffect(() => {
    // À distância, só o aparelho de quem criou a sala adianta o caso.
    if (!anfitriao || disparado.current) return;
    const config = estado.config;
    if (!config || estado.casoPreparado) return;
    disparado.current = true;

    async function preparar() {
      try {
        const resposta = await fetch("/api/gerar-caso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoria: config!.categoria,
            minutos: config!.minutos,
            dificuldade: config!.dificuldade,
            resumosVistos: estado.resumosVistos,
          }),
        });
        if (!resposta.ok) return;

        const corpo = (await resposta.json()) as {
          caso: CasoPublico;
          solucaoSelada: string;
        };

        const { fotos, usados } = sortearRetratos(
          corpo.caso.suspeitos,
          estado.retratosUsados,
        );

        dispatch({
          tipo: "GUARDAR_CASO_PREPARADO",
          preparado: {
            caso: corpo.caso,
            solucaoSelada: corpo.solucaoSelada,
            fotos,
            retratosUsados: usados,
            config: config!,
          },
        });
      } catch {
        // Falhou em segundo plano: a próxima partida simplesmente gera na hora.
      }
    }

    void preparar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
