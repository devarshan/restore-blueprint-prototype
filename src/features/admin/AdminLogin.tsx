import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { RestoreLogo } from '../../components/RestoreLogo';
import { adminLogin } from '../../infra/api';
import { storeAdminSession } from '../../infra/auth';

export function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const previousBackground = html.style.background;
    const previousColor = document.body.style.color;
    html.style.background = '#f4f6f7';
    document.body.style.color = '#102539';
    return () => {
      html.style.background = previousBackground;
      document.body.style.color = previousColor;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setError('Enter the password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await adminLogin(password);
      storeAdminSession(result.token, result.expiresIn);
      navigate('/admin', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/too many/i.test(message)) setError('Too many tries. Wait a few minutes, then try once.');
      else if (/failed to fetch|networkerror|load failed/i.test(message)) {
        setError('Could not reach the server.');
      } else setError('Password did not match.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={onSubmit} className="admin-login-panel">
        <RestoreLogo variant="light" className="admin-login-logo" />
        <h1 className="admin-login-title">Admin</h1>
        <label htmlFor="password" className="admin-login-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError('');
          }}
          className="admin-login-field"
        />
        {error ? <p className="admin-login-error">{error}</p> : null}
        <button type="submit" disabled={busy} className="admin-login-submit">
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
