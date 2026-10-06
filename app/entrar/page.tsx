import type { Metadata } from "next";
import FormularioEntrada from "@/components/FormularioEntrada";

export const metadata: Metadata = {
  title: "Entrar · Dossiê",
};

export default function PaginaEntrar() {
  return <FormularioEntrada />;
}
