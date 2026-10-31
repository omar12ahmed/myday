// Supabase Edge Function "ai-plan" (Deno). Deploy: see ../../README.md, "AI planning prototype".
// All the logic is in handler.ts; this file only connects it to Supabase:
//   - the signed-in user is checked with Supabase Auth, using the token the app sends;
//   - the limits (ai_begin / ai_finish in ../../migrations/20261003120000_ai_usage.sql) run as that user, so they
//     only ever touch that account's counts. No secret key is needed for either.
// The models' keys and settings are Edge Function secrets: the main model's (AI_PROVIDER, AI_BASE_URL, AI_MODEL,
// AI_API_KEY, prices…), optionally a learning model's (the same names starting AI_LEARN_) and which jobs go to it
// (AI_ROUTES, e.g. {"tutor": "learn"}). See providers.ts, routeFor.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handle } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
// The project's public (publishable/anon) key: provided to Edge Functions by Supabase, or set MYDAY_PUBLISHABLE_KEY.
// (|| rather than ??, so a setting left empty falls back too.)
const publicKey = Deno.env.get('MYDAY_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
const asUser = (token: string) => createClient(url, publicKey, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(req => handle(req, {
  env: name => Deno.env.get(name),
  verifyUser: async token => {
    const { data, error } = await asUser(token).auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
  begin: async (token, l) => {
    const { data, error } = await asUser(token).rpc('ai_begin', { per_day: l.perDay, monthly_usd: l.monthlyUsd, reserve_usd: l.reserveUsd, min_seconds: l.minSeconds });
    if (error) throw new Error('limits');
    return data as { ok: boolean; reason?: string; requests_today?: number };
  },
  finish: async (token, inputTokens, outputTokens) => {
    await asUser(token).rpc('ai_finish', { input_tokens: inputTokens, output_tokens: outputTokens });
  },
  log: line => console.log(line),
}));
