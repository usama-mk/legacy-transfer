/**
 * IndexedDB storage utilities using localForage
 */
import localforage from "localforage";
import { v4 as uuidv4 } from "uuid";

// Initialize localForage instance
const db = localforage.createInstance({
  name: "legacyOrganizer",
  storeName: "pages",
});

const settingsDb = localforage.createInstance({
  name: "legacyOrganizer",
  storeName: "settings",
});

const trusteesDb = localforage.createInstance({
  name: "legacyOrganizer",
  storeName: "trustees",
});

const releaseConditionsDb = localforage.createInstance({
  name: "legacyOrganizer",
  storeName: "releaseConditions",
});

/**
 * Save a page (entry) to IndexedDB
 * @param {string} pageId - Unique page ID
 * @param {string} category - Category name
 * @param {string} encryptedBlob - Base64-encoded encrypted data
 * @param {string} iv - Base64-encoded IV
 * @param {number} lastModified - Timestamp
 */
export async function savePage(
  pageId,
  category,
  encryptedBlob,
  iv,
  lastModified
) {
  const pageData = {
    id: pageId,
    category,
    encryptedBlob,
    iv,
    lastModified,
  };
  await db.setItem(pageId, pageData);
}

/**
 * Get all pages from IndexedDB
 * @returns {Promise<Array>} Array of all pages
 */
export async function getAllPages() {
  const pages = [];
  await db.iterate((value) => {
    pages.push(value);
  });
  return pages;
}

/**
 * Get a specific page by ID
 * @param {string} pageId - Page ID
 * @returns {Promise<Object|null>} Page data or null if not found
 */
export async function getPageById(pageId) {
  return await db.getItem(pageId);
}

/**
 * Delete a page by ID
 * @param {string} pageId - Page ID
 */
export async function deletePage(pageId) {
  await db.removeItem(pageId);
}

/**
 * Get settings from IndexedDB
 * @returns {Promise<Object|null>} Settings object or null
 */
export async function getSettings() {
  return await settingsDb.getItem("settings");
}

/**
 * Save settings to IndexedDB
 * @param {Object} settings - Settings object (salt, iterations, etc.)
 */
export async function saveSettings(settings) {
  await settingsDb.setItem("settings", settings);
}

/**
 * Check if user has initialized (has settings)
 * @returns {Promise<boolean>} True if settings exist
 */
export async function hasInitialized() {
  const settings = await getSettings();
  return settings !== null;
}

/**
 * Generate a new unique page ID
 * @returns {string} UUID v4
 */
export function generatePageId() {
  return uuidv4();
}

/**
 * Get all trustees
 * @returns {Promise<Array>} Array of trustees
 */
export async function getTrustees() {
  const trustees = [];
  await trusteesDb.iterate((value) => {
    trustees.push(value);
  });
  return trustees;
}

/**
 * Save a trustee
 * @param {Object} trustee - Trustee object with id, name, email, etc.
 */
export async function saveTrustee(trustee) {
  await trusteesDb.setItem(trustee.id, trustee);
}

/**
 * Delete a trustee by ID
 * @param {string} trusteeId - Trustee ID
 */
export async function deleteTrustee(trusteeId) {
  await trusteesDb.removeItem(trusteeId);
}

/**
 * Get release conditions
 * @returns {Promise<Object|null>} Release conditions object or null
 */
export async function getReleaseConditions() {
  return await releaseConditionsDb.getItem("conditions");
}

/**
 * Save release conditions
 * @param {Object} conditions - Release conditions object
 */
export async function saveReleaseConditions(conditions) {
  await releaseConditionsDb.setItem("conditions", conditions);
}

/**
 * Update last activity timestamp
 * @param {number} timestamp - Timestamp
 */
export async function updateLastActivity(timestamp) {
  const conditions = await getReleaseConditions();
  if (conditions) {
    conditions.lastActivity = timestamp;
    await saveReleaseConditions(conditions);
  }
}

/**
 * Get Resend API key from environment variable
 * @returns {string|null} API key or null
 */
export function getResendApiKey() {
  return import.meta.env.VITE_RESEND_API_KEY || null;
}

/**
 * Get Resend from email address from settings
 * @returns {Promise<string>} From email address
 */
export async function getResendFromEmail() {
  const settings = await getSettings();
  return (
    settings?.resendFromEmail || "Legacy Organizer <onboarding@resend.dev>"
  );
}

/**
 * Save Resend from email address to settings
 * @param {string} fromEmail - From email address
 */
export async function saveResendFromEmail(fromEmail) {
  const settings = (await getSettings()) || {};
  settings.resendFromEmail = fromEmail;
  await saveSettings(settings);
}

/**
 * Get backup email settings
 * @returns {Promise<Object|null>} Backup email settings
 */
export async function getBackupEmailSettings() {
  const settings = await getSettings();
  return settings?.backupEmail || null;
}

/**
 * Save backup email settings
 * @param {Object} backupEmail - Backup email settings (email, frequency, lastSent)
 */
export async function saveBackupEmailSettings(backupEmail) {
  const settings = (await getSettings()) || {};
  settings.backupEmail = backupEmail;
  await saveSettings(settings);
}
