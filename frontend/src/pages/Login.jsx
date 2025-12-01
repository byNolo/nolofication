import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Button from '../components/Button';
import Card from '../components/Card';
import { LogIn, Loader2 } from 'lucide-react';

const KEYN_BASE_URL = import.meta.env.VITE_KEYN_BASE_URL || 'https://auth-keyn.bynolo.ca';
const CLIENT_ID = import.meta.env.VITE_KEYN_CLIENT_ID || 'nolofication';
const REDIRECT_URI = window.location.origin + '/auth/callback';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (error) {
      setError('Authentication failed: ' + error);
      return;
    }

    if (code) {
      handleCallback(code, state);
    }
  }, [searchParams]);

  const handleCallback = async (code, state) => {
    // Verify state matches
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      setError('Invalid state parameter');
      return;
    }
    sessionStorage.removeItem('oauth_state');

    setProcessing(true);
    setError('');

    try {
      // Exchange code for token via our backend (avoids CORS)
      const loginResponse = await fetch('/api/auth/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: REDIRECT_URI
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.error_description || errorData.error || 'Login failed');
      }

      const loginData = await loginResponse.json();

      // Store the token and update auth state
      localStorage.setItem('auth_token', loginData.token);
      await login(loginData.token);

      // Redirect to home
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = () => {
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);

    // Redirect to KeyN OAuth
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'id,username,email',
      state: state,
    });

    window.location.href = `${KEYN_BASE_URL}/oauth/authorize?${params.toString()}`;
  };

  if (authLoading || processing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-nolo-green mx-auto mb-4" />
          <p className="text-text-secondary">
            {processing ? 'Completing login...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-nolo-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-nolo-green" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Nolofication</h1>
          <p className="text-text-secondary">
            Sign in with your KeyN account to manage your notifications
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleLogin}
          variant="primary"
          size="lg"
          className="w-full"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Sign in with KeyN
        </Button>

        <div className="mt-6 pt-6 border-t border-dark-border">
          <p className="text-xs text-text-secondary text-center">
            By signing in, you agree to receive notifications from sites you've authorized.
            <br />
            You can manage your preferences at any time.
          </p>
        </div>
      </Card>
    </div>
  );
}
