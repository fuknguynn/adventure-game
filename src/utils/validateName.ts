/** Display-name rules: trimmed 1–20 chars; allow Unicode letters, marks, numbers, spaces, - _ '; reject controls/blank. */
export function isValidDisplayName(raw: string): boolean {
  const name = raw.trim();
  if (name.length < 1 || name.length > 20) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(name)) return false;
  try {
    return /^[\p{L}\p{M}\p{N} \-_']+$/u.test(name);
  } catch {
    return /^[A-Za-z0-9 \-_']+$/.test(name);
  }
}

export function sanitizeDisplayName(raw: string): string {
  return raw.trim().slice(0, 20);
}

/** Escape for safe text rendering (React escapes by default; this is for any manual HTML contexts — none used). */
export function escapeText(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
