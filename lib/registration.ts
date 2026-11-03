// Costa Rica is UTC-6; close at midnight after November 30.
export const REGISTRATION_CUTOFF = Date.UTC(2026, 11, 1, 6);
export const REGISTRATION_CLOSED_ERROR = "Las inscripciones cerraron el 30 de noviembre.";

export function isRegistrationClosed(now = Date.now()) {
  return now >= REGISTRATION_CUTOFF;
}
