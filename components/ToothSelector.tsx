
import React, { useState } from 'react';
import { TEETH_ADULT, TEETH_CHILD } from '../constants';

interface ToothSelectorProps {
  onSelect: (selected: string[]) => void;
}

export const ToothSelector: React.FC<ToothSelectorProps> = ({ onSelect }) => {
  const [type, setType] = useState<'adult' | 'child'>('adult');
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);

  const toggleTooth = (tooth: string, quadrant: string) => {
    const id = `${quadrant}-${tooth}`;
    const newSelected = selectedTeeth.includes(id)
      ? selectedTeeth.filter(t => t !== id)
      : [...selectedTeeth, id];
    setSelectedTeeth(newSelected);
    onSelect(newSelected);
  };

  const teethList = type === 'adult' ? TEETH_ADULT : TEETH_CHILD;

  const QuadrantGrid = ({ q, reverse = false, top = false }: { q: string, reverse?: boolean, top?: boolean }) => (
    <div className={`flex flex-col ${reverse ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] text-slate-400 mb-1">{q}</span>
      <div className={`grid ${type === 'adult' ? 'grid-cols-8' : 'grid-cols-5'} gap-0.5 p-1 border-slate-200 dark:border-slate-700
        ${q === 'UR' ? 'border-b-2 border-l-2' : ''}
        ${q === 'UL' ? 'border-b-2 border-r-2' : ''}
        ${q === 'LR' ? 'border-t-2 border-l-2' : ''}
        ${q === 'LL' ? 'border-t-2 border-r-2' : ''}
      `}>
        {(reverse ? [...teethList] : [...teethList].reverse()).map((t) => {
          const id = `${q}-${t}`;
          const isSelected = selectedTeeth.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleTooth(t, q)}
              className={`aspect-square w-full rounded-sm flex items-center justify-center text-[10px] font-bold transition-colors
                ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700'}
              `}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex relative">
        <button
          onClick={() => setType('adult')}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded-md transition-all z-10 ${type === 'adult' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          恒牙 (1-8)
        </button>
        <button
          onClick={() => setType('child')}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded-md transition-all z-10 ${type === 'child' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-500'}`}
        >
          乳牙 (A-E)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <QuadrantGrid q="UR" reverse={true} top={true} />
          <QuadrantGrid q="UL" reverse={false} top={true} />
          <QuadrantGrid q="LR" reverse={true} top={false} />
          <QuadrantGrid q="LL" reverse={false} top={false} />
        </div>
      </div>
    </div>
  );
};
