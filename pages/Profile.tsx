
import React from 'react';
import { useLanguage, useAuth } from '../App';

const SettingItem: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, label, value, onClick, danger }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-50 dark:border-slate-700/50 shadow-sm active:scale-[0.98] transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={`size-11 rounded-2xl flex items-center justify-center transition-colors ${danger ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <span className={`text-[15px] font-black ${danger ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-bold text-slate-400">{value}</span>}
      <span className={`material-symbols-outlined text-[18px] ${danger ? 'text-red-300' : 'text-slate-300'}`}>chevron_right</span>
    </div>
  </button>
);

export const Profile: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出当前账号并锁定系统吗？')) {
      logout();
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="p-6 pt-10 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="size-32 rounded-[40px] bg-gradient-to-tr from-primary to-blue-400 p-1 shadow-2xl shadow-primary/20">
            <img 
              src="https://picsum.photos/seed/dentist/300/300" 
              className="w-full h-full rounded-[38px] object-cover border-4 border-white dark:border-slate-900" 
              alt="Avatar" 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 size-10 bg-green-500 rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-[18px] font-bold">verified</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t('drName')}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">{t('role')}</span>
          <div className="size-1 bg-slate-300 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('clinicName')}</span>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="space-y-3">
          <div className="px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('settings')}</h3>
          </div>
          <SettingItem 
            icon="language" 
            label={t('language')} 
            value={language === 'zh' ? '简体中文' : 'English'} 
            onClick={toggleLanguage}
          />
          <SettingItem icon="notifications" label="消息通知" value="已开启" />
          <SettingItem icon="dark_mode" label="深色模式" value="跟随系统" />
        </div>

        <div className="space-y-3">
          <div className="px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">关于系统</h3>
          </div>
          <SettingItem icon="info" label="服务条款" />
          <SettingItem icon="shield_person" label="隐私政策" />
          <SettingItem icon="update" label={t('version')} value="v2.4.0-pro" />
        </div>

        <div className="pt-4">
          <SettingItem 
            icon="logout" 
            label={t('logout')} 
            danger 
            onClick={handleLogout}
          />
        </div>
      </main>

      <footer className="p-8 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">DentalPro Management Systems © 2026</p>
      </footer>
    </div>
  );
};
