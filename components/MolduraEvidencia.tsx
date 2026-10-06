/**
 * Placeholder visual de evidência fotográfica: na v1 não geramos imagens, então
 * a legenda textual é apresentada dentro de uma moldura de arquivo forense.
 *
 * TODO (v2): plugar geração de imagem aqui — trocar este bloco por um <Image>
 * com a URL devolvida pelo modelo, mantendo a legenda como `alt` e rodapé.
 */
export default function MolduraEvidencia({
  legenda,
  numero,
}: {
  legenda: string;
  numero: string;
}) {
  return (
    <figure className="overflow-hidden rounded-md border border-noite-600 bg-noite-950/60">
      <div className="flex items-center justify-between border-b border-noite-700 bg-noite-900/80 px-3 py-2">
        <span className="etiqueta">Evidência fotográfica {numero}</span>
        <span className="font-mono text-[0.625rem] tracking-[0.2em] text-papel-500">
          SEM DIGITALIZAÇÃO
        </span>
      </div>

      <div className="relative px-5 py-6">
        {/* Marcas de canto, como um enquadramento de perícia */}
        <span className="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t border-l border-ambar-500/40" />
        <span className="pointer-events-none absolute top-2 right-2 h-4 w-4 border-t border-r border-ambar-500/40" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-ambar-500/40" />
        <span className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r border-b border-ambar-500/40" />

        <div className="flex gap-4">
          <svg
            viewBox="0 0 24 24"
            className="mt-0.5 h-7 w-7 shrink-0 text-noite-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M3 8.5h3.5L8 6h8l1.5 2.5H21v11H3z" />
            <circle cx="12" cy="14" r="3.6" />
          </svg>
          <figcaption className="text-sm leading-relaxed text-papel-100 italic">
            {legenda}
          </figcaption>
        </div>
      </div>
    </figure>
  );
}
