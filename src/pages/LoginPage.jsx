import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { customFetch } from '../api'; // Custom Fetch import ചെയ്തു
import './Login.css';

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Feedback States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Login Submission
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
      setError('An error occurred during sign in. Please try again.');
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

      // Register user via customFetch (Relative Base URL)
      const response = await customFetch('/api/v1/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          email: email,
          first_name: firstName,
          last_name: lastName,
          password: password,
          role: 'User',
        }),
      });

      if (!response.ok) {
        const responseErrors = await response.json();
        if (typeof responseErrors === 'object' && responseErrors !== null) {
          const firstKey = Object.keys(responseErrors)[0];
          const msg = Array.isArray(responseErrors[firstKey])
            ? responseErrors[firstKey][0]
            : responseErrors[firstKey];
          setError(`${firstKey}: ${msg}`);
        } else {
          setError('Failed to create account. Please try again.');
        }
        return;
      }

      // Auto login after successful registration
      const loginResult = await login(email, password);
      if (loginResult.success) {
        navigate('/dashboard');
      } else {
        setError('Registered successfully, but automated login failed. Please sign in manually.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-logo">S</div>
          <span className="brand-name">Sentra</span>
        </div>

        {/* Dynamic Header Text */}
        <h2 className="form-title">{isSignUp ? 'Create account' : 'Sign in'}</h2>
        <p className="form-subtitle">
          {isSignUp
            ? 'New accounts start with the Viewer role'
            : 'User & access management console'}
        </p>

        {/* Error Alert */}
        {error && <div className="error-alert">{error}</div>}

        {/* Forms */}
        {isSignUp ? (
          /* CREATE ACCOUNT FORM */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                placeholder="Jane Cooper"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm</label>
                <input
                  type="password"
                  placeholder="Repeat it"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>
        ) : (
          /* SIGN IN FORM */
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Toggle Controls */}
        <div className="login-footer">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                }}
              >
                Sign in
              </button>
            </p>
          ) : (
            <div className="signin-footer">
              <span className="demo-hint">Demo: any email + password</span>
              <button
                type="button"
                className="toggle-link"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                }}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;