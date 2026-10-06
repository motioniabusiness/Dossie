"use client";

import Image from "next/image";
import { useState } from "react";
import Botao from "./Botao";
import { IconeOlho, IconeOlhoFechado } from "./Icones";

/**
 * Porta de entrada do jogo publicado. Fica no mesmo cenário do menu, desfocado
 * ao fundo, com uma ficha de acesso por cima: parece parte do jogo, e não uma
 * janela do sistema pedindo usuário e senha.
 */
export default function FormularioEntrada() {
  const [senha, setSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** Muda a cada erro para reiniciar a animação de tremer. */
  const [tentativas, setTentativas] = useState(0);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!senha || enviando) return;
    setEnviando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });

      if (resposta.ok) {
        // Navegação completa, para o Proxy já ver o cookie novo.
        window.location.replace("/");
        return;
      }

      const corpo: unknown = await resposta.json().catch(() => null);
      setErro(
        corpo &&
          typeof corpo === "object" &&
          "erro" in corpo &&
          typeof corpo.erro === "string"
          ? corpo.erro
          : "Não foi possível entrar agora.",
      );
      setTentativas((t) => t + 1);
      setSenha("");
    } catch {
      setErro("Sem conexão com o servidor.");
      setTentativas((t) => t + 1);
    }
    setEnviando(false);
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden px-4 py-10">
      {/* Cenário do escritório, desfocado e escurecido */}
      <div className="animate-panorama absolute inset-0">
        <Image
          src="/menu.webp"
          alt=""
          fill
          priority
          unoptimized
          className="scale-105 object-cover blur-[3px]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(7,10,16,0.55),rgba(7,10,16,0.92))]" />

      <form
        key={tentativas}
        onSubmit={entrar}
        className={`papelzinho relative w-full max-w-sm border-2 border-tinta px-6 pt-8 pb-6 shadow-[7px_7px_0_0_rgba(0,0,0,0.55)] ${
          tentativas > 0 ? "animate-tremer" : "animate-assentar"
        }`}
      >
        <span className="pino pino-ambar" aria-hidden="true" />

        <div className="cascata flex flex-col gap-5">
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="carimbo animate-carimbar text-sm" style={{ "--giro": "-4deg" } as React.CSSProperties}>
              Acesso restrito
            </span>
            <h1 className="mt-2 font-maquina text-3xl leading-tight text-tinta">
              Confidential Files
            </h1>
            <p className="font-mono text-[0.8rem] leading-relaxed text-tinta/65">
              Escritório de investigação de Claudio e Bianca. Apresente a senha
              para abrir os arquivos.
            </p>
          </header>

          {/* Campo oculto: ajuda o gerenciador de senhas do celular a salvar. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value="dossie"
            readOnly
            hidden
          />

          <div className="flex flex-col gap-1">
            <label
              htmlFor="senha"
              className="font-mono text-[0.66rem] font-bold tracking-[0.18em] text-tinta/55 uppercase"
            >
              Senha do escritório
            </label>
            <div className="relative">
              <input
                id="senha"
                type={mostrar ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                autoFocus
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  if (erro) setErro(null);
                }}
                aria-invalid={erro !== null}
                aria-describedby={erro ? "erro-senha" : undefined}
                className="campo-papel py-2.5 pr-11 text-base"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrar((m) => !m)}
                aria-label={mostrar ? "Esconder a senha" : "Mostrar a senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-tinta/50 transition-colors hover:text-sangue-500"
              >
                {mostrar ? <IconeOlhoFechado className="h-5 w-5" /> : <IconeOlho className="h-5 w-5" />}
              </button>
            </div>
            <p
              id="erro-senha"
              role="alert"
              className="min-h-5 pt-1 text-xs text-sangue-600"
            >
              {erro}
            </p>
          </div>

          <Botao type="submit" disabled={!senha || enviando} className="w-full">
            {enviando ? "Conferindo..." : "Entrar no escritório"}
          </Botao>

          <p className="text-center font-mono text-[0.72rem] leading-relaxed text-tinta/50">
            Este aparelho fica lembrado por 30 dias.
          </p>
        </div>
      </form>
    </main>
  );
}
