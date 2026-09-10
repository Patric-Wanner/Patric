/**
 * Dartkartan.se — Form submission handler
 * Replaces Formspree. Stores submissions in Cloudflare KV.
 * View submissions: Cloudflare Dashboard → KV → DARTKARTAN_FORMS
 *
 * Bindings (wrangler.toml):
 *   FORMS — KV namespace for storing submissions
 */

export default {
  async fetch(request, env) {
    // --- CORS preflight ---
    if (request.method === 'OPTIONS') {
      return corsResponse(new Response(null, { status: 204 }));
    }

    // --- Only POST allowed ---
    if (request.method !== 'POST') {
      return corsResponse(jsonResp(405, { error: 'Method not allowed' }));
    }

    try {
      // --- Parse body (JSON or FormData) ---
      const contentType = request.headers.get('Content-Type') || '';
      let data = {};

      if (contentType.includes('application/json')) {
        data = await request.json();
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
      } else {
        return corsResponse(jsonResp(400, { error: 'Unsupported Content-Type' }));
      }

      // --- Store in KV ---
      const typ = data.typ || 'okänd';
      const subject = data._subject || 'Okänt formulär';
      const timestamp = new Date().toISOString();
      const key = `${timestamp}_${typ}_${crypto.randomUUID().slice(0, 8)}`;

      await env.FORMS.put(key, JSON.stringify({
        typ,
        subject,
        data,
        timestamp,
      }));

      return corsResponse(jsonResp(200, { ok: true, message: 'Tack! Vi har tagit emot din förfrågan.' }));

    } catch (err) {
      console.error('Worker error:', err);
      return corsResponse(jsonResp(500, { error: 'Serverfel' }));
    }
  },
};

// ─── Helpers ──────────────────────────────────────────────

function corsResponse(response) {
  response.headers.set('Access-Control-Allow-Origin', 'https://dartkartan.se');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  return response;
}

function jsonResp(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
