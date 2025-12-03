/**
 * Crypto utilities for master key derivation and data encryption/decryption
 */

/**
 * Generate a random salt (16 bytes) and return as base64
 * @returns {Promise<string>} Base64-encoded salt
 */
export async function generateSalt() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...salt));
}

/**
 * Derive a master key from password using PBKDF2
 * @param {string} password - Master password
 * @param {string} salt - Base64-encoded salt
 * @param {number} iterations - PBKDF2 iterations (default: 100000)
 * @returns {Promise<CryptoKey>} Derived AES-GCM key
 */
export async function deriveMasterKey(password, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

  const masterKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );

  return masterKey;
}

/**
 * Encrypt data using AES-GCM
 * @param {CryptoKey} masterKey - Master encryption key
 * @param {any} data - Data to encrypt (will be JSON stringified)
 * @returns {Promise<{cipherText: string, iv: string}>} Encrypted data and IV in base64
 */
export async function encryptData(masterKey, data) {
  const encoder = new TextEncoder();
  const dataString = JSON.stringify(data);
  const dataBuffer = encoder.encode(dataString);

  // Generate random 12-byte IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    masterKey,
    dataBuffer
  );

  // Convert to base64
  const cipherText = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    cipherText,
    iv: ivBase64
  };
}

/**
 * Decrypt data using AES-GCM
 * @param {CryptoKey} masterKey - Master decryption key
 * @param {string} cipherText - Base64-encoded ciphertext
 * @param {string} iv - Base64-encoded IV
 * @returns {Promise<any>} Decrypted data (parsed from JSON)
 */
export async function decryptData(masterKey, cipherText, iv) {
  const decoder = new TextDecoder();

  // Convert base64 to ArrayBuffer
  const cipherBuffer = Uint8Array.from(atob(cipherText), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    masterKey,
    cipherBuffer
  );

  const decryptedString = decoder.decode(decrypted);
  return JSON.parse(decryptedString);
}

