# NFC Tag + Points System PoC

This proof-of-concept provides:
- A simple **Node.js + Express** backend using **SQLite** for storage.
- HMAC-based NFC token validation to reduce cloning risks.
- Endpoints for registering tags, scanning (add points), querying points, and admin adjustments.
- A **Web NFC** demo page (`public/web-nfc.html`) to read NFC tags on supported Android browsers.
- An admin page (`public/admin.html`) for simple management and testing.

## Quick start (local test)

1. Ensure you have Node.js (>=16) and npm installed.
2. In project folder:
```bash
cd nfc-poc
npm install
node index.js
```
3. Server runs on http://localhost:3000

## How it works (high level)
- When issuing a tag: generate a token with `token_gen.js` for a user id. Write that token into the NFC tag (using a tag writer app).
- When a phone scans the tag (reads the token), the client POSTs `/nfc/scan` with `{ token, action, amount }`.
- Backend verifies token HMAC using `SECRET_KEY`, finds bound user, and applies points.
- All operations are logged in `points_log` SQLite table.

## Files
- `index.js` — main server
- `db.js` — sqlite wrapper and migrations
- `token_gen.js` — generate tokens to write to tags
- `public/web-nfc.html` — demo page to read tag and send scan
- `public/admin.html` — simple admin UI to create users/register tokens and view points

## Security notes (PoC)
- SECRET_KEY is in `.env` in this PoC for simplicity, but should be kept secret in production.
- Tokens include HMAC(userId + nonce). For higher security use challenge-response tags or NTAG with cryptographic features.
- Add rate-limiting, authentication, HTTPS for production.

Enjoy — you can open `public/web-nfc.html` on an Android device (Chrome) with NFC enabled.

