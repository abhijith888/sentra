import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customFetch } from '../api'; // 1. Centralized customFetch import ചെയ്തു

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Sign In Submission
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Account Registration Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registrationData = {
        username: email,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password: password,
        role: 'User'
      };

      // Call context register function
      const result = register
        ? await register(registrationData)
        : await handleDirectRegister(registrationData);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Failed to create account.');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback direct register with customFetch if context method isn't loaded
  const handleDirectRegister = async (userData) => {
    // 2. hardcoded URL മാറ്റി customFetch ഉപയോഗിച്ചു
    const response = await customFetch('/api/v1/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errData = await response.json();
      let msg = 'Failed to create account.';
      if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        const val = errData[firstKey];
        msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
      }
      return { success: false, message: msg };
    }

    return await login(userData.email, userData.password);
  };

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        {/* Brand Header */}
        <div style={styles.brandContainer}>
          <div style={styles.brandBadge}>S</div>
          <span style={styles.brandTitle}>Sentra</span>
        </div>

        {/* Dynamic Titles */}
        <h2 style={styles.formTitle}>{isSignUp ? 'Create account' : 'Sign in'}</h2>
        <p style={styles.formSubtitle}>
          {isSignUp
            ? 'New accounts start with the Viewer role'
            : 'User & access management console'}
        </p>

        {/* Error Alert */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Forms */}
        {isSignUp ? (
          /* CREATE ACCOUNT FORM */
          <form onSubmit={handleRegister}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Full name</label>
              <input
                type="text"
                placeholder="Jane Cooper"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="Min 8 chars"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.fieldGroup, flex: 1 }}>
                <label style={styles.label}>Confirm</label>
                <input
                  type="password"
                  placeholder="Repeat it"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form onSubmit={handleSignIn}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div style={styles.footer}>
          {isSignUp ? (
            <div>
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
                style={styles.toggleBtn}
              >
                Sign in
              </button>
            </div>
          ) : (
            <div style={styles.signinFooterRow}>
              <span style={styles.demoHint}>Don't have an account?</span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
                style={styles.toggleBtn}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline CSS Styles matching Sentra Prototype UI
const styles = {
  screen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '420px',
    padding: '36px',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px'
  },
  brandBadge: {
    backgroundColor: '#0d9488',
    color: '#ffffff',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px'
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a'
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  formSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 20px 0'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px'
  },
  fieldGroup: {
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px'
  },
  footer: {
    marginTop: '24px',
    fontSize: '13px',
    color: '#64748b'
  },
  signinFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  demoHint: {
    color: '#94a3b8'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
    fontSize: '13px'
  }
};

export default Login;
