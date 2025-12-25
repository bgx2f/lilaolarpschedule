import React, { useState, useMemo } from 'react';
import { Booking } from '../types';
import { X, BarChart3, TrendingUp, Users, BookOpen, Crown, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  allDms: string[]; // Receive all available DMs to show 0-count stats
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, bookings, allDms }) => {
  // Default to current month YYYY-MM using Local Time
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    // 1. Filter bookings for selected month
    const monthlyBookings = bookings.filter(b => b.date.startsWith(selectedMonth));

    // 2. Initialize counters
    const scriptCounts: Record<string, number> = {};
    const dmCounts: Record<string, number> = {};
    
    // Initialize all known DMs with 0 to ensure they appear in the list
    allDms.forEach(dm => {
        dmCounts[dm] = 0;
    });

    let totalNpcs = 0;

    // 3. Iterate and count
    monthlyBookings.forEach(b => {
      // Script Count
      if (b.scriptName) {
        scriptCounts[b.scriptName] = (scriptCounts[b.scriptName] || 0) + 1;
      }

      // DM Count
      if (b.dms && b.dms.length > 0) {
        b.dms.forEach(dm => {
          // Count distinct DM names found in bookings
          // If a DM is in the preset list, it increments; if it's a manual entry (e.g. 'Guest'), it adds a new key
          dmCounts[dm] = (dmCounts[dm] || 0) + 1;
        });
      }

      // Others
      totalNpcs += (b.npcs?.length || 0);
    });

    // 4. Sort Helpers (All stats, sorted descending)
    const sortDesc = (obj: Record<string, number>) => {
      return Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .map(([key, value]) => ({ name: key, count: value }));
    };

    return {
      totalBookings: monthlyBookings.length,
      totalNpcs,
      scriptStats: sortDesc(scriptCounts),
      dmStats: sortDesc(dmCounts)
    };
  }, [bookings, selectedMonth, allDms]);

  // --- Handlers ---
  const handleMonthChange = (increment: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    // Use day 15 to avoid any timezone/overflow edge cases causing the month to shift unexpectedly
    const date = new Date(y, m - 1 + increment, 15);
    const newY = date.getFullYear();
    const newM = date.getMonth() + 1;
    const newMonthStr = `${newY}-${String(newM).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  if (!isOpen) return null;

  // Max value for bar charts calculation
  const maxScriptCount = Math.max(...stats.scriptStats.map(s => s.count), 1);
  const maxDmCount = Math.max(...stats.dmStats.map(s => s.count), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">營運統計報表</h2>
                <p className="text-sm text-gray-500">檢視當月完整營運數據</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Toolbar: Month Selector */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-center bg-white sticky top-0 z-10">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl shadow-inner">
                <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
                    <ChevronLeft size={20} />
                </button>
                <div className="px-6 font-bold text-lg text-gray-800 tabular-nums flex items-center gap-2 min-w-[160px] justify-center">
                    <Calendar size={18} className="text-gray-400" />
                    {selectedMonth}
                </div>
                <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            
            {/* 1. Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">本月總團數</p>
                        <p className="text-3xl font-black text-gray-900">{stats.totalBookings}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <TrendingUp size={24} />
                    </div>
                </div>
                {/* Deposit Card Removed */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">NPC 出勤人次</p>
                        <p className="text-3xl font-black text-gray-900">{stats.totalNpcs}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                        <Users size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 2. DM Statistics (Full List) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Crown size={18} className="text-yellow-600" />
                            <h3 className="font-bold text-gray-800">主持人帶團統計</h3>
                        </div>
                        <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            共 {stats.dmStats.length} 位
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                         {/* Table Header */}
                         <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                            <div className="col-span-2 text-center">排名</div>
                            <div className="col-span-6">姓名</div>
                            <div className="col-span-4 text-right">團數</div>
                        </div>
                        
                        {stats.dmStats.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">尚無數據</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {stats.dmStats.map((dm, idx) => (
                                    <div key={dm.name} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-yellow-50/30 transition-colors">
                                        <div className="col-span-2 text-center">
                                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold 
                                                ${idx < 3 && dm.count > 0 ? 'bg-yellow-100 text-yellow-700' : 'text-gray-400 bg-gray-100'}`}>
                                                {idx + 1}
                                            </span>
                                        </div>
                                        <div className="col-span-6 font-bold text-gray-800 flex items-center gap-2">
                                            {dm.name}
                                            {dm.count === 0 && <span className="text-[10px] text-red-400 bg-red-50 px-1.5 rounded">未開團</span>}
                                        </div>
                                        <div className="col-span-4 flex items-center justify-end gap-3">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                                <div 
                                                    className={`h-full rounded-full ${dm.count > 0 ? 'bg-yellow-400' : 'bg-gray-200'}`}
                                                    style={{ width: `${(dm.count / maxDmCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className={`font-mono font-bold w-8 text-right ${dm.count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {dm.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Script Statistics (Full List) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} className="text-larp-accent" />
                            <h3 className="font-bold text-gray-800">本月劇本統計</h3>
                        </div>
                         <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            共 {stats.scriptStats.length} 款
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                         {/* Table Header */}
                         <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 border-b border-gray-100">
                            <div className="col-span-2 text-center">排名</div>
                            <div className="col-span-7">劇本名稱</div>
                            <div className="col-span-3 text-right">場次</div>
                        </div>

                        {stats.scriptStats.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-10">
                                <AlertCircle size={32} className="mb-2 opacity-50"/>
                                <span>本月尚無開團記錄</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {stats.scriptStats.map((script, idx) => (
                                    <div key={script.name} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-indigo-50/30 transition-colors">
                                        <div className="col-span-2 text-center">
                                            <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold 
                                                ${idx < 3 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 bg-gray-100'}`}>
                                                {idx + 1}
                                            </span>
                                        </div>
                                        <div className="col-span-7 font-bold text-gray-800 truncate pr-2" title={script.name}>
                                            {script.name}
                                        </div>
                                        <div className="col-span-3 flex items-center justify-end gap-3">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                                <div 
                                                    className="bg-indigo-400 h-full rounded-full" 
                                                    style={{ width: `${(script.count / maxScriptCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-mono font-bold text-gray-900 w-6 text-right">
                                                {script.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default StatsModal;