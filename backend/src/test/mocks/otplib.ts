export const generateSecret = jest.fn(() => 'TEST_OTP_SECRET');
export const generateURI = jest.fn(
  ({ issuer, label }: { issuer: string; label: string }) =>
    `otpauth://totp/${issuer}:${label}?secret=TEST_OTP_SECRET`,
);
export const verifySync = jest.fn(() => ({ valid: true }));
