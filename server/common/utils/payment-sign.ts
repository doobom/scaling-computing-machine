import { createHash } from 'crypto';

/**
 * 支付签名工具
 * 算法：参数按 key 字典序排序 → 拼接 key=value&key=value → 末尾拼接 &key=secret → MD5
 */

export function generateSign(
  params: Record<string, unknown>,
  secret: string,
): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== 'sign' && params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort();

  const queryString = sortedKeys
    .map((key) => `${key}=${String(params[key])}`)
    .join('&');

  const signStr = `${queryString}&key=${secret}`;
  return createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
}

export function verifySign(
  params: Record<string, unknown>,
  secret: string,
): boolean {
  const sign = params.sign as string | undefined;
  if (!sign) return false;
  const expected = generateSign(params, secret);
  return expected === sign.toUpperCase();
}
