# Fiesta ASVO 2026 — instalación

## Estado de entrega
Código fuente listo para configuración, NO publicado ni conectado a servicios reales. Requiere pruebas integrales antes de producción. No subir archivos `.env.local` ni claves a Git.

## 1. Crear recursos de Google
1. Iniciar sesión con **asvoorg@gmail.com**.
2. Crear una carpeta privada en Google Drive: `Fiesta ASVO 2026 - Comprobantes`. No activar «cualquiera con enlace».
3. Copiar el identificador de la carpeta desde su URL (no compartirla públicamente).
4. Crear una hoja de cálculo: `Fiesta ASVO 2026 - Inscripciones`; copiar su identificador.
5. Crear un proyecto en Google Apps Script, pegar `google-apps-script/Code.gs` y guardar.
6. En **Configuración del proyecto → Propiedades del script** definir:
   - `SPREADSHEET_ID`: identificador de la hoja.
   - `DRIVE_FOLDER_ID`: identificador de la carpeta privada.
   - `ADMIN_EMAIL`: `asvoorg@gmail.com`.
   - `PUBLIC_SITE_URL`: `https://fiesta.asvocr.org`.
   - `BACKEND_SHARED_SECRET`: secreto aleatorio largo (64+ caracteres), distinto de NEXTAUTH_SECRET.
7. Ejecutar manualmente `setup()` como propietario y aceptar permisos de Sheets, Drive y correo. Esto crea las pestañas **Inscripciones** y **Administradores**, y autoriza la cuenta inicial.
8. **Implementar → Nueva implementación → Aplicación web**: ejecutar como **Yo**; acceso **Cualquier usuario**. Copiar URL `/exec`. Esta aplicación solo admite operaciones con el secreto compartido del servidor Vercel. No mostrar ese secreto en frontend, logs ni repositorios.
9. Tras cambiar el código Apps Script, crear una **nueva versión de la implementación**; guardar el editor no actualiza automáticamente la versión publicada.

## 2. Google OAuth para el panel
1. En Google Cloud Console, crear o elegir proyecto; configurar pantalla de consentimiento OAuth.
2. Para cuentas personales externas, seleccionar audiencia **Externa**, configurar estado de publicación/usuarios de prueba según corresponda. Si está en pruebas, agregar cada administrador como usuario de prueba.
3. Crear **ID de cliente OAuth → Aplicación web**.
4. Orígenes autorizados: `https://fiesta.asvocr.org` (y `http://localhost:3000` para desarrollo).
5. URI de redirección: `https://fiesta.asvocr.org/api/auth/callback/google` (y `http://localhost:3000/api/auth/callback/google` para desarrollo).
6. Copiar client ID y client secret a variables de entorno de Vercel. El acceso real se valida contra la pestaña **Administradores**, no por iniciar sesión únicamente.

## 3. Vercel
1. Crear repositorio privado con el contenido del proyecto, excluyendo `.env.local`.
2. Importarlo a Vercel como proyecto Next.js.
3. Configurar variables de entorno siguiendo `.env.example`:
   - `NEXTAUTH_URL=https://fiesta.asvocr.org`
   - `NEXTAUTH_SECRET`: valor aleatorio, mínimo 32 bytes.
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: desde Google Cloud.
   - `APPS_SCRIPT_URL`: URL publicada del Apps Script.
   - `BACKEND_SHARED_SECRET`: exactamente el valor guardado en Apps Script.
4. Implementar y comprobar que la página principal carga.
5. **Dominio:** agregar `fiesta.asvocr.org` en Vercel → Domains. Copiar el destino CNAME **que Vercel muestre** para el proyecto.
6. En GoDaddy → DNS de `asvocr.org` → crear/editar registro CNAME de nombre `fiesta` con el destino indicado por Vercel. No tocar los registros MX, SPF, DKIM ni el sitio principal.
7. Esperar validación DNS/HTTPS y actualizar OAuth si cambió el dominio final.

## 4. Pruebas obligatorias
- Envío con JPG, PNG y PDF válidos; rechazo de archivos no permitidos o mayores de 4 MB.
- Envío duplicado por correo y por referencia.
- Correo de recepción, correo de aprobación, correo de rechazo y enlace de sustitución (de un solo uso).
- Acceso al panel con asvoorg@gmail.com, con revisor habilitado y con cuenta no autorizada.
- Agregar y deshabilitar revisores; comprobar que una cuenta deshabilitada ya no consulta archivos.
- Aprobar y rechazar comprobantes, recuentos y exportación CSV.
- Probar desde móvil y red lenta; verificar cuotas de Apps Script, MailApp y tiempo de respuesta.
- Comprobar el cierre de inscripción el 30 de noviembre a las 23:59:59 hora de Costa Rica.
- Revisar el consentimiento para publicación de fotografías y el tratamiento de datos personales.

## 5. Notas operativas
- Google Apps Script es adecuado para un evento de tamaño moderado, pero tiene límites de tiempo, tamaño de solicitudes y cuotas de correo. El tamaño máximo de comprobante se fijó en 4 MB. Si la cantidad de inscripciones o el volumen crecen, migrar el procesamiento de archivos a un backend dedicado.
- El correo se envía desde la cuenta propietaria del Apps Script; el servicio puede fallar por cuota y los fallos quedan registrados en el log de Apps Script. Se recomienda monitoreo y reenvío manual si falla una notificación.
- El comprobante se guarda en una carpeta privada. El panel consulta los archivos mediante una ruta de servidor que verifica el rol.
- Las cuentas administradoras se guardan en la hoja Administradores. El propietario inicial no puede deshabilitarse desde el panel.
- El enlace de sustitución es una credencial de un solo uso: debe mantenerse privado y el participante no debe reenviarlo.
- La aprobación es manual: el sistema no verifica automáticamente movimientos bancarios.
- No se incluye control de asistencia con QR, ni selección de unidad, ni acompañantes.
- Para uso público sostenido, añadir rate limiting externo (por ejemplo, WAF de Vercel), captcha y monitoreo de abuso; el campo trampa no es protección suficiente contra bots.
