import React, { useState, useEffect } from 'react';
import { User, PayrollRecord, LineType, RecordStatus } from '../types';
import { parseSmartInput } from '../services/geminiService';
import { mockStore } from '../services/mockStore';
import { Loader2, Send, CheckCircle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface SmartInputProps {
  user: User;
  onSave: () => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ user, onSave }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<PayrollRecord> | null>(null);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    setAllRecords(mockStore.getAllRecordsUnfiltered());
  }, []);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setError(null);
    setParsedData(null);
    setExistingRecordId(null);

    try {
      const result = await parseSmartInput(input, user);
      
      const match = allRecords.find(r => 
        r.companyName.trim() === result.companyName?.trim() || 
        (result.companyName && r.companyName.includes(result.companyName))
      );

      if (match) {
        setExistingRecordId(match.id);
        setParsedData({
          ...match,
          ...result,
          companyName: match.companyName,
        });
      } else {
        setParsedData(result);
      }
    } catch (err) {
      setError("AI 解析失败，请重试或检查网络。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData || !parsedData.companyName) return;

    if (existingRecordId) {
      const recordToUpdate = {
        ...parsedData,
        id: existingRecordId,
        department: parsedData.department || user.department, // Preserve or update department
      } as PayrollRecord;

      mockStore.updateRecordWithHistory(recordToUpdate, user);
      alert(`已更新 "${recordToUpdate.companyName}" 的记录`);
    } else {
      const newRecord: PayrollRecord = {
        id: crypto.randomUUID(),
        companyName: parsedData.companyName,
        totalEmployees: parsedData.totalEmployees || 0,
        estimatedPayroll: parsedData.estimatedPayroll || 0,
        landingDate: parsedData.landingDate || new Date().toISOString(),
        cardsIssued: parsedData.cardsIssued || 0,
        cardSchedule: parsedData.cardSchedule || new Date().toISOString(),
        lastVisitDate: parsedData.lastVisitDate || new Date().toISOString(),
        progressNotes: parsedData.progressNotes || '',
        updatedAt: new Date().toISOString(),
        updatedByUserId: user.id,
        updatedByName: user.name,
        line: parsedData.line || user.line,
        department: user.department, // Important: Bind to user's department
        status: parsedData.status || RecordStatus.FOLLOWING,
        history: [] 
      };
      mockStore.addRecord(newRecord);
      alert("新储备记录已创建");
    }

    onSave();
    setParsedData(null);
    setInput('');
    setExistingRecordId(null);
    setAllRecords(mockStore.getAllRecordsUnfiltered());
  };

  const updateField = (field: keyof PayrollRecord, value: any) => {
    if (parsedData) {
      setParsedData({ ...parsedData, [field]: value });
    }
  };

  const templates = [
    "今日走访了[企业名]，预计[人数]人，下周落地",
    "已完成[企业名]开卡，今日开卡20张",
    "电话回访[企业名]，暂无进展"
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" />
          <h2 className="text-lg font-bold text-slate-800">智能语音/文本录入</h2>
        </div>
        
        <div className="relative">
          <textarea
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            placeholder="请输入工作记录，例如：宁波东部科技园预计代发人数调整为200人..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
          <button
            onClick={handleAnalyze}
            disabled={isProcessing || !input.trim()}
            className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            AI 解析
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {templates.map((t, i) => (
            <button 
              key={i} 
              onClick={() => setInput(t)}
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {parsedData && (
        <form onSubmit={handleConfirm} className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-800">
                {existingRecordId ? '更新现有记录' : '创建新记录'}
              </h3>
              {existingRecordId ? (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200 font-medium">
                  <RefreshCw size={12} />
                  已关联历史数据
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                  新规录入
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">企业名称</label>
              <input 
                type="text" 
                required
                value={parsedData.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-slate-50"
                readOnly={!!existingRecordId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">所属条线</label>
              <select 
                value={parsedData.line || user.line}
                onChange={(e) => updateField('line', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(LineType).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">企业总人数</label>
              <input 
                type="number" 
                value={parsedData.totalEmployees || 0}
                onChange={(e) => updateField('totalEmployees', parseInt(e.target.value))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">预计代发人数</label>
              <input 
                type="number" 
                value={parsedData.estimatedPayroll || 0}
                onChange={(e) => updateField('estimatedPayroll', parseInt(e.target.value))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-blue-50 border-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">预计落地时间</label>
              <input 
                type="date" 
                value={parsedData.landingDate ? parsedData.landingDate.split('T')[0] : ''}
                onChange={(e) => updateField('landingDate', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">已开卡人数</label>
              <input 
                type="number" 
                value={parsedData.cardsIssued || 0}
                onChange={(e) => updateField('cardsIssued', parseInt(e.target.value))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-blue-50 border-blue-200"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-500 mb-1">营销进度备注</label>
              <textarea 
                rows={3}
                value={parsedData.progressNotes || ''}
                onChange={(e) => updateField('progressNotes', e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-yellow-50 border-yellow-200"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => {
                setParsedData(null);
                setExistingRecordId(null);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              取消
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <CheckCircle size={18} />
              {existingRecordId ? '确认更新' : '确认创建'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};