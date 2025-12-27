
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

  // --- 核心衝突偵測 ---

  const parseTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const cleanTime = timeStr.trim().replace('：', ':');
    const [h, m] = cleanTime.split(':').map(Number);
    return (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
  };

  const getTimeRangeMinutes = (rangeStr: string): [number, number] | null => {
    const parts = rangeStr.split('-').map(p => p.trim());
    if (parts.length !== 2) return null;
    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    if (end < start) return [start, end + 1440]; // 跨夜
    return [start, end];
  };

  const checkConflicts = (newBooking: Partial<Booking>): string | null => {
    const range1 = getTimeRangeMinutes(newBooking.timeRange || '');
    if (!range1) return '請輸入有效的時間格式 (例如 13:00-17:00)';
    const [start1, end1] = range1;

    for (const b of allBookings) {
      // 排除當前正在編輯的這一筆，且只比對同日期的預約
      if (b.id === newBooking.id || b.date !== newBooking.date) continue;

      const range2 = getTimeRangeMinutes(b.timeRange);
      if (!range2) continue;
      const [start2, end2] = range2;

      // 時段重疊判斷
      const isOverlapping = start1 < end2 && start2 < end1;

      if (isOverlapping) {
        const roomName = rooms.find(r => r.id === b.roomId)?.name || '其他房間';
        
        // 1. 場館重複 (相同房間、相同日期、時段重疊)
        if (b.roomId === newBooking.roomId) {
          return `該時段已有場次：${roomName} (已預約《${b.scriptName}》)`;
        }

        // 2. 劇本重複 (相同劇本、相同日期、時段重疊)
        if (b.scriptName.trim() === newBooking.scriptName?.trim()) {
          return `該時段劇本重複：劇本《${b.scriptName}》已在 ${roomName} 安排過場次`;
        }

        // 3. 人員重複 (DMs + NPCs 混合檢查，排除「待定」)
        const staffNew = [...(newBooking.dms || []), ...(newBooking.npcs || [])].filter(n => n && !n.includes('待定'));
        const staffExisting = [...(b.dms || []), ...(b.npcs || [])].filter(n => n && !n.includes('待定'));

        for (const name of staffNew) {
          if (staffExisting.includes(name)) {
            return `人員重複：${name} 在該時段已於 ${roomName} 的《${b.scriptName}》場次中排班`;
          }
        }
      }
    }
    return null;
  };

  const calculateSlot = (timeRange: string): SlotType => {
    const range = getTimeRangeMinutes(timeRange);
    if (!range) return SlotType.AFTERNOON;
    const [, endMinutes] = range;
    if (endMinutes <= 13 * 60) return SlotType.MORNING;
    if (endMinutes <= 18 * 60 + 30) return SlotType.AFTERNOON;
    return SlotType.EVENING; 
  };

  // --- 操作處理 ---

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. 準備提交的資料 (自動將輸入框內尚未按 + 的名字加入)
    const currentDms = [...(formData.dms || [])];
    if (dmInput.trim() && !currentDms.includes(dmInput.trim())) {
      currentDms.push(dmInput.trim());
    }

    const currentNpcs = [...(formData.npcs || [])];
    if (npcInput.trim() && !currentNpcs.includes(npcInput.trim())) {
      currentNpcs.push(npcInput.trim());
    }

    const submissionData = { ...formData, dms: currentDms, npcs: currentNpcs };

    // 2. 欄位基礎驗證 (順序在衝突偵測之前)
    if (!submissionData.date) { setError('請選擇日期'); return; }
    if (!submissionData.roomId) { setError('請選擇場館'); return; }
    if (!submissionData.timeRange || !submissionData.timeRange.includes('-')) { setError('請輸入正確的時間範圍 (例如 13:00-17:00)'); return; }
    if (!submissionData.scriptName) { setError('請輸入劇本名稱'); return; }
    if (!submissionData.organizerName) { setError('請輸入主揪姓名'); return; }
    if (submissionData.dms.length === 0) { setError('請至少填寫一位主持人 (DM)'); return; }

    // 3. 核心衝突偵測 (場館、劇本、人員)
    const conflictMessage = checkConflicts(submissionData);
    if (conflictMessage) {
      setError(conflictMessage);
      return;
    }

    // 4. 通過驗證後存檔
    const finalData = {
      ...submissionData,
      depositAmount: depositMode === 'amount' ? (submissionData.depositAmount || 0) : 0,
      depositLabel: depositMode === 'label' ? submissionData.depositLabel : '',
      slot: calculateSlot(submissionData.timeRange || ''),
      id: submissionData.id || Math.random().toString(36).substr(2, 9),
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
                {initialData?.id ? '編輯場次資料' : '新增預約場次'}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm font-black border border-red-200 shadow-lg animate-in slide-in-from-top-2 ring-2 ring-red-500/20">
                  <AlertCircle size={24} className="mt-0.5 flex-shrink-0 text-red-600" />
                  <div className="leading-relaxed whitespace-pre-wrap">{error}</div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">日期 <span className="text-red-500">*</span></label>
                    <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">場館房間 <span className="text-red-500">*</span></label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-bold" value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">時間時段 <span className="text-red-500">*</span></label>
                <input type="text" placeholder="範例: 13:00-17:00" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-mono" value={formData.timeRange} onChange={e => setFormData({...formData, timeRange: e.target.value})}/>
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">劇本名稱 <span className="text-red-500">*</span></label>
                <input list="script-list" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-bold" value={formData.scriptName} onChange={e => setFormData({...formData, scriptName: e.target.value})} placeholder="請選擇或輸入劇本..."/>
                <datalist id="script-list">{availableScripts.map(s => <option key={s} value={s} />)}</datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-600">定金狀態 <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => setDepositMode(depositMode === 'amount' ? 'label' : 'amount')} className="text-[10px] text-blue-600 flex items-center gap-1 font-bold hover:underline">
                      <RefreshCw size={10} /> 切換輸入
                    </button>
                  </div>
                  
                  {depositMode === 'amount' ? (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-gray-400" size={14} />
                      <input type="number" className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-bold" value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: parseInt(e.target.value) || 0, depositLabel: ''})} />
                    </div>
                  ) : (
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3 text-indigo-400" size={14} />
                      <select className="w-full pl-8 pr-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 focus:ring-2 focus:ring-indigo-400 outline-none font-bold text-sm" value={formData.depositLabel} onChange={e => setFormData({...formData, depositLabel: e.target.value, depositAmount: 0})} >
                        <option value="">-- 免付定金標籤 --</option>
                        {noDepositLabels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                <label className="block text-xs font-bold text-larp-accent mb-1">主揪姓名 <span className="text-red-500">*</span></label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-accent outline-none font-bold" value={formData.organizerName} onChange={e => setFormData({...formData, organizerName: e.target.value})}/>
                </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* DM Section */}
            <div>
              <label className="block text-xs font-bold text-yellow-600 mb-1">主持人 DM <span className="text-red-500">*</span></label>
              <div className="flex gap-2 mb-2">
                  <input list="dm-list" type="text" placeholder="名字..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-yellow-500 font-bold" value={dmInput} onChange={e => setDmInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddDM(); } }} />
                  <datalist id="dm-list">{availableDms.map(d => <option key={d} value={d} />)}</datalist>
                  <button type="button" onClick={() => handleAddDM()} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-4 py-1 rounded-lg text-sm border border-yellow-200 transition-colors font-black"><Plus size={18}/></button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[30px]">
                  {formData.dms?.map((dm, idx) => (
                  <span key={idx} className={`px-2.5 py-1.5 rounded-xl text-sm flex items-center font-bold shadow-sm transition-all ${dm.includes('待定') ? 'bg-orange-100 text-orange-700 border border-orange-300 animate-pulse' : 'bg-gray-800 text-white border border-gray-900'}`}>
                      <Crown size={12} className="mr-1.5 opacity-70" />
                      {dm}
                      <button type="button" onClick={() => removeDM(idx)} className="ml-2 hover:text-red-400"><X size={12}/></button>
                  </span>
                  ))}
              </div>
            </div>

            {/* NPC Section */}
            <div>
              <label className="block text-xs font-bold text-green-600 mb-1">NPC (工作人員支援)</label>
              <div className="flex gap-2 mb-2">
                  <input list="npc-list" type="text" placeholder="名字..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 font-bold" value={npcInput} onChange={e => setNpcInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddNPC(); } }} />
                  <datalist id="npc-list">{availableNpcs.map(n => <option key={n} value={n} />)}</datalist>
                  <button type="button" onClick={() => handleAddNPC()} className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-1 rounded-lg text-sm border border-green-200 transition-colors font-black"><Plus size={18}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                  {formData.npcs?.map((npc, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-xl text-sm flex items-center font-bold shadow-sm">
                      <Users size={12} className="mr-1.5 opacity-50" />
                      {npc}
                      <button type="button" onClick={() => removeNPC(idx)} className="ml-2 hover:text-red-500"><X size={12}/></button>
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
                        <button type="button" onClick={() => onDelete(initialData.id!)} className="flex items-center gap-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm font-bold active:scale-95"><Trash2 size={18} /> 確定刪除</button>
                        <button type="button" onClick={() => setIsDeleting(false)} className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium active:scale-95">取消</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => setIsDeleting(true)} className="flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 cursor-pointer active:scale-95 shadow-sm hover:shadow" title="刪除此預約"><Trash2 size={18} /></button>
                )}
                </>
            )}
            
            {!isDeleting && (
                <button type="submit" form="booking-form" className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-larp-primary to-larp-accent text-white font-black py-4 rounded-xl hover:shadow-xl hover:shadow-larp-primary/20 transition-all active:scale-95 shadow-lg text-base">
                <Save size={20} /> {initialData?.id ? '更新場次資料' : '正式送出預約'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
