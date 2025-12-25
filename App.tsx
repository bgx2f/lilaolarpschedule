
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, Plus, Filter, Settings, LayoutGrid, List, CalendarSearch, CalendarCheck, CalendarOff, Table2, BarChart3, LogOut, User as UserIcon } from 'lucide-react';
import { Booking, Room, SlotType, Member, MemberRole, MemberStatus } from './types';
import { ROOMS, MOCK_BOOKINGS, PRESET_SCRIPTS, PRESET_DMS, PRESET_NPCS, HOLIDAYS as DEFAULT_HOLIDAYS, MOCK_MEMBERS } from './constants';
import BookingCard from './components/BookingCard';
import BookingModal from './components/BookingModal';
import PublicCalendar from './components/PublicCalendar';
import MiniDatePicker from './components/MiniDatePicker';
import BookingListModal from './components/BookingListModal';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import StatsModal from './components/StatsModal';

type ViewMode = 'admin' | 'public';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-11-14');
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [rooms, setRooms] = useState<Room[]>(ROOMS);
  const [scripts, setScripts] = useState<string[]>(PRESET_SCRIPTS);
  const [dms, setDms] = useState<string[]>(PRESET_DMS);
  const [npcs, setNpcs] = useState<string[]>(PRESET_NPCS);
  const [holidays, setHolidays] = useState<string[]>(DEFAULT_HOLIDAYS);
  const [viewMode, setViewMode] = useState<ViewMode>('public'); // Default to public
  
  // --- New Auth & Member State ---
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  
  // Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true); // Open by default if no user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false); 
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<Booking> | undefined>(undefined);
  
  const [showAdminDatePicker, setShowAdminDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    // In a real app, check session/token here
    if (!currentUser) {
        setIsLoginModalOpen(true);
    }
  }, [currentUser]);

  // Filter bookings for the selected date (Only used in Admin View)
  const todaysBookings = useMemo(() => {
    return bookings.filter(b => b.date === selectedDate);
  }, [bookings, selectedDate]);

  // Determine Background Color based on Date
  const backgroundClass = useMemo(() => {
    const date = new Date(selectedDate);
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const isHoliday = holidays.includes(selectedDate);

    if (isHoliday) return 'bg-purple-50'; // Holiday Purple
    if (day === 0) return 'bg-red-50';    // Sunday Red
    if (day === 6) return 'bg-blue-50';   // Saturday Blue
    
    return 'bg-larp-bg'; // Default Gray
  }, [selectedDate, holidays]);

  // Get online members
  const onlineMembers = useMemo(() => {
      return members.filter(m => m.isOnline);
  }, [members]);

  // --- Auth Handlers ---

  const handleLogin = (username: string, password: string) => {
      const user = members.find(m => m.username === username && m.password === password);
      
      if (!user) {
          return { success: false, message: '帳號或密碼錯誤' };
      }

      if (user.status === MemberStatus.PENDING) {
          return { success: false, message: '您的帳號正在審核中，請稍後再試。' };
      }

      if (user.status === MemberStatus.REJECTED) {
          return { success: false, message: '您的帳號申請未通過。' };
      }

      // Update online status in state
      setMembers(prev => prev.map(m => m.id === user.id ? { ...m, isOnline: true } : m));
      
      setCurrentUser({ ...user, isOnline: true });
      setIsLoginModalOpen(false);
      
      // Redirect based on role (Admins and Editors go to admin view by default)
      if (user.role === MemberRole.ADMIN || user.role === MemberRole.EDITOR) {
          setViewMode('admin');
      } else {
          setViewMode('public');
      }

      return { success: true };
  };

  const handleRegister = (username: string, password: string, displayName: string) => {
      if (members.some(m => m.username === username)) {
          return { success: false, message: '此帳號已被使用' };
      }

      const newMember: Member = {
          id: `member-${Date.now()}`,
          username,
          password,
          displayName,
          role: MemberRole.MEMBER,
          status: MemberStatus.PENDING,
          createdAt: new Date().toISOString(),
          isOnline: false
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

  // --- Member Management Handlers ---

  const handleUpdateMemberStatus = (id: string, status: MemberStatus) => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const handleUpdateMemberRole = (id: string, role: MemberRole) => {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const handleDeleteMember = (id: string) => {
      setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateAdminPassword = (newPassword: string) => {
      // Find the specific ADMIN account. 
      // This ensures that even if an EDITOR calls this function, 
      // it updates the ADMIN's password, not the EDITOR's.
      const adminMember = members.find(m => m.role === MemberRole.ADMIN);

      if (adminMember) {
        setMembers(prev => prev.map(m => m.id === adminMember.id ? { ...m, password: newPassword } : m));
        
        // If the current logged-in user IS the admin, update their session state as well
        if (currentUser?.id === adminMember.id) {
            setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
        }
      }
  };

  // --- Navigation Handlers ---

  const handleSwitchToAdmin = () => {
    if (currentUser?.role === MemberRole.ADMIN || currentUser?.role === MemberRole.EDITOR) {
        setViewMode('admin');
    }
  };

  const toggleHoliday = () => {
    setHolidays(prev => {
        if (prev.includes(selectedDate)) {
            return prev.filter(d => d !== selectedDate);
        } else {
            return [...prev, selectedDate];
        }
    });
  };

  const isCurrentDateHoliday = holidays.includes(selectedDate);

  const getBookingsForSlotAndRoom = (slot: SlotType, roomId: string) => {
    return todaysBookings.filter(b => b.slot === slot && b.roomId === roomId);
  };

  const handleDateNavigation = (increment: number) => {
    const date = new Date(selectedDate);
    if (viewMode === 'admin') {
        date.setDate(date.getDate() + increment);
    } else {
        date.setMonth(date.getMonth() + increment);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleMonthJump = (increment: number) => {
    const date = new Date(selectedDate);
    date.setMonth(date.getMonth() + increment);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSaveBooking = (incomingBooking: Booking) => {
    if (incomingBooking.scriptName && !scripts.includes(incomingBooking.scriptName)) {
        setScripts(prev => [...prev, incomingBooking.scriptName]);
    }
    const existingIndex = bookings.findIndex(b => b.id === incomingBooking.id);
    if (existingIndex >= 0) {
        setBookings(prev => prev.map(b => b.id === incomingBooking.id ? incomingBooking : b));
    } else {
        setBookings(prev => [...prev, incomingBooking]);
    }
  };

  const handleDeleteBooking = (id: string) => {
      setBookings(prev => prev.filter(b => b.id !== id));
      setIsModalOpen(false);
      setEditingBooking(undefined);
  };

  const openNewBooking = (slot?: SlotType, roomId?: string) => {
    let defaultTimeRange = '10:00-18:30'; 
    if (slot === SlotType.MORNING) defaultTimeRange = '08:00-13:00';
    else if (slot === SlotType.AFTERNOON) defaultTimeRange = '13:30-18:30';
    else if (slot === SlotType.EVENING) defaultTimeRange = '19:00-03:00';

    setEditingBooking({
      slot: slot,
      roomId: roomId || rooms[0]?.id,
      date: selectedDate,
      timeRange: defaultTimeRange
    });
    setIsModalOpen(true);
  };

  const openEditBooking = (booking: Booking) => {
    // Only Admin and Editor can edit
    if (currentUser?.role === MemberRole.ADMIN || currentUser?.role === MemberRole.EDITOR) {
        setEditingBooking(booking);
        setIsModalOpen(true);
    }
  };

  const handleCalendarDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  const getWeekday = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('zh-TW', { weekday: 'long' });
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
        if ('showPicker' in dateInputRef.current) {
            try {
                (dateInputRef.current as any).showPicker();
            } catch (e) {}
        }
    }
  };

  const gridStyle = {
    gridTemplateColumns: `100px repeat(${rooms.length}, minmax(280px, 1fr))`
  };

  // Logic to determine if user has write access
  const canEdit = currentUser?.role === MemberRole.ADMIN || currentUser?.role === MemberRole.EDITOR;

  if (!currentUser && !isLoginModalOpen) {
      setIsLoginModalOpen(true);
  }

  return (
    <div className={`min-h-screen ${backgroundClass} text-gray-900 flex flex-col font-sans transition-colors duration-500`}>
      
      {/* Navbar / Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          
          {/* Logo & View Switcher */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
             <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg shadow-md transition-colors ${viewMode === 'admin' ? 'bg-gradient-to-br from-larp-primary to-larp-accent' : 'bg-gradient-to-br from-teal-500 to-emerald-500'}`}>
                    {viewMode === 'admin' ? <Settings className="text-white" size={20} /> : <Calendar className="text-white" size={20} />}
                </div>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">
                        {viewMode === 'admin' ? '管理後台' : '預約總覽'}
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">LARP Schedule System</p>
                </div>
             </div>

             {/* View Toggle Pill (Admin & Editor) */}
             {canEdit && (
                 <div className="bg-gray-100 p-1 rounded-full flex border border-gray-200">
                    <button 
                        onClick={() => setViewMode('public')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'public' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <LayoutGrid size={14} /> 班表
                    </button>
                    <button 
                        onClick={handleSwitchToAdmin}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'admin' ? 'bg-white text-larp-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <List size={14} /> 管理
                    </button>
                 </div>
             )}
          </div>

          {/* Date Controls */}
          {currentUser && (
            <div className="flex items-center justify-center gap-2 w-full md:w-auto">
                {/* Prev Controls */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button onClick={() => handleMonthJump(-1)} className="p-2 hover:bg-white rounded-md transition-colors text-gray-400 hover:text-larp-primary" title="上個月">
                        <ChevronsLeft size={16} />
                    </button>
                    <button onClick={() => handleDateNavigation(-1)} className="p-2 hover:bg-white rounded-md transition-colors text-gray-600" title={viewMode === 'admin' ? '上一天' : '上個月'}>
                        <ChevronLeft size={20} />
                    </button>
                </div>
                
                {/* Independent Date Picker Button (Global) */}
                <div className="relative group mx-2">
                <button 
                    onClick={triggerDatePicker}
                    className="flex items-center gap-3 px-5 py-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-blue-50 hover:border-larp-primary hover:shadow-md transition-all cursor-pointer min-w-[180px] relative z-0"
                >
                    <div className="p-1.5 bg-blue-100 text-larp-primary rounded-lg pointer-events-none">
                        <Calendar size={18} />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5 pointer-events-none">
                        <span className="text-xl font-bold text-gray-800 font-mono tracking-tight">{selectedDate}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                            {getWeekday(selectedDate)}
                        </span>
                    </div>
                </button>
                
                <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                </div>

                {/* Next Controls */}
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button onClick={() => handleDateNavigation(1)} className="p-2 hover:bg-white rounded-md transition-colors text-gray-600" title={viewMode === 'admin' ? '下一天' : '下個月'}>
                        <ChevronRight size={20} />
                    </button>
                    <button onClick={() => handleMonthJump(1)} className="p-2 hover:bg-white rounded-md transition-colors text-gray-400 hover:text-larp-primary" title="下個月">
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
          )}

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {currentUser ? (
                  <>
                    {/* Online Users Indicator */}
                    <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 mr-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-700 whitespace-nowrap">
                            線上人員:
                        </span>
                        <div className="flex -space-x-2">
                            {onlineMembers.map((m, idx) => (
                                <div 
                                    key={m.id} 
                                    className="w-6 h-6 rounded-full bg-white border border-green-200 flex items-center justify-center text-[10px] font-bold text-green-700 shadow-sm"
                                    title={`${m.displayName} (線上)`}
                                    style={{ zIndex: 10 - idx }}
                                >
                                    {m.displayName.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs">
                            <UserIcon size={12}/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-800 leading-none">{currentUser.displayName}</span>
                            <span className="text-[10px] text-gray-500 leading-none mt-0.5 capitalize">
                                {currentUser.role === MemberRole.ADMIN ? '管理員' : (currentUser.role === MemberRole.EDITOR ? '編輯者' : '主持人')}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="登出"
                    >
                        <LogOut size={20} />
                    </button>
                  </>
              ) : (
                 <div className="w-24"></div>
              )}

              {/* Add Button (Admin & Editor) */}
              {viewMode === 'admin' && canEdit && (
                <button 
                    onClick={() => openNewBooking()}
                    className="hidden md:flex items-center gap-2 bg-larp-primary text-white border border-transparent px-4 py-2 rounded-lg hover:bg-blue-600 transition-all text-sm font-bold shadow-md hover:shadow-lg ml-2"
                >
                    <Plus size={16} />
                    新增
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 relative">
        
        {!currentUser ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm z-0">
                <p className="text-gray-400 font-bold text-lg">請先登入以檢視內容</p>
            </div>
        ) : (
            <>
                {/* VIEW 1: ADMIN/EDITOR DASHBOARD */}
                {viewMode === 'admin' && canEdit && (
                    <div className="min-w-max h-full flex flex-col animate-in fade-in duration-300">
                    
                    {/* Admin Toolbar */}
                    <div className="mb-4 flex items-center gap-3 sticky left-0 z-40">
                        <div className="relative">
                            <button
                                onClick={() => setShowAdminDatePicker(!showAdminDatePicker)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 group
                                    ${showAdminDatePicker 
                                        ? 'bg-blue-50 border-larp-primary text-larp-primary' 
                                        : 'bg-white border-gray-300 text-gray-600 hover:border-larp-primary hover:text-larp-primary hover:bg-blue-50'}
                                `}
                            >
                                <CalendarSearch size={16} />
                                選擇日期
                            </button>

                            {showAdminDatePicker && (
                                <MiniDatePicker 
                                    initialDate={selectedDate}
                                    bookings={bookings}
                                    holidays={holidays}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                    }}
                                    onClose={() => setShowAdminDatePicker(false)}
                                    allowEmpty={true}
                                />
                            )}
                        </div>

                        <button
                            onClick={toggleHoliday}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95
                                ${isCurrentDateHoliday 
                                    ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' 
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50'}
                            `}
                        >
                            {isCurrentDateHoliday ? <CalendarOff size={16} /> : <CalendarCheck size={16} />}
                            {isCurrentDateHoliday ? '取消假日' : '設為假日'}
                        </button>

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={() => setIsStatsModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold shadow-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all active:scale-95"
                            >
                                <BarChart3 size={16} />
                                統計報表
                            </button>

                            <button
                                onClick={() => setIsListModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all active:scale-95"
                            >
                                <Table2 size={16} />
                                預約列表
                            </button>

                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-all active:scale-95"
                            >
                                <Settings size={16} />
                                設定
                            </button>
                        </div>
                    </div>

                    {/* Room Headers */}
                    <div className="grid gap-4 mb-4 sticky left-0 z-30" style={gridStyle}>
                        <div className="flex items-center justify-center font-bold text-gray-400 text-sm">
                            <Filter size={14} className="mr-1" />
                            場次
                        </div>
                        {rooms.map(room => (
                        <div key={room.id} className="text-center">
                            <div className="bg-white border-b-4 border-larp-accent py-3 px-3 rounded-xl shadow-sm relative group">
                            <h3 className="font-bold text-gray-800 truncate text-lg">{room.name}</h3>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Swimlanes */}
                    <div className="space-y-4 pb-20">
                        {Object.values(SlotType).map((slot) => (
                        <div key={slot} className="grid gap-4 min-h-[180px]" style={gridStyle}>
                            <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm sticky left-0 z-20">
                                <span className="text-lg font-bold text-larp-primary vertical-rl py-4 tracking-widest">{slot}</span>
                                {slot === SlotType.MORNING && <span className="text-[10px] text-gray-400 font-medium">13:00前</span>}
                                {slot === SlotType.AFTERNOON && <span className="text-[10px] text-gray-400 font-medium">18:30前</span>}
                                {slot === SlotType.EVENING && <span className="text-[10px] text-gray-400 font-medium">19:00後</span>}
                            </div>

                            {rooms.map(room => {
                            const roomBookings = getBookingsForSlotAndRoom(slot, room.id);
                            return (
                                <div 
                                key={`${slot}-${room.id}`} 
                                className="bg-white/40 border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col gap-3 group/slot relative transition-colors hover:border-larp-primary/30 hover:bg-white/60"
                                >
                                {roomBookings.map(booking => (
                                    <BookingCard 
                                    key={booking.id} 
                                    booking={booking} 
                                    onClick={openEditBooking}
                                    />
                                ))}

                                {roomBookings.length === 0 ? (
                                    <button 
                                    onClick={() => openNewBooking(slot, room.id)}
                                    className="flex-1 w-full rounded-lg flex flex-col items-center justify-center text-gray-300 hover:text-larp-primary hover:bg-blue-50/50 transition-all py-8"
                                    >
                                    <Plus size={32} />
                                    <span className="text-xs font-bold mt-2">新增預約</span>
                                    </button>
                                ) : (
                                    <button 
                                    onClick={() => openNewBooking(slot, room.id)}
                                    className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-larp-primary hover:border-larp-primary hover:bg-blue-50 transition-all flex items-center justify-center gap-1 text-sm font-medium mt-auto opacity-0 group-hover/slot:opacity-100"
                                    >
                                    <Plus size={14} /> 新增同場次預約
                                    </button>
                                )}
                                </div>
                            );
                            })}
                        </div>
                        ))}
                    </div>
                    </div>
                )}

                {/* VIEW 2: PUBLIC CALENDAR (MONTH VIEW) */}
                {viewMode === 'public' && (
                    <div className="h-full w-full max-w-7xl mx-auto animate-in fade-in duration-300">
                        <PublicCalendar 
                            currentDate={selectedDate}
                            bookings={bookings}
                            rooms={rooms}
                            holidays={holidays}
                            onDateClick={handleCalendarDateClick}
                            onMonthChange={handleDateNavigation}
                            onDateChange={setSelectedDate}
                        />
                    </div>
                )}
            </>
        )}

      </main>

      {/* Floating Action Button for Mobile (Admin & Editor only) */}
      {viewMode === 'admin' && canEdit && (
        <button 
            onClick={() => openNewBooking()}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-larp-primary to-larp-accent text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
            <Plus size={28} />
        </button>
      )}

      {/* Auth Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={() => {}} // Can't close without logging in
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Modal: Edit/New Booking */}
      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBooking}
        onDelete={handleDeleteBooking}
        initialData={editingBooking}
        selectedDate={selectedDate}
        rooms={rooms}
        availableScripts={scripts}
        allBookings={bookings}
        availableDms={dms}
        availableNpcs={npcs}
      />

      {/* Modal: Booking List View */}
      <BookingListModal 
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        bookings={bookings}
        rooms={rooms}
        onEdit={(booking) => {
            setEditingBooking(booking); 
            setIsModalOpen(true);
        }}
        onDelete={(id) => handleDeleteBooking(id)}
      />

      {/* Modal: Statistics */}
      <StatsModal 
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        bookings={bookings}
        allDms={dms}
      />

      {/* Modal: Settings (Rooms, Scripts, Members & Security) */}
      {currentUser && (
          <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            rooms={rooms}
            setRooms={setRooms}
            scripts={scripts}
            setScripts={setScripts}
            dms={dms}
            setDms={setDms}
            npcs={npcs}
            setNpcs={setNpcs}
            // Member Management
            members={members}
            onUpdateMemberStatus={handleUpdateMemberStatus}
            onUpdateMemberRole={handleUpdateMemberRole} // Pass role updater
            onDeleteMember={handleDeleteMember}
            onUpdateAdminPassword={handleUpdateAdminPassword}
            currentUser={currentUser}
            adminPassword={currentUser.password}
          />
      )}
    </div>
  );
};

export default App;
