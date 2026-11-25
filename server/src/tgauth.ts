/**
 * Telegram Mini App initData, verified without the bot token ("validating data
 * for third-party use", Bot API 8.0+): Telegram signs the data with Ed25519;
 * we check the signature with Telegram's public key and the bot's numeric id.
 * The bot token never leaves the bot's own server.
 *
 * data-check-string = `${botId}:WebAppData\n` + every field except `hash` and
 * `signature`, sorted by key, as `key=value`, joined with "\n".
 */

/** Telegram's Ed25519 public keys (hex). */
export const TG_PUBLIC_KEY = {
  production: 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d',
  test: '40055058a4ee38156a06562e52eece92a771bcd8346a8c4615cb7376eddf72ec',
} as const;

/** initData older than this is refused (replayed links). */
export const MAX_AGE_SEC = 24 * 3600;

export interface TgUser {
  id: number;
  name: string;
  username?: string;
}

export function dataCheckString(initData: string, botId: string): string | null {
  const params = new URLSearchParams(initData);
  if (!params.get('signature')) return null;
  const lines: string[] = [];
  for (const [k, v] of params) if (k !== 'hash' && k !== 'signature') lines.push(`${k}=${v}`);
  lines.sort();
  return `${botId}:WebAppData\n${lines.join('\n')}`;
}

const hexBytes = (hex: string) => new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)));

function base64urlBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Returns the Telegram user when `initData` is genuine, recent and signed for `botId`; otherwise null.
 * `publicKeyHex` defaults to Telegram's production key (tests pass their own).
 */
export async function verifyInitData(initData: string, botId: string, opts: { publicKeyHex?: string; now?: number } = {}): Promise<TgUser | null> {
  try {
    const dcs = dataCheckString(initData, botId);
    if (!dcs) return null;
    const params = new URLSearchParams(initData);
    const authDate = Number(params.get('auth_date'));
    const now = opts.now ?? Date.now() / 1000;
    if (!Number.isFinite(authDate) || now - authDate > MAX_AGE_SEC || authDate - now > 300) return null;
    const key = await crypto.subtle.importKey('raw', hexBytes(opts.publicKeyHex ?? TG_PUBLIC_KEY.production), { name: 'Ed25519' }, false, ['verify']);
    const ok = await crypto.subtle.verify({ name: 'Ed25519' }, key, base64urlBytes(params.get('signature')!), new TextEncoder().encode(dcs));
    if (!ok) return null;
    const u = JSON.parse(params.get('user') ?? 'null');
    if (!u || typeof u.id !== 'number') return null;
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username || `id${u.id}`;
    return { id: u.id, name: String(name).slice(0, 24), username: u.username };
  } catch {
    return null;
  }
}
