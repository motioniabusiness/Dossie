import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
