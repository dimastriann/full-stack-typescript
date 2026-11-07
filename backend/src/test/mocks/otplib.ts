export const generateSecret = vi.fn(() => 'TEST_OTP_SECRET');
export const generateURI = vi.fn(
  ({ issuer, label }: { issuer: string; label: string }) =>
    `otpauth://totp/${issuer}:${label}?secret=TEST_OTP_SECRET`,
);
export const verifySync = vi.fn(() => ({ valid: true }));
