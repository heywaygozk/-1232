import React, { useState, useMemo } from 'react';
import { PayrollRecord, RecordStatus, LineType, DEPARTMENTS } from '../types';
import { Calendar, CreditCard, Users, Clock, History, ChevronDown, ChevronUp, Filter, ArrowUpDown, Building2 } from 'lucide-react';

interface RecordListProps {
  records: PayrollRecord[];
}

type SortField = 'estimatedNewPayroll' | 'estimatedLandingDate' | 'cardsIssued' | 'probability' | 'lastVisitDate';

export const RecordList: React.FC<RecordListProps> = ({ records }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
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

    // Filter
    if (filterLine) result = result.filter(r => r.line === filterLine);
    if (filterDept) result = result.filter(r => r.department === filterDept);
    if (filterPerson) result = result.filter(r => r.updatedByName.includes(filterPerson));
    if (filterStatus) result = result.filter(r => r.status === filterStatus);

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Date comparison
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
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
                className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  sortField === item.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
                {sortField === item.key && <ArrowUpDown size={12} className={sortOrder === 'desc' ? 'rotate-180' : ''}/>}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} /> 筛选
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 animate-fade-in">
             <select 
               className="p-2 border rounded text-sm bg-slate-50" 
               value={filterLine} 
               onChange={e => {
                 setFilterLine(e.target.value);
                 setFilterDept(''); // Reset dept when line changes
               }}
             >
               <option value="">所有条线</option>
               {Object.values(LineType).map(l => <option key={l} value={l}>{l}</option>)}
             </select>

             <select className="p-2 border rounded text-sm bg-slate-50" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
               <option value="">所有部门</option>
               {filterLine && DEPARTMENTS[filterLine as LineType]?.map(d => <option key={d} value={d}>{d}</option>)}
               {!filterLine && Object.values(DEPARTMENTS).flat().map(d => <option key={d} value={d}>{d}</option>)}
             </select>

             <select className="p-2 border rounded text-sm bg-slate-50" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
               <option value="">所有进度</option>
               {Object.values(RecordStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             
             <input 
               type="text" 
               placeholder="搜索人员姓名" 
               className="p-2 border rounded text-sm bg-slate-50"
               value={filterPerson}
               onChange={e => setFilterPerson(e.target.value)}
             />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {processedRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              
              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">{record.companyName}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    record.status === RecordStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                    record.status === RecordStatus.FAILED ? 'bg-red-100 text-red-600 border-red-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {record.status}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                     概率: <span className={`font-bold ${record.probability > 70 ? 'text-green-600' : record.probability < 40 ? 'text-red-500' : 'text-orange-500'}`}>{record.probability}%</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-3">
                  <div className="flex items-center gap-1.5" title="储备人员">
                    <Users size={16} className="text-slate-400" />
                    <span>{record.updatedByName} <span className="text-xs text-slate-400">({record.department})</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 size={16} className="text-slate-400" />
                    <span>企业规模: <span className="font-semibold text-slate-900">{record.totalEmployees}</span> 人</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={16} className="text-slate-400" />
                    <span>预计新增: <span className="font-semibold text-slate-900">{record.estimatedNewPayroll}</span> 人</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-slate-400" />
                    <span>预计落地: {new Date(record.estimatedLandingDate).toLocaleDateString()}</span>
                  </div>
                   <div className="flex items-center gap-1.5">
                    <Clock size={16} className="text-slate-400" />
                    <span>最近走访: {formatVisitDate(record.lastVisitDate)}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100">
                  <span className="font-semibold text-slate-900">进度备注: </span>
                  {record.progressNotes}
                </div>
              </div>

              {/* Side Stats */}
              <div className="flex flex-col items-end gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-right w-full">
                  <p className="text-xs text-slate-500 mb-1">已开卡进度</p>
                  <div className="flex items-end justify-end gap-1">
                    <span className="text-2xl font-bold text-blue-600">{record.cardsIssued}</span>
                    <span className="text-sm text-slate-400 mb-1">/ {record.estimatedNewPayroll}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${Math.min(100, record.estimatedNewPayroll > 0 ? (record.cardsIssued / record.estimatedNewPayroll) * 100 : 0)}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleHistory(record.id)}
                  className="flex items-center justify-end gap-1 text-blue-500 hover:text-blue-700 mt-1 transition-colors text-xs"
                >
                  {expandedId === record.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expandedId === record.id ? '收起历史' : '查看历史'}
                </button>
              </div>
            </div>

            {/* History Expansion */}
            {expandedId === record.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <History size={12} />
                  变更记录
                </h4>
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                  {record.history && record.history.length > 0 ? (
                    record.history.map((h, i) => (
                      <div key={i} className="text-xs flex gap-3">
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
    </div>
  );
};