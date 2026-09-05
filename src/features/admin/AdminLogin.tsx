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
    setBusy(true);
    setError('');
    try {
      const result = await adminLogin(password);
      storeAdminSession(result.token, result.expiresIn);
      navigate('/admin', { replace: true });
    } catch {
      setError('Password did not match.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell admin-login">
      <form onSubmit={onSubmit} className="admin-login-card">
        <RestoreLogo variant="light" className="h-8 max-h-8 w-auto" />
        <h1 className="mt-8 font-sans text-[1.75rem] font-bold tracking-tight">Restore Survey</h1>
        <p className="mt-2 font-sans text-sm text-ink/55">Marketing admin</p>
        <label
          htmlFor="password"
          className="mt-8 block font-sans text-[0.68rem] tracking-[0.16em] text-ink/45 uppercase"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="admin-field"
        />
        {error ? <p className="mt-3 font-sans text-sm text-red-800">{error}</p> : null}
        <button type="submit" disabled={busy || !password} className="admin-cta admin-cta-block mt-6">
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
