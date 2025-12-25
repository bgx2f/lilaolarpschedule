
import React, { useState, useEffect } from 'react';
import { Cloud, Check, AlertCircle, Save, Download, Loader2, Key, LogIn, ExternalLink, ShieldCheck } from 'lucide-react';
import { GoogleDriveConfig } from '../types';
import * as DriveApi from '../utils/googleDrive';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleDriveConfig;
  onSaveConfig: (config: GoogleDriveConfig) => void;
  onSyncDown: () => Promise<void>;
  onSyncUp: () => Promise<void>;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
  lastSynced: string | null;
}

const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncDown,
  onSyncUp,
  isConnected,
  setIsConnected,
  lastSynced
}) => {
  const [localConfig, setLocalConfig] = useState<GoogleDriveConfig>(config);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handleConnect = async () => {
    if (!localConfig.clientId || !localConfig.apiKey) {
      setStatus('error');
      setMessage('請輸入 Client ID 與 API Key');
      return;
    }

    setStatus('loading');
    try {
      onSaveConfig(localConfig);
      await DriveApi.initGapiClient(localConfig.apiKey, localConfig.clientId, setIsConnected);
      DriveApi.initGis(localConfig.clientId, setIsConnected);
      DriveApi.handleAuthClick(); // Trigger popup
      setStatus('idle');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setMessage('連接失敗，請檢查金鑰或是網域設定: ' + (e.message || JSON.stringify(e)));
    }
  };

  const handleAction = async (action: 'up' | 'down') => {
    setStatus('loading');
    setMessage(action === 'up' ? '正在備份至雲端...' : '正在從雲端還原...');
    try {
      if (action === 'up') await onSyncUp();
      else await onSyncDown();
      setStatus('success');
      setMessage(action === 'up' ? '備份成功！' : '資料已同步！');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (e: any) {
      setStatus('error');
      setMessage('操作失敗: ' + (e.message || '未知錯誤'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Cloud size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">官方雲端資料庫</h2>
                <p className="text-xs text-gray-500">此設定僅限管理員，為店內班表的唯一來源</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><Check size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Important Security Notice */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
             <ShieldCheck className="text-amber-600 shrink-0" size={20} />
             <div className="text-xs text-amber-800 space-y-1">
                <p className="font-bold uppercase tracking-wide">管理員注意</p>
                <p>連結雲端後，系統會自動同步所有變更（包含新密碼）。這確保了即使更換電腦，您的劇本與人員設定也不會消失。</p>
             </div>
          </div>

          {/* 1. Configuration Section */}
          {!isConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100">
                <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={14}/> 如何取得金鑰？</p>
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                  <li>前往 <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="underline font-bold flex-inline items-center gap-0.5">Google Cloud Console <ExternalLink size={10}/></a></li>
                  <li>建立專案並啟用 <strong>Google Drive API</strong></li>
                  <li>建立憑證 (API Key 與 OAuth 2.0 Client ID)</li>
                  <li>將您的網址 (localhost 或正式網域) 加入「已授權的 JavaScript 來源」</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Client ID</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-3 text-gray-400"/>
                  <input 
                    type="text" 
                    value={localConfig.clientId}
                    onChange={e => setLocalConfig({...localConfig, clientId: e.target.value})}
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">API Key</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-3 text-gray-400"/>
                  <input 
                    type="text" 
                    value={localConfig.apiKey}
                    onChange={e => setLocalConfig({...localConfig, apiKey: e.target.value})}
                    placeholder="AIzaSy..."
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={handleConnect}
                disabled={status === 'loading'}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                 {status === 'loading' ? <Loader2 className="animate-spin" size={20}/> : <LogIn size={20}/>}
                 以 Google 帳號授權
              </button>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="bg-green-50 p-4 rounded-xl flex items-center justify-between border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Check size={20} strokeWidth={3} />
                    </div>
                    <div>
                        <p className="font-bold text-green-800">雲端連線正常</p>
                        <p className="text-xs text-green-600">檔案已保存在您的雲端硬碟</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        DriveApi.handleSignoutClick();
                        setIsConnected(false);
                    }}
                    className="text-xs text-gray-500 hover:text-red-500 font-bold underline"
                  >
                    斷開連結
                  </button>
               </div>
               
               {lastSynced && (
                   <p className="text-center text-xs text-gray-400">上次同步時間: {new Date(lastSynced).toLocaleString()}</p>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAction('up')}
                    disabled={status === 'loading'}
                    className="p-4 border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 rounded-xl flex flex-col items-center gap-2 text-blue-700 transition-all active:scale-95"
                  >
                     {status === 'loading' ? <Loader2 className="animate-spin" size={24}/> : <Save size={24} />}
                     <span className="font-bold">強制上傳備份</span>
                     <span className="text-[10px] opacity-70">本機 ➔ 雲端</span>
                  </button>

                  <button 
                    onClick={() => handleAction('down')}
                    disabled={status === 'loading'}
                    className="p-4 border-2 border-orange-100 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 rounded-xl flex flex-col items-center gap-2 text-orange-700 transition-all active:scale-95"
                  >
                     {status === 'loading' ? <Loader2 className="animate-spin" size={24}/> : <Download size={24} />}
                     <span className="font-bold">下載雲端還原</span>
                     <span className="text-[10px] opacity-70">雲端 ➔ 本機</span>
                  </button>
               </div>
               <p className="text-[10px] text-gray-400 text-center italic">* 系統會在任何異動後 5 秒內自動進行背景上傳</p>
            </div>
          )}

          {/* Status Message */}
          {status === 'error' && (
             <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 font-bold animate-in slide-in-from-bottom-2">
                 <AlertCircle size={16} /> {message}
             </div>
          )}
          {status === 'success' && (
             <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2 font-bold animate-in slide-in-from-bottom-2">
                 <Check size={16} /> {message}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CloudSyncModal;
