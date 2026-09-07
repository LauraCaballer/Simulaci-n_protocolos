import "./globals.css";

export const metadata = {
  title: "Sliding Window / Go-Back-N — Simulador",
  description: "Simulación interactiva de protocolos de control de flujo y errores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
