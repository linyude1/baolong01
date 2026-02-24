
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppointments, usePatients } from '../App';
import { Appointment, PatientStatus, TreatmentType } from '../types';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const { appointments, addAppointment, cancelAppointment } = useAppointments();
  const { patients } = usePatients();

  // 基础状态：选中的日期 (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 动态生成展示用的“周视图”：以选中日期为中心，前后各展示 7 天，共 15 天
  const weekDays = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const todayStr = new Date().toISOString().split('T')[0];
    const days = [];

    // 生成前后各 7 天的范围
    for (let i = -7; i <= 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayName: d.toLocaleDateString('zh-CN', { weekday: 'short' }).replace('周', ''),
        dayNum: d.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate
      });
    }
    return days;
  }, [selectedDate]);

  // 时间槽逻辑 (08:00 - 18:00, 每60分钟一格)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // 预约表单状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [newApt, setNewApt] = useState({ patientName: '', phone: '', type: '常规检查', patientId: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // 自动滚动选中的日期到视图中央
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

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
  }, [selectedDate]);

  const filteredExistingPatients = useMemo(() => {
    if (!searchQuery) return [];
    return patients.filter(p => p.name.includes(searchQuery) || p.phone.includes(searchQuery)).slice(0, 3);
  }, [searchQuery, patients]);

  const handleOpenModal = (time: string) => {
    setSelectedTime(time);
    setNewApt({ patientName: '', phone: '', type: '常规检查', patientId: '' });
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const handleCreateApt = () => {
    if (!newApt.patientName || !newApt.phone) return;
    const apt: Appointment = {
      id: crypto.randomUUID(),
      patientId: newApt.patientId || undefined,
      patientName: newApt.patientName,
      phone: newApt.phone,
      type: newApt.type,
      date: selectedDate,
      time: selectedTime,
      duration: 60,
      status: 'booked'
    };
    addAppointment(apt);
    setIsModalOpen(false);
  };

  const dayAppointments = useMemo(() =>
    appointments.filter(a => a.date === selectedDate)
    , [appointments, selectedDate]);

  const getAptAtTime = (time: string) => dayAppointments.find(a => a.time === time);

  // 全日期选择器临时状态
  const [tempYear, setTempYear] = useState(new Date(selectedDate).getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date(selectedDate).getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date(selectedDate).getDate());

  const handleJumpDate = () => {
    const d = new Date(tempYear, tempMonth - 1, tempDay);
    setSelectedDate(d.toISOString().split('T')[0]);
    setIsDatePickerOpen(false);
  };

  const handleGoToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="flex items-center p-2 justify-between">
          <button onClick={() => navigate('/')} className="size-12 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-100">
            <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
          </button>
          <h2 className="text-[17px] font-black text-slate-800 dark:text-slate-100">预约排班</h2>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              setTempYear(d.getFullYear());
              setTempMonth(d.getMonth() + 1);
              setTempDay(d.getDate());
              setIsDatePickerOpen(true);
            }}
            className="size-12 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-primary"
          >
            <span className="material-symbols-outlined font-black">calendar_today</span>
          </button>
        </div>

        {/* 15天动态滚动周视图 */}
        <div ref={scrollRef} className="flex overflow-x-auto gap-3 p-4 hide-scrollbar snap-x scroll-smooth border-t border-slate-50 dark:border-slate-800/50">
          {weekDays.map((d) => (
            <button
              key={d.dateStr}
              ref={el => itemRefs.current[d.dateStr] = el}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[56px] h-16 rounded-2xl snap-center transition-all ${d.isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700/50'}`}
            >
              <span className={`text-[10px] font-black mb-1 ${d.isSelected ? 'text-white/70' : 'text-slate-400'}`}>{d.dayName}</span>
              <span className="text-base font-black">{d.dayNum}</span>
              {d.isToday && <div className={`mt-1 size-1 rounded-full ${d.isSelected ? 'bg-white' : 'bg-primary'}`}></div>}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5"
          >
            <p className="text-[12px] font-black text-slate-700 dark:text-slate-300">
              {new Date(selectedDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
          </button>
          <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            共 {dayAppointments.length} 个预约
          </span>
        </div>

        <div className="space-y-4">
          {timeSlots.map((time) => {
            const apt = getAptAtTime(time);
            return (
              <div key={time} className="flex gap-4">
                <div className="w-12 flex flex-col items-center pt-2">
                  <span className="text-sm font-black text-slate-400">{time}</span>
                  <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 mt-2 opacity-50"></div>
                </div>

                <div className="flex-1 pb-4">
                  {apt ? (
                    <div
                      className="group bg-white dark:bg-slate-800 border-l-4 border-primary rounded-3xl p-4 shadow-sm relative animate-in fade-in slide-in-from-right-4 active:scale-[0.98] transition-all"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (window.confirm('确定取消该预约吗？')) cancelAppointment(apt.id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-slate-800 dark:text-slate-100 truncate">{apt.patientName}</h4>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md whitespace-nowrap">{apt.type}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">call</span>{apt.phone}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`患者 ${apt.patientName} 已到店？一键将其转入待就诊名单。`)) {
                              cancelAppointment(apt.id);
                              navigate('/add-case', { state: { defaultDate: selectedDate, treatmentType: TreatmentType.FOLLOW_UP, editPatient: patients.find(p => p.id === apt.patientId) || { name: apt.patientName, phone: apt.phone } } });
                            }
                          }}
                          className="size-10 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors active:scale-90"
                        >
                          <span className="material-symbols-outlined">login</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenModal(time)}
                      className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center gap-2 text-slate-300 hover:border-primary/40 hover:text-primary transition-all active:scale-[0.98] group"
                    >
                      <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">add_circle</span>
                      <span className="text-sm font-black">点击预约</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 全日期选择模态框 */}
      {isDatePickerOpen && (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDatePickerOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-8 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-black mb-6 text-center">选择预约日期</h3>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">年份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black"
                  value={tempYear}
                  onChange={(e) => setTempYear(parseInt(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">月份</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black"
                  value={tempMonth}
                  onChange={(e) => setTempMonth(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}月</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">日期</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black"
                  value={tempDay}
                  onChange={(e) => setTempDay(parseInt(e.target.value))}
                >
                  {Array.from({ length: 31 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}日</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleJumpDate}
                className="w-full h-16 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                确定跳转
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleGoToday}
                  className="flex-1 h-14 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  返回今天
                </button>
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 预约表单 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined font-black">calendar_add_on</span>
              </div>
              <div>
                <h3 className="text-xl font-black">创建新预约</h3>
                <p className="text-[11px] font-bold text-slate-400">{selectedDate} @ {selectedTime}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">患者检索 / 姓名</p>
                <div className="relative">
                  <input
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                    placeholder="搜老患者或直接输入..."
                    value={searchQuery || newApt.patientName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setNewApt(prev => ({ ...prev, patientName: val }));
                    }}
                  />
                  {filteredExistingPatients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-10 overflow-hidden">
                      {filteredExistingPatients.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setNewApt({ ...newApt, patientName: p.name, phone: p.phone, patientId: p.id });
                            setSearchQuery('');
                          }}
                          className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center border-b border-slate-50 last:border-none"
                        >
                          <div className="flex flex-col">
                            <span className="font-black text-sm">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.phone}</span>
                          </div>
                          <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">联系电话</p>
                <input
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black"
                  placeholder="请输入手机号"
                  value={newApt.phone}
                  onChange={(e) => setNewApt(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">诊疗内容</p>
                <select
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20"
                  value={newApt.type}
                  onChange={(e) => setNewApt(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option>常规检查</option>
                  <option>根管治疗</option>
                  <option>智齿拔除</option>
                  <option>牙周洁治</option>
                  <option>种植咨询</option>
                  <option>正畸复诊</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black active:scale-95 transition-all">取消</button>
              <button onClick={handleCreateApt} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all">确认预约</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
