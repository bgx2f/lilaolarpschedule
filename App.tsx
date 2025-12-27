
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Settings, LayoutGrid, List, Table2, BarChart3, LogOut, User as UserIcon, Loader2, Search, MapPin, ZoomIn, ZoomOut, AlertTriangle, Users as UsersIcon, Wifi } from 'lucide-react';
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
  
  // UI States
  const [showOnlineList, setShowOnlineList] = useState(false);

  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false); 
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<Booking> | undefined>(undefined);
  const [listForcePending, setListForcePending] = useState(false);

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
      if (currentUser) {
        setMembers(prev => prev.map(m => m.id === currentUser.id ? { ...m, isOnline: false } : m));
      }
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

  const handleZoom = (inc: number) => {
    setZoomLevel(prev => {
      const next = Math.min(Math.max(prev + inc, 0.4), 1.5);
      return parseFloat(next.toFixed(1));
    });
  };

  const todaysBookings = useMemo(() => bookings.filter(b => b.date === selectedDate), [bookings, selectedDate]);
  const currentMonthStr = useMemo(() => selectedDate.substring(0, 7), [selectedDate]);
  
  const pendingStaffCount = useMemo(() => {
      return bookings.filter(b => 
          (b.dms && b.dms.some(dm => dm.includes('待定'))) || 
          (b.npcs && b.npcs.some(npc => npc.includes('待定')))
      ).length;
  }, [bookings]);

  const onlineMembers = useMemo(() => members.filter(m => m.isOnline), [members]);

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
        <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between">
             <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg shadow-md ${viewMode === 'admin' ? 'bg-larp-primary' : 'bg-teal-500'}`}>
                    {viewMode === 'admin' ? <Settings className="text-white" size={24} /> : <Calendar className="text-white" size={24} />}
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-xl font-black text-gray-900 leading-tight tracking-tight">
                        {viewMode === 'admin' ? '管理系統' : '預約中心'}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${Supabase.supabase ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">
                            {syncStatus === 'syncing' ? '同步中' : '雲端就緒'}
                        </span>
                    </div>
                </div>
             </div>

             <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                   <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all active:scale-90" title="縮小">
                      <ZoomOut size={18} />
                   </button>
                   <button onClick={() => setZoomLevel(1.0)} className="px-2 text-[10px] font-black text-gray-500 hover:text-gray-900 transition-colors" title="重設縮放">
                      {Math.round(zoomLevel * 100)}%
                   </button>
                   <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all active:scale-90" title="放大">
                      <ZoomIn size={18} />
                   </button>
                </div>

                <button onClick={() => setIsSearchModalOpen(true)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-all active:scale-90 border border-gray-200 shadow-sm" title="全域搜尋">
                    <Search size={18} />
                </button>
                
                {canEdit && (
                    <div className="bg-gray-100 p-1 rounded-2xl flex border border-gray-200 shadow-sm">
                        <button onClick={() => setViewMode('public')} className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all ${viewMode === 'public' ? 'bg-white text-teal-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                            <LayoutGrid size={14} /> 班表
                        </button>
                        <button onClick={() => setViewMode('admin')} className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all ${viewMode === 'admin' ? 'bg-white text-larp-primary shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                            <List size={14} /> 管理
                        </button>
                    </div>
                )}
             </div>
          </div>

          {currentUser && viewMode === 'admin' && (
            <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300 w-full lg:w-auto">
                <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 1)).toISOString().split('T')[0])} className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-all active:scale-90"><ChevronLeft size={18}/></button>
                <div className="px-6 py-2 bg-white rounded-2xl shadow-md border border-gray-200 text-center flex-1 lg:flex-none lg:min-w-[160px]">
                    <span className="text-lg font-black text-gray-900 font-mono tracking-wider">{selectedDate}</span>
                </div>
                <button onClick={() => setSelectedDate(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)).toISOString().split('T')[0])} className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-all active:scale-90"><ChevronRight size={18}/></button>
            </div>
          )}

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
              <div className="relative">
                  <button 
                    onClick={() => setShowOnlineList(!showOnlineList)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${onlineMembers.length > 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                  >
                    <div className="relative">
                        <Wifi size={16} />
                        {onlineMembers.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        )}
                    </div>
                    <span className="text-[10px] font-black">{onlineMembers.length} 人</span>
                  </button>

                  {showOnlineList && onlineMembers.length > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-[1000] animate-in slide-in-from-top-2">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">目前在線人員</h4>
                          <div className="space-y-1.5">
                              {onlineMembers.map(m => (
                                  <div key={m.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                                      <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-200"></div>
                                      <div className="flex-1">
                                          <div className="text-xs font-black text-gray-900 leading-none">{m.displayName}</div>
                                          <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">{m.role}</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {currentUser && (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg">
                        <UserIcon size={14} className="text-teal-400"/>
                        <span className="text-xs font-black text-white">{currentUser.displayName}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="登出系統"><LogOut size={20} /></button>
                  </div>
              )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col" onClick={() => setShowOnlineList(false)}>
        {!isDataLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-[60]">
                <Loader2 className="animate-spin text-larp-primary mb-3" size={56}/>
                <p className="text-lg text-gray-600 font-black tracking-widest uppercase">載入中...</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col w-full h-full pb-12 overflow-hidden">
                {viewMode === 'admin' && canEdit && (
                    <div className="h-full flex flex-col animate-in fade-in duration-300 p-4 w-full overflow-hidden">
                        {/* 手機版按鈕容器：新增 overflow-x-auto */}
                        <div className="mb-4 flex-shrink-0 flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 sticky left-0 z-[60] w-full">
                             <button onClick={() => setIsStatsModalOpen(true)} className="whitespace-nowrap flex items-center gap-2 px-4 py-2.5 border border-indigo-200 rounded-2xl text-xs font-black shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-all"><BarChart3 size={16} /> 統計報表</button>
                             <button onClick={() => { setListForcePending(false); setIsListModalOpen(true); }} className="whitespace-nowrap flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-2xl text-xs font-black shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all"><Table2 size={16} /> 預約清單</button>
                             
                             <button 
                                onClick={() => { setListForcePending(true); setIsListModalOpen(true); }} 
                                className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black shadow-sm transition-all border ${pendingStaffCount > 0 ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 cursor-default'}`}
                                disabled={pendingStaffCount === 0}
                             >
                                <AlertTriangle size={16} className={pendingStaffCount > 0 ? 'text-orange-500' : ''} /> 
                                待定場次 
                                {pendingStaffCount > 0 && <span className="ml-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[9px] shadow-sm">{pendingStaffCount}</span>}
                             </button>

                             <button onClick={() => setIsSettingsModalOpen(true)} className="whitespace-nowrap flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-2xl text-xs font-black shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all ml-auto"><Settings size={16} /> 系統設定</button>
                        </div>
                        
                        {/* 網格容器：修正 w-full 與內容裁切 */}
                        <div className="flex-1 overflow-auto border border-gray-200 rounded-3xl bg-white/40 shadow-inner no-scrollbar h-full w-full">
                            <div 
                                className="min-w-max p-4 lg:p-6 min-h-full" 
                                style={{ zoom: zoomLevel }}
                            >
                                <div className="grid gap-6 mb-6 sticky top-0 z-[55]" style={{gridTemplateColumns: `100px repeat(${rooms.length}, minmax(320px, 1fr))`}}>
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl sticky left-0 z-[60] flex items-center justify-center h-14">
                                       <MapPin size={20} className="text-larp-primary" />
                                    </div>
                                    {rooms.map(room => (
                                        <div key={room.id} className="bg-gray-900 text-white rounded-2xl shadow-xl flex items-center justify-center h-14 font-black text-base tracking-widest px-6 border border-gray-800">
                                            {room.name}
                                        </div>
                                    ))}
                                </div>

                                {Object.values(SlotType).map(slot => (
                                    <div key={slot} className="grid gap-6 mb-6" style={{gridTemplateColumns: `100px repeat(${rooms.length}, minmax(320px, 1fr))`}}>
                                        <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-xl sticky left-0 z-40 min-h-[280px]">
                                            <span className="text-xl font-black text-larp-primary vertical-rl py-6 tracking-[0.3em] uppercase">{slot}</span>
                                        </div>
                                        {rooms.map(room => {
                                            const roomBookings = todaysBookings.filter(b => b.slot === slot && b.roomId === room.id);
                                            return (
                                                <div key={`${slot}-${room.id}`} className="bg-white/60 border-2 border-dashed border-gray-300 rounded-[2.5rem] p-4 min-h-[280px] flex flex-col gap-4 group transition-all hover:border-larp-primary/50 shadow-inner hover:bg-white/90 h-full">
                                                    {roomBookings.map(b => <BookingCard key={b.id} booking={b} onClick={(b) => { setEditingBooking(b); setIsModalOpen(true); }}/>)}
                                                    <button 
                                                        onClick={() => { setEditingBooking({ slot, roomId: room.id, date: selectedDate, timeRange: '13:00-17:00' }); setIsModalOpen(true); }} 
                                                        className="w-full flex-1 py-8 text-gray-300 hover:text-larp-primary border-2 border-transparent hover:border-larp-primary border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center bg-gray-50/50"
                                                    >
                                                        <Plus size={32} />
                                                        <span className="text-[10px] font-black mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">新增場次</span>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {viewMode === 'public' && (
                    <div className="flex-1 w-full h-full overflow-hidden p-4">
                        <div className="h-full overflow-auto no-scrollbar w-full" style={{ zoom: zoomLevel }}>
                          <PublicCalendar currentDate={selectedDate} bookings={bookings} rooms={rooms} holidays={holidays} onDateClick={setSelectedDate} onMonthChange={(inc) => {
                              const d = new Date(selectedDate);
                              d.setMonth(d.getMonth() + inc);
                              setSelectedDate(d.toISOString().split('T')[0]);
                          }} onDateChange={setSelectedDate} />
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>

      {monthTags.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-t border-gray-200 overflow-x-auto scroll-smooth py-1 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] show-scrollbar">
          <div className="flex items-center gap-4 w-full px-8 pb-4 pt-2 min-w-max justify-center">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-4 whitespace-nowrap">快速跳轉</div>
            {monthTags.map(tag => {
               const isActive = currentMonthStr === tag;
               return (
                 <button 
                   key={tag}
                   onClick={() => setSelectedDate(`${tag}-01`)}
                   className={`px-5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm border-2 ${isActive ? 'bg-larp-primary text-white border-larp-primary scale-105 shadow-larp-primary/30' : 'bg-white text-gray-600 border-gray-100 hover:border-larp-primary/50'}`}
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
      <BookingListModal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} bookings={bookings} rooms={rooms} onEdit={(b) => { setEditingBooking(b); setIsModalOpen(true); }} onDelete={handleDeleteBooking} forcePendingFilter={listForcePending} />
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
