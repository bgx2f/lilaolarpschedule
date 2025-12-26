
import React, { useState } from 'react';
import { Room, Member, MemberStatus, MemberRole } from '../types';
import { X, Plus, Trash2, MapPin, BookOpen, Settings, AlertTriangle, Check, Crown, Users, Shield, Save, Eye, EyeOff, UserCheck, UserX, Clock, ChevronDown, ShieldCheck } from 'lucide-react';

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

type Tab = 'rooms' | 'scripts' | 'dms' | 'npcs' | 'labels' | 'members' | 'security';

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
  const [newNpcName, setNewNpcName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    setRooms(prev => [...prev, { id: `room-${Date.now()}`, name: newRoomName.trim() }]);
    setNewRoomName('');
  };

  const handleAddScript = () => {
    if (!newScriptName.trim()) return;
    if (scripts.includes(newScriptName.trim())) return;
    setScripts(prev => [...prev, newScriptName.trim()]);
    setNewScriptName('');
  };

  const handleAddDm = () => {
    if (!newDmName.trim()) return;
    if (dms.includes(newDmName.trim())) return;
    setDms(prev => [...prev, newDmName.trim()]);
    setNewDmName('');
  };

  const handleAddNpc = () => {
    if (!newNpcName.trim()) return;
    if (npcs.includes(newNpcName.trim())) return;
    setNpcs(prev => [...prev, newNpcName.trim()]);
    setNewNpcName('');
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    if (depositLabels.includes(newLabel.trim())) return;
    setDepositLabels(prev => [...prev, newLabel.trim()]);
    setNewLabel('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 4) { setPasswordError('密碼至少需 4 碼'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('密碼不一致'); return; }
    onUpdateAdminPassword(newPassword);
    setPasswordSuccess('密碼更新成功！');
    setNewPassword('');
    setConfirmPassword('');
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

        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
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
            <BookOpen size={14} /> 劇本 {activeTab === 'scripts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-larp-accent"></div>}
          </button>
          <button onClick={() => setActiveTab('dms')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'dms' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500'}`}>
            <Crown size={14} /> 主持人 {activeTab === 'dms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500"></div>}
          </button>
          <button onClick={() => setActiveTab('labels')} className={`flex-1 py-4 text-xs font-bold flex items-center justify-center gap-1 transition-colors relative ${activeTab === 'labels' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>
            <ShieldCheck size={14} /> 定金標籤 {activeTab === 'labels' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
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
                             <tr><th className="p-3">姓名</th><th className="p-3">帳號</th><th className="p-3">狀態</th><th className="p-3 text-right">操作</th></tr>
                         </thead>
                         <tbody className="divide-y">
                             {members.map(member => (
                                 <tr key={member.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-bold">{member.displayName}</td>
                                     <td className="p-3 font-mono">{member.username}</td>
                                     <td className="p-3">{member.status}</td>
                                     <td className="p-3 text-right">
                                         {member.role !== MemberRole.ADMIN && (
                                             <button onClick={() => onDeleteMember(member.id)} className="text-red-500 p-1.5"><Trash2 size={16}/></button>
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
                <input type="text" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="輸入新場館" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2"/>
                <button onClick={handleAddRoom} className="px-5 bg-gray-900 text-white rounded-xl font-bold">新增</button>
              </div>
              <div className="space-y-2">
                {rooms.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <span>{r.name}</span>
                    <button onClick={() => setRooms(prev => prev.filter(x => x.id !== r.id))} className="text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input type="text" value={newScriptName} onChange={e => setNewScriptName(e.target.value)} placeholder="輸入新劇本" className="flex-1 bg-gray-50 border rounded-xl px-4 py-2"/>
                <button onClick={handleAddScript} className="px-5 bg-larp-accent text-white rounded-xl font-bold">新增</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {scripts.map(s => (
                  <div key={s} className="flex items-center justify-between p-2 border rounded-lg">
                    <span className="truncate">{s}</span>
                    <button onClick={() => setScripts(prev => prev.filter(x => x !== s))} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labels' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 mb-4">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
                  <div className="text-xs text-indigo-800">
                      <p className="font-bold mb-1 uppercase tracking-wider">定金標籤管理</p>
                      <p>在此設定「免付定金」的文字選項（例如：VIP、學生優惠），讓開場時能快速點選。</p>
                  </div>
               </div>

               <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newLabel} 
                  onChange={e => setNewLabel(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleAddLabel()}
                  placeholder="輸入免付定金理由 (如: 老客戶、社群優惠)" 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  onClick={handleAddLabel} 
                  disabled={!newLabel.trim()}
                  className="px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> 新增
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {depositLabels.map(label => (
                  <div key={label} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-all group">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {label.charAt(0)}
                       </div>
                       <span className="font-bold text-gray-800">{label}</span>
                    </div>
                    <button 
                      onClick={() => setDepositLabels(prev => prev.filter(x => x !== label))} 
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
                {depositLabels.length === 0 && (
                   <div className="col-span-full py-10 text-center text-gray-400 italic">尚未設定任何標籤</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-sm mx-auto pt-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">新密碼</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">確認密碼</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg"/>
                     </div>
                     {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                     {passwordSuccess && <p className="text-green-500 text-xs">{passwordSuccess}</p>}
                     <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-xl font-bold">儲存密碼</button>
                </form>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t text-right">
             <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg">完成</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
