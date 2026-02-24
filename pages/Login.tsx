
import React, { useState } from 'react';
import { useAuth } from '../App';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    const success = await login(username, password);
    if (!success) {
      setError(true);
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 bg-slate-50 dark:bg-slate-900 overflow-hidden pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo Section */}
        <div className="size-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-white text-5xl font-black">dentistry</span>
        </div>

        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">宝龙口腔</h1>
        <p className="text-slate-400 font-bold mb-10 uppercase tracking-[0.2em] text-[10px]">管理系统 · 护士站登录</p>

        <form onSubmit={handleLogin} className="w-full space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">管理账号</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">person</span>
              <input
                type="text"
                autoFocus
                placeholder="请输入账号"
                className={`w-full h-16 bg-white dark:bg-slate-800 border-2 rounded-2xl pl-12 pr-6 text-base font-black transition-all ${error ? 'border-red-500 bg-red-50/10' : 'border-slate-100 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 text-slate-800 dark:text-slate-100'}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">登录密码</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">lock</span>
              <input
                type="password"
                placeholder="请输入密码"
                className={`w-full h-16 bg-white dark:bg-slate-800 border-2 rounded-2xl pl-12 pr-6 text-base font-black transition-all ${error ? 'border-red-500 bg-red-50/10' : 'border-slate-100 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 text-slate-800 dark:text-slate-100'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-center text-[10px] font-bold text-red-500 mt-2 animate-pulse">账号或密码错误，请核对后重试</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-16 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <span className="material-symbols-outlined font-black">login</span>
            确认登录
          </button>
        </form>

        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Security</p>
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <p className="text-[10px] font-bold text-slate-400/60 leading-relaxed max-w-[220px] mx-auto">
            仅限宝龙口腔授权医护人员登录使用。系统将自动记录所有操作日志。
          </p>
        </div>
      </div>
    </div>
  );
};
