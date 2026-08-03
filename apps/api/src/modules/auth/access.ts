export function studentCanAccessPortal(input: {
  emailVerifiedAt: Date | string | null;
  emailVerificationRequired: boolean;
}) {
  if (!input.emailVerificationRequired) return true;
  return Boolean(input.emailVerifiedAt);
}
