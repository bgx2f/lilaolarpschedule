
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Settings, LayoutGrid, List, Table2, BarChart3, LogOut, User as UserIcon, Loader2, Search, MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Booking, Room, SlotType, Member, MemberRole, MemberStatus } from './types';
import { ROOMS, MOCK_BOOKINGS, PRESET_SCRIPTS, PRESET_DMS, PRESET_NPCS, HOLIDAYS as DEFAULT_HOLIDAYS, MOCK_MEMBERS } from './constants';
import BookingCard from './components/BookingCard';
import BookingModal from './components/BookingModal';
import PublicCalendar from './components/PublicCalendar';
import BookingListModal from './components/BookingListModal';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import StatsModal from './components/StatsModal';
import SearchModal from './components/SearchModal';
import * as Supabase from './utils/supabase';

type ViewMode = 'admin' | 'public';

const loadState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => loadState('larp_selected_date', '2026-11-14'));
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [zoomLevel, setZoomLevel] = useState(() => loadState('larp_zoom_level', 1.0));

  // Data States
  const [bookings, setBookings] = useState<Booking[]>(() => loadState('larp_bookings', MOCK_BOOKINGS));
  const [rooms, setRooms] = useState<Room[]>(() => loadState('larp_rooms', ROOMS));
  const [scripts, setScripts] = useState<string[]>(() => loadState('larp_scripts', PRESET_SCRIPTS));
  const [dms, setDms] = useState<string[]>(() => loadState('larp_dms', PRESET_DMS));
  const [npcs, setNpcs] = useState<string[]>(() => loadState('larp_npcs', PRESET_NPCS));
  const [holidays, setHolidays] = useState<string[]>(() => loadState('larp_holidays', DEFAULT_HOLIDAYS));
  const [depositLabels, setDepositLabels] = useState<string[]>(() => loadState('larp_deposit_labels', ['VIP免定', '老客戶免定', '活動優惠']));
  const [monthTags, setMonthTags] = useState<string[]>(() => loadState('larp_month_tags', ['2026-11', '2026-12', '2027-01', '2027-02']));
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadState('larp_view_mode', 'public'));
  
  // Auth & Member State
  const [members, setMembers] = useState<Member[]>(() => loadState('larp_members', MOCK_MEMBERS));
  const [currentUser, setCurrentUser] = useState<Member | null>(() => loadState('larp_current_user', null));
  
  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false); 
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<Booking> | undefined>(undefined);

  useEffect(() => {
    const initData = async () => {
      try {
        const cloudData = await Supabase.fetchAllLarpData();
        if (cloudData) {
          if (cloudData.bookings.length > 0) setBookings(cloudData.bookings);
          if (cloudData.members.length > 0) setMembers(cloudData.members);
          if (cloudData.settings) {
            const s = cloudData.settings;
            if (s.rooms) setRooms(s.rooms);
            if (s.scripts) setScripts(s.scripts);
            if (s.dms) setDms(s.dms);
            if (s.npcs) setNpcs(s.npcs);
            if (s.holidays) setHolidays(s.holidays);
            if (s.depositLabels) setDepositLabels(s.depositLabels);
            if (s.monthTags) setMonthTags(s.monthTags);
          }
        }
      } catch (e) {
        console.error('Initial cloud fetch failed:', e);
      } finally {
        setIsDataLoaded(true);
        if (!currentUser) setIsLoginModalOpen(true);
      }
    };
    initData();
  }, []);

  const performSync = async () => {
    if (!isDataLoaded || !currentUser || currentUser.role !== MemberRole.ADMIN) return;
    setSyncStatus('syncing');
    try {
      await Promise.all([
        Supabase.syncSettings({ rooms, scripts, dms, npcs, holidays, depositLabels, monthTags }),
        Supabase.syncBookings(bookings),
        Supabase.syncMembers(members)
      ]);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(performSync, 3000);
    return () => clearTimeout(timer);
  }, [rooms, scripts, dms, npcs, holidays, depositLabels, monthTags, bookings, members, isDataLoaded]);

  useEffect(() => {
    localStorage.setItem('larp_bookings', JSON.stringify(bookings));
    localStorage.setItem('larp_members', JSON.stringify(members));
    localStorage.setItem('larp_view_mode', JSON.stringify(viewMode));
    localStorage.setItem('larp_selected_date', JSON.stringify(selectedDate));
    localStorage.setItem('larp_month_tags', JSON.stringify(monthTags));
    localStorage.setItem('larp_zoom_level', JSON.stringify(zoomLevel));
    if (currentUser) {
        localStorage.setItem('larp_current_user', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('larp_current_user');
    }
  }, [bookings, members, viewMode, selectedDate, monthTags, currentUser, zoomLevel]);

  const handleLogin = (username: string, password: string) => {
      const user = members.find(m => m.username === username && m.password === password);
      if (!user) return { success: false, message: '帳號或密碼錯誤' };
      if (user.status === MemberStatus.PENDING) return { success: false, message: '您的帳號正在審核中。' };
      
      const updatedUser = { ...user, isOnline: true };
      setMembers(prev => prev.map(m => m.id === user.id ? updatedUser : m));
      setCurrentUser(updatedUser);
      setIsLoginModalOpen(false);
      if (user.role === MemberRole.ADMIN || user.role === MemberRole.EDITOR) setViewMode('admin');
      else setViewMode('public');
      return { success: true };
  };

  const handleRegister = (username: string, password: string, displayName: string) => {
      if (members.some(m => m.username === username)) return { success: false, message: '此帳號已被使用' };
      const newMember: Member = {
          id: `member-${Date.now()}`,
          username, password, displayName,
          role: MemberRole.MEMBER, status: MemberStatus.PENDING,
          createdAt: new Date().toISOString(), isOnline: false
      };
      setMembers(prev => [...prev, newMember]);
      return { success: true };
  };

  const handleLogout = () => {
      if (currentUser) setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, isOnline: false } : m));
      setCurrentUser(null);
      setIsLoginModalOpen(true);
      setViewMode('public');
  };

  const handleSaveBooking = (incomingBooking: Booking) => {
    const existingIndex = bookings.findIndex(b => b.id === incomingBooking.id);
    if (existingIndex >= 0) setBookings(prev => prev.map(b => b.id === incomingBooking.id ? incomingBooking : b));
    else setBookings(prev => [...prev, incomingBooking]);
  };

  const handleDeleteBooking = (id: string) => {
      setBookings(prev => prev.filter(b => b.id !== id));
      if (currentUser?.role === MemberRole.ADMIN) Supabase.deleteBookingFromCloud(id);
      setIsModalOpen(false);
      setEditingBooking(undefined);
  };

  const handleUpdateMemberStatus = (id: string, status: MemberStatus) => setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  const handleUpdateMemberRole = (id: string, role: MemberRole) => setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  const handleUpdateMemberNotes = (id: string, notes: string) => setMembers(prev => prev.map(m => m.id === id ? { ...m, notes } : m));
  const handleDeleteMember = (id: string) => {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (currentUser?.role === MemberRole.ADMIN) Supabase.deleteMemberFromCloud(id);
  };

  const handleUpdateAdminPassword = (newPassword: string) => {
      const adminMember = members.find(m => m.role === MemberRole.ADMIN);
      if (adminMember) {
        setMembers(prev => prev.map(m => m.id === adminMember.id ? { ...m, password: newPassword } : m));
        if (currentUser?.id === adminMember.id) setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
      }
  };

  const handleZoom = (inc: number) => setZoomLevel(prev => Math.min(Math.max(prev + inc, 0.7), 1.5));

  const todaysBookings = useMemo(() => bookings.filter(b => b.date === selectedDate), [bookings, selectedDate]);
  const currentMonthStr = useMemo(() => selectedDate.substring(0, 7), [selectedDate]);
  
  const backgroundClass = useMemo(() => {
    const date = new Date(selectedDate);
    if (holidays.includes(selectedDate)) return 'bg-purple-50';
    if (date.getDay() === 0) return 'bg-red-50';
    if (date.getDay() === 6) return 'bg-blue-50';
    return 'bg-larp-bg';
  }, [selectedDate, holidays]);

  const canEdit = currentUser?.role === MemberRole.ADMIN || currentUser?.role === MemberRole.EDITOR;

  return (
    <div className={`h-screen ${backgroundClass} text-gray-900 flex flex-col font-sans transition-colors duration-500 overflow-hidden`}>
      <header className="flex-shrink-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between">
             <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg shadow-md ${viewMode === 'admin' ? 'bg-larp-primary' : 'bg-teal-500'}`}>
                    {viewMode === 'admin' ? <Settings className="text-white" size={20} /> : <Calendar className="text-white" size={20} />}
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">
                        {viewMode === 'admin' ? '管理後台' : '預約總覽'}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${Supabase.supabase ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">
                            {syncStatus === 'syncing' ? '同步中...' : (syncStatus === 'error' ? '同步錯誤' : '雲端已就緒')}
                        </span>
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-1 sm:gap-2">
                {/* Zoom Controls - Visible on all screens */}
                <div className="flex items-center bg-gray-100 p-0.5 sm:p-1 rounded-xl border border-gray-200">
                   <button onClick={() => handleZoom(-0.1)} className="p-1 sm:p-1.5 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-90" title="縮小">
                      <ZoomOut size={16} />
                   </button>
                   <button onClick={() => setZoomLevel(1.0)} className="px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors" title="重設縮放">
                      {Math.round(zoomLevel * 100)}%
                   </button>
                   <button onClick={() => handleZoom(0.1)} className="p-1 sm:p-1.5 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-90" title="放大">
                      <ZoomIn size={16} />
                   </button>
                </div>

                <button onClick={() => setIsSearchModalOpen(true)} className="p-2 sm:p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-all active:scale-90 border border-gray-200" title="全域搜尋">
                    <Search size={18} />
                </button>
                
                {canEdit && (
                    <div className="bg-gray-100 p-1 rounded-full flex border border-gray-200">
                        <button onClick={() => setViewMode('public')} className={`px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'public' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}>
                            <LayoutGrid size={12} className="sm:w-3.5 sm:h-3.5" /> 班表
                        </button>
                        <button onClick={() => setViewMode('admin')} className={`px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'admin' ? 'bg-white text-larp-primary shadow-sm' : 'text-gray-500'}`}>
                            <List size={12} className="sm:w-3.5 sm:h-3.5" /> 管理
                        </button>
                    </div>
                )}
             </div>
          </div>

          {currentUser && (
            <div className="flex items-center justify-center gap-2">
                <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 1)).toISOString().split('T')[0])} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
                <div className="px-3 sm:px-5 py-2 bg-white rounded-xl shadow-sm border border-gray-200 text-center min-w-[120px] sm:min-w-[150px]">
                    <span className="text-sm sm:text-lg font-bold text-gray-800 font-mono tracking-tight">{selectedDate}</span>
                </div>
                <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)).toISOString().split('T')[0])} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><ChevronRight size={18}/></button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
              {currentUser && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                        <UserIcon size={14} className="text-gray-500"/>
                        <span className="text-xs font-bold text-gray-800">{currentUser.displayName}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
                  </div>
              )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto relative flex flex-col p-2 sm:p-4">
        {!isDataLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-[60]">
                <Loader2 className="animate-spin text-larp-primary mb-3" size={48}/>
                <p className="text-sm text-gray-600 font-bold tracking-widest uppercase">載入雲端班表中...</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col w-full h-full pb-20" style={{ zoom: zoomLevel }}>
                {viewMode === 'admin' && canEdit && (
                    <div className="min-w-max h-full flex flex-col animate-in fade-in duration-300">
                        <div className="mb-4 flex-shrink-0 flex items-center gap-3 sticky left-0 z-40">
                             <button onClick={() => setIsStatsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-indigo-200 rounded-xl text-sm font-bold shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 transition-all"><BarChart3 size={16} /> 統計報表</button>
                             <button onClick={() => setIsListModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold shadow-sm text-gray-600 bg-white hover:bg-gray-50 transition-all"><Table2 size={16} /> 預約列表</button>
                             <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold shadow-sm text-gray-600 bg-white hover:bg-gray-50 transition-all ml-auto"><Settings size={16} /> 系統設定</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pb-10">
                            {/* Improved Sticky Room Names Row */}
                            <div className="grid gap-4 mb-2 sticky top-0 z-[45]" style={{gridTemplateColumns: `100px repeat(${rooms.length}, minmax(280px, 1fr))`}}>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky left-0 z-50 flex items-center justify-center h-12">
                                   <MapPin size={18} className="text-gray-400" />
                                </div>
                                {rooms.map(room => (
                                    <div key={room.id} className="bg-gray-900 text-white rounded-xl shadow-lg flex items-center justify-center h-12 font-black text-sm tracking-widest px-4 border border-gray-800 z-40">
                                        {room.name}
                                    </div>
                                ))}
                            </div>

                            {Object.values(SlotType).map(slot => (
                                <div key={slot} className="grid gap-4 mb-4" style={{gridTemplateColumns: `100px repeat(${rooms.length}, minmax(280px, 1fr))`}}>
                                    <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm sticky left-0 z-20 min-h-[160px]">
                                        <span className="text-lg font-black text-larp-primary vertical-rl py-4 tracking-widest uppercase">{slot}</span>
                                    </div>
                                    {rooms.map(room => {
                                        const roomBookings = todaysBookings.filter(b => b.slot === slot && b.roomId === room.id);
                                        return (
                                            <div key={`${slot}-${room.id}`} className="bg-white/40 border-2 border-dashed border-gray-200 rounded-xl p-2 min-h-[160px] flex flex-col gap-3 group transition-colors hover:border-larp-primary/30">
                                                {roomBookings.map(b => <BookingCard key={b.id} booking={b} onClick={(b) => { setEditingBooking(b); setIsModalOpen(true); }}/>)}
                                                <button 
                                                    onClick={() => { setEditingBooking({ slot, roomId: room.id, date: selectedDate, timeRange: '13:00-17:00' }); setIsModalOpen(true); }} 
                                                    className="w-full flex-1 py-4 text-gray-300 hover:text-larp-primary border border-transparent hover:border-larp-primary border-dashed rounded-xl transition-all flex flex-col items-center justify-center"
                                                >
                                                    <Plus size={24} />
                                                    <span className="text-[10px] font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">新增預約</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {viewMode === 'public' && (
                    <div className="flex-1 w-full h-full max-w-7xl mx-auto overflow-hidden">
                        <PublicCalendar currentDate={selectedDate} bookings={bookings} rooms={rooms} holidays={holidays} onDateClick={setSelectedDate} onMonthChange={(inc) => {
                            const d = new Date(selectedDate);
                            d.setMonth(d.getMonth() + inc);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }} onDateChange={setSelectedDate} />
                    </div>
                )}
            </div>
        )}
      </main>

      {monthTags.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-[100] bg-white/60 backdrop-blur-lg border-t border-gray-200 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-3 max-w-7xl mx-auto px-6 py-3 min-w-max md:justify-center md:w-full">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 whitespace-nowrap">快速跳轉</div>
            {monthTags.map(tag => {
               const isActive = currentMonthStr === tag;
               return (
                 <button 
                   key={tag}
                   onClick={() => setSelectedDate(`${tag}-01`)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${isActive ? 'bg-larp-primary text-white border-larp-primary scale-110 shadow-larp-primary/20' : 'bg-white text-gray-600 border-gray-200 hover:border-larp-primary/50'}`}
                 >
                   {tag.replace('-', '年 ')}月
                 </button>
               );
            })}
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => {}} onLogin={handleLogin} onRegister={handleRegister} />
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveBooking} onDelete={handleDeleteBooking} initialData={editingBooking} selectedDate={selectedDate} rooms={rooms} availableScripts={scripts} allBookings={bookings} availableDms={dms} availableNpcs={npcs} noDepositLabels={depositLabels} />
      <BookingListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} bookings={bookings} rooms={rooms} onEdit={(b) => { setEditingBooking(b); setIsModalOpen(true); }} onDelete={handleDeleteBooking} />
      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} bookings={bookings} allDms={dms} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} bookings={bookings} rooms={rooms} onNavigate={setSelectedDate} />
      {currentUser && (
        <SettingsModal 
            isOpen={isSettingsModalOpen} 
            onClose={() => setIsSettingsModalOpen(false)} 
            rooms={rooms} setRooms={setRooms} 
            scripts={scripts} setScripts={setScripts} 
            dms={dms} setDms={setDms} 
            npcs={npcs} setNpcs={setNpcs} 
            depositLabels={depositLabels} setDepositLabels={setDepositLabels} 
            monthTags={monthTags} setMonthTags={setMonthTags}
            members={members} onUpdateMemberStatus={handleUpdateMemberStatus} onUpdateMemberRole={handleUpdateMemberRole} onUpdateMemberNotes={handleUpdateMemberNotes} onDeleteMember={handleDeleteMember} onUpdateAdminPassword={handleUpdateAdminPassword} currentUser={currentUser} 
        />
      )}
    </div>
  );
};

export default App;
