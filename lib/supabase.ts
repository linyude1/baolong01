/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
};

const _configured = isValidUrl(supabaseUrl) && supabaseAnonKey.length > 20;

// 只有合法 URL 时才真正创建客户端，否则传 dummy 避免崩溃
export const supabase: SupabaseClient = _configured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder');

export const isSupabaseConfigured = (): boolean => _configured;
