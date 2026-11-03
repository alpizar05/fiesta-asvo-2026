/** Fiesta ASVO 2026 — Google Apps Script (V8)
 * Script Properties required: BACKEND_SHARED_SECRET, SPREADSHEET_ID, DRIVE_FOLDER_ID,
 * PUBLIC_SITE_URL, ADMIN_EMAIL (asvoorg@gmail.com).
 * Deploy Web app: Execute as ME, access ANYONE. All requests authenticated by a long
 * shared secret kept ONLY on Vercel server and Script Properties. Never put it in browser.
 */
const HEADERS = [
  'id',
  'date',
  'name',
  'email',
  'phone',
  'method',
  'reference',
  'status',
  'receiptId',
  'reason',
  'updatedAt',
  'reuploadToken',
];
const ADMIN_HEADERS = ['email', 'role', 'active'];

function prop_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw Error('Falta configuración: ' + key);
  return v;
}

function ss_() {
  return SpreadsheetApp.openById(prop_('SPREADSHEET_ID'));
}

function sheet_(name, headers) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }

  return sh;
}

function registrations_() {
  return sheet_('Inscripciones', HEADERS);
}

function admins_() {
  return sheet_('Administradores', ADMIN_HEADERS);
}

function setup() {
  registrations_();
  admins_();

  const email = prop_('ADMIN_EMAIL').toLowerCase();
  const sh = admins_();
  const data = sh.getDataRange().getValues();

  if (!data.slice(1).some((r) => String(r[0]).toLowerCase() === email)) {
    sh.appendRow([email, 'ADMIN', true]);
  }
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || '{}');
    if (req.secret !== prop_('BACKEND_SHARED_SECRET')) {
      throw Error('Acceso denegado');
    }

    let data;
    switch (req.action) {
      case 'register':
        data = register_(req.data);
        break;
      case 'overview':
        data = overview_(req.email);
        break;
      case 'review':
        data = review_(req.email, req.data);
        break;
      case 'receipt':
        data = receipt_(req.email, req.id);
        break;
      case 'admins':
        data = listAdmins_(req.email);
        break;
      case 'addAdmin':
        data = addAdmin_(req.email, req.data);
        break;
      case 'removeAdmin':
        data = removeAdmin_(req.email, req.data);
        break;
      case 'reupload':
        data = reupload_(req.token, req.receipt);
        break;
      default:
        throw Error('Acción no permitida');
    }

    return respond_({ ok: true, ...data });
  } catch (err) {
    return respond_({ ok: false, error: String(err.message || err) });
  }
}

function rows_(sh) {
  const values = sh.getDataRange().getValues();
  return values
    .slice(1)
    .filter((r) => r[0])
    .map((r, i) => ({
      row: i + 2,
      record: Object.fromEntries(values[0].map((h, j) => [h, r[j]])),
    }));
}

function getRole_(email) {
  if (!email) throw Error('No autorizado');

  const normalized = String(email).trim().toLowerCase();
  const match = rows_(admins_()).find(
    (x) =>
      String(x.record.email).toLowerCase() === normalized &&
      String(x.record.active).toLowerCase() === 'true',
  );

  if (!match) throw Error('Cuenta no autorizada');
  return match.record.role;
}

function requireAdmin_(email) {
  if (getRole_(email) !== 'ADMIN') throw Error('Requiere rol Administrador');
}

function validateReceipt_(file) {
  if (
    !file ||
    !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) ||
    !file.base64
  ) {
    throw Error('Comprobante inválido');
  }

  const bytes = Utilities.base64Decode(file.base64);
  if (bytes.length < 100 || bytes.length > 4 * 1024 * 1024) {
    throw Error('Archivo fuera de rango');
  }

  const b = bytes.map((x) => (x + 256) % 256);
  const ok =
    file.type === 'image/jpeg'
      ? b[0] === 255 && b[1] === 216 && b[2] === 255
      : file.type === 'image/png'
        ? b.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
        : String.fromCharCode.apply(null, b.slice(0, 5)) === '%PDF-';

  if (!ok) throw Error('Tipo de archivo incorrecto');
  return bytes;
}

function upload_(file, id) {
  const bytes = validateReceipt_(file);
  const extension =
    file.type === 'application/pdf'
      ? 'pdf'
      : file.type === 'image/png'
        ? 'png'
        : 'jpg';
  const blob = Utilities.newBlob(bytes, file.type, id + '.' + extension);
  return DriveApp.getFolderById(prop_('DRIVE_FOLDER_ID'))
    .createFile(blob)
    .getId();
}

function closed_() {
  return new Date() > new Date('2026-12-01T05:59:59Z');
} // 30 nov 23:59:59 Costa Rica (UTC-6)

function register_(d) {
  if (closed_()) {
    throw Error('Las inscripciones cerraron el 30 de noviembre');
  }

  if (
    !d ||
    !d.volunteer ||
    !d.consent ||
    !d.name ||
    !d.email ||
    !d.phone ||
    !d.reference ||
    !['SINPE', 'TRANSFERENCIA'].includes(d.method)
  ) {
    throw Error('Datos incompletos');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    throw Error('Correo inválido');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sh = registrations_();
    const records = rows_(sh);

    if (
      records.some(
        (x) => String(x.record.email).toLowerCase() === d.email.toLowerCase(),
      )
    ) {
      throw Error(
        'Ya existe una inscripción con este correo. Contactá a Coordinación para cambios.',
      );
    }

    if (
      records.some(
        (x) =>
          String(x.record.reference) === d.reference &&
          String(x.record.method) === d.method,
      )
    ) {
      throw Error('Esta referencia de pago ya fue utilizada.');
    }

    const id = 'ASVO26-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    const fileId = upload_(d.receipt, id);
    const now = new Date().toISOString();

    sh.appendRow([
      id,
      now,
      safe_(d.name),
      d.email.toLowerCase(),
      safe_(d.phone),
      d.method,
      safe_(d.reference),
      'PENDING',
      fileId,
      '',
      now,
      '',
    ]);

    mail_(
      d.email,
      '🎉 Recibimos tu inscripción — Fiesta ASVO 2026',
      '¡Hola, ' +
        d.name +
        '!\n\nRecibimos tu inscripción a la Fiesta ASVO del sábado 5 de diciembre, de 2:00 p. m. a 8:00 p. m., en La FOS (Oficina de ASVO).\n\nCódigo: ' +
        id +
        '\nEstado: PENDIENTE DE VERIFICACIÓN.\n\nTe confirmaremos por correo una vez revisado el comprobante.\n\nCoordinación de Voluntariado ASVO',
    );

    return { id };
  } finally {
    lock.releaseLock();
  }
}

function safe_(value) {
  const s = String(value || '')
    .trim()
    .slice(0, 180);
  return /^[=+@\-]/.test(s) ? "'" + s : s;
}

function mail_(to, subject, body) {
  try {
    MailApp.sendEmail({
      to,
      subject,
      body,
      name: 'Coordinación de Voluntariado ASVO',
    });
  } catch (e) {
    console.error('Correo no enviado: ' + e);
  }
}

function overview_(email) {
  const role = getRole_(email);
  const rows = rows_(registrations_()).map((x) => {
    const r = x.record;
    return {
      id: r.id,
      date: String(r.date),
      name: r.name,
      email: r.email,
      phone: r.phone,
      method: r.method,
      reference: r.reference,
      status: r.status,
      reason: r.reason || '',
    };
  });

  return { rows, role };
}

function find_(id) {
  const match = rows_(registrations_()).find((x) => x.record.id === id);
  if (!match) throw Error('Inscripción no encontrada');
  return match;
}

function receipt_(email, id) {
  getRole_(email);

  const file = DriveApp.getFileById(find_(id).record.receiptId);
  const blob = file.getBlob();
  return {
    mime: blob.getContentType(),
    base64: Utilities.base64Encode(blob.getBytes()),
  };
}

function review_(email, d) {
  getRole_(email);
  if (!d || !['APPROVED', 'REJECTED'].includes(d.decision)) {
    throw Error('Decisión inválida');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const item = find_(d.id);
    const r = item.record;
    if (r.status !== 'PENDING') throw Error('La inscripción ya fue revisada');

    const sh = registrations_();
    const now = new Date().toISOString();
    const reason =
      d.decision === 'REJECTED'
        ? String(d.reason || '')
            .trim()
            .slice(0, 400)
        : '';

    if (d.decision === 'REJECTED' && !reason) {
      throw Error('Indicá el motivo del rechazo');
    }

    const token =
      d.decision === 'REJECTED' ? Utilities.getUuid() + Utilities.getUuid() : '';
    sh.getRange(item.row, 8, 1, 5).setValues([
      [d.decision, r.receiptId, reason, now, token],
    ]);

    if (d.decision === 'APPROVED') {
      mail_(
        r.email,
        '✅ Participación confirmada — Fiesta ASVO 2026',
        '¡Hola, ' +
          r.name +
          '!\n\nTu pago fue verificado. ¡Tu participación está confirmada!\n\nSábado 5 de diciembre de 2026\n2:00 p. m. a 8:00 p. m.\nLa FOS — Oficina de ASVO\nCódigo: ' +
          r.id +
          '\n\n¡Nos vemos!\nCoordinación de Voluntariado ASVO',
      );
    } else {
      mail_(
        r.email,
        '⚠️ Actualizá tu comprobante — Fiesta ASVO 2026',
        'Hola, ' +
          r.name +
          '\n\nNo pudimos validar tu comprobante.\nMotivo: ' +
          reason +
          '\n\nPodés cargar uno nuevo desde este enlace privado:\n' +
          prop_('PUBLIC_SITE_URL') +
          '/reupload/' +
          token +
          '\n\nNo compartás este enlace.\nCoordinación de Voluntariado ASVO',
      );
    }

    return { id: r.id, status: d.decision };
  } finally {
    lock.releaseLock();
  }
}

function reupload_(token, file) {
  if (!token || String(token).length < 60) throw Error('Enlace inválido');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const item = rows_(registrations_()).find(
      (x) => x.record.reuploadToken === token && x.record.status === 'REJECTED',
    );
    if (!item) throw Error('Enlace inválido o utilizado');

    const fileId = upload_(file, item.record.id + '-nuevo');
    const sh = registrations_();
    sh.getRange(item.row, 8, 1, 5).setValues([
      ['PENDING', fileId, '', new Date().toISOString(), ''],
    ]);
    mail_(
      item.record.email,
      '📎 Nuevo comprobante recibido — Fiesta ASVO 2026',
      'Recibimos tu nuevo comprobante. Tu inscripción vuelve a estar pendiente de revisión.\n\nCoordinación de Voluntariado ASVO',
    );

    return { id: item.record.id };
  } finally {
    lock.releaseLock();
  }
}

function listAdmins_(email) {
  requireAdmin_(email);
  return {
    admins: rows_(admins_()).map((x) => ({
      email: x.record.email,
      role: x.record.role,
      active: String(x.record.active).toLowerCase() === 'true',
    })),
  };
}

function addAdmin_(email, d) {
  requireAdmin_(email);

  const target = String(d.targetEmail || '')
    .trim()
    .toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) ||
    !['ADMIN', 'REVIEWER'].includes(d.role)
  ) {
    throw Error('Datos inválidos');
  }

  const sh = admins_();
  const match = rows_(sh).find(
    (x) => String(x.record.email).toLowerCase() === target,
  );

  if (match) {
    sh.getRange(match.row, 1, 1, 3).setValues([[target, d.role, true]]);
  } else {
    sh.appendRow([target, d.role, true]);
  }

  return { email: target };
}

function removeAdmin_(email, d) {
  requireAdmin_(email);

  const target = String(d.targetEmail || '')
    .trim()
    .toLowerCase();
  if (
    target === prop_('ADMIN_EMAIL').toLowerCase() ||
    target === String(email).toLowerCase()
  ) {
    throw Error('No se puede deshabilitar esta cuenta');
  }

  const match = rows_(admins_()).find(
    (x) => String(x.record.email).toLowerCase() === target,
  );
  if (!match) throw Error('Cuenta no encontrada');

  admins_().getRange(match.row, 3).setValue(false);
  return { email: target };
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'online',
      application: 'Fiesta ASVO 2026',
      message: 'API disponible',
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}
