
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePatients, useLanguage } from '../App';
import { ToothSelector } from '../components/ToothSelector';
import { PatientStatus, TreatmentType, Patient, TreatmentRecord } from '../types';
import { COMMON_TREATMENTS } from '../constants';

export const AddCase: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patients, addPatient, updatePatient } = usePatients();
  const { language } = useLanguage();
  const descRef = useRef<HTMLTextAreaElement>(null);
  
  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getLocalTimeString = () => {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // 从路由状态获取数据
  const editData = location.state?.editPatient as Patient | undefined;
  const isAddingRecord = location.state?.isAddingRecord as boolean | undefined;
  const editRecord = location.state?.editRecord as TreatmentRecord | undefined;
  const defaultVisitDateFromNav = location.state?.defaultDate as string | undefined;
  const defaultTreatmentType = location.state?.treatmentType as TreatmentType | undefined;

  // 查找最新病患数据
  const currentPatient = useMemo(() => 
    editData ? patients.find(p => p.id === editData.id) : null
  , [editData, patients]);

  // 表单状态初始化
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>(TreatmentType.INITIAL);
  const [visitTime, setVisitTime] = useState(getLocalTimeString());
  const [visitDate, setVisitDate] = useState(getLocalDateString());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 初始化赋值
  useEffect(() => {
    if (editRecord) {
      setName(currentPatient?.name || editData?.name || '');
      setPhone(currentPatient?.phone || editData?.phone || '');
      setCardNumber(currentPatient?.cardNumber || editData?.cardNumber || '');
      setAge(currentPatient?.age || editData?.age || '');
      setGender(currentPatient?.gender || editData?.gender || '男');
      setTreatmentType(TreatmentType.FOLLOW_UP);
      setVisitDate(editRecord.date);
      setVisitTime(editRecord.time);
      setDescription(editRecord.desc);
      // 处理牙位选择回填 (如果是 'UR-6, UR-7' 这种格式)
      if (editRecord.toothPos && editRecord.toothPos !== '全口') {
        setSelectedTeeth(editRecord.toothPos.split(',').map(s => s.trim()));
      }
    } else if (currentPatient || editData) {
      const p = currentPatient || editData!;
      setName(p.name);
      setPhone(p.phone);
      setCardNumber(p.cardNumber || '');
      setAge(p.age || '');
      setGender(p.gender || '男');
      setTreatmentType(isAddingRecord ? TreatmentType.FOLLOW_UP : p.treatmentType);
      setVisitDate(defaultVisitDateFromNav || getLocalDateString());
      setVisitTime(getLocalTimeString());
      setDescription(isAddingRecord ? '' : p.desc);
      if (!isAddingRecord && p.toothPos && p.toothPos !== '全口') {
        setSelectedTeeth(p.toothPos.split(',').map(s => s.trim()));
      }
    } else {
       setTreatmentType(defaultTreatmentType || TreatmentType.INITIAL);
    }
  }, [editRecord, currentPatient, editData, isAddingRecord, defaultVisitDateFromNav, defaultTreatmentType]);

  const handleSetToday = () => setVisitDate(getLocalDateString());
  const handleSetNow = () => setVisitTime(getLocalTimeString());

  const handleSave = async () => {
    if (!name || !phone) {
      alert('请填写患者姓名和手机号');
      return;
    }

    if ((isAddingRecord || editRecord) && !description.trim()) {
      alert('请填写本次诊疗的具体描述');
      descRef.current?.focus();
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const toothPosStr = selectedTeeth.length > 0 ? selectedTeeth.join(', ') : '全口';

      if (currentPatient || editData) {
        const pToUpdate = currentPatient || editData!;
        let updatedRecords = Array.isArray(pToUpdate.records) ? [...pToUpdate.records] : [];

        if (editRecord) {
          // 修改现有记录
          updatedRecords = updatedRecords.map(r => r.id === editRecord.id ? {
            ...r,
            date: visitDate,
            time: visitTime,
            toothPos: toothPosStr,
            desc: description
          } : r);
        } else if (isAddingRecord) {
          // 新增记录
          const newRecord: TreatmentRecord = {
            id: Math.random().toString(36).substr(2, 9),
            date: visitDate,
            time: visitTime,
            toothPos: toothPosStr,
            desc: description
          };
          updatedRecords = [newRecord, ...updatedRecords];
        }

        // 统一更新患者最新的摘要信息 (如果是最近的一条)
        const isLatest = editRecord ? (updatedRecords[0].id === editRecord.id) : isAddingRecord;
        
        updatePatient({
          ...pToUpdate,
          name,
          phone,
          cardNumber,
          age,
          gender,
          treatmentType: editRecord ? pToUpdate.treatmentType : treatmentType,
          time: isLatest ? visitTime : pToUpdate.time,
          visitDate: isLatest ? visitDate : pToUpdate.visitDate,
          desc: isLatest ? description : pToUpdate.desc,
          toothPos: isLatest ? toothPosStr : pToUpdate.toothPos,
          records: updatedRecords,
          status: (isAddingRecord || editRecord) ? PatientStatus.COMPLETED : pToUpdate.status
        });
        
        navigate(`/cases/${pToUpdate.id}`, { replace: true });
      } else {
        // 新增患者
        const newId = Math.random().toString(36).substr(2, 9);
        const newPatient: Patient = {
          id: newId,
          name,
          phone,
          cardNumber,
          age,
          gender,
          visitDate,
          status: PatientStatus.WAITING,
          treatmentType,
          time: visitTime,
          desc: description,
          toothPos: toothPosStr,
          avatar: `https://picsum.photos/seed/${name}/200/200`,
          records: [{
            id: Math.random().toString(36).substr(2, 9),
            date: visitDate,
            time: visitTime,
            toothPos: toothPosStr,
            desc: description
          }]
        };
        addPatient(newPatient);
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error("Save failed:", err);
      alert("保存失败，请检查输入项。");
    } finally {
      setIsSaving(false);
    }
  };

  const addCommonTreatment = (item: string) => {
    if (description.includes(item)) return;
    setDescription(prev => prev ? `${prev}，${item}` : item);
  };

  const handleBack = () => navigate(-1);

  const pageTitle = editRecord ? '修改诊疗记录' : (isAddingRecord ? '新增诊疗记录' : (editData ? '修改患者概况' : '快速建档'));

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-slate-900 relative">
      <header className="sticky top-0 z-[200] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 h-16 flex items-center shadow-sm px-2">
        <div className="flex-none w-14 flex items-center justify-center">
          <button 
            type="button"
            onClick={handleBack} 
            className="size-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all text-slate-800 dark:text-slate-100"
          >
            <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
          </button>
        </div>
        
        <div className="flex-1 text-center overflow-hidden">
          <h2 className="text-[17px] font-black text-slate-800 dark:text-slate-100 truncate">{pageTitle}</h2>
        </div>

        <div className="flex-none w-14 flex items-center justify-center">
          <button 
            type="button"
            onClick={handleBack} 
            className="h-11 px-3 flex items-center justify-center text-primary font-black text-sm active:opacity-60 transition-opacity"
          >
            取消
          </button>
        </div>
      </header>

      <main className="flex-1 pb-40 px-4 py-6 space-y-8 overflow-x-hidden">
        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-inner">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-1 pl-1">
                患者姓名 <span className="text-red-500 font-bold">*</span>
              </p>
              <div className={`flex items-center h-14 w-full rounded-2xl px-4 bg-white dark:bg-slate-900 shadow-sm border ${(isAddingRecord || editRecord) ? 'border-transparent opacity-60' : 'border-slate-50 dark:border-slate-800'}`}>
                 <input 
                  className={`flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black ${(isAddingRecord || editRecord) ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'}`} 
                  placeholder="请输入姓名" 
                  value={name} 
                  onChange={(e) => !(isAddingRecord || editRecord) && setName(e.target.value)} 
                  readOnly={isAddingRecord || !!editRecord}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-1 pl-1">
                  手机号码 <span className="text-red-500 font-bold">*</span>
                </p>
                <div className={`flex items-center h-14 w-full rounded-2xl px-4 bg-white dark:bg-slate-900 shadow-sm border ${(isAddingRecord || editRecord) ? 'border-transparent opacity-60' : 'border-slate-50 dark:border-slate-800'}`}>
                  <input 
                    className={`flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black ${(isAddingRecord || editRecord) ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'}`} 
                    placeholder="11位手机号" 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => !(isAddingRecord || editRecord) && setPhone(e.target.value)} 
                    readOnly={isAddingRecord || !!editRecord}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase pl-1">排队卡号</p>
                <div className={`flex items-center h-14 w-full rounded-2xl px-4 bg-white dark:bg-slate-900 shadow-sm border ${(isAddingRecord || editRecord) ? 'border-transparent opacity-60' : 'border-slate-50 dark:border-slate-800'}`}>
                  <input 
                    className={`flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black ${(isAddingRecord || editRecord) ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'}`} 
                    placeholder="选填" 
                    value={cardNumber} 
                    onChange={(e) => !(isAddingRecord || editRecord) && setCardNumber(e.target.value)} 
                    readOnly={isAddingRecord || !!editRecord}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase">就诊日期</p>
                  <button onClick={handleSetToday} className="text-[9px] font-black text-primary underline">设为今天</button>
                </div>
                <div className="flex items-center h-14 w-full rounded-2xl px-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-800">
                  <input 
                    type="date"
                    className="flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black text-primary" 
                    value={visitDate} 
                    onChange={(e) => setVisitDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase">就诊时刻</p>
                  <button onClick={handleSetNow} className="text-[9px] font-black text-primary underline">设为此刻</button>
                </div>
                <div className="flex items-center h-14 w-full rounded-2xl px-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-50 dark:border-slate-800">
                  <input 
                    type="time"
                    className="flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black text-primary" 
                    value={visitTime} 
                    onChange={(e) => setVisitTime(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase pl-1">就诊类型</p>
                <div className="flex bg-slate-200 dark:bg-slate-900 rounded-2xl p-1 h-14 items-center">
                  <button 
                    type="button"
                    onClick={() => !(isAddingRecord || editRecord) && setTreatmentType(TreatmentType.INITIAL)} 
                    className={`flex-1 h-full text-xs font-black rounded-xl transition-all ${treatmentType === TreatmentType.INITIAL ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                    disabled={isAddingRecord || !!editRecord}
                  >初诊</button>
                  <button 
                    type="button"
                    onClick={() => !(isAddingRecord || editRecord) && setTreatmentType(TreatmentType.FOLLOW_UP)} 
                    className={`flex-1 h-full text-xs font-black rounded-xl transition-all ${treatmentType === TreatmentType.FOLLOW_UP ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                    disabled={isAddingRecord || !!editRecord}
                  >复诊</button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-400 uppercase pl-1">性别/年龄</p>
                <div className={`flex items-center h-14 w-full rounded-2xl px-4 gap-2 bg-white dark:bg-slate-900 shadow-sm border ${(isAddingRecord || editRecord) ? 'border-transparent opacity-60' : 'border-slate-50 dark:border-slate-800'}`}>
                  <select 
                    className={`bg-transparent border-none p-0 focus:ring-0 text-base font-black ${(isAddingRecord || editRecord) ? 'text-slate-500 pointer-events-none' : 'text-slate-800 dark:text-slate-100'}`} 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value as any)}
                    disabled={isAddingRecord || !!editRecord}
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
                  <input 
                    className={`flex-1 border-none bg-transparent p-0 focus:ring-0 text-base font-black ${(isAddingRecord || editRecord) ? 'text-slate-500' : 'text-slate-800 dark:text-slate-100'}`} 
                    placeholder="年龄" 
                    type="number" 
                    value={age} 
                    onChange={(e) => !(isAddingRecord || editRecord) && setAge(e.target.value)} 
                    readOnly={isAddingRecord || !!editRecord}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[17px] font-black">牙位图选择</h3>
            <span className="text-[10px] font-bold text-slate-400">已选: {selectedTeeth.length}</span>
          </div>
          <ToothSelector onSelect={setSelectedTeeth} />
        </div>

        <div className="space-y-4">
          <h3 className="text-[17px] font-black pl-1">诊疗内容</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_TREATMENTS.map(item => (
              <button 
                key={item} 
                type="button"
                onClick={() => addCommonTreatment(item)} 
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-black rounded-full border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-all text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
            <textarea 
              ref={descRef}
              className="w-full min-h-[160px] border-none bg-transparent p-0 focus:ring-0 text-base font-bold leading-relaxed resize-none text-slate-800 dark:text-slate-100" 
              placeholder="在此记录主诉、现病史及本次治疗建议..." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-[300] bg-gradient-to-t from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                正在保存数据...
              </>
            ) : '确认并保存记录'}
          </button>
        </div>
      </div>
    </div>
  );
};
