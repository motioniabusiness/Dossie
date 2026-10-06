import { NextResponse } from "next/server";
import { SalaIndisponivel, armazem, sortearCodigo } from "@/lib/servidor/salas";

export const runtime = "nodejs";

/** Cria uma sala vazia e devolve o código para o convidado digitar. */
export async function POST() {
  try {
    const salas = armazem();
    // Colisão é raríssima (32^4 códigos), mas não custa tentar de novo.
    for (let i = 0; i < 5; i++) {
      const codigo = sortearCodigo();
      if (await salas.criar(codigo)) {
        return NextResponse.json({ codigo });
      }
    }
    return NextResponse.json(
      { erro: "Não foi possível criar a sala. Tente de novo." },
      { status: 500 },
    );
  } catch (e) {
    if (e instanceof SalaIndisponivel) {
      console.error("[sala]", e.message);
      return NextResponse.json({ erro: e.message }, { status: 503 });
    }
    throw e;
  }
}
