import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.replace(/\/rest\/v1\/?$/, "");
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl && !supabaseAnonKey) {
    return ".env.local에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해 주세요.";
  }
  if (!supabaseUrl) {
    return "NEXT_PUBLIC_SUPABASE_URL이 비어 있습니다.";
  }
  if (!supabaseAnonKey) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY가 비어 있습니다.";
  }
  return null;
}
