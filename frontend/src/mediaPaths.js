// Lumina – MSc Cloud Computing Project
/** Static art shipped in `public/lumina/` — same-origin, always available with the app. */
export function luminaFile(name) {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? `${base}lumina/${name}` : `${base}/lumina/${name}`;
}
