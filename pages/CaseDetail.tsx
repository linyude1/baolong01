
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatients } from '../App';
import { PatientStatus, TreatmentRecord, TreatmentType } from '../types';
import { formatToothPos } from '../constants';

const RecordEntry: React.FC<{ 
  record: TreatmentRecord; 
  onEdit?: (record: TreatmentRecord) => void;
  onDelete?: (id: string) => void;
  isReadOnly?: boolean;
}> = ({ record, onEdit, onDelete, isReadOnly }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative group ${isReadOnly ? 'opacity-80' : ''}`}>
      {/* 操作按钮组 - 只在非只读模式下显示 */}
      {!isReadOnly && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={() => onEdit?.(record)}
            className="size-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-primary active:scale-90 transition-all shadow-sm"
            title="修改病历"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button 
            onClick={() => onDelete?.(record.id)}
            className="size-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-red-500 active:scale-90 transition-all shadow-sm"
            title="删除病历"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-300 font-bold mb-1">{record.date}</p>
      <p className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">{record.time}</p>
      
      <p className="font-black text-primary text-base mb-4">{formatToothPos(record.toothPos)}</p>
      
      <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl py-4 px-6">
        <p className="text-[15px] font-bold text-slate-700 dark:text-slate-200 italic">“{record.desc}”</p>
      </div>
    </div>
  );
};

export const CaseDetail: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { patients, deletedPatients, updatePatient, restorePatient } = usePatients();

  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  
  // 智能查找：先找活跃患者，再找删除历史
  const activePatient = patients.find(p => p.id === caseId);
  const historyRecord = deletedPatients.find(p => p.id === caseId);
  const patient = activePatient || historyRecord?.data;
  const isDeleted = !!historyRecord;

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background-light dark:bg-background-dark">
        <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">person_off</span>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">未找到患者信息</h3>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-black">返回首页</button>
      </div>
    );
  }

  const handleSelectQueueNumber = (num: number) => {
    if (isDeleted) return;
    updatePatient({
      ...patient,
      status: PatientStatus.WAITING,
      treatmentType: TreatmentType.FOLLOW_UP,
      cardNumber: num.toString(),
      visitDate: new Date().toISOString().split('T')[0]
    });
    setIsQueueModalOpen(false);
    navigate('/');
  };

  const handleDeleteRecord = (recordId: string) => {
    if (isDeleted) return;
    if (!window.confirm('确定要删除这条诊疗记录吗？删除后不可恢复。')) return;
    
    const updatedRecords = (patient.records || []).filter(r => r.id !== recordId);
    let updatedSummary = { ...patient, records: updatedRecords };
    if (updatedRecords.length > 0 && patient.records?.[0]?.id === recordId) {
      const latest = updatedRecords[0];
      updatedSummary = {
        ...updatedSummary,
        visitDate: latest.date,
        time: latest.time,
        desc: latest.desc,
        toothPos: latest.toothPos
      };
    }
    updatePatient(updatedSummary);
  };

  const handleEditRecord = (record: TreatmentRecord) => {
    if (isDeleted) return;
    navigate('/add-case', { state: { editPatient: patient, editRecord: record } });
  };

  const handleRestore = () => {
    if (window.confirm(`确定要恢复患者 ${patient.name} 的档案吗？恢复后可在主页重新挂号。`)) {
      restorePatient(patient.id);
      navigate('/');
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDeleted ? 'bg-slate-100 dark:bg-slate-950 grayscale-[0.3]' : 'bg-slate-50 dark:bg-background-dark'}`}>
      <header className="sticky top-0 z-[150] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center h-14 px-2">
        <button 
          onClick={() => navigate(-1)} 
          className="size-11 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
        >
          <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-[17px] font-black text-slate-800 dark:text-slate-100">
            {isDeleted ? '历史档案 (只读)' : '诊疗详情'}
          </h2>
        </div>
        <div className="size-11"></div>
      </header>

      {isDeleted && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
          此病历已于 {new Date(historyRecord!.deletedAt).toLocaleDateString()} 移除 · 仅供查阅
        </div>
      )}

      <main className="flex-1 space-y-10 p-5 pb-32">
        <section className="bg-white dark:bg-slate-800 rounded-[44px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
          <img 
            src={patient.avatar || 'https://picsum.photos/seed/default/200/200'} 
            className="size-24 rounded-full border-4 border-slate-50 dark:border-slate-900 mb-5 object-cover shadow-sm" 
          />
          <h1 className="text-2xl font-black mb-1">{patient.name}</h1>
          <p className="text-slate-300 font-bold mb-6 tracking-wider">{patient.phone}</p>
          <div className="flex gap-3">
            <span className="px-5 py-1.5 bg-[#e6f2ff] text-primary text-[11px] font-black rounded-full">{patient.treatmentType}</span>
            <span className={`px-5 py-1.5 text-[11px] font-black rounded-full ${isDeleted ? 'bg-slate-400 text-white' : (patient.status === PatientStatus.COMPLETED ? 'bg-green-500 text-white' : 'bg-[#fdf3e7] text-orange-400')}`}>
              {isDeleted ? '已移除' : patient.status}
            </span>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">诊疗历史记录</h3>
            {!isDeleted && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsQueueModalOpen(true)} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary rounded-2xl font-black text-[12px] shadow-sm border border-primary/20 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">add_box</span>排队
                </button>
                <button 
                  onClick={() => navigate('/add-case', { state: { editPatient: patient, isAddingRecord: true } })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl shadow-lg active:scale-95 font-black text-[12px]"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>新增记录
                </button>
              </div>
            )}
            {isDeleted && (
              <button 
                onClick={handleRestore}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-2xl shadow-lg active:scale-95 font-black text-[12px]"
              >
                <span className="material-symbols-outlined text-[20px]">restore_from_trash</span>恢复档案
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {(patient.records && patient.records.length > 0) ? (
              patient.records.map((record) => (
                <RecordEntry 
                  key={record.id} 
                  record={record} 
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                  isReadOnly={isDeleted}
                />
              ))
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-[40px] p-12 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 opacity-20">history_edu</span>
                <p className="text-sm font-black text-slate-400">尚无详细的诊疗历史记录</p>
              </div>
            )}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 p-6 z-[200] bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-900 pointer-events-none">
          <div className="max-w-md mx-auto flex gap-4 pointer-events-auto">
            <button className="flex-1 flex items-center justify-center gap-2 h-16 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-black text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all">
              <span className="material-symbols-outlined">print</span>打印病历
            </button>
            {!isDeleted && (
              <button 
                onClick={() => navigate('/add-case', { state: { editPatient: patient } })} 
                className="flex-[1.5] flex items-center justify-center gap-2 h-16 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">edit</span>修改概况
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 排队卡号码选择 Modal */}
      {isQueueModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsQueueModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-xl font-black mb-1 text-center">发放排队卡</h3>
            <p className="text-[11px] font-bold text-slate-400 text-center mb-8 uppercase tracking-widest">请选择要发放的物理卡片号码</p>
            
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto px-1 hide-scrollbar">
              {Array.from({length: 25}).map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelectQueueNumber(i + 1)}
                  className="aspect-square flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-lg font-black text-slate-700 dark:text-slate-200 active:bg-primary active:text-white transition-colors"
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsQueueModalOpen(false)} 
              className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black mt-8 active:scale-95 transition-all"
            >
              取消操作
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
