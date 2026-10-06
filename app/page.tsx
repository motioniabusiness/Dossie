import Jogo from "@/components/Jogo";
import TrilhaSonora from "@/components/TrilhaSonora";
import { ProvedorJogo } from "@/lib/estado/JogoProvider";

export default function Home() {
  return (
    // Sem `justify-center`: em telas altas (sala de investigação) a centralização
    // vertical em flex esconderia o topo do conteúdo.
    <main className="relative z-10 flex flex-1 flex-col">
      <ProvedorJogo>
        <Jogo />
        <TrilhaSonora />
      </ProvedorJogo>
    </main>
  );
}
