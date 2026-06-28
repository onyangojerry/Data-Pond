import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { upsertProfile } from '../utils/profiles.js';
import { supabase } from '../utils/supabaseClient.js';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('sign-in');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const returnPath = location.state?.from?.pathname || '/admin';

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    if (!supabase) {
      setError('Supabase is not configured. Copy .env.example to .env and fill in your project URL and anon key.');
      setSubmitting(false);
      return;
    }

    const credentials = { email: email.trim(), password };
    const result =
      mode === 'sign-up'
        ? await supabase.auth.signUp({
            ...credentials,
            options: {
              data: {
                username: username.trim()
              }
            }
          })
        : await supabase.auth.signInWithPassword(credentials);

    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Account created. Check your email to confirm your address, then sign in.');
      setSubmitting(false);
      return;
    }

    if (mode === 'sign-up' && result.data.user) {
      try {
        await upsertProfile(result.data.user.id, username);
      } catch (profileError) {
        setMessage(`Account created, but username could not be saved: ${profileError.message}`);
      }
    }

    navigate(returnPath, { replace: true });
  }

  return (
    <div>
      <h2>{mode === 'sign-up' ? 'Create Admin Account' : 'Admin Login'}</h2>
      <p>
        <Link to="/">Back to Home</Link>
      </p>
      <hr />

      {error && <div className="error-box">{error}</div>}
      {message && <div className="notice-box">{message}</div>}

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        {mode === 'sign-up' && (
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength="2"
              required
            />
          </label>
        )}

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength="6"
            required
          />
        </label>

        <p>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'sign-up' ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </form>

      <p>
        {mode === 'sign-up' ? (
          <button type="button" className="link-button" onClick={() => setMode('sign-in')}>
            Already have an account? Sign in
          </button>
        ) : (
          <button type="button" className="link-button" onClick={() => setMode('sign-up')}>
            Need an account? Create one
          </button>
        )}
      </p>
    </div>
  );
}
