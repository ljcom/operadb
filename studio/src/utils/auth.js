// src/utils/auth.js

/**
 * --- Fungsi bantalan untuk konversi data ---
 */
function bufferToBase64(buffer) {
  // ArrayBuffer -> Base64 string
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  // Base64 string -> ArrayBuffer
  const binary = atob(base64);
  const len = binary.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = binary.charCodeAt(i);
  }
  return buf.buffer;
}

/**
 * Derive sebuah AES‐GCM key dari password + salt (PBKDF2).
 * @param {string} password 
 * @param {Uint8Array} saltBytes 
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKeyFromPassword(password, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,        // harus Uint8Array
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt privateKeyHex (string) dengan AES‐GCM. 
 * Output yang dikembalikan hanya: { ciphertext, iv, salt } (semua Base64).
 * @param {string} privateKeyHex  (misal: "0xabc123…")
 * @param {string} password 
 * @returns {Promise<{ciphertext: string, iv: string, salt: string}>}
 */
export async function encryptPrivateKey(privateKeyHex, password) {
  // 1) Generate salt (16 byte acak)
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));

  // 2) Derive AES key dengan PBKDF2
  const aesKey = await deriveKeyFromPassword(password, saltBytes);

  // 3) Generate IV (12 byte acak) untuk AES-GCM
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));

  // 4) Enkripsi privateKeyHex (plaintext) menjadi ciphertext
  const enc = new TextEncoder();
  const dataBytes = enc.encode(privateKeyHex); // string -> Uint8Array

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    aesKey,
    dataBytes
  );

  // 5) Kembalikan Base64‐encoded hasil enkripsi + iv + salt
  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(ivBytes.buffer),
    salt: bufferToBase64(saltBytes.buffer),
  };
}

/**
 * Decrypt objek { ciphertext, iv, salt } (semua Base64) dengan password.
 * Jika password salah atau data korup, fungsi ini akan melempar Error.
 * @param {{ ciphertext: string, iv: string, salt: string }} param0 
 * @param {string} password 
 * @returns {Promise<string>}  privateKeyHex (string)
 */
export async function decryptPrivateKey({ ciphertext, iv, salt }, password) {
  // 1) Decode Base64 -> ArrayBuffer
  const saltBytes = new Uint8Array(base64ToBuffer(salt));
  const ivBytes = new Uint8Array(base64ToBuffer(iv));
  const encryptedBytes = base64ToBuffer(ciphertext);

  // 2) Derive kembali AES key dengan PBKDF2
  const aesKey = await deriveKeyFromPassword(password, saltBytes);

  // 3) Dekripsi ciphertext
  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      aesKey,
      encryptedBytes
    );
  } catch {
    throw new Error("Decryption failed");
  }

  // 4) Convert ArrayBuffer -> String (TextDecoder)
  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer); // Ini adalah privateKeyHex
}