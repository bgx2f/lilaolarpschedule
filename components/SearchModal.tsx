
import React, { useState, useMemo } from 'react';
import { X, Search, Calendar, MapPin, User, Crown, Clock, CheckCircle2, AlertCircle, CalendarSearch, Filter, ChevronDown, Globe } from 'lucide-react';
import { Booking, Room, SlotType } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
  onNavigate: (date: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, bookings, rooms, onNavigate }) => {
  const [searchMode, setSearchMode] = useState<'existing' | 'availability'>('existing');
  const [keyword, setKeyword] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [searchAllTime, setSearchAllTime] = useState(false);
  
  // 自由選擇年月 (預設為當月)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 1. 搜尋現有預約 (增加全期搜尋開關)
  const filteredBookings = useMemo(() => {
    const lower = keyword.toLowerCase();
    return bookings.filter(b => {
      // 如果不是全期搜尋，則過濾月份
      const matchesMonth = searchAllTime || b.date.startsWith(selectedMonth);
      
      const matchesKeyword = !keyword.trim() || (
        b.scriptName.toLowerCase().includes(lower) ||
        b.organizerName.toLowerCase().includes(lower) ||
        b.dms.some(dm => dm.toLowerCase().includes(lower)) ||
        b.npcs.some(npc => npc.toLowerCase().includes(lower)) ||
        (b.notes && b.notes.toLowerCase().includes(lower))
      );
      return matchesMonth && matchesKeyword;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, keyword, selectedMonth, searchAllTime]);

  // 2. 搜尋空位 (搜尋指定月份的全月空位)
  const availableSlots = useMemo(() => {
    if (searchMode !== 'availability') return [];
    
    const results: { date: string, slot: SlotType }[] = [];
    const [year, month] = selectedMonth.split('-').map(Number);
    // 獲取該月正確天數
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      Object.values(SlotType).forEach(slot => {
        const isOccupied = bookings.some(b => b.date === dateStr && b.roomId === selectedRoomId && b.slot === slot);
        if (!isOccupied) {
          results.push({ date: dateStr, slot });
        }
      });
    }
    return results;
  }, [bookings, selectedRoomId, searchMode, selectedMonth]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <CalendarSearch className="text-larp-primary" /> 智慧班表搜尋
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-gray-200/50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setSearchMode('existing')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${searchMode === 'existing' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search size={16}/> 預約紀錄
            </button>
            <button 
              onClick={() => setSearchMode('availability')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${searchMode === 'availability' ? 'bg-white text-larp-primary shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MapPin size={16}/> 空位查詢
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-3">
             {/* Month Picker - 使用原生 month input 實現自由選擇 */}
             <div className={`relative md:w-52 transition-opacity ${searchAllTime && searchMode === 'existing' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input 
                   type="month"
                   value={selectedMonth}
                   onChange={e => setSelectedMonth(e.target.value)}
                   className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-larp-primary font-bold text-gray-800 shadow-sm cursor-pointer"
                />
             </div>

             {searchMode === 'existing' ? (
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="輸入關鍵字..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-larp-primary font-medium shadow-sm"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                  />
                </div>
             ) : (
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-larp-primary font-bold text-gray-800 appearance-none shadow-sm cursor-pointer"
                    value={selectedRoomId}
                    onChange={e => setSelectedRoomId(e.target.value)}
                  >
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
             )}
          </div>

          {/* New: All Time Toggle for Keyword Search */}
          {searchMode === 'existing' && (
              <div className="flex items-center gap-3 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${searchAllTime ? 'bg-larp-primary' : 'bg-gray-300'}`}>
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={searchAllTime} 
                            onChange={() => setSearchAllTime(!searchAllTime)} 
                          />
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${searchAllTime ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-600 group-hover:text-larp-primary transition-colors flex items-center gap-1">
                          <Globe size={12} /> 搜尋所有月份 (包含歷史紀錄)
                      </span>
                  </label>
              </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
          {searchMode === 'existing' ? (
            <div className="space-y-3">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => { onNavigate(b.date); onClose(); }}
                    className="p-5 border border-gray-100 rounded-3xl hover:border-larp-primary hover:bg-blue-50/40 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-black text-gray-900 text-xl group-hover:text-larp-primary transition-colors">{b.scriptName}</span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black bg-larp-primary text-white px-3 py-1 rounded-full mb-1">{b.date}</span>
                        <span className="text-[10px] font-bold text-gray-400">{b.slot}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl"><Clock size={14} className="text-larp-primary"/> {b.timeRange}</div>
                      <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl text-teal-600"><MapPin size={14}/> {rooms.find(r => r.id === b.roomId)?.name}</div>
                      <div className="flex items-center gap-2 bg-yellow-50/50 p-2 rounded-xl text-yellow-700"><Crown size={14}/> {b.dms.join(', ')}</div>
                      <div className="flex items-center gap-2 bg-purple-50/50 p-2 rounded-xl text-larp-accent"><User size={14}/> 主揪: {b.organizerName}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 text-gray-400">
                  <Search size={64} className="mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-bold">查無相關結果</p>
                  <p className="text-xs mt-1">請嘗試修改關鍵字或開啟全期搜尋</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { onNavigate(slot.date); onClose(); }}
                    className="p-4 border border-green-100 bg-green-50/20 rounded-2xl hover:bg-green-100 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-between shadow-sm group"
                  >
                    <div>
                      <div className="text-sm font-black text-green-900">{slot.date}</div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${
                         slot.slot === SlotType.MORNING ? 'bg-blue-100 text-blue-600' :
                         slot.slot === SlotType.AFTERNOON ? 'bg-orange-100 text-orange-600' :
                         'bg-indigo-100 text-indigo-600'
                      }`}>
                         {slot.slot}
                      </div>
                    </div>
                    <CheckCircle2 size={24} className="text-green-500 group-hover:scale-110 transition-transform" />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-24 text-gray-400">
                  <AlertCircle size={64} className="mx-auto mb-4 opacity-10" />
                  <p className="text-lg font-bold">此月份已無任何空位</p>
                  <p className="text-xs mt-1">請嘗試切換至其他月份或場館</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Filter size={12}/> {searchMode === 'existing' ? '搜尋模式：預約紀錄' : '搜尋模式：空位查詢'}
           </div>
           <div className="text-[10px] font-black text-larp-primary uppercase tracking-widest">
              找到 {searchMode === 'existing' ? filteredBookings.length : availableSlots.length} 個結果
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
