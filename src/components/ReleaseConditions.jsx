import { useState, useEffect } from "react";
import {
  getReleaseConditions,
  saveReleaseConditions,
  updateLastActivity,
} from "../utils/storage";
import ReleaseDataModal from "./ReleaseDataModal";

function ReleaseConditions({ masterKey, onClose }) {
  const [inactivityDays, setInactivityDays] = useState(60);
  const [requiredTrustees, setRequiredTrustees] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [lastActivity, setLastActivity] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  useEffect(() => {
    loadConditions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConditions = async () => {
    setLoading(true);
    try {
      const conditions = await getReleaseConditions();
      if (conditions) {
        setInactivityDays(conditions.inactivityDays || 60);
        setRequiredTrustees(conditions.requiredTrustees || 1);
        setLastActivity(conditions.lastActivity || Date.now());
      } else {
        // Initialize with defaults
        setLastActivity(Date.now());
        await saveReleaseConditions({
          inactivityDays: 60,
          requiredTrustees: 1,
          lastActivity: Date.now(),
        });
      }
    } catch (err) {
      console.error("Error loading conditions:", err);
      showNotification("Error loading release conditions", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleSave = async () => {
    try {
      await saveReleaseConditions({
        inactivityDays,
        requiredTrustees,
        lastActivity: lastActivity || Date.now(),
      });
      showNotification("Release conditions saved");
    } catch (err) {
      console.error("Error saving conditions:", err);
      showNotification("Error saving release conditions", "error");
    }
  };

  const handleReleaseNow = async () => {
    if (
      window.confirm(
        "Are you sure you want to release all information now? This will decrypt and format all your data for sharing with trustees. This action cannot be undone."
      )
    ) {
      try {
        // Mark as released
        const conditions = {
          inactivityDays,
          requiredTrustees,
          lastActivity: lastActivity || Date.now(),
          released: true,
          releaseDate: Date.now(),
        };
        await saveReleaseConditions(conditions);

        // Show the release data modal
        setShowReleaseModal(true);
      } catch (err) {
        console.error("Error triggering release:", err);
        showNotification("Error triggering release", "error");
      }
    }
  };

  const handleUpdateActivity = async () => {
    try {
      const now = Date.now();
      await updateLastActivity(now);
      setLastActivity(now);
      showNotification("Last activity updated");
    } catch (err) {
      console.error("Error updating activity:", err);
      showNotification("Error updating activity", "error");
    }
  };

  const getDaysSinceActivity = () => {
    if (!lastActivity) return 0;
    const diff = Date.now() - lastActivity;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysSinceActivity = getDaysSinceActivity();
  const daysUntilRelease = Math.max(0, inactivityDays - daysSinceActivity);

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
      <div className="modal-content release-modal">
        <div className="modal-header">
          <h2>Release Conditions</h2>
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

        <div className="release-info">
          <p>
            <strong>How Release Conditions Work</strong>
            <br />
            Configure when and how your information should be released to
            trustees. If you don't log in for the specified period, and the
            required number of trustees verify your status, your information
            will be released to them.
          </p>
        </div>

        <div className="activity-status">
          <h3>Activity Status</h3>
          <div className="status-card">
            <p>
              <strong>Last Activity:</strong>{" "}
              {lastActivity ? new Date(lastActivity).toLocaleString() : "Never"}
            </p>
            <p>
              <strong>Days Since Last Activity:</strong> {daysSinceActivity}{" "}
              days
            </p>
            <p>
              <strong>Days Until Release:</strong> {daysUntilRelease} days
            </p>
            <button onClick={handleUpdateActivity} className="btn-secondary">
              Update Activity Now
            </button>
          </div>
        </div>

        <div className="release-settings">
          <div className="setting-group">
            <label htmlFor="inactivityDays">
              Inactivity Period: <strong>{inactivityDays} days</strong>
            </label>
            <input
              type="range"
              id="inactivityDays"
              min="7"
              max="365"
              value={inactivityDays}
              onChange={(e) => setInactivityDays(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>7 days</span>
              <span>365 days</span>
            </div>
            <p className="help-text">
              Information will be released if you don't log in for this many
              days
            </p>
          </div>

          <div className="setting-group">
            <label htmlFor="requiredTrustees">
              Required Trustees for Verification:{" "}
              <strong>{requiredTrustees}</strong>
            </label>
            <input
              type="range"
              id="requiredTrustees"
              min="1"
              max="2"
              value={requiredTrustees}
              onChange={(e) => setRequiredTrustees(Number(e.target.value))}
              className="slider"
            />
            <div className="slider-labels">
              <span>1 trustee</span>
              <span>2 trustees</span>
            </div>
            <p className="help-text">
              Number of trustees who must verify your status before information
              is released
            </p>
          </div>
        </div>

        <div className="release-actions">
          <button onClick={handleSave} className="btn-primary">
            Save Conditions
          </button>
          <button onClick={handleReleaseNow} className="btn-release">
            🔓 RELEASE NOW
          </button>
        </div>

        <div className="release-warning">
          <p>
            <strong>⚠️ Important:</strong> The "RELEASE NOW" button will decrypt
            and format all your information for sharing with trustees. You'll be
            able to copy, download, or email the formatted data. Use this only
            if you want to grant access to your information right away.
          </p>
        </div>

        {showReleaseModal && (
          <ReleaseDataModal
            masterKey={masterKey}
            onClose={() => setShowReleaseModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default ReleaseConditions;
