import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

/**
 * Botão de tinta: contorno preto e sombra dura deslocada (ver `.botao` no
 * globals.css). No celular nenhum botão fica abaixo dos 44 px do dedo.
 */
export default function Botao({
  variante = "primario",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      {...props}
      className={`botao botao-${variante} min-h-11 md:min-h-10 ${className}`}
    />
  );
}
