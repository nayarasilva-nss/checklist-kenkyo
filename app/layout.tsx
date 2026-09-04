import type { Metadata } from "next";
import { Archivo, Outfit } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Checklist Kenkyo",
  description: "Sistema de checklists interno da operação Kenkyo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
