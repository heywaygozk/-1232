
import React, { useState, useEffect } from 'react';
import { mockStore } from '../services/mockStore';
import { CloudConfig } from '../types';
import { Cloud, Save, CheckCircle, RefreshCw, ExternalLink, AlertTriangle, Info } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<CloudConfig>({
    enabled: false,
    apiKey: '',
    binId: ''
  });
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const stored = mockStore.getCloudConfig();
    if (stored) setConfig(stored);
  }, []);

  const handleSave = () => {
    mockStore.saveCloudConfig(config);
    alert('配置已保存！建议立即进行一次同步测试。');
    setSyncResult(null);
  };

  const handleSync = async () => {
    if (!config.apiKey || !config.binId) {
        alert("请先填写配置信息");
        return;
    }
    setLoading(true);
    setSyncResult(null);
    const res = await mockStore.syncWithCloud();
    setLoading(false);
    setSyncResult(res);
    
    // Refresh page data if successful to show new data
    if (res.success) {
        // We can optionally force a reload or just let the user navigate
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Intro Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-3 bg-blue-100 rounded-full text-blue-600">
             <Cloud size={24} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-800">云端数据同步设置</h2>
             <p className="text-sm text-slate-500">配置云存储后，多台设备可通过云端实现数据共享与备份。</p>
           </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
           <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
           <div className="text-sm text-amber-800">
              <strong>原理说明：</strong> 本系统使用 <code>JSONBin.io</code> 作为免费的云数据库。所有用户需配置 <strong>相同的 Key 和 Bin ID</strong> 才能看到彼此的数据。请管理员创建好后分发给所有员工。
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">启用云同步</label>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="absolute w-6 h-6 opacity-0 cursor-pointer"
                            checked={config.enabled}
                            onChange={(e) => setConfig({...config, enabled: e.target.checked})}
                        />
                        <span className={`block w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                        <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enabled ? 'translate-x-6' : ''}`}></span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">JSONBin Master Key (X-Master-Key)</label>
                    <input 
                        type="password" 
                        value={config.apiKey}
                        onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="$2b$10$..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Bin ID</label>
                    <input 
                        type="text" 
                        value={config.binId}
                        onChange={(e) => setConfig({...config, binId: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="671..."
                    />
                </div>

                <div className="pt-2 flex gap-3">
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-slate-800 text-white py-2 rounded hover:bg-slate-900 flex items-center justify-center gap-2"
                    >
                        <Save size={18}/> 保存配置
                    </button>
                    <button 
                        onClick={handleSync}
                        disabled={loading || !config.enabled}
                        className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                         {loading ? <RefreshCw className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                         立即同步
                    </button>
                </div>

                {syncResult && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${syncResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {syncResult.success ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                        {syncResult.message}
                    </div>
                )}
            </div>

            {/* Guide */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 text-sm text-slate-600 space-y-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Info size={16} className="text-blue-500"/>
                    如何获取免费配置？
                </h3>
                <ol className="list-decimal pl-4 space-y-2">
                    <li>访问 <a href="https://jsonbin.io/login" target="_blank" className="text-blue-600 underline flex items-center inline-flex gap-1">JSONBin.io <ExternalLink size={10}/></a> 并注册/登录。</li>
                    <li>在 Dashboard 中点击 "Create Bin"。复制生成的 <strong>Bin ID</strong>。</li>
                    <li>点击顶部的 "API Keys"，复制 <strong>Master Key</strong>。</li>
                    <li>将这两个值填入左侧表单并保存。</li>
                    <li>将这两个值分享给你的团队成员，让他们也填入同样的配置。</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">注意：JSONBin 免费版有请求次数限制，请勿频繁点击同步。</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
