import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const supabaseAdmin = createClient(
  req('VITE_SUPABASE_URL'),        // тот же URL проекта
  req('SUPABASE_SERVICE_ROLE_KEY'),// НОВЫЙ service_role ключ (только сервер!)
  { auth: { persistSession: false } }
);