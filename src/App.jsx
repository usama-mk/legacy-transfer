import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import CategoryPage from './components/CategoryPage.jsx';
import Backup from './components/Backup.jsx';
import TrusteeManagement from './components/TrusteeManagement.jsx';
import ReleaseConditions from './components/ReleaseConditions.jsx';
import EmailSettings from './components/EmailSettings.jsx';
import { updateLastActivity } from './utils/storage';
import { checkAndProcessReleaseConditions, checkAndSendBackup } from './utils/releaseService';
import './App.css';

function App() {
  const [masterKey, setMasterKey] = useState(null);
  const [showBackup, setShowBackup] = useState(false);
  const [showTrustees, setShowTrustees] = useState(false);
  const [showReleaseConditions, setShowReleaseConditions] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  const handleLogin = async (key) => {
    setMasterKey(key);
    // Update last activity on login
    await updateLastActivity(Date.now());
  };

  // Check release conditions and backup on login
  useEffect(() => {
    if (masterKey) {
      // Check release conditions (only once on login, not repeatedly)
      checkAndProcessReleaseConditions(masterKey).then(result => {
        if (result.shouldRelease && result.released) {
          console.log('Information automatically released to trustees');
          // Could show a notification here if needed
        }
      }).catch(err => {
        console.error('Error checking release conditions:', err);
      });

      // Check and send backup if needed
      checkAndSendBackup(masterKey).then(result => {
        if (result.shouldSend && result.sent) {
          console.log('Automatic backup email sent');
        }
      }).catch(err => {
        console.error('Error checking backup:', err);
      });

      // Update activity on any interaction
      const activityInterval = setInterval(async () => {
        await updateLastActivity(Date.now());
      }, 60000); // Update every minute while active

      return () => clearInterval(activityInterval);
    }
  }, [masterKey]);

  const handleLogout = () => {
    setMasterKey(null);
  };

  return (
    <Router>
      <div className="app">
        {masterKey && (
          <div className="app-header">
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        )}

        <Routes>
          <Route
            path="/login"
            element={
              masterKey ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/"
            element={
              masterKey ? (
                <Dashboard
                  onBackup={() => setShowBackup(true)}
                  onImport={() => setShowBackup(true)}
                  onTrustees={() => setShowTrustees(true)}
                  onReleaseConditions={() => setShowReleaseConditions(true)}
                  onEmailSettings={() => setShowEmailSettings(true)}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/category/:categoryId"
            element={
              masterKey ? (
                <CategoryPage masterKey={masterKey} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {showBackup && (
          <Backup onClose={() => setShowBackup(false)} />
        )}

        {showTrustees && masterKey && (
          <TrusteeManagement
            masterKey={masterKey}
            onClose={() => setShowTrustees(false)}
          />
        )}

        {showReleaseConditions && masterKey && (
          <ReleaseConditions
            masterKey={masterKey}
            onClose={() => setShowReleaseConditions(false)}
          />
        )}

        {showEmailSettings && (
          <EmailSettings
            onClose={() => setShowEmailSettings(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
