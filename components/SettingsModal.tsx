
import React, { useState } from 'react';
import { Room, Member, MemberStatus, MemberRole } from '../types';
import { X, Plus, Trash2, MapPin, BookOpen, Settings, AlertTriangle, Check, Crown, Users, Shield, Save, Eye, EyeOff, UserCheck, UserX, Clock, RefreshCw, ChevronDown } from 'lucide-react';

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
  // Updated Auth Props
  members: Member[];
  onUpdateMemberStatus: (id: string, status: MemberStatus) => void;
  onUpdateMemberRole?: (id: string, role: MemberRole) => void; // New prop for role changing
  onDeleteMember: (id: string) => void;
  onUpdateAdminPassword: (newPassword: string) => void;
  currentUser: Member;
  adminPassword?: string;
}

type Tab = 'rooms' | 'scripts' | 'dms' | 'npcs' | 'members' | 'security';

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
  members,
  onUpdateMemberStatus,
  onUpdateMemberRole,
  onDeleteMember,
  onUpdateAdminPassword,
  currentUser
}) => {
  // If current user is EDITOR, they cannot see 'members' tab.
  // We default to 'scripts' for them, 'members' for ADMIN.
  const isEditor = currentUser.role === MemberRole.EDITOR;
  const initialTab = isEditor ? 'scripts' : 'members';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [newRoomName, setNewRoomName] = useState('');
  const [newScriptName, setNewScriptName] = useState('');
  const [newDmName, setNewDmName] = useState('');
  const [newNpcName, setNewNpcName] = useState('');
  
  // Security Tab State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // State to track which room/member is currently waiting for delete confirmation
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  // --- Room Handlers ---
  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim()
    };
    setRooms(prev => [...prev, newRoom]);
    setNewRoomName('');
  };

  const initiateDeleteRoom = (id: string) => {
    setRoomToDelete(id);
    setTimeout(() => {
        setRoomToDelete(current => current === id ? null : current);
    }, 3000);
  };

  const confirmDeleteRoom = (id: string) => {
      setRooms(prev => prev.filter(r => r.id !== id));
      setRoomToDelete(null);
  };

  // --- Script Handlers ---
  const handleAddScript = () => {
    const name = newScriptName.trim();
    if (!name) return;
    if (scripts.includes(name)) {
      alert('此劇本名稱已存在');
      return;
    }
    setScripts(prev => [...prev, name]);
    setNewScriptName('');
  };

  const handleDeleteScript = (name: string) => {
    setScripts(prev => prev.filter(s => s !== name));
  };

  // --- DM Handlers ---
  const handleAddDm = () => {
    const name = newDmName.trim();
    if (!name) return;
    if (dms.includes(name)) {
      alert('此主持人名稱已存在');
      return;
    }
    setDms(prev => [...prev, name]);
    setNewDmName('');
  };

  const handleDeleteDm = (name: string) => {
    setDms(prev => prev.filter(s => s !== name));
  };

  // --- NPC Handlers ---
  const handleAddNpc = () => {
    const name = newNpcName.trim();
    if (!name) return;
    if (npcs.includes(name)) {
      alert('此NPC名稱已存在');
      return;
    }
    setNpcs(prev => [...prev, name]);
    setNewNpcName('');
  };

  const handleDeleteNpc = (name: string) => {
    setNpcs(prev => prev.filter(s => s !== name));
  };

  // --- Member Handlers ---
  const confirmDeleteMember = (id: string) => {
    onDeleteMember(id);
    setMemberToDelete(null);
  }
  const initiateDeleteMember = (id: string) => {
    setMemberToDelete(id);
    setTimeout(() => {
        setMemberToDelete(current => current === id ? null : current);
    }, 3000);
  };

  // --- Password Handlers ---
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Removed old password verification as requested
    
    if (newPassword.length < 4) {
        setPasswordError('新密碼長度至少需 4 碼');
        return;
    }
    if (newPassword !== confirmPassword) {
        setPasswordError('兩次新密碼輸入不一致');
        return;
    }

    onUpdateAdminPassword(newPassword);
    setPasswordSuccess('密碼更新成功！');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleResetRandomPassword = () => {
      if (!window.confirm('確定要強制重設密碼嗎？\n新密碼將會寄送至 boardgamex2f@gmail.com')) {
          return;
      }

      // Generate random password (8 chars, alphanumeric)
      const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
      
      // Update state
      onUpdateAdminPassword(randomPass);

      // In a real app, this sends an email via API.
      // For demo, we show the new password in the UI.
      setPasswordSuccess(`密碼已重設！(測試模式: 新密碼為 ${randomPass})`);
      setPasswordError('');
  };

  // Count pending members
  const pendingCount = members.filter(m => m.status === MemberStatus.PENDING).length;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-200 rounded-lg text-gray-700">
                <Settings size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">系統設定</h2>
                <p className="text-xs text-gray-500">管理場館、劇本、人員與權限</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
          {!isEditor && (
            <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[100px] ${activeTab === 'members' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <div className="relative">
                    <UserCheck size={16} />
                    {pendingCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                            {pendingCount}
                        </span>
                    )}
                </div>
                主持人管理
                {activeTab === 'members' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[80px] ${activeTab === 'rooms' ? 'text-gray-900 bg-gray-100/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <MapPin size={16} />
            場館
            {activeTab === 'rooms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900"></div>}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[80px] ${activeTab === 'scripts' ? 'text-larp-accent bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BookOpen size={16} />
            劇本
            {activeTab === 'scripts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-larp-accent"></div>}
          </button>
           <button
            type="button"
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[80px] ${activeTab === 'dms' ? 'text-yellow-600 bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Crown size={16} />
            主持人
            {activeTab === 'dms' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500"></div>}
          </button>
           <button
            type="button"
            onClick={() => setActiveTab('npcs')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[80px] ${activeTab === 'npcs' ? 'text-gray-700 bg-gray-100/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Users size={16} />
            NPC
            {activeTab === 'npcs' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-600"></div>}
          </button>
          
          {/* Security Tab - Available for both Admin and Editor now */}
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative min-w-[80px] ${activeTab === 'security' ? 'text-red-600 bg-red-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Shield size={16} />
            安全性
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          
          {/* MEMBERS TAB (Admin Only) */}
          {activeTab === 'members' && !isEditor && (
             <div className="space-y-4">
                 <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex gap-2">
                     <AlertTriangle size={16} className="mt-0.5"/>
                     <div>
                         <strong>權限說明：</strong>
                         <ul className="list-disc pl-4 mt-1 space-y-1">
                             <li>「待審核」主持人無法登入檢視前台。</li>
                             <li>「已核准」主持人僅能檢視前台班表。</li>
                             <li>「編輯者」可管理場次與設定內容，但無法管理會員。</li>
                             <li>管理員 (Admin) 擁有完整後台權限。</li>
                         </ul>
                     </div>
                 </div>

                 <div className="border rounded-xl overflow-hidden min-h-[400px]">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                             <tr>
                                 <th className="p-3">姓名/暱稱</th>
                                 <th className="p-3">帳號</th>
                                 <th className="p-3">狀態</th>
                                 <th className="p-3">角色</th>
                                 <th className="p-3 text-right">操作</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y">
                             {members.map(member => (
                                 <tr key={member.id} className="hover:bg-gray-50">
                                     <td className="p-3 font-bold text-gray-900">{member.displayName}</td>
                                     <td className="p-3 text-gray-500 font-mono">{member.username}</td>
                                     <td className="p-3">
                                         {member.status === MemberStatus.PENDING && (
                                             <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                                 <Clock size={12}/> 待審核
                                             </span>
                                         )}
                                         {member.status === MemberStatus.APPROVED && (
                                             <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                                 <Check size={12}/> 已核准
                                             </span>
                                         )}
                                         {member.status === MemberStatus.REJECTED && (
                                             <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                                                 <UserX size={12}/> 已駁回
                                             </span>
                                         )}
                                     </td>
                                     <td className="p-3">
                                         {member.role === MemberRole.ADMIN ? (
                                             <span className="font-bold text-purple-600">管理員</span>
                                         ) : (
                                             <div className="flex items-center gap-2">
                                                 {/* Role Display/Selector */}
                                                 <div className="relative group/role">
                                                     <button className={`
                                                         flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border transition-colors
                                                         ${member.role === MemberRole.EDITOR ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-600 border-gray-200'}
                                                     `}>
                                                         {member.role === MemberRole.EDITOR ? '編輯者' : '一般主持人'}
                                                         <ChevronDown size={12} />
                                                     </button>
                                                     
                                                     {/* Role Dropdown */}
                                                     <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden hidden group-focus-within/role:block group-hover/role:block z-20">
                                                         {member.role !== MemberRole.EDITOR && (
                                                             <button 
                                                                 onClick={() => onUpdateMemberRole && onUpdateMemberRole(member.id, MemberRole.EDITOR)}
                                                                 className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 text-indigo-700 font-medium"
                                                             >
                                                                 設為 編輯者
                                                             </button>
                                                         )}
                                                         {member.role !== MemberRole.MEMBER && (
                                                             <button 
                                                                 onClick={() => onUpdateMemberRole && onUpdateMemberRole(member.id, MemberRole.MEMBER)}
                                                                 className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700 font-medium"
                                                             >
                                                                 設為 一般主持人
                                                             </button>
                                                         )}
                                                     </div>
                                                 </div>
                                             </div>
                                         )}
                                     </td>
                                     <td className="p-3 text-right">
                                         <div className="flex items-center justify-end gap-2">
                                             {member.role !== MemberRole.ADMIN && (
                                                 <>
                                                    {member.status === MemberStatus.PENDING && (
                                                        <>
                                                            <button 
                                                                onClick={() => onUpdateMemberStatus(member.id, MemberStatus.APPROVED)}
                                                                className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" title="核准">
                                                                <Check size={16}/>
                                                            </button>
                                                            <button 
                                                                onClick={() => onUpdateMemberStatus(member.id, MemberStatus.REJECTED)}
                                                                className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" title="駁回">
                                                                <X size={16}/>
                                                            </button>
                                                        </>
                                                    )}
                                                    {member.status === MemberStatus.REJECTED && (
                                                        <button 
                                                            onClick={() => onUpdateMemberStatus(member.id, MemberStatus.APPROVED)}
                                                            className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200" title="重新核准">
                                                            <Check size={16}/>
                                                        </button>
                                                    )}
                                                    {member.status === MemberStatus.APPROVED && (
                                                        <button 
                                                            onClick={() => onUpdateMemberStatus(member.id, MemberStatus.REJECTED)}
                                                            className="p-1.5 bg-gray-100 text-gray-400 rounded hover:text-red-500 hover:bg-red-50" title="停權">
                                                            <UserX size={16}/>
                                                        </button>
                                                    )}

                                                    {/* Delete Action */}
                                                    {memberToDelete === member.id ? (
                                                        <button
                                                            onClick={() => confirmDeleteMember(member.id)}
                                                            className="p-1.5 bg-red-600 text-white rounded shadow-sm animate-in fade-in"
                                                            title="確認刪除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => initiateDeleteMember(member.id)}
                                                            className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                            title="刪除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                 </>
                                             )}
                                             {member.role === MemberRole.ADMIN && (
                                                 <span className="text-xs text-gray-300 italic">無法操作</span>
                                             )}
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                  placeholder="輸入新場館名稱"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button 
                  type="button"
                  onClick={handleAddRoom}
                  disabled={!newRoomName.trim()}
                  className="px-5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> 新增
                </button>
              </div>

              <div className="space-y-3">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                        <MapPin size={16} />
                      </div>
                      <span className="font-bold text-gray-800">{room.name}</span>
                    </div>
                    
                    <div className="flex items-center">
                        {roomToDelete === room.id ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right duration-200">
                                <span className="text-xs text-red-500 font-bold mr-1">確定刪除?</span>
                                <button
                                    type="button"
                                    onClick={() => confirmDeleteRoom(room.id)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                                    title="確認刪除"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRoomToDelete(null)}
                                    className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                    title="取消"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button"
                                onClick={() => initiateDeleteRoom(room.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-10 active:scale-95"
                                title="刪除場館"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                    <div className="text-center py-10 text-gray-400">尚未建立任何場館</div>
                )}
              </div>
            </div>
          )}

          {/* SCRIPTS TAB */}
          {activeTab === 'scripts' && (
            <div className="space-y-6">
               <div className="flex gap-3">
                <input 
                  type="text" 
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddScript()}
                  placeholder="輸入新劇本名稱"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-larp-accent"
                />
                <button 
                  type="button"
                  onClick={handleAddScript}
                  disabled={!newScriptName.trim()}
                  className="px-5 bg-larp-accent text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> 新增
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scripts.map((script) => (
                  <div key={script} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-purple-200 transition-all group">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} />
                      </div>
                      <span className="font-bold text-gray-800 truncate">{script}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDeleteScript(script)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-10 active:scale-95"
                      title="移除劇本"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {scripts.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-gray-400">尚未建立劇本清單</div>
                )}
              </div>
            </div>
          )}

          {/* DMs TAB */}
          {activeTab === 'dms' && (
             <div className="space-y-6">
             <div className="flex gap-3">
              <input 
                type="text" 
                value={newDmName}
                onChange={(e) => setNewDmName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDm()}
                placeholder="輸入新主持人名字"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button 
                type="button"
                onClick={handleAddDm}
                disabled={!newDmName.trim()}
                className="px-5 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> 新增
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dms.map((dm) => (
                <div key={dm} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-yellow-200 transition-all group">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0">
                      <Crown size={16} />
                    </div>
                    <span className="font-bold text-gray-800 truncate">{dm}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteDm(dm)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-10 active:scale-95"
                    title="移除主持人"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {dms.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400">尚未建立主持人清單</div>
              )}
            </div>
          </div>
          )}

          {/* NPCs TAB */}
          {activeTab === 'npcs' && (
             <div className="space-y-6">
             <div className="flex gap-3">
              <input 
                type="text" 
                value={newNpcName}
                onChange={(e) => setNewNpcName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNpc()}
                placeholder="輸入新NPC名字"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-500"
              />
              <button 
                type="button"
                onClick={handleAddNpc}
                disabled={!newNpcName.trim()}
                className="px-5 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> 新增
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {npcs.map((npc) => (
                <div key={npc} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:shadow-sm hover:border-gray-300 transition-all group">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                      <Users size={16} />
                    </div>
                    <span className="font-bold text-gray-800 truncate">{npc}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteNpc(npc)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer relative z-10 active:scale-95"
                    title="移除NPC"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {npcs.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-400">尚未建立NPC清單</div>
              )}
            </div>
          </div>
          )}

          {/* SECURITY TAB (Admin & Editor) */}
          {activeTab === 'security' && (
            <div className="flex flex-col h-full justify-start max-w-sm mx-auto w-full pt-4">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">系統管理員密碼</h3>
                    <p className="text-sm text-gray-500">此處修改的是後台管理員(Admin)的登入密碼</p>
                </div>

                <div className="space-y-6">
                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                         
                         {isEditor && (
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs flex gap-2 border border-yellow-100">
                                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                <span>注意：您正在修改「系統管理員」的密碼，而非您自己的密碼。</span>
                            </div>
                         )}

                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">新後台密碼</label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="輸入新密碼"
                            />
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">確認新密碼</label>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="再次輸入新密碼"
                            />
                         </div>

                         <div className="flex items-center gap-2 mb-2">
                             <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-800"
                             >
                                {showPassword ? <EyeOff size={12}/> : <Eye size={12}/>}
                                {showPassword ? '隱藏密碼' : '顯示密碼'}
                             </button>
                         </div>

                         {passwordError && (
                             <div className="bg-red-50 text-red-600 text-xs p-2 rounded flex items-center gap-1 font-bold">
                                 <AlertTriangle size={12} /> {passwordError}
                             </div>
                         )}

                         {passwordSuccess && (
                             <div className="bg-green-50 text-green-600 text-xs p-2 rounded flex items-center gap-1 font-bold">
                                 <Check size={12} /> {passwordSuccess}
                             </div>
                         )}

                         <button 
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                         >
                             <Save size={16} /> 儲存變更
                         </button>
                    </form>
                    
                    {/* Random Password Reset (Admin Only - because it emails the owner) */}
                    {currentUser.role === MemberRole.ADMIN && (
                        <div className="pt-6 border-t border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 mb-2">忘記密碼 / 強制重設</label>
                            <button 
                                type="button"
                                onClick={handleResetRandomPassword}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl border border-gray-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} /> 產生隨機密碼並寄信
                            </button>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">
                                * 新密碼將寄送至 boardgamex2f@gmail.com
                            </p>
                        </div>
                    )}
                </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
             <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
             >
                完成
             </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
