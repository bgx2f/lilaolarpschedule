
import React from 'react';
import { Booking } from '../types';
import { Clock, User, Users, DollarSign, Crown, Edit2, ShieldCheck } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  onClick: (booking: Booking) => void;
  readOnly?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, readOnly }) => {
  // Defensive defaults in case data is malformed
  const dms = booking.dms || [];
  const npcs = booking.npcs || [];
  
  const hasDepositAmount = booking.depositAmount > 0;
  const hasDepositLabel = !!booking.depositLabel;

  return (
    <div 
      onClick={() => onClick(booking)}
      className={`
        relative p-4 rounded-[1.5rem] border border-gray-200 
        bg-white shadow-sm hover:shadow-xl hover:border-larp-primary/50
        hover:translate-y-[-2px]
        transition-all duration-300 cursor-pointer group overflow-hidden
      `}
    >
      {/* Accent strip */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-larp-primary via-larp-accent to-larp-primary opacity-30 group-hover:opacity-100 transition-opacity"></div>

      {/* Header: Time & Script */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-1">
          <h3 className="text-lg font-black text-gray-900 leading-tight group-hover:text-larp-primary transition-colors mb-1.5">
            {booking.scriptName}
          </h3>
          <div className="flex items-center text-[10px] text-larp-primary font-black bg-blue-50/80 w-fit px-2.5 py-0.5 rounded-full border border-blue-100/50">
            <Clock size={12} className="mr-1" />
            {booking.timeRange}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {hasDepositLabel ? (
            <span className="flex items-center text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg shadow-sm uppercase tracking-wider">
              <ShieldCheck size={10} className="mr-0.5" />
              {booking.depositLabel}
            </span>
          ) : hasDepositAmount ? (
            <span className="flex items-center text-[11px] font-black text-white bg-teal-600 px-2 py-1 rounded-lg shadow-sm">
              <DollarSign size={10} className="mr-0.5" />
              {booking.depositAmount}
            </span>
          ) : (
            <span className="flex items-center text-[11px] font-black text-red-600 border border-red-100 bg-red-50 px-2 py-1 rounded-lg">
              未付定
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2.5">
        
        {/* DM Section */}
        <div className="flex items-start">
          <div className="w-6 mt-0.5 text-gray-400 flex-shrink-0">
            <Crown size={16} className="text-yellow-500" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dms.length > 0 ? dms.map((dm, idx) => (
              <span 
                key={idx} 
                className={`
                  px-2 py-0.5 rounded-lg text-[11px] border font-black shadow-sm
                  ${dm.includes('待定') 
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 animate-pulse' 
                    : 'bg-gray-800 border-gray-900 text-white'}
                `}
              >
                {dm}
              </span>
            )) : <span className="text-gray-400 text-[10px] italic font-medium">尚未排定 DM</span>}
          </div>
        </div>

        {/* NPC Section */}
        {npcs.length > 0 && (
          <div className="flex items-start">
            <div className="w-6 mt-0.5 text-gray-400 flex-shrink-0">
              <Users size={16} className="text-teal-500" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {npcs.map((npc, idx) => (
                <span key={idx} className="text-[11px] font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">
                  {npc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Organizer Section */}
        <div className="flex items-center pt-3 mt-3 border-t border-gray-100">
          <div className="p-1 bg-purple-50 rounded-lg mr-2">
            <User size={12} className="text-larp-accent" />
          </div>
          <span className="text-larp-accent font-black text-xs">主揪: {booking.organizerName}</span>
        </div>
      </div>

      {/* Hover Edit Action */}
      {!readOnly && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
            <div className="p-1.5 bg-larp-primary text-white rounded-lg shadow-md hover:scale-110 transition-transform">
              <Edit2 size={14} />
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
