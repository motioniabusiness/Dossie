import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const BASE =
  // min-h-11: no celular nenhum botão fica abaixo dos 44 px que o dedo pede.
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium md:min-h-0 " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ambar-500/60 disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-ambar-500 text-noite-950 shadow-lg shadow-ambar-600/20 hover:bg-ambar-400 " +
    "enabled:hover:-translate-y-px active:translate-y-0",
  secundario:
    "border border-noite-600 bg-noite-800/70 text-papel-100 hover:border-ambar-500/60 hover:text-ambar-300",
  fantasma: "text-papel-300 hover:text-ambar-300",
};

export default function Botao({
  variante = "primario",
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
    />
  );
}
