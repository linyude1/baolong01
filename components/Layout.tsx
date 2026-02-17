
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../App';

const TabBarItem: React.FC<{
  icon: string, 
  label: string, 
  active?: boolean, 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90 ${active ? 'text-primary' : 'text-slate-400'}`}
  >
    <span className={`material-symbols-outlined text-[28px] ${active ? 'fill-1 font-bold' : ''}`}>
      {icon}
    </span>
    <span className="text-[10px] font-black">{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  showTabBar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showTabBar = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { path: '/', icon: 'home', label: t('home') },
    { path: '/appointments', icon: 'calendar_month', label: t('appointments') },
    { path: '/cases', icon: 'folder_shared', label: t('cases') },
    { path: '/profile', icon: 'person', label: t('profile') },
  ];

  return (
    <div className="max-w-md mx-auto h-screen bg-background-light dark:bg-background-dark flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-100 dark:border-slate-800">
      <main className={`flex-1 overflow-y-auto hide-scrollbar relative ${showTabBar ? 'pb-24' : ''}`}>
        {children}
      </main>
      
      {showTabBar && (
        <nav className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-3 px-4 z-[100] flex justify-around items-center h-20">
          {tabs.map((tab) => (
            <TabBarItem
              key={tab.path}
              icon={tab.icon}
              label={tab.label}
              active={location.pathname === tab.path}
              onClick={() => navigate(tab.path)}
            />
          ))}
        </nav>
      )}
    </div>
  );
};
