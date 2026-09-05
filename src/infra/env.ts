interface EnvConfig {
  supabaseUrl: string;
  anonKey: string;
  serverUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function required(key: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (value) return value;
  throw new Error(`Missing required environment variable: ${key}`);
}

export const env: EnvConfig = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  anonKey: required('VITE_SUPABASE_ANON_KEY'),
  serverUrl: required('VITE_SERVER_URL'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://conferences.restoreworklife.com';
