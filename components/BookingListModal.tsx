
import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Room } from '../types';
import { X, Search, Edit2, Trash2, Calendar, MapPin, Clock, User, Download, Check, AlertTriangle, Filter } from 'lucide-react';

interface BookingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  forcePendingFilter?: boolean;
}

const BookingListModal: React.FC<BookingListModalProps> = ({
  isOpen,
  onClose,
  bookings,
  rooms,
  onEdit,
  onDelete,
  forcePendingFilter = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(forcePendingFilter);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Update local toggle when prop changes
  useEffect(() => {
    if (isOpen) {
        setShowOnlyPending(forcePendingFilter);
    }
  }, [isOpen, forcePendingFilter]);

  // Sort bookings by date (descending) then time
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.timeRange.localeCompare(b.timeRange);
    });
  }, [bookings]);

  // Filter bookings based on search term and pending toggle
  const filteredBookings = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    
    return sortedBookings.filter(b => {
      const matchesSearch = !searchTerm || (
        b.scriptName.toLowerCase().includes(lowerTerm) ||
        b.organizerName.toLowerCase().includes(lowerTerm) ||
        b.date.includes(lowerTerm) ||
        (b.dms && b.dms.some(dm => dm.toLowerCase().includes(lowerTerm)))
      );

      const isPending = (b.dms && b.dms.some(dm => dm.includes('待定'))) || 
                        (b.npcs && b.npcs.some(npc => npc.includes('待定')));
      
      const matchesPending = !showOnlyPending || isPending;

      return matchesSearch && matchesPending;
    });
  }, [sortedBookings, searchTerm, showOnlyPending]);

  // Helper to get room name
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  // --- Actions ---

  const handleExportCSV = () => {
    const headers = ['日期', '時間', '場館', '劇本名稱', '主揪', '主持人', 'NPC', '訂金', '備註'];
    const rows = filteredBookings.map(b => [
        b.date,
        b.timeRange,
        `"${getRoomName(b.roomId)}"`, 
        `"${b.scriptName}"`,
        `"${b.organizerName}"`,
        `"${(b.dms || []).join(', ')}"`,
        `"${(b.npcs || []).join(', ')}"`,
        b.depositAmount,
        `"${b.notes || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LARP_Schedule_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
                預約總表列表
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                共 {bookings.length} 筆資料
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm shadow-sm"
                title="匯出 CSV"
            >
                <Download size={16} />
                <span className="hidden md:inline">匯出 CSV</span>
            </button>

            <button 
                type="button"
                onClick={onClose}
                className="p-2 ml-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Quick Filter */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text"
                    placeholder="搜尋劇本、主揪、日期或主持人..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-larp-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button 
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${showOnlyPending ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
                <AlertTriangle size={16} />
                僅顯示待定場次
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-left border-collapse">
            <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pl-2 font-bold w-32">日期</th>
                <th className="pb-3 font-bold w-32">時間</th>
                <th className="pb-3 font-bold w-40">場館</th>
                <th className="pb-3 font-bold">劇本名稱</th>
                <th className="pb-3 font-bold w-32">主揪</th>
                <th className="pb-3 font-bold w-24">主持人</th>
                <th className="pb-3 font-bold w-20 text-center">訂金</th>
                <th className="pb-3 font-bold w-32 text-right pr-2">操作</th>
            </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
            {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="py-3 pl-2">
                    <div className="flex items-center gap-2 font-medium">
                        <Calendar size={14} className="text-gray-400" />
                        {booking.date}
                    </div>
                </td>
                <td className="py-3">
                    <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        {booking.timeRange}
                    </div>
                </td>
                <td className="py-3 text-gray-600">
                    <div className="flex items-center gap-1" title={getRoomName(booking.roomId)}>
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate max-w-[140px] block">{getRoomName(booking.roomId)}</span>
                    </div>
                </td>
                <td className="py-3 font-bold text-gray-900">{booking.scriptName}</td>
                <td className="py-3">
                    <div className="flex items-center gap-1 text-larp-accent">
                        <User size={14} />
                        {booking.organizerName}
                    </div>
                </td>
                <td className="py-3">
                    {booking.dms && booking.dms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {booking.dms.map((dm, idx) => (
                                <span key={idx} className={`text-xs px-1.5 py-0.5 rounded shadow-sm font-bold ${dm.includes('待定') ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                    {dm}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-xs italic">無</span>
                    )}
                </td>
                <td className="py-3 text-center">
                    {booking.depositAmount > 0 ? (
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full text-xs">${booking.depositAmount}</span>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                </td>
                <td className="py-3 text-right pr-2">
                    {deleteConfirmId === booking.id ? (
                         <div className="flex items-center justify-end gap-2 animate-in slide-in-from-right duration-200">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(booking.id);
                                    setDeleteConfirmId(null);
                                }}
                                className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                <Check size={14} /> 確認
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                }}
                                className="flex items-center gap-1 px-2 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                            >
                                <X size={14} /> 取消
                            </button>
                         </div>
                    ) : (
                        <div className="flex items-center justify-end gap-2 relative z-10">
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(booking);
                                }}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                                title="編輯"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(booking.id);
                                }}
                                className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors cursor-pointer"
                                title="刪除"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </td>
                </tr>
            ))}
            
            {filteredBookings.length === 0 && (
                <tr>
                    <td colSpan={8} className="py-20 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                            <Filter size={48} className="mb-2 opacity-10" />
                            <p className="text-lg font-bold">查無資料</p>
                            {showOnlyPending && <p className="text-xs">目前沒有任何人員待定的場次</p>}
                        </div>
                    </td>
                </tr>
            )}
            </tbody>
            </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl text-right text-xs text-gray-500">
            顯示 {filteredBookings.length} 筆預約 (共 {bookings.length} 筆)
        </div>
      </div>
    </div>
  );
};

export default BookingListModal;
