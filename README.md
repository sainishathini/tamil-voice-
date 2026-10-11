# tamil-voice-

## Secure personal details

Secure personal details are available to signed-in users from the dashboard. Values are encrypted on the server with AES-256-GCM, are returned masked by default, and require the account password for each reveal or change.

The server creates a random encryption key at `server/data/personal-details.key` the first time a detail is saved. This file is excluded from Git. Back it up securely alongside the database: if the key is lost or replaced, encrypted details cannot be recovered. To supply a key through server-side configuration instead, set `PERSONAL_DETAILS_ENCRYPTION_KEY` to 64 hexadecimal characters (32 random bytes).

The server also creates a persistent JWT signing key at `server/data/jwt.key` unless `JWT_SECRET` is configured. Production deployments should use a strong server-only `JWT_SECRET`, configure the frontend origin, and serve the API over HTTPS (`NODE_ENV=production` rejects non-HTTPS requests).