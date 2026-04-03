/**
 * validateSetup.ts
 * Run with: npx ts-node utils/validateSetup.ts
 *
 * Checks that:
 * 1. .env is loaded with real credentials
 * 2. AA CE auth API responds with 200
 * 3. Prints token prefix on success
 */
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

const username = process.env.USERNAME || '';
const password = process.env.PASSWORD || '';
const baseUrl  = 'community.cloud.automationanywhere.digital';

if (!username || !password || password === 'YOUR_PASSWORD_HERE') {
  console.error('❌ Credentials not set. Edit .env and set USERNAME and PASSWORD.');
  process.exit(1);
}

console.log(`\n🔍 Validating setup for: ${username}`);
console.log(`   Endpoint: https://${baseUrl}/v1/authentication\n`);

const body = JSON.stringify({ username, password, multipleLogin: false });

const options = {
  hostname: baseUrl,
  path: '/v1/authentication',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(data);
      if (res.statusCode === 200 && parsed.token) {
        console.log(`✅ Auth SUCCESS — token starts with: ${String(parsed.token).substring(0, 12)}...`);
        console.log('\nSetup is valid. You can now run: npm test\n');
      } else {
        console.error('❌ Auth FAILED. Response:', JSON.stringify(parsed, null, 2));
        console.error('\nCheck your USERNAME and PASSWORD in .env\n');
        process.exit(1);
      }
    } catch {
      console.error('❌ Could not parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Network error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
