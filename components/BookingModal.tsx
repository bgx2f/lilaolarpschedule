
import React, { useState, useEffect } from 'react';
import { Booking, Room, SlotType } from '../types';
import { X, Save, Trash2, AlertCircle, Plus, Check } from 'lucide-react';

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
  availableNpcs
}) => {
  const [formData, setFormData] = useState<Partial<Booking>>({
    roomId: rooms[0]?.id || '',
    timeRange: '',
    scriptName: '',
    dms: [],
    npcs: [],
    depositAmount: 0,
    organizerName: '',
    date: selectedDate
  });

  const [dmInput, setDmInput] = useState('');
  const [npcInput, setNpcInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // New state for delete confirmation

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsDeleting(false); // Reset delete state on open
      if (initialData?.id) {
        setFormData({ 
            dms: [], 
            npcs: [], 
            ...initialData 
        });
      } else {
        setFormData({
          roomId: initialData?.roomId || rooms[0]?.id || '',
          timeRange: '13:00-17:00', // Default placeholder
          scriptName: '',
          dms: [],
          npcs: [],
          depositAmount: 0,
          organizerName: '',
          date: selectedDate, // Default to currently viewed date
          ...initialData 
        });
      }
      setDmInput('');
      setNpcInput('');
    }
  }, [isOpen, initialData, selectedDate, rooms]);

  if (!isOpen) return null;

  const handleAddDM = (nameOverride?: string) => {
    const name = nameOverride || dmInput.trim();
    if (name) {
      // Allow duplicates ONLY if the name is '待定'
      if (name !== '待定' && formData.dms?.includes(name)) {
         if (nameOverride) {
             setFormData(prev => ({ ...prev, dms: prev.dms?.filter(d => d !== name) }));
         } else {
             alert(`${name} 已經在名單中了`);
         }
         return;
      }
      setFormData(prev => ({ ...prev, dms: [...(prev.dms || []), name] }));
      if (!nameOverride) setDmInput('');
    }
  };

  const handleAddNPC = (nameOverride?: string) => {
    const name = nameOverride || npcInput.trim();
    if (name) {
      if (name !== '待定' && formData.npcs?.includes(name)) {
          if (nameOverride) {
              setFormData(prev => ({ ...prev, npcs: prev.npcs?.filter(n => n !== name) }));
          } else {
              alert(`${name} 已經在名單中了`);
          }
         return;
      }
      setFormData(prev => ({ ...prev, npcs: [...(prev.npcs || []), name] }));
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
    if (startMinutes >= 19 * 60) return SlotType.EVENING;
    return SlotType.EVENING; 
  };

  const checkOverlap = (targetDate: string, newRoomId: string, newTimeRange: string, currentId?: string): boolean => {
    const parts = newTimeRange.split('-');
    if (parts.length !== 2) return false;

    const startNew = parseTime(parts[0].trim());
    const endNew = parseTime(parts[1].trim());

    const relevantBookings = allBookings.filter(b => 
        b.date === targetDate && 
        b.roomId === newRoomId && 
        b.id !== currentId
    );

    for (const booking of relevantBookings) {
      const [bStartStr, bEndStr] = booking.timeRange.split('-');
      const startExisting = parseTime(bStartStr);
      const endExisting = parseTime(bEndStr);

      if (startNew < endExisting && endNew > startExisting) {
        return true;
      }
    }
    return false;
  };

  const checkPersonnelConflicts = (
    targetDate: string,
    newTimeRange: string,
    dms: string[],
    npcs: string[],
    currentId?: string
  ): string[] => {
    const parts = newTimeRange.split('-');
    if (parts.length !== 2) return [];

    const startNew = parseTime(parts[0].trim());
    const endNew = parseTime(parts[1].trim());

    const conflicts: string[] = [];
    const dayBookings = allBookings.filter(b => b.date === targetDate && b.id !== currentId);

    for (const booking of dayBookings) {
      const [bStartStr, bEndStr] = booking.timeRange.split('-');
      const startExisting = parseTime(bStartStr);
      const endExisting = parseTime(bEndStr);

      if (startNew < endExisting && endNew > startExisting) {
         const conflictingDMs = dms.filter(dm => booking.dms.includes(dm) && dm !== '待定' && dm !== '?');
         if (conflictingDMs.length > 0) {
             conflicts.push(`主持人衝突: ${conflictingDMs.join(', ')} (已在 ${booking.timeRange} ${booking.scriptName})`);
         }

         const conflictingNPCs = npcs.filter(npc => booking.npcs.includes(npc) && npc !== '待定' && npc !== '?');
         if (conflictingNPCs.length > 0) {
             conflicts.push(`NPC衝突: ${conflictingNPCs.join(', ')} (已在 ${booking.timeRange} ${booking.scriptName})`);
         }
      }
    }
    return conflicts;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.date) { setError('請選擇日期 (Date is required)'); return; }
    if (!formData.roomId) { setError('請選擇場館 (Room is required)'); return; }
    if (!formData.timeRange || !formData.timeRange.includes('-')) { setError('請輸入正確的時間範圍 eg. 13:00-17:00'); return; }
    if (!formData.scriptName) { setError('請輸入劇本名稱 (Script is required)'); return; }
    if (!formData.organizerName) { setError('請輸入主揪姓名 (Organizer is required)'); return; }
    if (formData.depositAmount === undefined || formData.depositAmount === null) { setError('請輸入訂金金額，未付請填0'); return; }
    if (!formData.dms || formData.dms.length === 0) { setError('請至少填寫一位主持人 (DM is required)'); return; }

    // 1. Calculate Slot First
    const calculatedSlot = calculateSlot(formData.timeRange);

    // 2. Check Script Conflict (New Rule: Prevent same script in same slot on same day)
    const isScriptDuplicated = allBookings.some(b => 
      b.date === formData.date && 
      b.slot === calculatedSlot && 
      b.scriptName === formData.scriptName && 
      b.id !== formData.id
    );

    if (isScriptDuplicated) {
      setError(`❌ 劇本衝突！\n${formData.date} ${calculatedSlot} 已有「${formData.scriptName}」。\n為了確保體驗或資源分配，同個時段禁止開設重複劇本。`);
      return;
    }

    // 3. Check Room Overlap
    const isOverlapping = checkOverlap(formData.date, formData.roomId, formData.timeRange, formData.id);
    if (isOverlapping) {
      setError(`❌ 場地衝突！${formData.date} 該場館此時段已有預約。`);
      return;
    }

    // 4. Check Personnel Conflict
    const personnelConflicts = checkPersonnelConflicts(
        formData.date, 
        formData.timeRange, 
        formData.dms, 
        formData.npcs || [], 
        formData.id
    );

    if (personnelConflicts.length > 0) {
        setError(`❌ 人員調度衝突！\n${personnelConflicts.join('\n')}`);
        return;
    }
    
    const finalData = {
      ...formData,
      slot: calculatedSlot,
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as Booking;

    onSave(finalData);
    onClose();
  };

  // --- DELETE LOGIC ---
  const handleTrashClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true); // Enter confirmation mode
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const idToDelete = initialData?.id;
    if (idToDelete) {
        onDelete(idToDelete);
    } else {
        setError('錯誤：找不到預約 ID，無法刪除');
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(false); // Revert to normal mode
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
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

        {/* --- VIEW: EDIT FORM --- */}
        <div className="flex-1 overflow-y-auto p-6">
            <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm font-bold border border-red-100 whitespace-pre-line animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>{error}</div>
                </div>
            )}

            {/* Date & Room */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">日期 Date <span className="text-red-500">*</span></label>
                    <input 
                        type="date"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">場館 Room <span className="text-red-500">*</span></label>
                    <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none"
                    value={formData.roomId}
                    onChange={e => setFormData({...formData, roomId: e.target.value})}
                    >
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Time & Script */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">時間 Time Range <span className="text-red-500">*</span></label>
                <input 
                    type="text"
                    placeholder="eg. 13:00-17:00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-mono"
                    value={formData.timeRange}
                    onChange={e => setFormData({...formData, timeRange: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-1">格式: HH:MM-HH:MM (系統自動分類)</p>
                </div>
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">劇本 Script <span className="text-red-500">*</span></label>
                <input 
                    list="scripts"
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none font-bold"
                    value={formData.scriptName}
                    onChange={e => setFormData({...formData, scriptName: e.target.value})}
                    placeholder="輸入或選擇劇本..."
                />
                <datalist id="scripts">
                    {availableScripts.map(s => <option key={s} value={s} />)}
                </datalist>
                </div>
            </div>

            {/* Deposit & Organizer */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">訂金 Deposit ($) <span className="text-red-500">*</span></label>
                <input 
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-primary outline-none"
                    value={formData.depositAmount}
                    onChange={e => setFormData({...formData, depositAmount: parseInt(e.target.value) || 0})}
                />
                </div>
                <div>
                <label className="block text-xs font-bold text-larp-accent mb-1">主揪 Organizer <span className="text-red-500">*</span></label>
                <input 
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-larp-accent outline-none"
                    value={formData.organizerName}
                    onChange={e => setFormData({...formData, organizerName: e.target.value})}
                />
                </div>
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* DMs */}
            <div>
            <label className="block text-xs font-bold text-yellow-600 mb-1">主持人 DM <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-2">
                <input 
                type="text" 
                placeholder="輸入DM名字" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-yellow-500"
                value={dmInput}
                onChange={e => setDmInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDM())}
                />
                <button type="button" onClick={() => handleAddDM()} className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg text-sm border border-yellow-200 transition-colors"><Plus size={16}/></button>
            </div>
            
            {availableDms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                    <span className="text-[10px] text-gray-400 w-full font-bold">快速點選:</span>
                    {availableDms.map(dm => {
                        const isSelected = formData.dms?.includes(dm);
                        return (
                            <button
                                type="button"
                                key={dm}
                                onClick={() => handleAddDM(dm)}
                                className={`px-2 py-1 text-xs rounded border transition-all ${isSelected ? 'bg-yellow-500 text-white border-yellow-600 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-yellow-400'}`}
                            >
                                {dm}
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex flex-wrap gap-2 min-h-[30px]">
                {formData.dms?.map((dm, idx) => (
                <span key={idx} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-sm flex items-center font-medium">
                    {dm}
                    <button type="button" onClick={() => removeDM(idx)} className="ml-2 hover:text-red-500 text-yellow-400"><X size={12}/></button>
                </span>
                ))}
            </div>
            </div>

            {/* NPCs */}
            <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">NPC (選填)</label>
            <div className="flex gap-2 mb-2">
                <input 
                type="text" 
                placeholder="輸入NPC名字" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-500"
                value={npcInput}
                onChange={e => setNpcInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNPC())}
                />
                <button type="button" onClick={() => handleAddNPC()} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-lg text-sm border border-gray-300 transition-colors"><Plus size={16}/></button>
            </div>

            {availableNpcs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                    <span className="text-[10px] text-gray-400 w-full font-bold">快速點選:</span>
                    {availableNpcs.map(npc => {
                        const isSelected = formData.npcs?.includes(npc);
                        return (
                            <button
                                type="button"
                                key={npc}
                                onClick={() => handleAddNPC(npc)}
                                className={`px-2 py-1 text-xs rounded border transition-all ${isSelected ? 'bg-gray-600 text-white border-gray-700 shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                            >
                                {npc}
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {formData.npcs?.map((npc, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-1 rounded text-sm flex items-center">
                    {npc}
                    <button type="button" onClick={() => removeNPC(idx)} className="ml-2 hover:text-red-500 text-gray-400"><X size={12}/></button>
                </span>
                ))}
            </div>
            </div>

            </form>
        </div>
        
        {/* Footer with Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between gap-3 shrink-0 z-20">
            {initialData?.id && (
                <>
                {isDeleting ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200 flex-1">
                        <button 
                            type="button" 
                            onClick={handleConfirmDelete}
                            className="flex items-center gap-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm font-bold active:scale-95"
                        >
                            <Trash2 size={18} /> 確認刪除
                        </button>
                        <button 
                            type="button" 
                            onClick={handleCancelDelete}
                            className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium active:scale-95"
                        >
                            取消
                        </button>
                    </div>
                ) : (
                    <button 
                    type="button" 
                    onClick={handleTrashClick}
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 cursor-pointer active:scale-95 shadow-sm hover:shadow"
                    title="刪除此預約"
                    >
                    <Trash2 size={18} />
                    </button>
                )}
                </>
            )}
            
            {/* Save Button (Hide if deleting to prevent confusion) */}
            {!isDeleting && (
                <button 
                type="submit" 
                form="booking-form"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-larp-primary to-larp-accent text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-larp-primary/20 transition-all active:scale-95 shadow-md"
                >
                <Save size={18} />
                {initialData?.id ? '儲存變更' : '建立預約'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
