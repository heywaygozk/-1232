
import React, { useState, useMemo } from 'react';
import { PayrollRecord, RecordStatus, LineType, DEPARTMENTS, User, Role } from '../types';
import { Calendar, CreditCard, Users, Clock, History, ChevronDown, ChevronUp, Filter, ArrowUpDown, Building2, Edit, Trash2, Download, Save, X } from 'lucide-react';
import { mockStore } from '../services/mockStore';

interface RecordListProps {
  records: PayrollRecord[];
  currentUser: User;
}

type SortField = 'estimatedNewPayroll' | 'estimatedLandingDate' | 'cardsIssued' | 'probability' | 'lastVisitDate';

export const RecordList: React.FC<RecordListProps> = ({ records, currentUser }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('estimatedLandingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtering State
  const [filterLine, setFilterLine] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Derived Data
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (filterLine) result = result.filter(r => r.line === filterLine);
    if (filterDept) result = result.filter(r => r.department === filterDept);
    if (filterPerson) result = result.filter(r => r.updatedByName.includes(filterPerson));
    if (filterStatus) result = result.filter(r => r.status === filterStatus);

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField.includes('Date')) {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, sortField, sortOrder, filterLine, filterDept, filterPerson, filterStatus]);


  const toggleHistory = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatVisitDate = (dateStr: string) => {
    if (!dateStr) return '无走访记录';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '无走访记录';
    return d.toLocaleDateString();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条储备记录吗？此操作不可恢复。')) {
      mockStore.deleteRecord(id);
      window.location.reload(); 
    }
  };

  const handleExportCSV = () => {
    const headers = ["企业名称", "企业规模", "预计新增", "预计落地", "已开卡", "概率", "最近走访", "进度备注", "条线", "部门", "业务人员", "状态"];
    const rows = processedRecords.map(r => [
        r.companyName, r.totalEmployees, r.estimatedNewPayroll, new Date(r.estimatedLandingDate).toLocaleDateString(),
        r.cardsIssued, r.probability, formatVisitDate(r.lastVisitDate), r.progressNotes,
        r.line, r.department, r.updatedByName, r.status
    ].map(v => `"${v}"`).join(','));
    
    const csvContent = "\ufeff" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "储备记录导出.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingRecord) return;
      
      mockStore.updateRecordWithHistory(editingRecord, currentUser);
      setEditingRecord(null);
      window.location.reload(); 
  };

  const updateEditField = (field: keyof PayrollRecord, value: any) => {
    if (editingRecord) {
      setEditingRecord({ ...editingRecord, [field]: value });
    }
  };

  const isAdmin = currentUser.role === Role.ADMIN;


  if (records.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
        <Users className="mx-auto mb-4 opacity-50" size={48} />
        <p className="text-lg">暂无储备记录</p>
        <p className="text-sm">请使用智能录入功能添加数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto no-scrollbar">
            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">排序:</span>
            {[
              { key: 'estimatedNewPayroll', label: '新增人数' },
              { key: 'estimatedLandingDate', label: '落地时间' },
              { key: 'cardsIssued', label: '已开卡' },
              { key: 'probability', label: '概率' },
              { key: 'lastVisitDate', label: '最近走访' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => handleSort(item.key as SortField)}
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap ${
                  sortField === item.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
                {sortField === item.key && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180' : ''}/>}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
                onClick={handleExportCSV}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-green-50 text-green-700 hover:bg-green-100"
            >
                <Download size={16} /> <span className="hidden md:inline">导出列表</span><span className="md:hidden">导出</span>
            </button>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
                <Filter size={16} /> 筛选
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 animate-fade-in">
             <select 
               className="p-2 border rounded text-sm bg-slate-50 w-full" 
               value={filterLine} 
               onChange={e => {
                 setFilterLine(e.target.value);
                 setFilterDept('');
               }}
             >
               <option value="">所有条线</option>
               {Object.values(LineType).map(l => <option key={l} value={l}>{l}</option>)}
             </select>

             <select className="p-2 border rounded text-sm bg-slate-50 w-full" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
               <option value="">所有部门</option>
               {filterLine && DEPARTMENTS[filterLine as LineType]?.map(d => <option key={d} value={d}>{d}</option>)}
               {!filterLine && Object.values(DEPARTMENTS).flat().map(d => <option key={d} value={d}>{d}</option>)}
             </select>

             <select className="p-2 border rounded text-sm bg-slate-50 w-full" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
               <option value="">所有进度</option>
               {Object.values(RecordStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             
             <input 
               type="text" 
               placeholder="搜索人员姓名" 
               className="p-2 border rounded text-sm bg-slate-50 w-full"
               value={filterPerson}
               onChange={e => setFilterPerson(e.target.value)}
             />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {processedRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative">
            
            {/* Action Buttons - Optimized for Mobile (Always visible row or accessible) */}
            <div className="flex justify-between items-start mb-3 md:hidden border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-400">ID: {record.id.slice(0,6)}</span>
                <div className="flex gap-3">
                     <button 
                        onClick={() => setEditingRecord(record)}
                        className="text-blue-600 flex items-center gap-1 text-xs"
                      >
                          <Edit size={14}/> 编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 flex items-center gap-1 text-xs"
                      >
                          <Trash2 size={14}/> 删除
                      </button>
                </div>
            </div>

            {/* Desktop Action Buttons (Hover) */}
            <div className="hidden md:flex absolute top-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => setEditingRecord(record)}
                  className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-100 shadow-sm" title="编辑"
                >
                    <Edit size={14}/>
                </button>
                <button 
                  onClick={() => handleDelete(record.id)}
                  className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-100 shadow-sm" title="删除"
                >
                    <Trash2 size={14}/>
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Main Info */}
              <div className="flex-1 md:pr-12">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{record.companyName}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        record.status === RecordStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                        record.status === RecordStatus.FAILED ? 'bg-red-100 text-red-600 border-red-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                        {record.status}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        概率: <span className={`font-bold ${record.probability > 70 ? 'text-green-600' : record.probability < 40 ? 'text-red-500' : 'text-orange-500'}`}>{record.probability}%</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-1.5 w-full md:w-auto" title="储备人员">
                    <Users size={16} className="text-slate-400 shrink-0" />
                    <span>{record.updatedByName} <span className="text-xs text-slate-400">({record.department})</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 w-[45%] md:w-auto">
                    <Building2 size={16} className="text-slate-400 shrink-0" />
                    <span>规模: <span className="font-semibold text-slate-900">{record.totalEmployees}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 w-[45%] md:w-auto">
                    <CreditCard size={16} className="text-slate-400 shrink-0" />
                    <span>预计: <span className="font-semibold text-slate-900">{record.estimatedNewPayroll}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full md:w-auto">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <span>落地: {new Date(record.estimatedLandingDate).toLocaleDateString()}</span>
                  </div>
                   <div className="flex items-center gap-1.5 w-full md:w-auto">
                    <Clock size={16} className="text-slate-400 shrink-0" />
                    <span>走访: {formatVisitDate(record.lastVisitDate)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100">
                  <span className="font-semibold text-slate-900">进度备注: </span>
                  {record.progressNotes}
                </div>
              </div>

              {/* Side Stats */}
              <div className="flex flex-row md:flex-col justify-between md:items-end gap-3 w-full md:min-w-[180px] md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="md:text-right flex-1">
                  <p className="text-xs text-slate-500 mb-1">已开卡进度</p>
                  <div className="flex items-baseline md:justify-end gap-1">
                    <span className="text-2xl font-bold text-blue-600">{record.cardsIssued}</span>
                    <span className="text-sm text-slate-400 mb-1">/ {record.estimatedNewPayroll}</span>
                  </div>
                  <div className="w-full md:w-32 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden ml-auto">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, record.estimatedNewPayroll > 0 ? (record.cardsIssued / record.estimatedNewPayroll) * 100 : 0)}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleHistory(record.id)}
                  className="flex items-center justify-end gap-1 text-blue-500 hover:text-blue-700 mt-1 transition-colors text-xs whitespace-nowrap"
                >
                  {expandedId === record.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expandedId === record.id ? '收起历史' : '查看历史'}
                </button>
              </div>
            </div>

            {expandedId === record.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <History size={12} />
                  变更记录
                </h4>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                  {record.history && record.history.length > 0 ? (
                    record.history.map((h, i) => (
                      <div key={i} className="text-xs flex gap-3 flex-col md:flex-row md:items-center">
                        <span className="text-slate-400 min-w-[80px]">
                          {new Date(h.date).toLocaleDateString()}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-700 mr-2">{h.updatedByName}:</span>
                          <span className="text-slate-600">{h.changeSummary}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                     <div className="text-xs text-slate-400 italic">暂无历史记录</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingRecord && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-4 md:p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="text-xl font-bold text-slate-800">编辑储备记录</h3>
                      <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSaveEdit} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 mb-1">企业名称</label>
                          <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" value={editingRecord.companyName} onChange={e => updateEditField('companyName', e.target.value)} />
                      </div>
                      
                      {/* Ownership fields - Only Admin can edit */}
                      <div className={`p-4 bg-slate-50 rounded md:col-span-2 border border-slate-100 ${!isAdmin ? 'opacity-70' : ''}`}>
                          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                              {isAdmin ? <Edit size={12}/> : <ShieldCheck size={12}/>}
                              归属信息 {isAdmin ? '(管理员权限)' : '(仅管理员可修改)'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">条线</label>
                                <select 
                                    className="w-full p-2 border rounded bg-white" 
                                    value={editingRecord.line} 
                                    onChange={e => updateEditField('line', e.target.value)}
                                    disabled={!isAdmin}
                                >
                                    {Object.values(LineType).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">部门</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded bg-white" 
                                    value={editingRecord.department} 
                                    onChange={e => updateEditField('department', e.target.value)}
                                    disabled={!isAdmin}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">业务人员</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded bg-white" 
                                    value={editingRecord.updatedByName} 
                                    onChange={e => updateEditField('updatedByName', e.target.value)}
                                    disabled={!isAdmin}
                                />
                            </div>
                          </div>
                      </div>

                      <div className="md:col-span-2 border-t pt-2">
                         <label className="block text-sm font-medium text-slate-600 mb-1">营销状态</label>
                          <select className="w-full p-2 border rounded" value={editingRecord.status} onChange={e => updateEditField('status', e.target.value)}>
                              {Object.values(RecordStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">企业总人数</label>
                          <input type="number" className="w-full p-2 border rounded" value={editingRecord.totalEmployees} onChange={e => updateEditField('totalEmployees', parseInt(e.target.value))} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">预计新增人数</label>
                          <input type="number" className="w-full p-2 border rounded" value={editingRecord.estimatedNewPayroll} onChange={e => updateEditField('estimatedNewPayroll', parseInt(e.target.value))} />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">落地概率(%)</label>
                          <input type="number" min="0" max="100" className="w-full p-2 border rounded" value={editingRecord.probability} onChange={e => updateEditField('probability', parseInt(e.target.value))} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">已开卡人数</label>
                          <input type="number" className="w-full p-2 border rounded" value={editingRecord.cardsIssued} onChange={e => updateEditField('cardsIssued', parseInt(e.target.value))} />
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">预计落地时间</label>
                          <input type="date" className="w-full p-2 border rounded" value={new Date(editingRecord.estimatedLandingDate).toISOString().split('T')[0]} onChange={e => updateEditField('estimatedLandingDate', new Date(e.target.value).toISOString())} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">最近走访时间</label>
                          <input type="date" className="w-full p-2 border rounded" value={new Date(editingRecord.lastVisitDate).toISOString().split('T')[0] || ''} onChange={e => updateEditField('lastVisitDate', new Date(e.target.value).toISOString())} />
                      </div>

                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-600 mb-1">进度备注</label>
                          <textarea className="w-full p-2 border rounded" rows={3} value={editingRecord.progressNotes} onChange={e => updateEditField('progressNotes', e.target.value)} />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2 pb-safe-area-bottom">
                          <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 md:flex-none px-4 py-3 md:py-2 text-slate-600 hover:bg-slate-100 rounded bg-slate-50 md:bg-transparent">取消</button>
                          <button type="submit" className="flex-1 md:flex-none px-6 py-3 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18}/> 保存变更</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

// Minimal import of ShieldCheck for the edit modal
function ShieldCheck({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  )
}
