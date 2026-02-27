
import React, { useState, useEffect, useMemo } from 'react';
import { usePatients } from '../App';
import { PatientStatus } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const QueueScreen: React.FC = () => {
    const { patients } = usePatients();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [marqueeText, setMarqueeText] = useState('温馨提示：请各位患者在候诊区安静等候，听到叫号后前往对应诊室。保持环境整洁，谢谢配合。');
    const [isEditingMarquee, setIsEditingMarquee] = useState(false);
    const [tempMarqueeText, setTempMarqueeText] = useState('');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('baolong_marquee');
        if (saved) setMarqueeText(saved);
    }, []);

    const saveMarquee = () => {
        setMarqueeText(tempMarqueeText);
        localStorage.setItem('baolong_marquee', tempMarqueeText);
        setIsEditingMarquee(false);
    };

    const maskName = (name: string) => {
        if (!name) return '';
        if (name.length <= 1) return name;
        return name.substring(0, name.length - 1) + '*';
    };

    const currentPatient = useMemo(() => {
        const treating = patients.filter(p => p.status === PatientStatus.TREATING);
        return treating.length > 0 ? treating[treating.length - 1] : null;
    }, [patients]);

    const waitingPatients = useMemo(() =>
        patients.filter(p => p.status === PatientStatus.WAITING)
            .sort((a, b) => (a.cardNumber || '').localeCompare(b.cardNumber || '')),
        [patients]
    );

    return (
        <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden select-none">
            {/* Header */}
            <header className="h-28 bg-white flex items-center justify-between px-16 border-b border-slate-50">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-black text-[#137fec] tracking-tight">
                        宝龙口腔 <span className="text-slate-300 font-light mx-2">•</span> 候诊大厅
                    </h1>
                    <p className="text-[12px] font-bold text-slate-300 tracking-[0.2em] uppercase">
                        BAOLONG DENTAL CLINIC • WAITING HALL
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-7xl font-mono font-bold text-slate-800 tabular-nums">
                        {format(currentTime, 'HH:mm:ss')}
                    </div>
                    <div className="text-xl font-bold text-slate-400">
                        {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Featured Treating Patient */}
                <section className="flex-1 flex flex-col p-20 relative">
                    <div className="mb-24">
                        <span className="inline-flex items-center px-10 py-4 bg-[#137fec] text-white text-2xl font-black rounded-full shadow-lg shadow-blue-200">
                            正在就诊 • NOW TREATING
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col items-start justify-center pl-10">
                        {currentPatient ? (
                            <div className="animate-in fade-in zoom-in duration-700">
                                <div className="text-[280px] font-black text-[#137fec] leading-none mb-8 -ml-4 tracking-tighter">
                                    {currentPatient.cardNumber || '--'}
                                </div>
                                <div className="text-[160px] font-black text-[#0d141b] mb-16 leading-none">
                                    {maskName(currentPatient.name)}
                                </div>
                                <div className="flex items-center gap-10 text-[56px] font-bold text-slate-400/80 tracking-widest whitespace-nowrap">
                                    <span className="material-symbols-outlined text-7xl text-[#137fec]">meeting_room</span>
                                    <span>请前往</span>
                                    <span className="text-8xl text-[#137fec] font-black">
                                        {currentPatient.roomNumber?.match(/\d+/)?.[0] || currentPatient.roomNumber || '?'}
                                    </span>
                                    <span>号诊室就诊</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-6xl font-black text-slate-200 italic">暂无正在就诊的患者</div>
                        )}
                    </div>
                </section>

                {/* Right: Queue List */}
                <aside className="w-[600px] bg-white border-l border-slate-50 flex flex-col">
                    <div className="p-12 flex items-center gap-6">
                        <span className="h-4 w-4 rounded-full bg-[#10b981]"></span>
                        <h2 className="text-4xl font-black text-slate-800">候诊名单</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 space-y-6">
                        {waitingPatients.map((p, idx) => (
                            <div key={p.id} className="group flex items-center justify-between p-10 rounded-[40px] bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-10">
                                    <span className="text-5xl font-black text-slate-100 italic font-mono flex-shrink-0">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h4 className="text-5xl font-black text-slate-700 mb-2">{maskName(p.name)}</h4>
                                        <p className="text-xl font-bold text-slate-400 tracking-wider">卡号：<span className="text-[#137fec]">{p.cardNumber}</span></p>
                                    </div>
                                </div>
                                <div className="bg-[#ecfdf5] px-8 py-3 rounded-2xl border border-emerald-100">
                                    <span className="text-[#10b981] text-lg font-black tracking-widest">等待中</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-12 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-black text-slate-200 tracking-[0.2em] uppercase">齿泰通系统 V2.4</span>
                        <span className="text-xs font-black text-slate-200 tracking-[0.2em] uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified_user</span> 安全连接
                        </span>
                    </div>
                </aside>
            </main>

            {/* Footer Marquee */}
            <footer
                className="h-20 bg-[#137fec] flex items-center relative cursor-help"
                onContextMenu={(e) => {
                    e.preventDefault();
                    setTempMarqueeText(marqueeText);
                    setIsEditingMarquee(true);
                }}
                title="右键点击编辑提示内容"
            >
                <div className="absolute left-0 top-0 bottom-0 bg-[#0d6ecc] px-12 flex items-center z-10">
                    <span className="text-white text-2xl font-black tracking-widest">温馨提示：</span>
                </div>
                <div className="flex-1 whitespace-nowrap overflow-hidden">
                    <div className="inline-block animate-marquee pl-full text-white text-3xl font-bold py-2">
                        {marqueeText}
                    </div>
                </div>
            </footer>

            {/* CSS Animation for Marquee */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 30s linear infinite;
                }
                main { background-image: radial-gradient(circle at 20% 20%, #fbfdff 0%, transparent 40%); }
            `}</style>

            {/* Edit Dialog */}
            {isEditingMarquee && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                    <div className="w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
                        <div className="size-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl">edit_note</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">修改候诊提示</h3>
                        <p className="text-sm font-bold text-slate-400 mb-8">输入新的滚动内容，将即时同步至大屏底部。</p>

                        <textarea
                            autoFocus
                            rows={4}
                            className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-lg font-bold text-slate-700 focus:ring-0 focus:border-blue-500 transition-colors mb-8 resize-none"
                            value={tempMarqueeText}
                            onChange={(e) => setTempMarqueeText(e.target.value)}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsEditingMarquee(false)}
                                className="flex-1 h-16 bg-slate-100 text-slate-500 rounded-2xl font-black active:scale-95 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveMarquee}
                                className="flex-1 h-16 bg-blue-500 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all"
                            >
                                保存设置
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
