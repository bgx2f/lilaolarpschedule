
import React, { useState } from 'react';
import { Room, Member, MemberStatus, MemberRole } from '../types';
import { X, Plus, Trash2, MapPin, BookOpen, Settings, AlertTriangle, Check, Crown, Users, Shield, Save, Eye, EyeOff, UserCheck, UserX, Clock, ChevronDown, ShieldCheck, Cloud, RefreshCw, Loader2 } from 'lucide-react';
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
  members: Member[];
  onUpdateMemberStatus: (id: string, status: MemberStatus) => void;
  onUpdateMemberRole?: (id: string, role: MemberRole) => void;
  onDeleteMember: (id: string) => void;
  onUpdateAdminPassword: (newPassword: string) => void;
  currentUser: Member;
  adminPassword?: string;
}

type Tab = 'rooms' | 'scripts' | 'dms' | 'labels' | 'members' | 'cloud' | 'security';

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
  members,
  onUpdateMemberStatus,
  onUpdateMemberRole,
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
  const [newLabel, setNewLabel] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
      setIsSyncing(true);
      setSyncDone(false);
      try {
          const larpBookings = JSON.parse(localStorage.getItem('larp_bookings') || '[]');
          const larpMembers = JSON.parse(localStorage.getItem('larp_members') || '[]');
          
          await Promise.all([
              Supabase.syncSettings({ rooms, scripts, dms, npcs, depositLabels }),
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

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-200 rounded-lg text-gray-700"><Settings size={20} /></div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">系統設定</h2>
                <p className="text-xs text-gray-500">管理場館、人員與預設選項</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={24} /></button>
        </div>

        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar bg-white">
          {!isEditor && (
            <button onClick={() => setActiveTab('members')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative min-w-[100px] ${activeTab === 'members' ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}>
                <UserCheck size={14} /> 主持人 {pendingCount > 0 && <span className="bg-red-500 text-white text-[8px] px-1 rounded-full">{pendingCount}</span>}
                {activeTab === 'members' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
          <button onClick={() => setActiveTab('rooms')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'rooms' ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}>
            <MapPin size={14} /> 場館 {activeTab === 'rooms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </button>
          <button onClick={() => setActiveTab('scripts')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'scripts' ? 'text-larp-accent bg-purple-50' : 'text-gray-500'}`}>
            <BookOpen size={14} /> 劇本庫 {activeTab === 'scripts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-larp-accent"></div>}
          </button>
          <button onClick={() => setActiveTab('dms')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'dms' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500'}`}>
            <Crown size={14} /> DM 名單 {activeTab === 'dms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500"></div>}
          </button>
          <button onClick={() => setActiveTab('labels')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'labels' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
            <ShieldCheck size={14} /> 定金標籤 {activeTab === 'labels' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
          </button>
          <button onClick={() => setActiveTab('cloud')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'cloud' ? 'text-green-600 bg-green-50' : 'text-gray-500'}`}>
            <Cloud size={14} /> 雲端同步 {activeTab === 'cloud' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500"></div>}
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'security' ? 'text-red-600 bg-red-50' : 'text-gray-500'}`}>
            <Shield size={14} /> 安全性 {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'members' && !isEditor && (
             <div className="space-y-4">
                 <div className="border rounded-xl overflow-hidden min-h-[400px]">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                             <tr><th className="p-3">姓名</th><th className="p-3">帳號</th><th className="p-3">權限</th><th className="p-3 text-right">操作</th></tr>
                         </thead>
                         <tbody className="divide-y">
                             {members.map(member => (
                                 <tr key={member.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-bold">{member.displayName}</td>
                                     <td className="p-3 font-mono">{member.username}</td>
                                     <td className="p-3 text-xs uppercase font-bold">{member.role}</td>
                                     <td className="p-3 text-right">
                                         {member.role !== MemberRole.ADMIN && (
                                             <button onClick={() => onDeleteMember(member.id)} className="text-red-400 hover:text-red-600 p-1.5"><Trash2 size={16}/></button>
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
            <div className="space-y-6">
              <div className="flex gap-3">
                <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="輸入新場館" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-gray-900"/>
                <button onClick={() => { if(newRoomName) { setRooms(prev => [...prev, { id: `room-${Date.now()}`, name: newRoomName }]); setNewRoomName(''); } }} className="px-5 bg-gray-900 text-white rounded-xl font-bold">新增</button>
              </div>
              <div className="space-y-2">
                {rooms.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                    <span className="font-medium">{r.name}</span>
                    <button onClick={() => setRooms(prev => prev.filter(x => x.id !== r.id))} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input type="text" value={newScriptName} onChange={e => setNewScriptName(e.target.value)} placeholder="搜尋或新增劇本" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-larp-accent"/>
                <button onClick={() => { if(newScriptName && !scripts.includes(newScriptName)) { setScripts(prev => [...prev, newScriptName]); setNewScriptName(''); } }} className="px-5 bg-larp-accent text-white rounded-xl font-bold">新增</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {scripts.map(s => (
                  <div key={s} className="flex items-center justify-between p-2 border rounded-lg bg-white hover:border-larp-accent">
                    <span className="truncate text-xs font-bold">{s}</span>
                    <button onClick={() => setScripts(prev => prev.filter(x => x !== s))} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dms' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input type="text" value={newDmName} onChange={e => setNewDmName(e.target.value)} placeholder="新增主持人姓名" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"/>
                <button onClick={() => { if(newDmName && !dms.includes(newDmName)) { setDms(prev => [...prev, newDmName]); setNewDmName(''); } }} className="px-5 bg-yellow-500 text-white rounded-xl font-bold">新增</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {dms.map(d => (
                  <div key={d} className="flex items-center justify-between p-2 border rounded-lg bg-white hover:border-yellow-500">
                    <span className="truncate text-xs font-bold">{d}</span>
                    <button onClick={() => setDms(prev => prev.filter(x => x !== d))} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="max-w-md mx-auto py-10 flex flex-col items-center text-center space-y-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${Supabase.supabase ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} mb-2`}>
                    <Cloud size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Supabase 雲端資料庫</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        {Supabase.supabase 
                            ? '目前已成功連接至您的專案。系統會自動進行異動同步，您也可以手動點擊下方按鈕進行強制備份。' 
                            : '連線失敗，請檢查 Supabase URL 與 Anon Key 是否正確配置。'}
                    </p>
                </div>
                
                <button 
                    onClick={handleManualSync}
                    disabled={isSyncing || !Supabase.supabase}
                    className={`
                        w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95
                        ${syncDone ? 'bg-green-500 text-white' : 'bg-larp-primary text-white hover:bg-blue-600'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isSyncing ? <Loader2 className="animate-spin" size={20}/> : (syncDone ? <Check size={20}/> : <RefreshCw size={20}/>)}
                    {syncDone ? '同步完成' : (isSyncing ? '同步中...' : '立即強制同步')}
                </button>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    同步範圍：場館、劇本、DM名單、所有預約、主持人權限
                </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-sm mx-auto pt-4 space-y-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20}/>
                    <p className="text-xs text-red-700 font-bold">修改管理員密碼後，系統會同步至雲端。請務必牢記新密碼，以免無法進入後台。</p>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if(newPassword && newPassword === confirmPassword) {
                        onUpdateAdminPassword(newPassword);
                        setPasswordSuccess('密碼更新成功！');
                        setNewPassword(''); setConfirmPassword('');
                    } else { setPasswordError('密碼不一致'); }
                }} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">新管理密碼</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">確認新密碼</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500"/>
                     </div>
                     {passwordError && <p className="text-red-500 text-xs font-bold">{passwordError}</p>}
                     {passwordSuccess && <p className="text-green-500 text-xs font-bold">{passwordSuccess}</p>}
                     <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-md transition-colors">儲存密碼</button>
                </form>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t text-right">
             <button type="button" onClick={onClose} className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-black transition-colors">完成</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
