
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
  
  const isPendingDM = dms.some(dm => dm.includes('待定') || dm === '?');
  const hasDepositAmount = booking.depositAmount > 0;
  const hasDepositLabel = !!booking.depositLabel;

  return (
    <div 
      onClick={() => onClick(booking)}
      className={`
        relative p-4 rounded-xl border border-gray-200 
        bg-white shadow-sm hover:shadow-md hover:border-larp-primary/50
        transition-all duration-200 cursor-pointer group
      `}
    >
      {/* Header: Time & Script */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-wide group-hover:text-larp-primary transition-colors">
            {booking.scriptName}
          </h3>
          <div className="flex items-center text-xs text-larp-primary font-medium mt-1 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
            <Clock size={12} className="mr-1" />
            {booking.timeRange}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {hasDepositLabel ? (
            <span className="flex items-center text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded shadow-sm">
              <ShieldCheck size={10} className="mr-0.5" />
              {booking.depositLabel}
            </span>
          ) : hasDepositAmount ? (
            <span className="flex items-center text-xs font-bold text-white bg-larp-success px-2 py-1 rounded shadow-sm">
              <DollarSign size={10} className="mr-0.5" />
              ${booking.depositAmount}
            </span>
          ) : (
            <span className="flex items-center text-xs font-bold text-larp-danger border border-larp-danger/50 bg-red-50 px-2 py-1 rounded">
              未付定
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 text-sm">
        
        {/* DM Section */}
        <div className="flex items-start">
          <div className="w-6 mt-0.5 text-larp-muted flex-shrink-0">
            <Crown size={14} />
          </div>
          <div className="flex flex-wrap gap-1">
            {dms.length > 0 ? dms.map((dm, idx) => (
              <span 
                key={idx} 
                className={`
                  px-1.5 py-0.5 rounded text-xs border font-medium
                  ${dm.includes('待定') 
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700 animate-pulse' 
                    : 'bg-gray-100 border-gray-200 text-gray-600'}
                `}
              >
                {dm}
              </span>
            )) : <span className="text-larp-muted text-xs italic">無主持人</span>}
          </div>
        </div>

        {/* NPC Section */}
        {npcs.length > 0 && (
          <div className="flex items-start">
            <div className="w-6 mt-0.5 text-larp-muted flex-shrink-0">
              <Users size={14} />
            </div>
            <div className="flex flex-wrap gap-1">
              {npcs.map((npc, idx) => (
                <span key={idx} className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                  {npc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Organizer Section */}
        <div className="flex items-center pt-2 mt-2 border-t border-gray-100">
          <User size={14} className="mr-2 text-larp-accent" />
          <span className="text-larp-accent font-bold text-xs">主揪: {booking.organizerName}</span>
        </div>
      </div>

      {/* Hover Edit Action */}
      {!readOnly && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 bg-larp-primary text-white rounded-full shadow-md">
            <Edit2 size={12} />
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
