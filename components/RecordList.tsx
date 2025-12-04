import React, { useState } from 'react';
import { PayrollRecord, RecordStatus } from '../types';
import { Calendar, CreditCard, Users, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';

interface RecordListProps {
  records: PayrollRecord[];
}

export const RecordList: React.FC<RecordListProps> = ({ records }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
        <Users className="mx-auto mb-4 opacity-50" size={48} />
        <p className="text-lg">暂无储备记录</p>
        <p className="text-sm">请使用智能录入功能添加数据</p>
      </div>
    );
  }

  // Sort by updatedAt descending
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const toggleHistory = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {sortedRecords.map((record) => (
        <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            
            {/* Header / Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-900">{record.companyName}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  record.status === RecordStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                  record.status === RecordStatus.PAUSED ? 'bg-gray-100 text-gray-600 border-gray-200' :
                  'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {record.status}
                </span>
                <span className="text-xs text-slate-400 border border-slate-200 px-2 rounded">
                  {record.line}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-slate-400" />
                  <span>规模: {record.totalEmployees}人</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={16} className="text-slate-400" />
                  <span>预计代发: <span className="font-semibold text-slate-900">{record.estimatedPayroll}</span> 人</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-slate-400" />
                  <span>落地: {new Date(record.landingDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100">
                <span className="font-semibold text-slate-900">最新进度: </span>
                {record.progressNotes}
              </div>
            </div>

            {/* Side Stats */}
            <div className="flex flex-col items-end gap-3 min-w-[180px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-right w-full">
                <p className="text-xs text-slate-500 mb-1">已开卡进度</p>
                <div className="flex items-end justify-end gap-1">
                  <span className="text-2xl font-bold text-blue-600">{record.cardsIssued}</span>
                  <span className="text-sm text-slate-400 mb-1">/ {record.estimatedPayroll}</span>
                </div>
                {/* Simple Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `${Math.min(100, (record.cardsIssued / record.estimatedPayroll) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400 mt-2 flex flex-col gap-1 w-full">
                <div className="flex items-center justify-end gap-1">
                   <Clock size={12} />
                   <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="truncate text-slate-500">
                  By {record.updatedByName}
                </div>
                
                <button 
                  onClick={() => toggleHistory(record.id)}
                  className="flex items-center justify-end gap-1 text-blue-500 hover:text-blue-700 mt-1 transition-colors"
                >
                  {expandedId === record.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expandedId === record.id ? '收起历史' : '查看历史'}
                </button>
              </div>
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
  );
};