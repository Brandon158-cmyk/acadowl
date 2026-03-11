import { exportJWK, exportPKCS8, generateKeyPair } from 'jose';
import { spawnSync } from 'child_process';

async function setup() {
  console.log('Generating Ed25519 keys (recommended by Convex Auth)...');
  const { privateKey: priv, publicKey: pub } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true,
  });

  const privateKeyPem = await exportPKCS8(priv);
  const publicKeyJwk = await exportJWK(pub);

  const jwks = JSON.stringify({
    keys: [{ use: 'sig', ...publicKeyJwk, kid: 'primary' }],
  });

  // Convex Auth expects the PEM newlines replaced by spaces for the env var
  const formattedPrivateKey = privateKeyPem.trim().replace(/\r?\n/g, ' ');

  console.log('Applying JWT_PRIVATE_KEY via stdin (safest for Windows)...');
  spawnSync('npx.cmd', ['convex', 'env', 'set', 'JWT_PRIVATE_KEY', '-'], {
    input: formattedPrivateKey,
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  console.log('Applying JWKS via stdin...');
  spawnSync('npx.cmd', ['convex', 'env', 'set', 'JWKS', '-'], {
    input: jwks,
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  console.log('\n✅ Done! Ed25519 keys applied successfully.');
  console.log('Wait a few seconds for Convex to restart, then try signing in again.');
}

setup().catch(console.error);
