import { describe, expect, it } from 'vitest';
import { dataCheckString, verifyInitData } from '../server/src/tgauth';

/** Sign initData the way Telegram does, with a test key pair. */
async function signed(fields: Record<string, string>, botId: string) {
  const kp = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const pubHex = [...raw].map((b) => b.toString(16).padStart(2, '0')).join('');
  const p = new URLSearchParams({ ...fields, signature: 'x', hash: 'h' });
  const dcs = dataCheckString(p.toString(), botId)!;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, kp.privateKey, new TextEncoder().encode(dcs)));
  const b64url = btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  p.set('signature', b64url);
  return { initData: p.toString(), pubHex };
}

const now = 1_800_000_000;
const user = JSON.stringify({ id: 4242, first_name: 'Олег', last_name: 'К', username: 'oleg' });

describe('Telegram initData (third-party validation)', () => {
  it('builds the data-check-string: bot id prefix, sorted, without hash and signature', () => {
    const s = dataCheckString('user=%7B%7D&auth_date=5&signature=s&hash=h&query_id=q', '123');
    expect(s).toBe('123:WebAppData\nauth_date=5\nquery_id=q\nuser={}');
  });

  it('accepts genuine data and returns the user', async () => {
    const { initData, pubHex } = await signed({ auth_date: String(now - 60), query_id: 'AAA', user, start_param: 'l_ABCDE' }, '777');
    expect(await verifyInitData(initData, '777', { publicKeyHex: pubHex, now })).toEqual({ id: 4242, name: 'Олег К', username: 'oleg' });
  });

  it('refuses another bot, tampered fields, old data and missing signature', async () => {
    const { initData, pubHex } = await signed({ auth_date: String(now - 60), user }, '777');
    expect(await verifyInitData(initData, '778', { publicKeyHex: pubHex, now })).toBeNull();
    expect(await verifyInitData(initData.replace('4242', '4243'), '777', { publicKeyHex: pubHex, now })).toBeNull();
    expect(await verifyInitData(initData, '777', { publicKeyHex: pubHex, now: now + 2 * 86400 })).toBeNull();
    expect(await verifyInitData('user=%7B%7D&auth_date=1', '777', { publicKeyHex: pubHex, now })).toBeNull();
    expect(await verifyInitData('garbage', '777', { now })).toBeNull();
  });
});
