import "./styles.css";

export const metadata = {
  title: "Fiesta ASVO 2026 | ¡Celebremos juntos!",
  description:
    "Fiesta de fin de año ASVO. Sábado 5 de diciembre, 2 a 8 p. m. Inscripción exclusiva para voluntariado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
