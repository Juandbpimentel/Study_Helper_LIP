import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Helper",
  description: "Sistema de gerenciamento de estudos, cronogramas e revisões",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
