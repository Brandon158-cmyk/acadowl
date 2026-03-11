import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import { execSync } from 'child_process';

const keys = await generateKeyPair('RS256', {
  extractable: true,
});

const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);

const jwks = JSON.stringify({
  keys: [{ use: 'sig', ...publicKey }],
});

const formattedPrivateKey = privateKey.trimEnd().replace(/\n/g, ' ');

console.log('Setting JWT_PRIVATE_KEY...');
// Use -- to prevent CLI from thinking the key is an argument/option
execSync(`npx convex env set JWT_PRIVATE_KEY -- "${formattedPrivateKey}"`, { stdio: 'inherit' });

console.log('Setting JWKS...');
// Escape single quotes for shell if necessary, or just use json string
const escapedJwks = jwks.replace(/'/g, "'\\''");
execSync(`npx convex env set JWKS '${escapedJwks}'`, { stdio: 'inherit' });

console.log('Done!');
