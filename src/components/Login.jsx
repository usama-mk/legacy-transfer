import { useState, useEffect } from 'react';
import { deriveMasterKey, generateSalt } from '../utils/crypto';
import { hasInitialized, getSettings, saveSettings } from '../utils/storage';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkInitialization();
  }, []);

  const checkInitialization = async () => {
    const initialized = await hasInitialized();
    setIsFirstTime(!initialized);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstTime) {
        // First-time user: create master password
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Generate salt and derive key
        const salt = await generateSalt();
        const iterations = 100000;
        const masterKey = await deriveMasterKey(password, salt, iterations);

        // Save settings
        await saveSettings({
          salt,
          iterations
        });

        // Pass masterKey to parent (App.js)
        onLogin(masterKey);
      } else {
        // Returning user: verify password
        const settings = await getSettings();
        if (!settings) {
          setError('Settings not found. Please refresh and try again.');
          setLoading(false);
          return;
        }

        const masterKey = await deriveMasterKey(
          password,
          settings.salt,
          settings.iterations
        );

        // Pass masterKey to parent
        onLogin(masterKey);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Legacy Organizer</h1>
        <p className="subtitle">
          {isFirstTime
            ? 'Create your master password to organize your critical life information'
            : 'Enter your master password to access your legacy information'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Master Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter master password"
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {isFirstTime && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm master password"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : isFirstTime ? 'Create Password' : 'Login'}
          </button>
        </form>

        <div className="info-box">
          <p>
            <strong>🔒 Secure, Local-Only Storage</strong>
            <br />
            Legacy Organizer stores all your critical life information locally in your browser. 
            Everything is encrypted with AES-GCM encryption. Your master password is never stored or transmitted.
            <br /><br />
            <strong>This is a local-only tool.</strong> Your data never leaves your device unless you explicitly export a backup.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

