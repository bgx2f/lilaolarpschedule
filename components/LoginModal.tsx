
import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, UserPlus, Settings, LayoutDashboard } from 'lucide-react';
import { Member, MemberRole, MemberStatus } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void; // Usually disabled in this flow, but kept for interface
  onLogin: (username: string, password: string) => { success: boolean; message?: string; member?: Member };
  onRegister: (username: string, password: string, displayName: string) => { success: boolean; message?: string };
}

type Mode = 'login' | 'register' | 'admin';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [mode, setMode] = useState<Mode>('login');
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // For registration
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setPassword('');
      setDisplayName('');
      setError(null);
      setSuccessMsg(null);
      setMode('login');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'login' || mode === 'admin') {
        const result = onLogin(username, password);
        if (result.success) {
            // App component handles state update
        } else {
            setError(result.message || '登入失敗');
        }
    } else {
        // Register
        if (!username || !password || !displayName) {
            setError('請填寫所有欄位');
            return;
        }
        const result = onRegister(username, password, displayName);
        if (result.success) {
            setSuccessMsg('註冊成功！請等待管理員審核您的帳號。');
            setMode('login');
            setUsername('');
            setPassword('');
        } else {
            setError(result.message || '註冊失敗');
        }
    }
  };

  const getHeaderIcon = () => {
      if (mode === 'register') return <UserPlus size={32} />;
      if (mode === 'admin') return <Settings size={32} />;
      return <Lock size={32} />;
  };

  const getHeaderColor = () => {
      if (mode === 'register') return 'bg-gradient-to-br from-larp-primary to-larp-accent';
      if (mode === 'admin') return 'bg-gradient-to-br from-gray-800 to-gray-900';
      return 'bg-gradient-to-br from-gray-700 to-black'; // Login default
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
        
        {/* Toggle Header (Hide in Admin Mode to keep it clean) */}
        {mode !== 'admin' && (
            <div className="flex border-b border-gray-100">
                <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'login' ? 'text-gray-900 bg-white' : 'text-gray-400 bg-gray-50'}`}
                >
                    主持人登入
                </button>
                <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'register' ? 'text-larp-primary bg-white' : 'text-gray-400 bg-gray-50'}`}
                >
                    註冊帳號
                </button>
            </div>
        )}

        {/* Admin Header Decoration */}
        {mode === 'admin' && (
            <div className="h-2 bg-gradient-to-r from-gray-800 to-gray-600 w-full" />
        )}

        <div className="p-8 flex flex-col items-center">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 transition-colors duration-300 ${getHeaderColor()}`}>
                {getHeaderIcon()}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {mode === 'login' && '歡迎回來'}
                {mode === 'register' && '申請加入'}
                {mode === 'admin' && '後台管理系統'}
            </h2>
            <p className="text-gray-500 text-sm mb-6 text-center">
                {mode === 'login' && '請輸入您的主持人帳號密碼以檢視班表'}
                {mode === 'register' && '註冊後需等待管理員審核通過方可登入'}
                {mode === 'admin' && '請輸入管理員憑證以進入後台'}
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                
                {mode === 'register' && (
                     <div className="relative group">
                        <User className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-larp-primary transition-colors" size={18} />
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-larp-primary focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-medium"
                            placeholder="您的稱呼 (暱稱)"
                        />
                    </div>
                )}

                <div className="relative group">
                    <ShieldCheck className={`absolute left-3 top-3.5 text-gray-400 transition-colors ${mode === 'register' ? 'group-focus-within:text-larp-primary' : 'group-focus-within:text-gray-800'}`} size={18} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-bold ${mode === 'register' ? 'focus:ring-larp-primary' : 'focus:ring-gray-300'}`}
                        placeholder="帳號"
                        autoComplete="username"
                    />
                </div>

                <div className="relative group">
                    <Lock className={`absolute left-3 top-3.5 text-gray-400 transition-colors ${mode === 'register' ? 'group-focus-within:text-larp-primary' : 'group-focus-within:text-gray-800'}`} size={18} />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-bold ${mode === 'register' ? 'focus:ring-larp-primary' : 'focus:ring-gray-300'}`}
                        placeholder="密碼"
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    />
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold animate-in slide-in-from-top-1">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                     <div className="flex items-start gap-2 bg-green-50 text-green-600 p-3 rounded-lg text-sm font-bold animate-in slide-in-from-top-1">
                        <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className={`w-full text-white font-bold py-3 rounded-xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg mt-2
                        ${mode === 'register' ? 'bg-gradient-to-r from-larp-primary to-larp-accent' : 'bg-gray-900 hover:bg-black'}
                    `}
                >
                    {mode === 'login' && (
                        <>登入 <ArrowRight size={18} /></>
                    )}
                    {mode === 'register' && (
                        <>送出申請 <ArrowRight size={18} /></>
                    )}
                    {mode === 'admin' && (
                        <>進入後台 <LayoutDashboard size={18} /></>
                    )}
                </button>
            </form>

            {/* Admin Toggle Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 w-full text-center">
                {mode === 'admin' ? (
                    <button 
                        onClick={() => setMode('login')} 
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                        <User size={14} /> 返回主持人登入
                    </button>
                ) : (
                    <button 
                        onClick={() => setMode('admin')} 
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium flex items-center justify-center gap-1 mx-auto"
                    >
                        <ShieldCheck size={14} /> 管理員後台登入
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
