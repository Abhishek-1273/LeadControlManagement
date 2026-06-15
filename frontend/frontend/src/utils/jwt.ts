// Lightweight JWT expiry check. Does NOT verify the signature (server does that).
function base64UrlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const base64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  // atob is available in React Native's Hermes/JSC runtime
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]));
    if (!payload.exp) return false;
    // exp is in seconds; compare to now
    return payload.exp * 1000 <= Date.now();
  } catch {
    // Malformed token -> treat as expired
    return true;
  }
}