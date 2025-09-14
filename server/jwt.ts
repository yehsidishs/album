import jwt from 'jsonwebtoken';

export function signJwt(payload: object, opt: jwt.SignOptions = { expiresIn: '7d' }) {
  if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET');
  return jwt.sign(payload, process.env.JWT_SECRET, opt);
}

export function verifyJwt<T = any>(token: string): T {
  const secrets = [process.env.JWT_SECRET, process.env.JWT_SECRET_OLD].filter(Boolean) as string[];
  for (const s of secrets) {
    try { return jwt.verify(token, s) as T; } catch {}
  }
  throw new Error('Invalid token');
}