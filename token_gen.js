/*
Run this script with: node token_gen.js <userId> [nonce]
It will print a token and optional nonce to stdout, which you can write to a tag.
*/
const crypto = require('crypto');
const SECRET = process.env.SECRET_KEY || 'replace_this_with_a_strong_random_key';

function hmacToken(userId, nonce) {
  return crypto.createHmac('sha256', SECRET).update(String(userId) + '|' + String(nonce)).digest('hex');
}

const userId = process.argv[2];
const nonce = process.argv[3] || Date.now().toString();

if(!userId) {
  console.log('Usage: node token_gen.js <userId> [nonce]');
  process.exit(1);
}

console.log('nonce:', nonce);
console.log('token:', hmacToken(userId, nonce));
