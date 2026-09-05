const TOKEN_KEY = 'restore_admin_token';
const EXPIRY_KEY = 'restore_admin_expiry';

export function storeAdminSession(token: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, String(expiresAt));
}

export function getAdminToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  if (!token || Date.now() > expiry) {
    clearAdminSession();
    return null;
  }
  return token;
}

export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null;
}

export function clearAdminSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
