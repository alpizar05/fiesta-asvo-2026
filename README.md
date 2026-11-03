# 🎉 Fiesta ASVO 2026

Invitación tropical interactiva, inscripción de personas voluntarias, comprobantes privados en Google Drive, registros en Google Sheets y panel de revisión de pagos con Google OAuth.

- **Evento:** sábado 5 de diciembre de 2026, 2:00 p. m. – 8:00 p. m.
- **Lugar:** La FOS (Oficina de ASVO)
- **Cuota:** ₡5.000; pago únicamente por SINPE Móvil al 8967 0829.
- **Inscripciones:** hasta el 30 de noviembre de 2026 inclusive (hora de Costa Rica); después se cierra el formulario, pero el panel sigue disponible para revisar pagos pendientes.
- **Titular del SINPE Móvil:** Maria José Castro Cerdas.
- **Subdominio propuesto:** fiesta.asvocr.org (DNS en GoDaddy, alojamiento Vercel).
- **Administrador inicial:** asvoorg@gmail.com; posibilidad de agregar administradores y revisores.

## Desarrollo local

Requiere Node.js 20+.

```bash
npm install
cp .env.example .env.local
# Completar variables; para iniciar sesión local configurar redirect OAuth de localhost
npm run dev
```

**Atención:** el formulario solo puede recibir inscripciones reales después de desplegar y configurar el backend de Google Apps Script. La página visual puede revisarse sin configurar servicios, pero los envíos fallarán hasta completar la instalación.

Guía detallada: [docs/INSTALACION.md](docs/INSTALACION.md).
