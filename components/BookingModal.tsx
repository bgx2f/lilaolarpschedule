
import React, { useState, useEffect } from 'react';
import { Booking, Room, SlotType } from '../types';
import { X, Save, Trash2, AlertCircle, Plus, Check, DollarSign, ShieldCheck, RefreshCw, Crown, Users, CheckCircle2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  onDelete: (id: string) => void;
  initialData?: Partial<Booking>;
  selectedDate: string;
  rooms: Room[];
  availableScripts: string[];
  allBookings: Booking[];
  availableDms: string[];
  availableNpcs: string[];
  noDepositLabels: string[];
}

const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialData, 
  selectedDate,
  rooms,
  availableScripts,
  allBookings,
  availableDms,
  availableNpcs,
  noDepositLabels
}) => {
  const [formData, setFormData] = useState<Partial<Booking>>({
    roomId: rooms[0]?.id || '',
    timeRange: '',
    scriptName: '',
    dms: [],
    npcs: [],
    depositAmount: 0,
    depositLabel: '',
    organizerName: '',
    date: selectedDate
  });

  const [depositMode, setDepositMode] = useState<'amount' | 'label'>('amount');
  const [dmInput, setDmInput] = useState('');
  const [npcInput, setNpcInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false);
      if (initialData?.id) {
        setFormData({ 
            dms: [], 
            npcs: [], 
            depositLabel: '',
            ...initialData 
        });
        setDepositMode(initialData.depositLabel ? 'label' : 'amount');
      } else {
        setFormData({
          roomId: initialData?.roomId || rooms[0]?.id || '',
          timeRange: '13:00-17:00',
          scriptName: '',
          dms: [],
          npcs: [],
          depositAmount: 0,
          depositLabel: '',
          organizerName: '',
          date: selectedDate,
          ...initialData 
        });
        setDepositMode('amount');
      }
      setDmInput('');
      setNpcInput('');
    }
  }, [isOpen, initialData, selectedDate, rooms]);

  if (!isOpen) return null;

  const handleAddDM = (nameOverride?: string) => {
    const name = nameOverride || dmInput.trim();
    if (name) {
      const currentDms = formData.dms || [];
      if (currentDms.includes(name)) return;
      setFormData(prev => ({ ...prev, dms: [...currentDms, name] }));
      if (!nameOverride) setDmInput('');
    }
  };

  const handleAddNPC = (nameOverride?: string) => {
    const name = nameOverride || npcInput.trim();
    if (name) {
      const currentNpcs = formData.npcs || [];
      if (currentNpcs.includes(name)) return;
      setFormData(prev => ({ ...prev, npcs: [...currentNpcs, name] }));
      if (!nameOverride) setNpcInput('');
    }
  };

  const removeDM = (idx: number) => {
    setFormData(prev => ({ ...prev, dms: prev.dms?.filter((_, i) => i !== idx) }));
  };

  const removeNPC = (idx: number) => {
    setFormData(prev => ({ ...prev, npcs: prev.npcs?.filter((_, i) => i !== idx) }));
  };

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const calculateSlot = (timeRange: string): SlotType => {
    const parts = timeRange.split('-');
    if (parts.length !== 2) return SlotType.AFTERNOON;
    const startMinutes = parseTime(parts[0].trim());
    const endMinutes = parseTime(parts[1].trim());
    if (endMinutes <= 13 * 60) return SlotType.MORNING;
    if (endMinutes <= 18 * 60 + 30) return SlotType.AFTERNOON;
    return SlotType.EVENING; 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.date) { setError('請選擇日期'); return; }
    if (!formData.roomId) { setError('請選擇場館'); return; }
    if (!formData.timeRange || !formData.timeRange.includes('-')) { setError('請輸入正確的時間範圍'); return; }
    if (!formData.scriptName) { setError('請輸入劇本名稱'); return; }
    if (!formData.organizerName) { setError('請輸入主揪姓名'); return; }
    if (!formData.dms || formData.dms.length === 0) { setError('請至少填寫一位主持人'); return; }

    const finalData = {
      ...formData,
      depositAmount: depositMode === 'amount' ? (formData.depositAmount || 0) : 0,
      depositLabel: depositMode === 'label' ? formData.depositLabel : '',
      slot: calculateSlot(formData.timeRange || ''),
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as Booking;

    onSave(finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-bold text-gray-900">
                {initialData?.id ? '編輯預約' : '新增預約'}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm font-bold border border-red-100 whitespace-pre-line animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>{error}</div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">日期 <span className="text-red-500">*</span></label>
                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">場館 <span className="text-red-500">*</span></label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">時間範圍 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="eg. 13:00-17:00" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-mono" value={formData.timeRange} onChange={e => setFormData({...formData, timeRange: e.target.value})}/>
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">劇本 <span className="text-red-500">*</span></label>
                <input list="script-list" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-bold" value={formData.scriptName} onChange={e => setFormData({...formData, scriptName: e.target.value})} placeholder="輸入或選擇劇本..."/>
                <datalist id="script-list">{availableScripts.map(s => <option key={s} value={s} />)}</datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-600">定金 Deposit <span className="text-red-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={() => setDepositMode(depositMode === 'amount' ? 'label' : 'amount')}
                      className="text-[10px] text-blue-600 flex items-center gap-1 font-bold hover:underline"
                    >
                      <RefreshCw size={10} /> 切換模式
                    </button>
                  </div>
                  
                  {depositMode === 'amount' ? (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={14} />
                      <input 
                        type="number"
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none"
                        value={formData.depositAmount}
                        onChange={e => setFormData({...formData, depositAmount: parseInt(e.target.value) || 0, depositLabel: ''})}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 text-indigo-400" size={14} />
                      <select 
                        className="w-full pl-8 pr-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 focus:ring-2 focus:ring-indigo-400 outline-none font-bold text-sm"
                        value={formData.depositLabel}
                        onChange={e => setFormData({...formData, depositLabel: e.target.value, depositAmount: 0})}
                      >
                        <option value="">-- 選擇免付標籤 --</option>
                        {noDepositLabels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                <label className="block text-xs font-bold text-larp-accent mb-1">主揪 Organizer <span className="text-red-500">*</span></label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-accent outline-none" value={formData.organizerName} onChange={e => setFormData({...formData, organizerName: e.target.value})}/>
                </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* DM Section (Enhanced with Quick Select) */}
            <div>
              <label className="block text-xs font-bold text-yellow-600 mb-1">主持人 DM <span className="text-red-500">*</span></label>
              <div className="flex gap-2 mb-2">
                  <input 
                    list="dm-list"
                    type="text" 
                    placeholder="輸入主持人名字..." 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-yellow-500" 
                    value={dmInput} 
                    onChange={e => setDmInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDM())}
                  />
                  <datalist id="dm-list">{availableDms.map(d => <option key={d} value={d} />)}</datalist>
                  <button type="button" onClick={() => handleAddDM()} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg text-sm border border-yellow-200 transition-colors"><Plus size={16}/></button>
              </div>

              {/* Quick Select DM */}
              {availableDms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                      {availableDms.map(dm => {
                          const isSelected = formData.dms?.includes(dm);
                          return (
                              <button
                                key={dm}
                                type="button"
                                onClick={() => handleAddDM(dm)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${isSelected ? 'bg-yellow-100 border-yellow-300 text-yellow-700 opacity-50 cursor-default' : 'bg-white border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600'}`}
                                disabled={isSelected}
                              >
                                {dm}
                              </button>
                          );
                      })}
                  </div>
              )}

              <div className="flex flex-wrap gap-2 min-h-[30px]">
                  {formData.dms?.map((dm, idx) => (
                  <span key={idx} className={`px-2.5 py-1.5 rounded-xl text-sm flex items-center font-bold shadow-sm ${dm.includes('待定') ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 animate-pulse' : 'bg-gray-800 text-white border border-gray-900'}`}>
                      <Crown size={12} className="mr-1.5 opacity-70" />
                      {dm}
                      <button type="button" onClick={() => removeDM(idx)} className="ml-2 hover:text-red-400 transition-colors"><X size={12}/></button>
                  </span>
                  ))}
              </div>
            </div>

            {/* NPC Section (Enhanced with Quick Select) */}
            <div>
              <label className="block text-xs font-bold text-green-600 mb-1">NPC (選填)</label>
              <div className="flex gap-2 mb-2">
                  <input 
                    list="npc-list"
                    type="text" 
                    placeholder="輸入 NPC 名字..." 
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-600" 
                    value={npcInput} 
                    onChange={e => setNpcInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNPC())}
                  />
                  <datalist id="npc-list">{availableNpcs.map(n => <option key={n} value={n} />)}</datalist>
                  <button type="button" onClick={() => handleAddNPC()} className="bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1 rounded-lg text-sm border border-green-200 transition-colors"><Plus size={16}/></button>
              </div>

              {/* Quick Select NPC */}
              {availableNpcs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                      {availableNpcs.map(npc => {
                          const isSelected = formData.npcs?.includes(npc);
                          return (
                              <button
                                key={npc}
                                type="button"
                                onClick={() => handleAddNPC(npc)}
                                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${isSelected ? 'bg-green-100 border-green-300 text-green-700 opacity-50 cursor-default' : 'bg-white border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600'}`}
                                disabled={isSelected}
                              >
                                {npc}
                              </button>
                          );
                      })}
                  </div>
              )}

              <div className="flex flex-wrap gap-2">
                  {formData.npcs?.map((npc, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-sm flex items-center font-bold">
                      <Users size={12} className="mr-1.5 opacity-50" />
                      {npc}
                      <button type="button" onClick={() => removeNPC(idx)} className="ml-2 hover:text-red-500 transition-colors"><X size={12}/></button>
                  </span>
                  ))}
              </div>
            </div>

            </form>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between gap-3 shrink-0 z-20">
            {initialData?.id && (
                <>
                {isDeleting ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200 flex-1">
                        <button type="button" onClick={() => onDelete(initialData.id!)} className="flex items-center gap-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm font-bold active:scale-95"><Trash2 size={18} /> 確認刪除</button>
                        <button type="button" onClick={() => setIsDeleting(false)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium active:scale-95">取消</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => setIsDeleting(true)} className="flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 cursor-pointer active:scale-95 shadow-sm hover:shadow" title="刪除此預約"><Trash2 size={18} /></button>
                )}
                </>
            )}
            
            {!isDeleting && (
                <button type="submit" form="booking-form" className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-larp-primary to-larp-accent text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-larp-primary/20 transition-all active:scale-95 shadow-md">
                <Save size={18} /> {initialData?.id ? '儲存變更' : '建立預約'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
