/** Only same-site paths are allowed, so ?redirect= can't send people to another website. */
export function safeRedirect(value: string | null, fallback = '/account'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
