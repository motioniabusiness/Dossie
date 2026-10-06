"use client";

import Image from "next/image";
import { useState } from "react";
import Botao from "./Botao";

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
          src="/menu.jpg"
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
        className={`papelzinho relative w-full max-w-sm rounded-sm px-6 pt-8 pb-6 ${
          tentativas > 0 ? "animate-tremer" : "animate-assentar"
        }`}
      >
        <span className="pino pino-ambar" aria-hidden="true" />

        <div className="cascata flex flex-col gap-5">
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="-rotate-3 border-2 border-sangue-600/70 px-2.5 py-1 font-mono text-[0.625rem] tracking-[0.3em] text-sangue-600 uppercase">
              Acesso restrito
            </span>
            <h1 className="mt-2 font-mono text-2xl leading-tight text-noite-900">
              Confidential Files
            </h1>
            <p className="text-xs leading-relaxed text-noite-900/60">
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
              className="font-mono text-[0.5625rem] tracking-[0.18em] text-noite-900/55 uppercase"
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
                className="w-full rounded-sm border border-noite-900/25 bg-papel-50/70 py-2.5 pr-11 pl-3 font-mono text-base text-noite-900 outline-none transition-colors placeholder:text-noite-900/35 focus:border-sangue-600/60 focus:bg-papel-50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrar((m) => !m)}
                aria-label={mostrar ? "Esconder a senha" : "Mostrar a senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-noite-900/45 transition-colors hover:text-sangue-600"
              >
                {mostrar ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3 4.2M6.6 6.6C4.4 8 2.7 10.2 2 12c1 2.5 5 7 10 7a10 10 0 0 0 4.4-1" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
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

          <p className="text-center text-[0.6875rem] leading-relaxed text-noite-900/45">
            Este aparelho fica lembrado por 30 dias.
          </p>
        </div>
      </form>
    </main>
  );
}
