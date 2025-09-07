// Environment configuration and validation

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_BASE_URL: string;
}

const getEnvVar = (name: keyof EnvConfig): string => {
  const value = import.meta.env[name];
  
  if (!value) {
    console.warn(`Missing environment variable: ${name}`);
    // Return defaults for development
    if (name === 'VITE_API_BASE_URL') {
      return 'http://localhost:5000/api';
    }
    return '';
  }
  
  return value;
};

export const env: EnvConfig = {
  VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL'),
  VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  VITE_API_BASE_URL: getEnvVar('VITE_API_BASE_URL'),
};

// Validate environment in development
if (import.meta.env.DEV) {
  console.log('Environment configuration:', {
    SUPABASE_URL: env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
    API_BASE_URL: env.VITE_API_BASE_URL ? '✓ Set' : '✗ Missing',
  });
}