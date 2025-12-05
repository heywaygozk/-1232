import React, { useState, useEffect } from 'react';
import { User, PayrollRecord, LineType, RecordStatus } from '../types';
import { parseSmartInput } from '../services/geminiService';
import { mockStore } from '../services/mockStore';
import { Loader2, Send, CheckCircle, AlertCircle, Sparkles, RefreshCw, FileSpreadsheet, Upload, Download, Settings } from 'lucide-react';

interface SmartInputProps {
  user: User;
  onSave: () => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({ user, onSave }) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'import'>('ai');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<Partial<PayrollRecord> | null>(null);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([]);

  // CSV Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<PayrollRecord[]>([]);
  const [csvEncoding, setCsvEncoding] = useState<string>('GBK'); // Default to GBK for Excel compatibility in China

  useEffect(() => {
    setAllRecords(mockStore.getAllRecordsUnfiltered());
  }, []);

  // --- AI Logic ---
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

  const handleConfirmAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedData || !parsedData.companyName) return;

    if (existingRecordId) {
      const recordToUpdate = {
        ...parsedData,
        id: existingRecordId,
        department: parsedData.department || user.department, 
      } as PayrollRecord;

      mockStore.updateRecordWithHistory(recordToUpdate, user);
      alert(`已更新 "${recordToUpdate.companyName}" 的记录`);
    } else {
      const newRecord: PayrollRecord = {
        id: crypto.randomUUID(),
        companyName: parsedData.companyName,
        totalEmployees: parsedData.totalEmployees || 0,
        estimatedNewPayroll: parsedData.estimatedNewPayroll || 0,
        estimatedLandingDate: parsedData.estimatedLandingDate || new Date().toISOString(),
        cardsIssued: parsedData.cardsIssued || 0,
        cardSchedule: parsedData.cardSchedule || new Date().toISOString(),
        lastVisitDate: parsedData.lastVisitDate || new Date().toISOString(),
        probability: parsedData.probability || 50,
        progressNotes: parsedData.progressNotes || '',
        updatedAt: new Date().toISOString(),
        updatedByUserId: user.id,
        updatedByName: user.name,
        line: parsedData.line || user.line,
        department: user.department,
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

  // --- Batch Import Logic ---
  const handleDownloadTemplate = () => {
      const headers = ["企业名称", "企业总人数", "预计新增代发人数", "预计落地时间(YYYY-MM-DD)", "已开卡人数", "落地概率(0-100)", "最新走访日期(YYYY-MM-DD)", "进度备注"];
      const csvContent = headers.join(",") + "\n" + "示例企业,100,50,2024-01-01,0,80,2023-11-15,初次拜访有意向";
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "储备导入模板.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportFile(file);
      
      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          parseCSV(text);
      };
      // Use selected encoding (default GBK for Chinese Excel CSVs)
      reader.readAsText(file, csvEncoding);
  };

  // Re-read file when encoding changes
  useEffect(() => {
    if (importFile) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            parseCSV(text);
        };
        reader.readAsText(importFile, csvEncoding);
    }
  }, [csvEncoding]);

  const parseCSV = (text: string) => {
      try {
          const lines = text.split('\n').filter(l => l.trim());
          const records: PayrollRecord[] = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < lines.length; i++) {
              // Handle CSV quote parsing simply (not robust for commas in values, but sufficient for simple template)
              // For robustness, consider a CSV parser library, but here we split by comma
              const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
              if (cols.length < 2) continue;

              records.push({
                  id: crypto.randomUUID(),
                  companyName: cols[0],
                  totalEmployees: parseInt(cols[1]) || 0,
                  estimatedNewPayroll: parseInt(cols[2]) || 0,
                  estimatedLandingDate: cols[3] && !isNaN(Date.parse(cols[3])) ? new Date(cols[3]).toISOString() : new Date().toISOString(),
                  cardsIssued: parseInt(cols[4]) || 0,
                  probability: parseInt(cols[5]) || 50,
                  lastVisitDate: cols[6] && !isNaN(Date.parse(cols[6])) ? new Date(cols[6]).toISOString() : '', // Allow empty
                  progressNotes: cols[7] || '批量导入',
                  cardSchedule: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  updatedByUserId: user.id,
                  updatedByName: user.name,
                  line: user.line,
                  department: user.department,
                  status: RecordStatus.FOLLOWING,
                  history: []
              });
          }
          setImportPreview(records);
      } catch (err) {
          alert("CSV 解析错误，请检查格式");
          setImportPreview([]);
      }
  };

  const handleConfirmImport = () => {
      if (importPreview.length === 0) return;
      mockStore.batchAddRecords(importPreview);
      alert(`成功导入 ${importPreview.length} 条数据`);
      setImportFile(null);
      setImportPreview([]);
      onSave();
  };

  const updateField = (field: keyof PayrollRecord, value: any) => {
    if (parsedData) {
      setParsedData({ ...parsedData, [field]: value });
    }
  };

  const templates = [
    "今日走访了[企业名]，预计[人数]人，落地概率80%，下周落地",
    "已完成[企业名]开卡，今日开卡20张，进度更新为已落地",
    "电话回访[企业名]，暂无进展，概率调整为30%"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Mode Switcher */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex">
          <button 
             onClick={() => setActiveMode('ai')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                 activeMode === 'ai' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <Sparkles size={16}/> 智能AI录入
          </button>
          <button 
             onClick={() => setActiveMode('import')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                 activeMode === 'import' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
             }`}
          >
             <FileSpreadsheet size={16}/> 表格批量导入
          </button>
        </div>
      </div>

      {/* AI Mode */}
      {activeMode === 'ai' && (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-purple-600" />
                <h2 className="text-lg font-bold text-slate-800">智能语音/文本录入</h2>
                </div>
                
                <div className="relative">
                <textarea
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                    placeholder="请输入工作记录，例如：宁波东部科技园预计代发人数调整为200人，落地概率提升至90%..."
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
                <form onSubmit={handleConfirmAI} className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in-up">
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
                    
                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="block text-sm font-medium text-slate-500 mb-1">营销进度</label>
                        <select 
                            value={parsedData.status || RecordStatus.FOLLOWING}
                            onChange={(e) => updateField('status', e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.values(RecordStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
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
                    <label className="block text-sm font-medium text-slate-500 mb-1">预计新增代发人数</label>
                    <input 
                        type="number" 
                        value={parsedData.estimatedNewPayroll || 0}
                        onChange={(e) => updateField('estimatedNewPayroll', parseInt(e.target.value))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-blue-50 border-blue-200"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">预计落地时间</label>
                    <input 
                        type="date" 
                        value={parsedData.estimatedLandingDate ? parsedData.estimatedLandingDate.split('T')[0] : ''}
                        onChange={(e) => updateField('estimatedLandingDate', e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">落地概率 (%)</label>
                    <input 
                        type="number" 
                        min="0" max="100"
                        value={parsedData.probability || 0}
                        onChange={(e) => updateField('probability', parseInt(e.target.value))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-purple-50 border-purple-200"
                    />
                    </div>
                    
                    <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">已开卡人数</label>
                    <input 
                        type="number" 
                        value={parsedData.cardsIssued || 0}
                        onChange={(e) => updateField('cardsIssued', parseInt(e.target.value))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
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
        </>
      )}

      {/* Import Mode */}
      {activeMode === 'import' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
              <div className="border-b pb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">步骤 1: 下载表格模板</h3>
                  <p className="text-sm text-slate-500 mb-4">请下载标准CSV模板，按格式填入数据后上传。</p>
                  <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded transition-colors text-sm font-medium">
                      <Download size={16}/> 下载导入模板.csv
                  </button>
              </div>

              <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center justify-between">
                      步骤 2: 上传填好的表格
                      <div className="flex items-center gap-2 text-sm font-normal">
                          <Settings size={14} className="text-slate-400"/>
                          <span className="text-slate-500">文件编码:</span>
                          <select 
                            value={csvEncoding}
                            onChange={e => setCsvEncoding(e.target.value)}
                            className="bg-slate-100 border-none rounded py-1 px-2 text-slate-700 text-xs focus:ring-1 focus:ring-blue-500"
                          >
                              <option value="GBK">GBK (Excel默认/防乱码)</option>
                              <option value="UTF-8">UTF-8 (标准)</option>
                          </select>
                      </div>
                  </h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                      <input 
                         type="file" 
                         accept=".csv"
                         onChange={handleFileUpload}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload size={32} className="mx-auto text-slate-400 mb-2"/>
                      <p className="text-sm font-medium text-slate-600">点击或拖拽上传 CSV 文件</p>
                      <p className="text-xs text-slate-400 mt-1">支持 CSV 格式 (Excel 可另存为 CSV)</p>
                      {importFile && <p className="mt-2 text-blue-600 font-medium">{importFile.name}</p>}
                  </div>
              </div>

              {importPreview.length > 0 && (
                  <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-slate-800">步骤 3: 确认数据 ({importPreview.length} 条)</h3>
                          <button 
                            onClick={handleConfirmImport}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                          >
                              <CheckCircle size={18}/> 确认导入
                          </button>
                      </div>
                      <div className="overflow-x-auto border rounded-lg max-h-64">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-slate-50 text-slate-500 font-medium">
                                  <tr>
                                      <th className="p-3">企业名称</th>
                                      <th className="p-3">规模</th>
                                      <th className="p-3">预计新增</th>
                                      <th className="p-3">落地时间</th>
                                      <th className="p-3">概率</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y">
                                  {importPreview.map((r, i) => (
                                      <tr key={i} className="hover:bg-slate-50">
                                          <td className="p-3">{r.companyName}</td>
                                          <td className="p-3">{r.totalEmployees}</td>
                                          <td className="p-3">{r.estimatedNewPayroll}</td>
                                          <td className="p-3">{new Date(r.estimatedLandingDate).toLocaleDateString()}</td>
                                          <td className="p-3">{r.probability}%</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};