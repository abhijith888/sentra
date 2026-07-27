import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
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

      // Register user via Django backend endpoint
      await axios.post('http://127.0.0.1:8000/api/v1/register/', {
        username: email,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password: password,
        role: 'User'
      });

      // Auto login after registration
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const responseErrors = err.response?.data;
      if (typeof responseErrors === 'object' && responseErrors !== null) {
        const firstKey = Object.keys(responseErrors)[0];
        const msg = Array.isArray(responseErrors[firstKey])
          ? responseErrors[firstKey][0]
          : responseErrors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Failed to create account. Please try again.');
      }
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