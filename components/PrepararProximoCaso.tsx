"use client";

import { useEffect, useRef } from "react";
import { useJogo, usePapel } from "@/lib/estado/JogoProvider";
import { adiantar } from "@/lib/proximoCaso";

/**
 * Monta o próximo caso em segundo plano enquanto a dupla lê o resultado. Ler
 * a solução e as notas leva um ou dois minutos, tempo de sobra para o caso
 * seguinte ficar pronto: a partir da segunda partida a espera vira zero.
 *
 * Roda só depois do julgamento, e não durante o veredito, por dois motivos:
 * nunca disputa os últimos créditos com o júri, e só gasta quando a partida
 * atual já terminou de verdade.
 *
 * Não renderiza nada.
 */
export default function PrepararProximoCaso() {
  const { estado, dispatch } = useJogo();
  const { anfitriao } = usePapel();
  const disparado = useRef(false);
  /**
   * Num efeito próprio: o StrictMode monta, desmonta e monta de novo, e um
   * marcador preso ao efeito do pedido ficaria "desmontado" para sempre.
   */
  const montado = useRef(false);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    // À distância, só o aparelho de quem criou a sala adianta o caso.
    if (!anfitriao || disparado.current) return;
    const config = estado.config;
    if (!config || estado.casoPreparado) return;
    disparado.current = true;

    void adiantar(config, estado.resumosVistos, estado.retratosUsados).then(
      (pronto) => {
        // Se a tela já saiu, quem quiser o caso pega direto do adiantamento.
        if (pronto && montado.current) {
          dispatch({ tipo: "GUARDAR_CASO_PREPARADO", preparado: pronto });
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
