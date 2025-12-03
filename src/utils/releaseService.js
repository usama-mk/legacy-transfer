/**
 * Service to check release conditions and automatically send emails
 */
import { getReleaseConditions, getTrustees, getAllPages, getBackupEmailSettings, saveBackupEmailSettings, getSettings } from './storage';
import { decryptData } from './crypto';
import { sendEmail, sendBackupEmail } from './emailService';

const CATEGORY_NAMES = {
  'digital-accounts': 'Digital Accounts',
  'financial-assets': 'Financial Assets',
  'key-contacts': 'Key Contacts',
  'end-of-life-wishes': 'End-of-Life Wishes'
};

/**
 * Format decrypted data for email
 */
async function formatDataForEmail(masterKey, pages) {
  const pagesByCategory = {};
  for (const page of pages) {
    if (!pagesByCategory[page.category]) {
      pagesByCategory[page.category] = [];
    }
    pagesByCategory[page.category].push(page);
  }

  let formatted = 'LEGACY ORGANIZER - INFORMATION RELEASE\n';
  formatted += '='.repeat(50) + '\n\n';
  formatted += `Release Date: ${new Date().toLocaleString()}\n`;
  formatted += `This information has been automatically released due to inactivity.\n\n`;
  formatted += '='.repeat(50) + '\n\n';

  for (const [category, categoryPages] of Object.entries(pagesByCategory)) {
    const categoryName = CATEGORY_NAMES[category] || category;
    formatted += `\n${categoryName.toUpperCase()}\n`;
    formatted += '-'.repeat(50) + '\n\n';

    for (const page of categoryPages) {
      try {
        const decrypted = await decryptData(masterKey, page.encryptedBlob, page.iv);
        let entryFormatted = '';
        for (const [key, value] of Object.entries(decrypted)) {
          if (value) {
            const label = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            
            if (typeof value === 'string' && value.includes('\n')) {
              entryFormatted += `${label}:\n${value}\n\n`;
            } else {
              entryFormatted += `${label}: ${value}\n`;
            }
          }
        }
        formatted += entryFormatted;
        formatted += '-'.repeat(30) + '\n\n';
      } catch (err) {
        console.error('Error decrypting page:', page.id, err);
        formatted += `[Error decrypting entry]\n\n`;
      }
    }
  }

  formatted += '\n' + '='.repeat(50) + '\n';
  formatted += 'END OF INFORMATION RELEASE\n';
  return formatted;
}

/**
 * Check if release conditions are met and send emails automatically
 */
export async function checkAndProcessReleaseConditions(masterKey) {
  try {
    const conditions = await getReleaseConditions();
    if (!conditions || !conditions.lastActivity) {
      return { shouldRelease: false, reason: 'No release conditions configured' };
    }

    const daysSinceActivity = Math.floor((Date.now() - conditions.lastActivity) / (1000 * 60 * 60 * 24));
    const inactivityDays = conditions.inactivityDays || 60;

    if (daysSinceActivity < inactivityDays) {
      return { shouldRelease: false, reason: `Only ${daysSinceActivity} days since last activity (need ${inactivityDays})` };
    }

    // Check if already released
    if (conditions.released) {
      return { shouldRelease: false, reason: 'Information already released' };
    }

    // Get trustees
    const trustees = await getTrustees();
    if (trustees.length === 0) {
      return { shouldRelease: false, reason: 'No trustees configured' };
    }

    const requiredTrustees = conditions.requiredTrustees || 1;
    if (trustees.length < requiredTrustees) {
      return { shouldRelease: false, reason: `Need ${requiredTrustees} trustee(s), but only ${trustees.length} configured` };
    }

    // Conditions met - release information
    const pages = await getAllPages();
    const formattedData = await formatDataForEmail(masterKey, pages);

    const emailSubject = 'Legacy Organizer - Automatic Information Release';
    const emailBody = `
Dear Trustee(s),

This email contains automatically released information from Legacy Organizer.

The account owner has been inactive for ${daysSinceActivity} days (threshold: ${inactivityDays} days), and the release conditions have been met.

Please find the information below. This information was automatically released on ${new Date().toLocaleString()}.

Please keep this information secure and confidential.

---
${formattedData}
---

This information was automatically released on ${new Date().toLocaleString()} due to ${daysSinceActivity} days of inactivity.

Best regards,
Legacy Organizer
    `.trim();

    // Send to all trustees
    const results = [];
    for (const trustee of trustees) {
      const result = await sendEmail(trustee.email, emailSubject, emailBody);
      results.push({ trustee: trustee.name, success: result.success, error: result.error });
    }

    // Mark as released
    conditions.released = true;
    conditions.releaseDate = Date.now();
    await saveReleaseConditions(conditions);

    return {
      shouldRelease: true,
      released: true,
      results,
      daysSinceActivity,
    };
  } catch (err) {
    console.error('Error checking release conditions:', err);
    return { shouldRelease: false, reason: `Error: ${err.message}` };
  }
}

/**
 * Check if backup email should be sent and send it
 */
export async function checkAndSendBackup(masterKey) {
  try {
    const backupSettings = await getBackupEmailSettings();
    if (!backupSettings || !backupSettings.email) {
      return { shouldSend: false, reason: 'No backup email configured' };
    }

    const frequency = backupSettings.frequency || 30;
    const lastSent = backupSettings.lastSent;
    const now = Date.now();

    // Check if it's time to send backup
    if (lastSent) {
      const daysSinceLastBackup = Math.floor((now - lastSent) / (1000 * 60 * 60 * 24));
      if (daysSinceLastBackup < frequency) {
        return { shouldSend: false, reason: `Last backup sent ${daysSinceLastBackup} days ago (frequency: ${frequency} days)` };
      }
    }

    // Generate backup
    const pages = await getAllPages();
    const settings = await getSettings();
    const backupData = {
      version: '1.0',
      timestamp: now,
      pages: pages,
      settings: settings,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `legacy-backup-${new Date().toISOString().split('T')[0]}.legacy`;

    // Send backup email
    const result = await sendBackupEmail(backupSettings.email, jsonString, filename);

    if (result.success) {
      // Update last sent timestamp
      backupSettings.lastSent = now;
      await saveBackupEmailSettings(backupSettings);
    }

    return {
      shouldSend: true,
      sent: result.success,
      error: result.error,
    };
  } catch (err) {
    console.error('Error checking/sending backup:', err);
    return { shouldSend: false, reason: `Error: ${err.message}` };
  }
}

