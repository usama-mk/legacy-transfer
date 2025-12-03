import { useState, useEffect } from "react";
import {
  getResendFromEmail,
  saveResendFromEmail,
  getBackupEmailSettings,
  saveBackupEmailSettings,
} from "../utils/storage";
import { getResendApiKey } from "../utils/storage";

function EmailSettings({ onClose }) {
  const [fromEmail, setFromEmail] = useState(
    "Legacy Organizer <onboarding@resend.dev>"
  );
  const [backupEmail, setBackupEmail] = useState("");
  const [backupFrequency, setBackupFrequency] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const from = await getResendFromEmail();
      const backup = await getBackupEmailSettings();
      setFromEmail(from || "Legacy Organizer <onboarding@resend.dev>");
      if (backup) {
        setBackupEmail(backup.email || "");
        setBackupFrequency(backup.frequency || 30);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleSave = async () => {
    if (!fromEmail.trim()) {
      showNotification("Please enter a from email address");
      return;
    }

    setSaving(true);
    try {
      await saveResendFromEmail(fromEmail.trim());

      // Save backup email settings if email is provided
      if (backupEmail.trim()) {
        await saveBackupEmailSettings({
          email: backupEmail.trim(),
          frequency: backupFrequency,
          lastSent: null, // Will be set when backup is sent
        });
      } else {
        // Clear backup settings if email is empty
        await saveBackupEmailSettings(null);
      }

      showNotification("Settings saved successfully");
    } catch (err) {
      console.error("Error saving settings:", err);
      showNotification("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content email-settings-modal">
        <div className="modal-header">
          <h2>Email Settings</h2>
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        </div>

        {notification && (
          <div
            className={`notification ${
              notification.includes("Error") ? "error" : "success"
            }`}
          >
            {notification}
          </div>
        )}

        <div className="email-settings-info">
          <p>
            <strong>Resend API Configuration</strong>
            <br />
            Configure your email settings. The Resend API key should be set in
            your <code>.env</code> file as <code>VITE_RESEND_API_KEY</code>.
            <br />
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key from Resend →
            </a>
          </p>
          {!getResendApiKey() && (
            <p className="error-message" style={{ marginTop: "0.5rem" }}>
              ⚠️ Resend API key not found in environment variables. Please set
              VITE_RESEND_API_KEY in your .env file.
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="fromEmail">From Email Address</label>
          <input
            type="text"
            id="fromEmail"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            placeholder="Legacy Organizer <onboarding@resend.dev>"
          />
          <p className="help-text">
            The email address that will appear as the sender. Use the default
            for testing, or set your verified domain email (e.g., "Legacy
            Organizer &lt;noreply@yourdomain.com&gt;").
          </p>
        </div>

        <div className="setting-group">
          <h3>Automatic Backup Email</h3>
          <div className="form-group">
            <label htmlFor="backupEmail">Backup Email Address</label>
            <input
              type="email"
              id="backupEmail"
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              placeholder="backup@example.com"
            />
            <p className="help-text">
              Email address to receive automatic backup files. Leave empty to
              disable automatic backups.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="backupFrequency">
              Backup Frequency: <strong>{backupFrequency} days</strong>
            </label>
            <input
              type="range"
              id="backupFrequency"
              min="7"
              max="365"
              value={backupFrequency}
              onChange={(e) => setBackupFrequency(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>7 days</span>
              <span>365 days</span>
            </div>
            <p className="help-text">
              How often to automatically send backup files to the email above.
            </p>
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailSettings;
