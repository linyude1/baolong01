
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients, useMedicines } from '../App';
import { PatientStatus, TreatmentType, Patient } from '../types';
import { formatToothPos } from '../constants';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { patients, updatePatient, deletePatient } = usePatients();
  const { medicines } = useMedicines();

  const getLocalDate = () => {
    const d = new Date();
    return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
  };

  const today = getLocalDate();

  const [selectedDate, setSelectedDate] = useState<number | null>(today.day);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.year, today.month, 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [isYearMonthModalOpen, setIsYearMonthModalOpen] = useState(false);

  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [verificationQuestion, setVerificationQuestion] = useState({ q: '', ans: 0 });
  const [userAnswer, setUserAnswer] = useState('');

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  const monthName = currentMonth.toLocaleString('zh-CN', { year: 'numeric', month: 'long' });

  const generateQuestion = () => {
    const isAdd = Math.random() > 0.5;
    if (isAdd) {
      const a = Math.floor(Math.random() * 6);
      const b = Math.floor(Math.random() * (11 - a));
      return { q: `${a} + ${b} = ?`, ans: a + b };
    } else {
      const a = Math.floor(Math.random() * 11);
      const b = Math.floor(Math.random() * (a + 1));
      return { q: `${a} - ${b} = ?`, ans: a - b };
    }
  };

  const handleLongPressStart = (patient: Patient) => {
    longPressTimer.current = setTimeout(() => {
      setPatientToDelete(patient);
      setVerificationQuestion(generateQuestion());
      setUserAnswer('');
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 800);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const confirmDelete = () => {
    if (parseInt(userAnswer) === verificationQuestion.ans) {
      if (patientToDelete) {
        deletePatient(patientToDelete.id);
        setPatientToDelete(null);
      }
    } else {
      alert('计算错误，请重试');
      setVerificationQuestion(generateQuestion());
      setUserAnswer('');
    }
  };

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const isToday = d === today.day && month === today.month && year === today.year;
      const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', '');
      days.push({
        date: d,
        day: dayName,
        isToday
      });
    }
    return days;
  }, [currentMonth, today]);

  useEffect(() => {
    if (selectedDate && itemRefs.current[selectedDate] && scrollRef.current) {
      setTimeout(() => {
        itemRefs.current[selectedDate]?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }, 100);
    }
  }, [selectedDate, currentMonth]);

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);
    const isThisMonth = newMonth.getMonth() === today.month && newMonth.getFullYear() === today.year;
    setSelectedDate(isThisMonth ? today.day : 1);
  };

  const hasInventoryWarning = useMemo(() => {
    return medicines.some(m => m.status === 'expired' || m.status === 'warning' || m.stock < m.minStock);
  }, [medicines]);

  const filteredVisits = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const day = selectedDate ? String(selectedDate).padStart(2, '0') : null;
    const targetDateStr = day ? `${year}-${month}-${day}` : `${year}-${month}`;

    const visits: { patient: Patient; displayTime: string; displayDesc: string; displayTooth: string; isCompleted: boolean }[] = [];

    patients.forEach(p => {
      const matchesSearch = p.name.includes(searchQuery) || (p.phone && p.phone.includes(searchQuery));
      if (!matchesSearch) return;

      if (selectedDate === null) {
        const hasRecordsInMonth = p.records?.some(r => r.date.startsWith(targetDateStr));
        if (p.visitDate?.startsWith(targetDateStr) || hasRecordsInMonth) {
          visits.push({
            patient: p,
            displayTime: p.time,
            displayDesc: p.desc,
            displayTooth: p.toothPos || '全口',
            isCompleted: p.status === PatientStatus.COMPLETED
          });
        }
      } else {
        if (p.visitDate === targetDateStr) {
          visits.push({
            patient: p,
            displayTime: p.time,
            displayDesc: p.desc,
            displayTooth: p.toothPos || '全口',
            isCompleted: p.status === PatientStatus.COMPLETED
          });
        }
        else {
          const recordOnDate = p.records?.find(r => r.date === targetDateStr);
          if (recordOnDate) {
            visits.push({
              patient: p,
              displayTime: recordOnDate.time,
              displayDesc: recordOnDate.desc,
              displayTooth: recordOnDate.toothPos,
              isCompleted: true
            });
          }
        }
      }
    });

    return visits.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      return a.displayTime.localeCompare(b.displayTime);
    });
  }, [searchQuery, patients, selectedDate, currentMonth]);

  const togglePatientStatus = (e: React.MouseEvent, p: Patient) => {
    e.stopPropagation();
    const newStatus = p.status === PatientStatus.COMPLETED ? PatientStatus.WAITING : PatientStatus.COMPLETED;
    updatePatient({ ...p, status: newStatus });
  };

  return (
    <div className="flex flex-col relative pb-20">
      <header className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="p-3 px-3">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/medicine')} className="size-11 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">menu</span>
            </button>

            <div className="flex items-center gap-1">
              <button onClick={() => changeMonth(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_left</span>
              </button>
              <div
                className="flex items-center gap-1 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm cursor-pointer active:scale-95 transition-transform"
                onClick={() => setIsYearMonthModalOpen(true)}
              >
                <h2 className="text-sm font-black text-primary">{monthName}</h2>
                <span className="material-symbols-outlined text-lg text-primary">keyboard_arrow_down</span>
              </div>
              <button onClick={() => changeMonth(1)} className="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/medicine')}
              className="size-11 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">notifications</span>
              {hasInventoryWarning && (
                <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
              )}
            </button>
          </div>

          <div ref={scrollRef} className="flex overflow-x-auto gap-3 hide-scrollbar pb-2 snap-x snap-mandatory px-1 scroll-smooth">
            <button
              onClick={() => setSelectedDate(null)}
              className={`flex flex-col items-center justify-center min-w-[54px] h-16 rounded-2xl border transition-all snap-center ${selectedDate === null ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'}`}
            >
              <span className={`text-[10px] font-bold mb-0.5 ${selectedDate === null ? 'text-white/80' : 'text-slate-400'}`}>本月</span>
              <span className="material-symbols-outlined text-xl font-black">calendar_view_month</span>
            </button>

            {daysInMonth.map((d) => (
              <button
                key={d.date}
                ref={el => itemRefs.current[d.date] = el}
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center justify-center min-w-[54px] h-16 rounded-2xl border transition-all snap-center ${selectedDate === d.date ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600'}`}
              >
                <span className={`text-[10px] font-bold mb-0.5 ${selectedDate === d.date ? 'text-white/80' : 'text-slate-400'}`}>{d.day}</span>
                <span className="text-lg font-black">{d.date}</span>
                {d.isToday && <div className={`mt-0.5 w-1 h-1 rounded-full ${selectedDate === d.date ? 'bg-white' : 'bg-primary'}`}></div>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-4 py-6 space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <span className="material-symbols-outlined">search</span>
          </span>
          <input
            className="block w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 text-sm"
            placeholder="搜索患者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate('/add-case', { state: { treatmentType: TreatmentType.INITIAL } })} className="h-16 bg-white dark:bg-slate-800 text-primary border border-primary/20 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
            <span className="material-symbols-outlined">person_add</span>首次就诊
          </button>
          <button onClick={() => navigate('/cases')} className="h-16 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">history</span>复诊查询
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-4">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-black">就诊名单 ({filteredVisits.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md">
              {selectedDate === null ? '本月' : `${currentMonth.getMonth() + 1}月${selectedDate}日`} 共:{filteredVisits.length}人
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {filteredVisits.map((visit, index) => (
            <div
              key={`${visit.patient.id}-${visit.displayTime}`}
              onClick={() => navigate(`/cases/${visit.patient.id}`)}
              onMouseDown={() => handleLongPressStart(visit.patient)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(visit.patient)}
              onTouchEnd={handleLongPressEnd}
              className={`bg-white dark:bg-slate-800 p-4 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-700/50 active:scale-[0.98] transition-all cursor-pointer flex gap-4 relative overflow-hidden select-none ${visit.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="absolute top-0 left-0 bg-primary/10 text-primary px-3 py-1 rounded-br-2xl text-[10px] font-black flex items-center gap-1">
                <span>#{index + 1}</span>
                {visit.patient.cardNumber && (
                  <>
                    <span className="opacity-30">|</span>
                    <span className="text-primary/70 font-bold">排队卡:{visit.patient.cardNumber}</span>
                  </>
                )}
              </div>

              <img src={visit.patient.avatar} className="size-16 rounded-2xl object-cover mt-2" alt={visit.patient.name} />
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-bold truncate">{visit.patient.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400">{visit.displayTime}</span>
                </div>

                <p className="text-[13px] font-bold text-slate-500 mb-2 truncate">
                  {visit.displayDesc || '常规口腔检查'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-black rounded-md">{visit.patient.treatmentType}</span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md border border-slate-100">{formatToothPos(visit.displayTooth)}</span>
                  </div>

                  <button
                    onClick={(e) => togglePatientStatus(e, visit.patient)}
                    className={`h-8 px-4 rounded-full text-[11px] font-black transition-all flex items-center gap-1 ${visit.isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-primary/10 text-primary border border-primary/20 active:bg-primary active:text-white'}`}
                  >
                    {visit.isCompleted ? (
                      <><span className="material-symbols-outlined text-[16px]">check_circle</span>完成</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">pending_actions</span>待检</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredVisits.length === 0 && (
            <div className="py-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_available</span>
              <p className="text-sm font-bold">该时段暂无就诊安排</p>
            </div>
          )}
        </div>
      </div>

      {patientToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setPatientToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-black mb-1 text-center text-slate-800 dark:text-slate-100">彻底删除患者数据</h3>
            <p className="text-xs font-bold text-slate-400 text-center mb-6">您正在尝试删除 <span className="text-red-500">{patientToDelete.name}</span> 的所有病历。此操作不可撤销，请完成以下口算以验证权限：</p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 mb-6 text-center">
              <p className="text-2xl font-black text-primary tracking-widest mb-4">{verificationQuestion.q}</p>
              <input
                autoFocus
                type="number"
                placeholder="在此输入结果"
                className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-center text-xl font-black text-slate-800 dark:text-slate-100 focus:ring-0 focus:border-primary transition-colors"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPatientToDelete(null)}
                className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-black shadow-lg shadow-red-200 active:scale-95 transition-all"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {isYearMonthModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsYearMonthModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6 text-center">跳转至月份</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">年份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setFullYear(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">月份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const newDate = new Date(currentMonth);
                    newDate.setMonth(parseInt(e.target.value));
                    setCurrentMonth(newDate);
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i}>{i + 1}月</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setIsYearMonthModalOpen(false)}
              className="w-full h-16 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 active:scale-95 transition-all"
            >
              确定跳转
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
