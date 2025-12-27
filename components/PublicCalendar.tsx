
import React, { useEffect, useRef, useState } from 'react';
import { Booking, Room, SlotType } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, SearchX, CalendarSearch, Clock, MapPin } from 'lucide-react';
import BookingCard from './BookingCard';
import MiniDatePicker from './MiniDatePicker';

interface PublicCalendarProps {
  currentDate: string; // YYYY-MM-DD
  bookings: Booking[];
  rooms: Room[];
  holidays: string[];
  onDateClick: (date: string) => void;
  onMonthChange: (increment: number) => void;
  onDateChange?: (newDate: string) => void;
}

const PublicCalendar: React.FC<PublicCalendarProps> = ({ 
  currentDate, 
  bookings, 
  rooms, 
  holidays,
  onDateClick,
  onMonthChange,
  onDateChange
}) => {
  const dateObj = new Date(currentDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const daysWithBookings = allDays.filter(day => {
     const dateStr = getDateString(day);
     return bookings.some(b => b.date === dateStr);
  });

  const getBookingsForDayRoomSlot = (dateStr: string, roomId: string, slot: SlotType) => {
    return bookings.filter(b => b.date === dateStr && b.roomId === roomId && b.slot === slot);
  };

  useEffect(() => {
    const targetId = `date-${currentDate}`;
    const element = document.getElementById(targetId);
    if (element && scrollRef.current) {
        element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentDate, year, month, daysWithBookings.length]); 

  const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  const getDateHeaderColor = (dayOfWeek: number, isHoliday: boolean) => {
      if (isHoliday) return 'text-purple-600';
      if (dayOfWeek === 0) return 'text-red-600';
      if (dayOfWeek === 6) return 'text-blue-600';
      return 'text-gray-900';
  };

  const getDayNameColor = (dayOfWeek: number, isHoliday: boolean) => {
      if (isHoliday) return 'text-purple-400';
      if (dayOfWeek === 0) return 'text-red-400';
      if (dayOfWeek === 6) return 'text-blue-400';
      return 'text-gray-500';
  };

  const getSlotTheme = (slot: SlotType) => {
      switch (slot) {
          case SlotType.MORNING: 
            return { 
              text: 'text-blue-600', 
              bg: 'bg-transparent',
              labelBg: 'bg-blue-50', 
              border: 'border-blue-100', 
              accent: 'bg-blue-500' 
            };
          case SlotType.AFTERNOON: 
            return { 
              text: 'text-orange-600', 
              bg: 'bg-transparent',
              labelBg: 'bg-orange-50', 
              border: 'border-orange-100', 
              accent: 'bg-orange-500' 
            };
          case SlotType.EVENING: 
            return { 
              text: 'text-indigo-600', 
              bg: 'bg-transparent',
              labelBg: 'bg-indigo-50', 
              border: 'border-indigo-100', 
              accent: 'bg-indigo-500' 
            };
          default: 
            return { 
              text: 'text-gray-600', 
              bg: 'bg-transparent', 
              labelBg: 'bg-gray-50', 
              border: 'border-gray-200', 
              accent: 'bg-gray-400' 
            };
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl overflow-hidden shadow-inner w-full">
      
      {/* 1. Header (Sticky Top) - 縮小高度並移除切換按鈕 */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="bg-teal-600 text-white p-1.5 rounded-lg shadow-sm">
                    <CalendarIcon size={18} />
                </span>
                <div className="flex items-center bg-gray-50 rounded-lg py-1 px-4 border border-gray-200 shadow-inner">
                    <h2 className="text-base font-black text-gray-900 min-w-[100px] text-center select-none tracking-tight">
                        {year}年 {month + 1}月
                    </h2>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden lg:flex text-[10px] text-gray-600 font-bold bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                活動日期：<span className="text-teal-600 font-black ml-1 text-xs">{daysWithBookings.length}</span>
            </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable List for Dates */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto p-3 pb-12 scroll-smooth no-scrollbar w-full">
        {daysWithBookings.length > 0 ? (
            <div className="flex h-full gap-4 w-full">
                {daysWithBookings.map((day) => {
                    const dateStr = getDateString(day);
                    const currentDayObj = new Date(dateStr);
                    const dayOfWeek = currentDayObj.getDay();
                    const dayOfWeekStr = weekDays[dayOfWeek];
                    
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    const isSelected = currentDate === dateStr;
                    const isHoliday = holidays.includes(dateStr);
                    
                    return (
                        <div 
                            key={dateStr} 
                            id={`date-${dateStr}`}
                            className={`flex flex-col bg-white rounded-[2.5rem] border transition-all flex-shrink-0 h-full overflow-hidden ${isSelected ? 'border-teal-500 shadow-lg scale-[1.005] z-10' : 'border-gray-200 shadow-sm'}`}
                        >
                            {/* Date Header - 縮小標頭空間 */}
                            <div 
                                onClick={() => onDateClick(dateStr)}
                                className={`px-6 py-3.5 border-b flex justify-between items-center cursor-pointer group flex-shrink-0 ${isToday ? 'bg-teal-50/50' : 'bg-gray-50/80'}`}
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-2xl font-black tracking-tight ${getDateHeaderColor(dayOfWeek, isHoliday)}`}>
                                        {String(month + 1).padStart(2, '0')}/{String(day).padStart(2, '0')}
                                    </span>
                                    <span className={`text-sm font-black uppercase tracking-wider ${getDayNameColor(dayOfWeek, isHoliday)}`}>
                                        {dayOfWeekStr}
                                    </span>
                                    {isToday && <span className="text-[9px] bg-teal-600 text-white px-2 py-1 rounded-full font-black shadow-sm uppercase tracking-wider ml-1">Today</span>}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-auto relative bg-white no-scrollbar">
                                
                                {/* Room Names Header (Row) - 縮小房間標籤空間 */}
                                <div className="flex sticky top-0 z-20 shadow-sm">
                                    <div className="w-[70px] flex-shrink-0 bg-gray-100 border-b border-r border-gray-200 sticky left-0 z-30"></div>
                                    {rooms.map(room => (
                                        <div key={room.id} className="w-[320px] flex-shrink-0 py-3 px-6 bg-gray-100 border-b border-r border-gray-200 flex items-center justify-center gap-1.5">
                                            <MapPin size={14} className="text-teal-600 opacity-60" />
                                            <span className="text-xs font-black text-gray-700 uppercase tracking-widest truncate">{room.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Slot Rows */}
                                {Object.values(SlotType).map(slot => {
                                    const theme = getSlotTheme(slot);
                                    return (
                                        <div key={slot} className={`flex min-w-max border-b-2 border-dashed border-gray-200 last:border-0 group/slot bg-white`}>
                                            
                                            {/* LEFT STICKY SLOT LABEL - 縮小寬度 */}
                                            <div className={`w-[70px] flex-shrink-0 sticky left-0 z-10 border-r border-gray-200 flex items-center justify-center shadow-sm bg-white group-hover/slot:bg-gray-50/50 transition-colors`}>
                                                <div className={`vertical-rl py-8 px-2 flex items-center justify-center gap-2 font-black text-base tracking-[0.3em] uppercase transition-all`}>
                                                    <div className={`w-full h-full absolute inset-0 opacity-40 ${theme.labelBg}`}></div>
                                                    <span className={`w-2 h-2 rounded-full ${theme.accent} mb-3 shadow-sm`}></span>
                                                    <span className={`${theme.text}`}>{slot}</span>
                                                </div>
                                            </div>

                                            {/* ROOM CELLS */}
                                            {rooms.map(room => {
                                                const slotBookings = getBookingsForDayRoomSlot(dateStr, room.id, slot);
                                                return (
                                                    <div key={room.id} className="w-[320px] flex-shrink-0 p-5 min-h-[250px] border-r border-gray-100 last:border-r-0 transition-all h-full bg-white group-hover/slot:bg-gray-50/30">
                                                        {slotBookings.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {slotBookings.map(booking => (
                                                                    <BookingCard 
                                                                        key={booking.id} 
                                                                        booking={booking} 
                                                                        onClick={() => onDateClick(dateStr)}
                                                                        readOnly={true}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="h-full min-h-[180px] border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center opacity-40 transition-all group-hover/slot:border-gray-200">
                                                                <span className="text-[9px] font-black text-gray-300 tracking-[0.3em] uppercase">無預約</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-[1.5rem] flex items-center justify-center mb-5 shadow-inner">
                    <SearchX size={40} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-700">此月份尚無任何預約記錄</h3>
                <p className="text-xs mt-1 font-medium">請選擇其他月份，或進入後台進行場次排定</p>
                <div className="mt-6 relative">
                    <button onClick={() => setShowDatePicker(!showDatePicker)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2 active:scale-95">
                        <CalendarSearch size={16} /> 快速挑選日期
                    </button>
                    {showDatePicker && onDateChange && (
                        <MiniDatePicker 
                            initialDate={currentDate}
                            bookings={bookings}
                            holidays={holidays}
                            onSelect={(date) => onDateChange(date)}
                            onClose={() => setShowDatePicker(false)}
                            allowEmpty={true}
                        />
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PublicCalendar;
