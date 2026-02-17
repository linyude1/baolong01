
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMedicines } from '../App';
import { Medicine, ShoppingItem, DeletedMedicine } from '../types';

export const MedicineInventory: React.FC = () => {
  const navigate = useNavigate();
  const { medicines, deletionHistory, shoppingItems, addMedicine, deleteMedicine, addShoppingItem, toggleShoppingItem } = useMedicines();
  
  // Tab: 预警, 全部, 采购, 历史
  const [activeTab, setActiveTab] = useState<'expiry' | 'inventory' | 'shopping' | 'history'>('expiry');
  
  // Modals
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
  
  // Long press timer and state
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null);

  // Form states
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });
  const [newMedicine, setNewMedicine] = useState<Partial<Medicine>>({
    name: '', brand: '', expiryDate: '', stock: 0, unit: '盒', minStock: 5, category: '其他'
  });

  const handleAddShoppingItem = () => {
    if (!newItem.name || !newItem.quantity) return;
    const item: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      quantity: newItem.quantity,
      isCustom: true,
      addedDate: new Date().toISOString().split('T')[0],
      isBought: false
    };
    addShoppingItem(item);
    setNewItem({ name: '', quantity: '' });
    setIsShoppingModalOpen(false);
  };

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.expiryDate) return;
    const today = new Date();
    const expiry = new Date(newMedicine.expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: 'normal' | 'expired' | 'warning' = 'normal';
    if (diffDays < 0) status = 'expired';
    else if (diffDays < 90) status = 'warning';

    const medicine: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMedicine.name || '',
      brand: newMedicine.brand || '未知',
      expiryDate: newMedicine.expiryDate || '',
      stock: Number(newMedicine.stock) || 0,
      unit: newMedicine.unit || '盒',
      minStock: Number(newMedicine.minStock) || 5,
      category: (newMedicine.category as any) || '其他',
      status: status
    };

    addMedicine(medicine);
    setNewMedicine({ name: '', brand: '', expiryDate: '', stock: 0, unit: '盒', minStock: 5, category: '其他' });
    setIsMedicineModalOpen(false);
  };

  const handleLongPressStart = (med: Medicine) => {
    setPressingId(med.id);
    longPressTimer.current = setTimeout(() => {
      setMedicineToDelete(med);
      setPressingId(null);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 800);
  };

  const handleLongPressEnd = () => {
    setPressingId(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const confirmDelete = () => {
    if (medicineToDelete) {
      deleteMedicine(medicineToDelete.id);
      setMedicineToDelete(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-[150] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-2">
        <div className="flex items-center h-14 px-2">
          <button onClick={() => navigate(-1)} className="size-12 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all text-slate-800 dark:text-slate-100">
            <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">医疗物资管理</h2>
          </div>
          <button onClick={() => setIsMedicineModalOpen(true)} className="size-10 ml-auto flex items-center justify-center rounded-xl bg-primary/10 text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black">add</span>
          </button>
        </div>

        <div className="mt-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex relative overflow-hidden">
          {['expiry', 'inventory', 'shopping', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 text-center text-[10px] font-black rounded-xl transition-all z-10 ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
            >
              {tab === 'expiry' && `预警 (${medicines.filter(m => m.status !== 'normal' || m.stock < m.minStock).length})`}
              {tab === 'inventory' && '全部'}
              {tab === 'shopping' && '采购单'}
              {tab === 'history' && '历史'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 relative">
        {(activeTab === 'expiry' || activeTab === 'inventory') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {activeTab === 'expiry' ? '预警中' : '全库记录'} (长按可删除)
              </h3>
            </div>
            {medicines
              .filter(m => activeTab === 'inventory' || m.status !== 'normal' || m.stock < m.minStock)
              .map(m => {
                const isLowStock = m.stock < m.minStock;
                const isPressing = pressingId === m.id;
                
                return (
                  <div 
                    key={m.id} 
                    onMouseDown={() => handleLongPressStart(m)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(m)}
                    onTouchEnd={handleLongPressEnd}
                    className={`bg-white dark:bg-slate-800 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 border-l-4 transition-all active:bg-slate-50 select-none ${isPressing ? 'scale-[0.97] opacity-80' : 'scale-100'} ${m.status === 'expired' ? 'border-l-red-500' : (m.status === 'warning' || isLowStock) ? 'border-l-amber-500' : 'border-l-primary/30'}`}
                  >
                    <div className={`size-14 rounded-2xl flex items-center justify-center ${m.status === 'expired' ? 'bg-red-50 text-red-500' : (m.status === 'warning' || isLowStock) ? 'bg-amber-50 text-amber-500' : 'bg-primary/5 text-primary'}`}>
                      <span className="material-symbols-outlined text-2xl">{m.status === 'expired' ? 'error' : (m.status === 'warning' || isLowStock) ? 'notification_important' : 'inventory_2'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{m.name}</h4>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.status === 'expired' ? 'bg-red-500 text-white' : m.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                            {m.status === 'expired' ? '已过期' : m.status === 'warning' ? '临期' : '正常'}
                          </span>
                          {isLowStock && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 animate-pulse">需采购</span>}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{m.brand} · {m.category}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="material-symbols-outlined text-[12px]">event</span>
                          <span className="text-[10px] font-black">{m.expiryDate}</span>
                        </div>
                        <p className="text-[10px] font-black">库存: <span className={isLowStock ? 'text-red-500 font-black' : 'text-slate-800 dark:text-slate-200'}>{m.stock} {m.unit}</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待采购项</h3>
              <button onClick={() => setIsShoppingModalOpen(true)} className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/10 px-4 py-2 rounded-full active:scale-90 transition-all">
                <span className="material-symbols-outlined text-sm">add_circle</span>手动添加
              </button>
            </div>
            {shoppingItems.map(item => (
              <div key={item.id} onClick={() => toggleShoppingItem(item.id)} className={`bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all ${item.isBought ? 'opacity-50 grayscale' : ''}`}>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center ${item.isBought ? 'bg-green-500 border-green-500' : 'border-slate-200 dark:border-slate-600'}`}>
                  {item.isBought && <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>}
                </div>
                <div className="flex-1">
                  <h4 className={`font-black text-slate-800 dark:text-slate-100 text-sm ${item.isBought ? 'line-through' : ''}`}>{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.quantity} · {item.isCustom ? '手动' : '预警'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="px-2 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">删除历史 (保存7天)</h3>
            </div>
            {deletionHistory.map(item => (
              <div key={item.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm opacity-70">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-sm text-slate-700 dark:text-slate-200">{item.name}</h4>
                  <span className="text-[9px] font-black text-slate-400">{new Date(item.deletedAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{item.brand} · 已移除</p>
              </div>
            ))}
            {deletionHistory.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl opacity-10">history</span>
                <p className="text-xs font-black mt-2">暂无历史记录</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 删除确认 Modal */}
      {medicineToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setMedicineToDelete(null)}></div>
          <div className="relative w-full max-w-xs bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>
            <h3 className="text-base font-black text-center mb-2">确认删除药品？</h3>
            <p className="text-xs font-bold text-slate-400 text-center mb-6">"{medicineToDelete.name}" 将从主列表中移除并保存至历史记录7天。</p>
            <div className="flex gap-3">
              <button onClick={() => setMedicineToDelete(null)} className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-xs active:scale-95 transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 h-12 bg-red-500 text-white rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 录入物资 Modal */}
      {isMedicineModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsMedicineModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black mb-6">录入物资</h3>
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">物资名称</p>
                <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20" placeholder="如: 3M纳米树脂" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">品牌</p>
                  <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" placeholder="品牌" value={newMedicine.brand} onChange={e => setNewMedicine({...newMedicine, brand: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">分类</p>
                  <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" value={newMedicine.category} onChange={e => setNewMedicine({...newMedicine, category: e.target.value as any})} >
                    <option value="麻醉">麻醉</option><option value="填充">填充</option><option value="消毒">消毒</option><option value="耗材">耗材</option><option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">当前库存</p>
                  <input type="number" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" value={newMedicine.stock} onChange={e => setNewMedicine({...newMedicine, stock: Number(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">单位</p>
                  <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black" placeholder="支/盒/套" value={newMedicine.unit} onChange={e => setNewMedicine({...newMedicine, unit: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">有效期至</p>
                <input type="date" className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black text-primary" value={newMedicine.expiryDate} onChange={e => setNewMedicine({...newMedicine, expiryDate: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsMedicineModalOpen(false)} className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-2xl font-black">取消</button>
              <button onClick={handleAddMedicine} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20">确认录入</button>
            </div>
          </div>
        </div>
      )}

      {/* 手动采购 Modal */}
      {isShoppingModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsShoppingModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-6 text-center">手动添加采购项</h3>
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">物品名称</p>
                <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20" placeholder="如: 高速机芯" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase pl-1">数量</p>
                <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-sm font-black focus:ring-2 focus:ring-primary/20" placeholder="如: 5个" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsShoppingModalOpen(false)} className="flex-1 h-14 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl font-black active:scale-95 transition-all">取消</button>
              <button onClick={handleAddShoppingItem} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all">确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
