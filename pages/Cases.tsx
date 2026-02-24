
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../App';
import { formatToothPos } from '../constants';

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const { patients, deletedPatients } = usePatients();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const filteredActive = patients.filter(p => p.name.includes(query) || p.phone.includes(query));
  const filteredHistory = deletedPatients.filter(p => p.name.includes(query) || p.phone.includes(query));

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(-1)}
            className="size-12 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">病例中心</h2>
          <div className="w-12"></div>
        </div>

        {/* Tab Switcher */}
        <div className="px-2 mb-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex relative overflow-hidden">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all z-10 ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
            >
              活跃病历 ({patients.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all z-10 ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
            >
              删除历史 ({deletedPatients.length})
            </button>
          </div>
        </div>

        <div className="px-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="form-input block w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50 text-base font-black"
              placeholder={activeTab === 'active' ? "搜索活跃病历..." : "搜索历史记录..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pb-8">
        {activeTab === 'active' ? (
          <div className="flex flex-col gap-4 p-4">
            {filteredActive.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/cases/${p.id}`)}
                className="flex flex-col gap-4 rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-primary text-xl font-black">{p.name}</p>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">
                        {p.treatmentType}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {p.visitDate}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-600">
                    {p.avatar ? (
                      <img src={p.avatar} className="w-full h-full object-cover" alt="Case thumbnail" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-300">image</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-slate-400">牙位:</span>
                    <span className="text-primary font-black">{formatToothPos(p.toothPos)}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                    “{p.desc}”
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button className="flex items-center justify-center rounded-xl h-10 px-5 bg-primary text-white gap-2 text-sm font-black transition-transform active:scale-95 shadow-md shadow-primary/20">
                    <span>查看详情</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredActive.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-10">folder_open</span>
                <p className="font-black text-xs uppercase tracking-widest">未找到活跃病历</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className="px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                ⚠️ 以下患者记录将于删除 7 天后永久清理
              </p>
            </div>
            {filteredHistory.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/cases/${p.id}`)}
                className="flex flex-col gap-3 rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer hover:bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black text-slate-700 dark:text-slate-200">{p.name}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{p.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">已移除</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">
                      {new Date(p.deletedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <span className="text-[10px] font-black text-primary flex items-center gap-1">
                    查看归档病历
                    <span className="material-symbols-outlined text-[14px]">arrow_forward_ios</span>
                  </span>
                </div>
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-10">history</span>
                <p className="font-black text-xs uppercase tracking-widest">暂无删除历史</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
