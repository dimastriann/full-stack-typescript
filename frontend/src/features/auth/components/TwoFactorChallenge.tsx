import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { COMPLETE_2FA_LOGIN_MUTATION } from '../gql/auth.graphql';
import { useAuthStore } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

interface TwoFactorChallengeProps {
  preAuthToken: string;
  onCancel: () => void;
}

/**
 * Displayed after successful password check when the user has 2FA enabled.
 * Accepts either a 6-digit TOTP code or an 8-char backup code.
 */
export default function TwoFactorChallenge({
  preAuthToken,
  onCancel,
}: TwoFactorChallengeProps) {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [completeTwoFactorLogin, { loading }] = useMutation(
    COMPLETE_2FA_LOGIN_MUTATION,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackup]);

  const handleSubmit = async (token: string) => {
    if (!token.trim()) return;
    setErrorMsg('');

    try {
      const { data } = await completeTwoFactorLogin({
        variables: { preAuthToken, token: token.trim() },
      });

      if (data?.completeTwoFactorLogin) {
        setAuth(data.completeTwoFactorLogin.user, 'logged_in');
        navigate('/dashboard');
      }
    } catch {
      setErrorMsg('Invalid code. Please check and try again.');
      setCode('');
      inputRef.current?.focus();
    }
  };

  /** Auto-submit on 6-digit TOTP entry (not backup codes). */
  const handleTotpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      handleSubmit(digits);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Two-Factor Authentication"
    >
      <div className="w-full max-w-sm mx-4">
        <div className="card p-8 shadow-float">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-2xl flex items-center justify-center text-white mb-4 shadow-glow">
              <ShieldCheck size={28} strokeWidth={2} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Two-Factor Authentication
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              {useBackup
                ? 'Enter one of your saved backup codes.'
                : 'Open your authenticator app and enter the 6-digit code.'}
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-in-up">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                {errorMsg}
              </p>
            </div>
          )}

          {/* TOTP input */}
          {!useBackup ? (
            <div>
              <label
                htmlFor="totp-code"
                className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Authentication Code
              </label>
              <input
                id="totp-code"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => handleTotpChange(e.target.value)}
                placeholder="000000"
                disabled={loading}
                className="input-modern text-center text-2xl font-bold tracking-[0.5em] w-full py-4 disabled:opacity-50"
                autoComplete="one-time-code"
              />
            </div>
          ) : (
            /* Backup code input */
            <div>
              <label
                htmlFor="backup-code"
                className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Backup Code
              </label>
              <input
                id="backup-code"
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4E5"
                disabled={loading}
                className="input-modern text-center font-mono text-lg tracking-widest w-full py-4 disabled:opacity-50"
                autoComplete="off"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(code)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Verify Backup Code
              </button>
            </div>
          )}

          {/* Toggle between TOTP / backup */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUseBackup(!useBackup);
                setCode('');
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline transition-colors"
            >
              {useBackup
                ? '← Back to authenticator app'
                : 'Use a backup code instead'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Cancel and return to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
