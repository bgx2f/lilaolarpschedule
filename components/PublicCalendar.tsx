import React, { useEffect, useRef, useState } from 'react';
import { Booking, Room } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Coffee, SearchX, CalendarSearch } from 'lucide-react';
import BookingCard from './BookingCard';
import MiniDatePicker from './MiniDatePicker';

interface PublicCalendarProps {
  currentDate: string; // YYYY-MM-DD
  bookings: Booking[];
  rooms: Room[];
  holidays: string[]; // Receive holidays as prop
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
  
  // State for Custom Date Picker (Used in Empty State)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate all days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to format date string YYYY-MM-DD
  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Filter: Only keep days that have bookings
  const daysWithBookings = allDays.filter(day => {
     const dateStr = getDateString(day);
     return bookings.some(b => b.date === dateStr);
  });

  // Helper to get bookings for a specific day and room
  const getBookingsForDayAndRoom = (dateStr: string, roomId: string) => {
    return bookings
      .filter(b => b.date === dateStr && b.roomId === roomId)
      .sort((a, b) => {
        // Sort by start time
        const timeA = parseInt(a.timeRange.split('-')[0].replace(':', ''));
        const timeB = parseInt(b.timeRange.split('-')[0].replace(':', ''));
        return timeA - timeB;
      });
  };

  // Scroll to selected date or today if visible
  useEffect(() => {
    const targetId = `date-${currentDate}`;
    const element = document.getElementById(targetId);
    
    if (element && scrollRef.current) {
        element.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentDate, year, month, daysWithBookings.length]); 

  const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  // Helper for Header Colors
  const getDateHeaderColor = (dayOfWeek: number, isHoliday: boolean) => {
      if (isHoliday) return 'text-purple-500';
      if (dayOfWeek === 0) return 'text-red-500'; // Sunday
      if (dayOfWeek === 6) return 'text-blue-500'; // Saturday
      return 'text-gray-800';
  };

  const getDayNameColor = (dayOfWeek: number, isHoliday: boolean) => {
      if (isHoliday) return 'text-purple-400';
      if (dayOfWeek === 0) return 'text-red-400';
      if (dayOfWeek === 6) return 'text-blue-400';
      return 'text-gray-500';
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-xl overflow-hidden">
      
      {/* 1. Header (Sticky Top) */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-20 sticky top-0 flex-shrink-0">
        
        {/* Left Side: Title & Navigation */}
        <div className="flex items-center gap-4">
            
            {/* Icon + Title + Nav Buttons */}
            <div className="flex items-center gap-2">
                <span className="bg-larp-primary text-white p-2 rounded-lg shadow-sm">
                    <CalendarIcon size={24} />
                </span>

                {/* Integrated Navigation Title */}
                <div className="flex items-center bg-gray-50 hover:bg-gray-100 rounded-xl p-1 border border-gray-200 transition-colors">
                    <button 
                        onClick={() => onMonthChange(-1)}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-larp-primary transition-all active:scale-95"
                        title="上個月"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-800 px-2 min-w-[130px] text-center select-none leading-none pt-0.5">
                        {year}年 {month + 1}月
                    </h2>

                    <button 
                        onClick={() => onMonthChange(1)}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-larp-primary transition-all active:scale-95"
                        title="下個月"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
        
        {/* Right Side: Summary */}
        <div className="flex items-center gap-3">
            <div className="hidden md:flex text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                本月已有場次：<span className="text-larp-primary font-bold ml-1">{daysWithBookings.length}</span> 天
            </div>
        </div>
      </div>

      {/* 2. Horizontal Scrollable List */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {daysWithBookings.length > 0 ? (
            <div className="flex h-full gap-6">
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
                            className={`
                                flex flex-col bg-white rounded-2xl border transition-all flex-shrink-0 h-full
                                ${isSelected ? 'border-larp-primary shadow-lg scale-[1.01]' : 'border-gray-200 shadow-sm hover:shadow-md'}
                            `}
                        >
                            {/* Date Header (Full Width) */}
                            <div 
                                onClick={() => onDateClick(dateStr)}
                                className={`
                                    px-5 py-3 border-b flex justify-between items-center cursor-pointer group flex-shrink-0
                                    ${isToday ? 'bg-gradient-to-r from-blue-50 to-white' : 'bg-gray-50'}
                                    ${isSelected ? 'bg-blue-50/50' : ''}
                                    rounded-t-2xl
                                `}
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-2xl font-black ${getDateHeaderColor(dayOfWeek, isHoliday)}`}>
                                        {String(month + 1).padStart(2, '0')}/{String(day).padStart(2, '0')}
                                    </span>
                                    <span className={`text-sm font-bold ${getDayNameColor(dayOfWeek, isHoliday)}`}>
                                        {dayOfWeekStr}
                                    </span>
                                    {isToday && <span className="text-[10px] bg-larp-primary text-white px-2 py-0.5 rounded-full font-bold">TODAY</span>}
                                    {isHoliday && <span className="text-[10px] bg-purple-100 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-bold">假日</span>}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex flex-1 divide-x divide-gray-100 overflow-hidden">
                                {rooms.map(room => {
                                    const roomBookings = getBookingsForDayAndRoom(dateStr, room.id);
                                    return (
                                        <div key={room.id} className="w-[300px] flex flex-col flex-shrink-0">
                                            {/* Room Header */}
                                            <div className="py-2 px-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-500 truncate">{room.name}</span>
                                            </div>

                                            {/* Scrollable Bookings for this room */}
                                            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide bg-white">
                                                {roomBookings.length > 0 ? (
                                                    roomBookings.map(booking => (
                                                        <BookingCard 
                                                            key={booking.id} 
                                                            booking={booking} 
                                                            onClick={() => onDateClick(dateStr)}
                                                            readOnly={true} // Disable hover edit effects
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-gray-400">空</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            // No bookings in the entire month
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <SearchX size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-600">本月尚無任何預約</h3>
                <p className="text-sm mt-2">請切換月份或至管理後台新增場次</p>
                <div className="mt-4 relative">
                    <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <CalendarSearch size={16} /> 快速跳轉日期
                    </button>
                    {/* Custom Popover Date Picker in Empty State */}
                    {showDatePicker && onDateChange && (
                        <MiniDatePicker 
                            initialDate={currentDate}
                            bookings={bookings}
                            holidays={holidays}
                            onSelect={(date) => {
                                onDateChange(date);
                            }}
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