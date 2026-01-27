import * as CryptoJS from 'crypto-js';

function getPassphrase(): string {
  const pass = process.env.PAYMENTS_ENCRYPTION_KEY;
  if (!pass) {
    throw new Error(
      'La variable de entorno PAYMENTS_ENCRYPTION_KEY no está configurada',
    );
  }
  return pass;
}

/**
 * Encripta texto utilizando crypto-js AES (formato compatible con OpenSSL con sal).
 * Regresa una cadena similar a base64 producida por crypto-js (contiene información de sal).
 */
export function encrypt(text: string): string {
  const pass = getPassphrase();
  const cipher = CryptoJS.AES.encrypt(text, pass);
  return cipher.toString();
}

export function decrypt(payload: string): string {
  const pass = getPassphrase();
  const bytes = CryptoJS.AES.decrypt(payload, pass);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted)
    throw new Error('Payload encriptado inválido o clave incorrecta');
  return decrypted;
}
