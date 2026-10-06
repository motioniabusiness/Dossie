import type { Metadata, Viewport } from "next";
import { Courier_Prime, Geist, Special_Elite } from "next/font/google";
import "./globals.css";

/** Texto corrido: legível em qualquer tamanho, inclusive no celular. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Máquina de escrever limpa, para rótulos, fichas e números: o que nos
 * documentos de verdade sairia datilografado.
 */
const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

/**
 * Máquina de escrever gasta, com a tinta falhando: títulos e carimbos. É a
 * mesma família de letra do título desenhado na arte do menu.
 */
const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Dossiê: Duelo de Investigadores",
  description:
    "Dois analistas rivais, um caso inédito, uma única verdade. Jogo de investigação para dois jogadores.",
  // Adicionado à tela inicial do iPhone, abre sem a barra do Safari.
  appleWebApp: { capable: true, title: "Dossiê", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Ocupa a tela toda nos celulares com entalhe; as margens seguras ficam no CSS.
  viewportFit: "cover",
  // Barra do navegador no celular na mesma cor do fundo do jogo.
  themeColor: "#070a10",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${courierPrime.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
