import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const authService = {
    async login(username: string, password: string): Promise<boolean> {
        if (!isSupabaseConfigured()) {
            console.warn('[Auth] Supabase 未配置，使用本地硬编码验证');
            return username === 'baolong1' && password === '00001';
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error || !data) return false;
            return true;
        } catch {
            console.error('[Auth] 登录查询失败，回退到本地验证');
            return username === 'baolong1' && password === '00001';
        }
    }
};
