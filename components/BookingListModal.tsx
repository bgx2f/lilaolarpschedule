import React, { useState, useMemo } from 'react';
import { Booking, Room } from '../types';
import { X, Search, Edit2, Trash2, Calendar, MapPin, Clock, User, Download, List } from 'lucide-react';

interface BookingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

const BookingListModal: React.FC<BookingListModalProps> = ({
  isOpen,
  onClose,
  bookings,
  rooms,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort bookings by date (descending) then time
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.timeRange.localeCompare(b.timeRange);
    });
  }, [bookings]);

  // Filter bookings based on search term
  const filteredBookings = useMemo(() => {
    if (!searchTerm) return sortedBookings;
    const lowerTerm = searchTerm.toLowerCase();
    
    return sortedBookings.filter(b => 
      b.scriptName.toLowerCase().includes(lowerTerm) ||
      b.organizerName.toLowerCase().includes(lowerTerm) ||
      b.date.includes(lowerTerm) ||
      (b.dms && b.dms.some(dm => dm.toLowerCase().includes(lowerTerm)))
    );
  }, [sortedBookings, searchTerm]);

  // Helper to get room name
  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  // --- Actions ---

  const handleExportCSV = () => {
    // 1. Define Headers
    const headers = ['日期', '時間', '場館', '劇本名稱', '主揪', '主持人', 'NPC', '訂金', '備註'];
    
    // 2. Format Data
    const rows = filteredBookings.map(b => [
        b.date,
        b.timeRange,
        `"${getRoomName(b.roomId)}"`, // Quote to handle potential commas
        `"${b.scriptName}"`,
        `"${b.organizerName}"`,
        `"${(b.dms || []).join(', ')}"`,
        `"${(b.npcs || []).join(', ')}"`,
        b.depositAmount,
        `"${b.notes || ''}"`
    ]);

    // 3. Construct CSV Content (Add BOM \uFEFF for Excel Chinese support)
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

    // 4. Trigger Download
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
             {/* Export CSV Button */}
            <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm shadow-sm"
                title="匯出 CSV"
            >
                <Download size={16} />
                <span className="hidden md:inline">匯出 CSV</span>
            </button>

            {/* Close */}
            <button 
                onClick={onClose}
                className="p-2 ml-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
            >
                <X size={24} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
            type="text"
            placeholder="搜尋劇本、主揪、日期或主持人..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-larp-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
            
          {/* MODE: LIST */}
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
                <th className="pb-3 font-bold w-24 text-right pr-2">操作</th>
            </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-50">
            {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50/50 transition-colors group">
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
                                <span key={idx} className={`text-xs px-1.5 py-0.5 rounded ${dm.includes('待定') ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
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
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => onEdit(booking)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="編輯"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm(`確定要刪除「${booking.scriptName}」的預約嗎？`)) {
                                    onDelete(booking.id);
                                }
                            }}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="刪除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
                </tr>
            ))}
            
            {filteredBookings.length === 0 && (
                <tr>
                    <td colSpan={8} className="py-10 text-center text-gray-400">
                        查無資料
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