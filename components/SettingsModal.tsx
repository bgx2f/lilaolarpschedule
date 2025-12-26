
import React, { useState, useRef, useMemo } from 'react';
import { Room, Member, MemberStatus, MemberRole } from '../types';
import { X, Plus, Trash2, MapPin, BookOpen, Settings, AlertTriangle, Check, Crown, Users, Shield, UserCheck, RefreshCw, Loader2, CalendarRange, StickyNote, ShieldCheck, Cloud, Wifi } from 'lucide-react';
import * as Supabase from '../utils/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  scripts: string[];
  setScripts: React.Dispatch<React.SetStateAction<string[]>>;
  dms: string[];
  setDms: React.Dispatch<React.SetStateAction<string[]>>;
  npcs: string[];
  setNpcs: React.Dispatch<React.SetStateAction<string[]>>;
  depositLabels: string[];
  setDepositLabels: React.Dispatch<React.SetStateAction<string[]>>;
  monthTags: string[];
  setMonthTags: React.Dispatch<React.SetStateAction<string[]>>;
  members: Member[];
  onUpdateMemberStatus: (id: string, status: MemberStatus) => void;
  onUpdateMemberRole?: (id: string, role: MemberRole) => void;
  onUpdateMemberNotes?: (id: string, notes: string) => void;
  onDeleteMember: (id: string) => void;
  onUpdateAdminPassword: (newPassword: string) => void;
  currentUser: Member;
}

type Tab = 'rooms' | 'scripts' | 'dms' | 'npcs' | 'labels' | 'monthTags' | 'members' | 'cloud' | 'security';

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rooms,
  setRooms,
  scripts,
  setScripts,
  dms,
  setDms,
  npcs,
  setNpcs,
  depositLabels,
  setDepositLabels,
  monthTags,
  setMonthTags,
  members,
  onUpdateMemberStatus,
  onUpdateMemberRole,
  onUpdateMemberNotes,
  onDeleteMember,
  onUpdateAdminPassword,
  currentUser
}) => {
  const isEditor = currentUser.role === MemberRole.EDITOR;
  const initialTab = isEditor ? 'scripts' : 'members';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [newRoomName, setNewRoomName] = useState('');
  const [newScriptName, setNewScriptName] = useState('');
  const [newDmName, setNewDmName] = useState('');
  const [newNpcName, setNewNpcName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newMonthTag, setNewMonthTag] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Sorted members: Online first, then by role
  const sortedMembers = useMemo(() => {
      return [...members].sort((a, b) => {
          if (a.isOnline === b.isOnline) {
              return a.displayName.localeCompare(b.displayName);
          }
          return a.isOnline ? -1 : 1;
      });
  }, [members]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
      setIsSyncing(true);
      setSyncDone(false);
      try {
          const larpBookings = JSON.parse(localStorage.getItem('larp_bookings') || '[]');
          const larpMembers = JSON.parse(localStorage.getItem('larp_members') || '[]');
          
          await Promise.all([
              Supabase.syncSettings({ rooms, scripts, dms, npcs, depositLabels, monthTags }),
              Supabase.syncBookings(larpBookings),
              Supabase.syncMembers(larpMembers)
          ]);
          setSyncDone(true);
          setTimeout(() => setSyncDone(false), 3000);
      } catch (e) {
          alert('同步失敗，請檢查網路連線');
      } finally {
          setIsSyncing(false);
      }
  };

  const pendingCount = members.filter(m => m.status === MemberStatus.PENDING).length;

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      setRooms([...rooms, { id: `room-${Date.now()}`, name: newRoomName.trim() }]);
      setNewRoomName('');
    }
  };

  const handleAddScript = () => {
    if (newScriptName.trim() && !scripts.includes(newScriptName.trim())) {
      setScripts([...scripts, newScriptName.trim()]);
      setNewScriptName('');
    }
  };

  const handleAddDm = () => {
    if (newDmName.trim() && !dms.includes(newDmName.trim())) {
      setDms([...dms, newDmName.trim()]);
      setNewDmName('');
    }
  };

  const handleAddNpc = () => {
    if (newNpcName.trim() && !npcs.includes(newNpcName.trim())) {
      setNpcs([...npcs, newNpcName.trim()]);
      setNewNpcName('');
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !depositLabels.includes(newLabel.trim())) {
      setDepositLabels([...depositLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleAddMonthTag = () => {
    if (newMonthTag.trim() && !monthTags.includes(newMonthTag.trim())) {
      setMonthTags([...monthTags, newMonthTag.trim()].sort());
      setNewMonthTag('');
    }
  };

  const handleUpdatePassword = () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('密碼長度需至少 6 個字元');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('兩次輸入的密碼不一致');
      return;
    }
    onUpdateAdminPassword(newPassword);
    setPasswordSuccess('管理員密碼已更新');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Settings size={20} /></div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">系統設定</h2>
                <p className="text-xs text-gray-500">管理人員與預設選項</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={24} /></button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-white shrink-0">
          {!isEditor && (
            <button onClick={() => setActiveTab('members')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'members' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                <UserCheck size={14} /> 主持人 {pendingCount > 0 && <span className="bg-red-500 text-white text-[8px] px-1 rounded-full">{pendingCount}</span>}
                {activeTab === 'members' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
          <button onClick={() => setActiveTab('rooms')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'rooms' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MapPin size={14} /> 場館 {activeTab === 'rooms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </button>
          <button onClick={() => setActiveTab('scripts')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'scripts' ? 'text-larp-accent bg-purple-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <BookOpen size={14} /> 劇本庫 {activeTab === 'scripts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-larp-accent"></div>}
          </button>
          <button onClick={() => setActiveTab('dms')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'dms' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Crown size={14} /> DM 名單 {activeTab === 'dms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500"></div>}
          </button>
          <button onClick={() => setActiveTab('npcs')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'npcs' ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Users size={14} /> NPC 名單 {activeTab === 'npcs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500"></div>}
          </button>
          <button onClick={() => setActiveTab('labels')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'labels' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <ShieldCheck size={14} /> 定金標籤 {activeTab === 'labels' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
          </button>
          <button onClick={() => setActiveTab('monthTags')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'monthTags' ? 'text-larp-primary bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}>
            <CalendarRange size={14} /> 月份標籤 {activeTab === 'monthTags' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-larp-primary"></div>}
          </button>
          {!isEditor && (
            <>
              <button onClick={() => setActiveTab('cloud')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'cloud' ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Cloud size={14} /> 雲端同步 {activeTab === 'cloud' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500"></div>}
              </button>
              <button onClick={() => setActiveTab('security')} className={`flex-1 py-4 px-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] whitespace-nowrap ${activeTab === 'security' ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Shield size={14} /> 安全性 {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
          {activeTab === 'members' && !isEditor && (
             <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><UserCheck size={20} className="text-blue-500" /> 主持人權限管理</h3>
                    <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold md:hidden">可橫向滑動查看更多 →</div>
                 </div>
                 <div className="border rounded-2xl overflow-hidden shadow-sm overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                     <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-gray-50 text-[11px] font-black text-gray-400 uppercase tracking-widest border-b">
                          <tr>
                            <th className="px-4 py-4">狀態</th>
                            <th className="px-4 py-4">顯示名稱</th>
                            <th className="px-4 py-4">登入帳號</th>
                            <th className="px-4 py-4">權限等級</th>
                            <th className="px-4 py-4">帳號狀態</th>
                            <th className="px-4 py-4">管理備註</th>
                            <th className="px-4 py-4 text-right">管理操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                          {sortedMembers.map(member => (
                            <tr key={member.id} className={`hover:bg-gray-50/50 transition-colors ${member.isOnline ? 'bg-green-50/20' : ''}`}>
                              <td className="px-4 py-4">
                                  {member.isOnline ? (
                                      <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-200"></div>
                                          <span className="text-[10px] font-black uppercase">Online</span>
                                      </div>
                                  ) : (
                                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full ml-4"></div>
                                  )}
                              </td>
                              <td className="px-4 py-4 font-bold text-gray-900">{member.displayName}</td>
                              <td className="px-4 py-4 font-mono text-xs text-gray-500">{member.username}</td>
                              <td className="px-4 py-4">
                                <select 
                                  value={member.role} 
                                  onChange={(e) => onUpdateMemberRole?.(member.id, e.target.value as MemberRole)}
                                  className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                  disabled={member.role === MemberRole.ADMIN}
                                >
                                  <option value={MemberRole.MEMBER}>主持人</option>
                                  <option value={MemberRole.EDITOR}>值班經理</option>
                                  <option value={MemberRole.ADMIN}>管理員</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  member.status === MemberStatus.APPROVED ? 'bg-green-100 text-green-700' : 
                                  member.status === MemberStatus.PENDING ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {member.status === MemberStatus.APPROVED ? '已核准' : 
                                   member.status === MemberStatus.PENDING ? '待審核' : '已停權'}
                                </span>
                              </td>
                              <td className="px-4 py-4 min-w-[200px]">
                                <div className="flex items-center gap-2 bg-gray-50 border border-transparent focus-within:bg-white focus-within:border-blue-200 px-3 py-1.5 rounded-xl transition-all">
                                  <StickyNote size={14} className="text-gray-300" />
                                  <input 
                                    type="text" 
                                    defaultValue={member.notes || ''} 
                                    onBlur={(e) => onUpdateMemberNotes?.(member.id, e.target.value)}
                                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-gray-300"
                                    placeholder="點擊新增備註..."
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right space-x-1">
                                {member.status === MemberStatus.PENDING && (
                                  <button onClick={() => onUpdateMemberStatus(member.id, MemberStatus.APPROVED)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" title="核准">
                                    <UserCheck size={18} />
                                  </button>
                                )}
                                {member.role !== MemberRole.ADMIN && (
                                  <button onClick={() => onDeleteMember(member.id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-colors" title="刪除">
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                 </div>
             </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><MapPin size={20} className="text-gray-900" /> 場館環境設定</h3>
              <div className="flex gap-2">
                <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="新增場館名稱..." className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-gray-900 transition-all font-bold"/>
                <button onClick={handleAddRoom} className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-4 border-2 border-gray-50 rounded-2xl bg-white shadow-sm hover:border-gray-200 transition-all group">
                    <span className="font-black text-gray-800">{room.name}</span>
                    <button onClick={() => setRooms(rooms.filter(r => r.id !== room.id))} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><BookOpen size={20} className="text-larp-accent" /> 劇本庫存管理</h3>
              <div className="flex gap-2">
                <input type="text" value={newScriptName} onChange={e => setNewScriptName(e.target.value)} placeholder="搜尋或新增劇本..." className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-larp-accent transition-all font-bold"/>
                <button onClick={handleAddScript} className="bg-larp-accent text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {scripts.map(s => (
                  <span key={s} className="bg-purple-50 text-purple-700 border-2 border-purple-100 px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                    {s} <button onClick={() => setScripts(scripts.filter(x => x !== s))} className="hover:text-red-500 transition-colors"><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dms' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Crown size={20} className="text-yellow-500" /> 主持人預設名單</h3>
              <div className="flex gap-2">
                <input type="text" value={newDmName} onChange={e => setNewDmName(e.target.value)} placeholder="新增常用主持人..." className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-yellow-500 transition-all font-bold"/>
                <button onClick={handleAddDm} className="bg-yellow-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6">
                {dms.map(d => (
                  <div key={d} className="flex items-center justify-between p-2.5 border-2 border-gray-50 rounded-xl bg-white hover:border-yellow-100 transition-all shadow-sm">
                    <span className="truncate text-xs font-black text-gray-700">{d}</span>
                    <button onClick={() => setDms(dms.filter(x => x !== d))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'npcs' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Users size={20} className="text-green-600" /> NPC 預設名單</h3>
              <div className="flex gap-2">
                <input type="text" value={newNpcName} onChange={e => setNewNpcName(e.target.value)} placeholder="新增 NPC 名稱..." className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-green-600 transition-all font-bold"/>
                <button onClick={handleAddNpc} className="bg-green-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {npcs.map(n => (
                  <span key={n} className="bg-green-50 text-green-700 border-2 border-green-100 px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                    {n} <button onClick={() => setNpcs(npcs.filter(x => x !== n))} className="hover:text-red-500 transition-colors"><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labels' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><ShieldCheck size={20} className="text-indigo-600" /> 定金免除標籤設定</h3>
              <div className="flex gap-2">
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="新增免定金原因..." className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-indigo-600 transition-all font-bold"/>
                <button onClick={handleAddLabel} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6">
                {depositLabels.map(l => (
                  <div key={l} className="flex items-center justify-between p-3 border-2 border-gray-50 rounded-xl bg-white shadow-sm hover:border-indigo-100 transition-all">
                    <span className="font-bold text-indigo-900">{l}</span>
                    <button onClick={() => setDepositLabels(depositLabels.filter(x => x !== l))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'monthTags' && (
            <div className="space-y-4 max-w-2xl mx-auto py-4">
              <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><CalendarRange size={20} className="text-larp-primary" /> 月份快速選單設定</h3>
              <div className="flex gap-2">
                <input type="month" value={newMonthTag} onChange={e => setNewMonthTag(e.target.value)} className="flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-larp-primary transition-all font-bold"/>
                <button onClick={handleAddMonthTag} className="bg-larp-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold active:scale-95 transition-all shadow-md">
                  <Plus size={18} /> 新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {monthTags.map(t => (
                  <span key={t} className="bg-blue-50 text-blue-700 border-2 border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-sm">
                    {t.replace('-', ' / ')} <button onClick={() => setMonthTags(monthTags.filter(x => x !== t))} className="hover:text-red-500 transition-colors"><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cloud' && !isEditor && (
            <div className="max-w-xl mx-auto py-10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
                    <Cloud size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Supabase 雲端同步 center</h3>
                  <p className="text-sm text-gray-500 mt-2 font-medium">系統預設會自動在背景同步所有異動。<br/>若您更換了新設備，可在此手動觸發完整同步。</p>
                </div>
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 active:scale-95"
                >
                  {isSyncing ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                  {syncDone ? '同步完成' : '立即手動強制備份'}
                </button>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 w-full text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                  同步範圍：預約訂單、場館資訊、主持人權限、劇本庫、所有系統標籤
                </div>
            </div>
          )}

          {activeTab === 'security' && !isEditor && (
            <div className="max-w-md mx-auto py-4 space-y-6">
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <p className="text-xs text-red-800 font-bold">修改管理員密碼後將即時生效。請務必記住新密碼，以免無法進入後台管理區域。</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">新管理密碼</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-red-500 transition-all font-bold" placeholder="至少 6 位字元..."/>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">確認新密碼</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 outline-none focus:border-red-500 transition-all font-bold" placeholder="再次輸入新密碼..."/>
                </div>
                {passwordError && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg border border-red-100">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-lg border border-green-100">{passwordSuccess}</p>}
                <button onClick={handleUpdatePassword} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg active:scale-95">更新管理密碼</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end shrink-0">
             <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-900 text-white font-black rounded-2xl shadow-md hover:bg-black transition-all active:scale-95">儲存並關閉</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
