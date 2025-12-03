/**
 * Email service for sending emails via Resend API (through backend proxy)
 */
import { getResendFromEmail } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Send email via backend proxy
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {string} html - Optional HTML body
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendEmail(to, subject, text, html = null) {
  const fromEmail = await getResendFromEmail();

  try {
    const response = await fetch(`${API_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        text,
        ...(html && { html }),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || `HTTP ${response.status}` };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * Send backup file as email attachment via backend proxy
 * @param {string} to - Recipient email
 * @param {string} backupContent - Backup file content
 * @param {string} filename - Backup filename
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendBackupEmail(to, backupContent, filename) {
  const fromEmail = await getResendFromEmail();

  try {
    const response = await fetch(`${API_BASE_URL}/api/send-backup-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        backupContent,
        filename,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || `HTTP ${response.status}` };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Error sending backup email:', err);
    return { success: false, error: err.message || 'Failed to send backup email' };
  }
}

