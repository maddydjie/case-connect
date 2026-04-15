import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import type { JWTPayload } from './types.js';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || '';

const jwksClient = jwksRsa({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(kid, (err, key) => {
      if (err) return reject(err);
      if (!key) return reject(new Error('No signing key found'));
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid token format');
  }

  const kid = decoded.header.kid;
  if (!kid) throw new Error('No kid in token header');

  const signingKey = await getSigningKey(kid);
  const payload = jwt.verify(token, signingKey, {
    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
  }) as JWTPayload;

  return payload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
