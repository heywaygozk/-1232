
import React, { useMemo } from 'react';
import { PayrollRecord, RecordStatus, LineType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatsReportProps {
  records: PayrollRecord[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  [RecordStatus.FOLLOWING]: '#3b82f6', // Blue
  [RecordStatus.COMPLETED]: '#22c55e', // Green
  [RecordStatus.FAILED]: '#ef4444',    // Red
};

export const StatsReport: React.FC<StatsReportProps> = ({ records }) => {

  // --- 1. Overview Cards Data ---
  const overview = useMemo(() => {
    const total = records.reduce((acc, r) => acc + r.estimatedNewPayroll, 0);
    const completed = records.filter(r => r.status === RecordStatus.COMPLETED).reduce((acc, r) => acc + r.estimatedNewPayroll, 0);
    const failed = records.filter(r => r.status === RecordStatus.FAILED).reduce((acc, r) => acc + r.estimatedNewPayroll, 0);
    const following = records.filter(r => r.status === RecordStatus.FOLLOWING).reduce((acc, r) => acc + r.estimatedNewPayroll, 0);
    
    // Conversion Rate (Completed / (Completed + Failed)) or (Completed / Total) depending on definition. 
    // Usually (Completed / Total Projects) or (Completed / Total Payroll).
    // Let's use Completed Payroll / Total Payroll
    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, failed, following, conversionRate };
  }, [records]);

  // --- 2. Charts Data ---
  
  // A. Status Distribution (Pie)
  const statusData = useMemo(() => {
    const data = [
      { name: RecordStatus.FOLLOWING, value: overview.following },
      { name: RecordStatus.COMPLETED, value: overview.completed },
      { name: RecordStatus.FAILED, value: overview.failed },
    ].filter(d => d.value > 0);
    return data;
  }, [overview]);

  // B. Probability Distribution (Bar)
  const probabilityData = useMemo(() => {
    // Buckets: 0-30%, 31-60%, 61-90%, 91-100%
    const buckets = {
      '低 (0-30%)': 0,
      '中 (31-60%)': 0,
      '高 (61-90%)': 0,
      '极高 (90%+)': 0
    };
    records.filter(r => r.status === RecordStatus.FOLLOWING).forEach(r => {
       if (r.probability <= 30) buckets['低 (0-30%)'] += r.estimatedNewPayroll;
       else if (r.probability <= 60) buckets['中 (31-60%)'] += r.estimatedNewPayroll;
       else if (r.probability <= 90) buckets['高 (61-90%)'] += r.estimatedNewPayroll;
       else buckets['极高 (90%+)'] += r.estimatedNewPayroll;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [records]);

  // C. Line/Dept Breakdown (Bar)
  // Show top contributors (Dept or Person)
  const contributionData = useMemo(() => {
     const map = new Map<string, number>();
     // If user sees many depts, group by Dept. If only one dept, group by Person.
     // Simple heuristic: Count unique departments
     const uniqueDepts = new Set(records.map(r => r.department));
     const groupKey = uniqueDepts.size > 1 ? 'department' : 'updatedByName';
     const label = uniqueDepts.size > 1 ? '部门' : '人员';

     records.forEach(r => {
         const key = r[groupKey as keyof PayrollRecord] as string;
         map.set(key, (map.get(key) || 0) + r.estimatedNewPayroll);
     });

     return {
         label,
         data: Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8) // Top 8
     };
  }, [records]);


  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-slate-500 mb-2"><TrendingUp size={16}/> 总储备 (人)</div>
           <div className="text-2xl font-bold text-slate-900">{overview.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-blue-500 mb-2"><Clock size={16}/> 跟进中 (人)</div>
           <div className="text-2xl font-bold text-blue-600">{overview.following}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle size={16}/> 已落地 (人)</div>
           <div className="text-2xl font-bold text-green-600">{overview.completed}</div>
           <div className="text-xs text-slate-400 mt-1">转化率 {overview.conversionRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 text-red-500 mb-2"><XCircle size={16}/> 无法落地 (人)</div>
           <div className="text-2xl font-bold text-red-600">{overview.failed}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
            <h3 className="font-bold text-slate-700 mb-4">储备状态分布 (按人数)</h3>
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                     {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as RecordStatus] || COLORS[index]} />
                     ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
            </ResponsiveContainer>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
            <h3 className="font-bold text-slate-700 mb-4">跟进中项目 - 落地概率分布</h3>
            <ResponsiveContainer width="100%" height="90%">
               <BarChart data={probabilityData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#8884d8" name="预计人数" radius={[0, 4, 4, 0]}>
                    {probabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>

      </div>

      {/* Charts Row 2 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-96">
         <h3 className="font-bold text-slate-700 mb-4">Top 8 {contributionData.label} 储备贡献排行</h3>
         <ResponsiveContainer width="100%" height="90%">
            <BarChart data={contributionData.data} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="value" fill="#3b82f6" name="预计新增代发人数" radius={[4, 4, 0, 0]} />
            </BarChart>
         </ResponsiveContainer>
      </div>

    </div>
  );
};
