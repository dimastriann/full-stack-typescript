import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import {
  SETUP_2FA_MUTATION,
  VERIFY_ENABLE_2FA_MUTATION,
  DISABLE_2FA_MUTATION,
} from '../../auth/gql/auth.graphql';
import {
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  AlertCircle,
  Key,
  Loader2,
} from 'lucide-react';

interface TwoFactorSetupProps {
  /** Whether 2FA is currently active for the logged-in user. */
  isEnabled: boolean;
  /** Called on successful enable/disable so the parent can refresh the user. */
  onStatusChange: () => void;
}

type SetupStep = 'idle' | 'qr' | 'verify' | 'success' | 'disable';

/**
 * Two-Factor Authentication setup card embedded in the Profile page.
 *
 * Flow (enable):
 *   idle → qr (show QR + secret) → verify (enter TOTP) → success (show backup codes)
 *
 * Flow (disable):
 *   idle → disable (enter TOTP to confirm) → idle
 */
export default function TwoFactorSetup({
  isEnabled,
  onStatusChange,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('idle');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const verifyInputRef = useRef<HTMLInputElement>(null);

  const [setupMutation, { loading: setupLoading }] =
    useMutation(SETUP_2FA_MUTATION);
  const [verifyMutation, { loading: verifyLoading }] = useMutation(
    VERIFY_ENABLE_2FA_MUTATION,
  );
  const [disableMutation, { loading: disableLoading }] =
    useMutation(DISABLE_2FA_MUTATION);

  const loading = setupLoading || verifyLoading || disableLoading;

  useEffect(() => {
    if (step === 'verify' || step === 'disable') {
      setTimeout(() => verifyInputRef.current?.focus(), 50);
    }
  }, [step]);

  // ─── handlers ──────────────────────────────────────────────────────────────

  const handleSetup = async () => {
    setErrorMsg('');
    try {
      const { data } = await setupMutation();
      if (data?.setupTwoFactor) {
        setOtpauthUrl(data.setupTwoFactor.otpauthUrl);
        setSecret(data.setupTwoFactor.secret);
        setStep('qr');
      }
    } catch {
      setErrorMsg('Failed to start 2FA setup. Please try again.');
    }
  };

  const handleVerifyEnable = async () => {
    if (!verifyToken.trim()) return;
    setErrorMsg('');
    try {
      const { data } = await verifyMutation({
        variables: { token: verifyToken.trim() },
      });
      if (data?.verifyAndEnableTwoFactor?.enabled) {
        setBackupCodes(data.verifyAndEnableTwoFactor.backupCodes);
        setStep('success');
        onStatusChange();
      }
    } catch {
      setErrorMsg('Invalid code. Ensure your device clock is synced.');
      setVerifyToken('');
      verifyInputRef.current?.focus();
    }
  };

  const handleDisable = async () => {
    if (!verifyToken.trim()) return;
    setErrorMsg('');
    try {
      await disableMutation({ variables: { token: verifyToken.trim() } });
      setStep('idle');
      setVerifyToken('');
      onStatusChange();
    } catch {
      setErrorMsg('Invalid code. Please try again.');
      setVerifyToken('');
      verifyInputRef.current?.focus();
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  // QR code image URL via Google Charts API (no extra dependencies)
  const qrCodeUrl = otpauthUrl
    ? `https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encodeURIComponent(otpauthUrl)}&choe=UTF-8`
    : '';

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`p-3 rounded-xl ${
            isEnabled
              ? 'bg-green-500/10 text-green-500'
              : 'bg-indigo-500/10 text-indigo-500'
          }`}
        >
          {isEnabled ? (
            <ShieldCheck className="w-6 h-6" />
          ) : (
            <ShieldOff className="w-6 h-6" />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {isEnabled
              ? '2FA is active. Your account has an extra layer of protection.'
              : 'Add an extra layer of security by requiring a verification code at sign-in.'}
          </p>
        </div>
      </div>

      <div className="border-t border-surface-100 dark:border-slate-800/60 pt-4">
        {/* Error message */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              {errorMsg}
            </p>
          </div>
        )}

        {/* ── IDLE state ─────────────────────────────────────────────────── */}
        {step === 'idle' && !isEnabled && (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Use an authenticator app like{' '}
              <span className="font-semibold">Google Authenticator</span>,{' '}
              <span className="font-semibold">Authy</span>, or{' '}
              <span className="font-semibold">1Password</span> to get time-based
              verification codes.
            </p>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Enable Two-Factor Authentication
            </button>
          </div>
        )}

        {/* ── QR code step ───────────────────────────────────────────────── */}
        {step === 'qr' && (
          <div className="space-y-5">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Scan the QR code with your authenticator app, then enter the
              6-digit code below to confirm.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* QR code */}
              <div className="shrink-0 p-3 bg-white rounded-2xl border border-surface-200 dark:border-slate-700 shadow-sm">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>

              {/* Manual entry */}
              <div className="flex-1 space-y-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Can't scan? Enter manually:
                </p>
                <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-slate-800 rounded-xl border border-surface-200 dark:border-slate-700">
                  <code className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all flex-1 select-all">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Copy secret"
                  >
                    {copiedSecret ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  Select <strong>Time-based</strong> as the account type in your
                  authenticator app.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow"
            >
              I've scanned it →
            </button>
          </div>
        )}

        {/* ── Verify step ────────────────────────────────────────────────── */}
        {step === 'verify' && (
          <div className="space-y-4 max-w-xs">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app to confirm
              setup.
            </p>
            <div>
              <label
                htmlFor="totp-verify"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Verification Code
              </label>
              <input
                id="totp-verify"
                ref={verifyInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyToken}
                onChange={(e) =>
                  setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                disabled={loading}
                className="input-modern text-center text-xl font-bold tracking-[0.4em] w-full py-3.5 disabled:opacity-50"
                autoComplete="one-time-code"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleVerifyEnable}
                disabled={loading || verifyToken.length !== 6}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Verify & Enable
              </button>
              <button
                onClick={() => setStep('qr')}
                disabled={loading}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── Success step: show backup codes ─────────────────────────────── */}
        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-800 dark:text-green-400">
                  Two-Factor Authentication is now enabled!
                </p>
                <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                  Save your backup codes below. These can each be used once if
                  you lose access to your authenticator app.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Backup Codes (save these now)
              </p>
              <div className="grid grid-cols-2 gap-2 p-4 bg-slate-950 rounded-2xl">
                {backupCodes.map((code) => (
                  <code
                    key={code}
                    className="text-xs font-mono text-green-400 tracking-widest text-center py-1 select-all"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-red-500 dark:text-red-400 font-semibold">
                ⚠ These codes will NOT be shown again. Store them in a safe
                place.
              </p>
            </div>

            <button
              onClick={() => setStep('idle')}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-surface-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-surface-50 dark:hover:bg-slate-700 transition-all"
            >
              Done
            </button>
          </div>
        )}

        {/* ── Enabled state (disable button) ──────────────────────────────── */}
        {step === 'idle' && isEnabled && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
              <p className="text-xs text-green-800 dark:text-green-400 font-medium">
                Two-Factor Authentication is active. Sign-ins require a 6-digit
                code from your authenticator app.
              </p>
            </div>
            <button
              onClick={() => {
                setStep('disable');
                setVerifyToken('');
                setErrorMsg('');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-xs font-bold transition-all"
            >
              <ShieldOff className="w-4 h-4" />
              Disable Two-Factor Authentication
            </button>
          </div>
        )}

        {/* ── Disable confirmation ─────────────────────────────────────────── */}
        {step === 'disable' && (
          <div className="space-y-4 max-w-xs">
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                Enter your current authenticator code to confirm you want to
                disable 2FA.
              </p>
            </div>
            <div>
              <label
                htmlFor="totp-disable"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2"
              >
                Confirmation Code
              </label>
              <input
                id="totp-disable"
                ref={verifyInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyToken}
                onChange={(e) =>
                  setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="000000"
                disabled={loading}
                className="input-modern text-center text-xl font-bold tracking-[0.4em] w-full py-3.5 disabled:opacity-50"
                autoComplete="one-time-code"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDisable}
                disabled={loading || verifyToken.length !== 6}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                Confirm Disable 2FA
              </button>
              <button
                onClick={() => setStep('idle')}
                disabled={loading}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-slate-700 border border-surface-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
