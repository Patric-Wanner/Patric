# Dartkartan Forms Worker

Cloudflare Worker som ersätter Formspree. Lagrar formulär i KV.
Kolla submissions: **Cloudflare Dashboard → Workers & Pages → KV → DARTKARTAN_FORMS**

## Setup

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler kv namespace create FORMS
# Kopiera ID:t som skrivs ut och klistra in i wrangler.toml
npm run deploy
```
