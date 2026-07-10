import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
