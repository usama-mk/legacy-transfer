import { useState } from 'react';
import {
  getAllPages,
  getSettings,
  savePage,
  saveSettings,
  getTrustees,
  saveTrustee,
  getReleaseConditions,
  saveReleaseConditions
} from '../utils/storage';

function Backup({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setMessage('');

    try {
      const pages = await getAllPages();
      const settings = await getSettings();
      const trustees = await getTrustees();
      const releaseConditions = await getReleaseConditions();

      const backupData = {
        version: '1.0',
        timestamp: Date.now(),
        pages: pages,
        settings: settings,
        trustees: trustees || [],
        releaseConditions: releaseConditions || null
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legacy-backup-${new Date().toISOString().split('T')[0]}.legacy`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('Backup exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      setMessage('Error exporting backup');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.pages || !backupData.settings) {
        throw new Error('Invalid backup file format');
      }

      // Save settings
      await saveSettings(backupData.settings);

      // Save all pages
      for (const page of backupData.pages) {
        await savePage(
          page.id,
          page.category,
          page.encryptedBlob,
          page.iv,
          page.lastModified || Date.now()
        );
      }

      // Save trustees if present
      if (backupData.trustees && Array.isArray(backupData.trustees)) {
        for (const trustee of backupData.trustees) {
          await saveTrustee(trustee);
        }
      }

      // Save release conditions if present
      if (backupData.releaseConditions) {
        await saveReleaseConditions(backupData.releaseConditions);
      }

      const trusteeCount = backupData.trustees ? backupData.trustees.length : 0;
      setMessage(
        `Successfully imported ${backupData.pages.length} entries${trusteeCount > 0 ? `, ${trusteeCount} trustee${trusteeCount > 1 ? 's' : ''}` : ''}!`
      );
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Import error:', err);
      setMessage('Error importing backup. Please check the file format.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="backup-modal">
      <div className="backup-content">
        <div className="backup-header">
          <h2>Backup & Import</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="backup-section">
          <h3>Export Backup</h3>
          <p>Download all your encrypted data as a .legacy file.</p>
          <button
            onClick={handleExport}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Exporting...' : '📥 Export Backup'}
          </button>
        </div>

        <div className="backup-section">
          <h3>Import Backup</h3>
          <p>Restore your data from a previously exported .legacy file.</p>
          <label className="file-input-label">
            <input
              type="file"
              accept=".legacy"
              onChange={handleImport}
              disabled={loading}
            />
            <span className="btn-secondary">
              {loading ? 'Importing...' : '📤 Choose File to Import'}
            </span>
          </label>
        </div>

        {message && (
          <div className={`backup-message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="backup-info">
          <p>
            <strong>Important:</strong> Your backup file contains encrypted data. You'll
            need your master password to decrypt it. Keep your backup file secure and store it in a safe location.
            <br /><br />
            <strong>Local-Only Storage:</strong> This version stores all data locally in your browser. 
            Export regular backups to ensure you don't lose your information if you clear browser data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Backup;

