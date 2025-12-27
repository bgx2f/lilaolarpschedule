import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../types';

interface MiniDatePickerProps {
  initialDate: string;
  bookings: Booking[];
  holidays: string[]; // Receive holidays as prop
  onSelect: (date: string) => void;
  onClose: () => void;
  allowEmpty?: boolean; // New prop to allow selecting any date
}

const MiniDatePicker: React.FC<MiniDatePickerProps> = ({ 
  initialDate, 
  bookings, 
  holidays,
  onSelect, 
  onClose, 
  allowEmpty = false 
}) => {
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // Check if today is in the currently viewed month for the legend
  const todayDate = new Date();
  const isTodayInCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  // Helper to check if a specific date has bookings
  const checkAvailability = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
    
    const hasBooking = bookings.some(b => b.date === dateStr);
    const isSelected = initialDate === dateStr;
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    const isHoliday = holidays.includes(dateStr);
    
    return { dateStr, hasBooking, isSelected, isToday, dayOfWeek, isHoliday };
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // Helper for text colors
  const getDayTextColor = (dayOfWeek: number, isHoliday: boolean, isDisabled: boolean) => {
    if (isDisabled) return 'text-gray-300';
    if (isHoliday) return 'text-purple-400 font-bold'; // Holiday Purple
    if (dayOfWeek === 0) return 'text-red-400 font-bold'; // Sunday Red
    if (dayOfWeek === 6) return 'text-blue-400 font-bold'; // Saturday Blue
    return 'text-gray-900';
  };

  // Helper for Header colors
  const getHeaderColor = (index: number) => {
      if (index === 0) return 'text-red-400'; // Sunday
      if (index === 6) return 'text-blue-400'; // Saturday
      return 'text-gray-400';
  };

  return (
    <div 
      ref={wrapperRef}
      className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-[320px] animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-gray-800 font-bold text-lg">
          {year}年 {month + 1}月
        </span>
        <button 
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((d, i) => (
          <div key={i} className={`text-center text-xs font-bold ${getHeaderColor(i)}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty slots for previous month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const { dateStr, hasBooking, isSelected, isToday, dayOfWeek, isHoliday } = checkAvailability(day);

          // Determine if clickable
          const isClickable = allowEmpty || hasBooking;
          const textColorClass = getDayTextColor(dayOfWeek, isHoliday, !isClickable);

          return (
            <button
              key={day}
              onClick={() => {
                if (isClickable) {
                  onSelect(dateStr);
                  onClose();
                }
              }}
              disabled={!isClickable}
              className={`
                h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-all
                ${isSelected 
                    ? 'bg-larp-primary text-white shadow-md scale-105 font-bold' 
                    : isClickable
                        ? `hover:bg-blue-50 cursor-pointer ${textColorClass}` 
                        : `cursor-not-allowed bg-gray-50/50 ${textColorClass}`
                }
              `}
            >
              <span className="text-sm leading-none">{day}</span>
              
              {/* Indicators */}
              <div className="flex gap-0.5 mt-1 h-1">
                {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                )}
                {hasBooking && !isSelected && (
                    <span className={`w-1 h-1 rounded-full ${isHoliday ? 'bg-purple-400' : 'bg-larp-primary'}`}></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-larp-primary"></span>
            <span>一般</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>週六</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>週日</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>假日</span>
        </div>
        {isTodayInCurrentMonth && (
             <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>今日</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default MiniDatePicker;