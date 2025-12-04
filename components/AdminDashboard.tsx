
import React, { useMemo } from 'react';
import { PayrollRecord, User, RecordStatus, Role, LineType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, Target, Award, Copy, MessageSquare } from 'lucide-react';

interface AdminDashboardProps {
  records: PayrollRecord[];
  allUsers: User[];
  currentUser: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ records, allUsers, currentUser }) => {
  
  // --- 1. Aggregation Logic based on Role (The Drill-down) ---
  const breakdownCharts = useMemo(() => {
    const charts = [];
    
    // Helper to group records by a key
    const groupBy = (key: keyof PayrollRecord | 'updatedByName') => {
      const map = new Map<string, number>();
      records.forEach(r => {
        // If grouping by status "Completed" or just "Estimated" reserve? 
        // Request says "Reserve Percentage", so usually Estimated Payroll count.
        const val = r.estimatedPayroll;
        const groupKey = key === 'updatedByName' ? r.updatedByName : String(r[key]);
        map.set(groupKey, (map.get(groupKey) || 0) + val);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    // Logic:
    // Staff -> Companies
    // Manager -> Staff, Companies
    // VP -> Departments, Staff, Companies
    // President -> Lines, Departments, Staff, Companies
    
    // Everyone sees Companies
    charts.push({ title: '各企业储备占比', data: groupBy('companyName') });

    if (currentUser.role !== Role.STAFF) {
      // Manager & up see Staff breakdown
      charts.push({ title: '各人员储备占比', data: groupBy('updatedByName') });
    }

    if (currentUser.role === Role.VP_CORPORATE || currentUser.role === Role.VP_RETAIL || currentUser.role === Role.VP_PERSONAL || currentUser.role === Role.BRANCH_PRESIDENT || currentUser.role === Role.ADMIN) {
       // VP & up see Dept breakdown
       charts.push({ title: '各部门/网点储备占比', data: groupBy('department') });
    }

    if (currentUser.role === Role.BRANCH_PRESIDENT || currentUser.role === Role.ADMIN) {
       // President sees Line breakdown
       charts.push({ title: '各条线储备占比', data: groupBy('line') });
    }

    // Reverse order so higher level aggregation comes first visually
    return charts.reverse();

  }, [records, currentUser.role]);

  // --- 2. KPI Metrics (Respecting the filtered records passed in) ---
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthLandedCount = 0;   
    let monthProjectedCount = 0; 
    let yearLandedCount = 0;     

    records.forEach(r => {
      const d = new Date(r.landingDate);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const isThisYear = d.getFullYear() === currentYear;

      if (r.status === RecordStatus.COMPLETED) {
        if (isThisYear) yearLandedCount += r.estimatedPayroll;
        if (isThisMonth) monthLandedCount += r.estimatedPayroll;
      }
      if (r.status === RecordStatus.FOLLOWING && isThisMonth) {
        monthProjectedCount += r.estimatedPayroll;
      }
    });

    // Calculate Target based on Role Scope
    // Staff -> Own Target
    // Mgr -> Sum of Dept Staff Targets
    // VP -> Sum of Line Staff Targets
    // Pres -> Sum of All Targets
    let target = 0;
    
    // We need to filter allUsers based on the same scope as records to sum their targets
    // A simple way is to use the record filtering logic or just sum targets of users relevant to current user
    if (currentUser.role === Role.STAFF) {
        target = currentUser.yearlyTarget;
    } else if (currentUser.role === Role.DEPARTMENT_MANAGER) {
        target = allUsers.filter(u => u.department === currentUser.department).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_CORPORATE) {
        target = allUsers.filter(u => u.line === LineType.COMPANY).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_RETAIL) {
        target = allUsers.filter(u => u.line === LineType.RETAIL).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_PERSONAL) {
        target = allUsers.filter(u => u.line === LineType.PERSONAL).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else {
        // President / Admin
        target = allUsers.reduce((acc, u) => acc + u.yearlyTarget, 0);
    }

    const gap = Math.max(0, target - yearLandedCount);
    const progress = target > 0 ? (yearLandedCount / target) * 100 : 0;

    return { monthLandedCount, monthProjectedCount, yearLandedCount, target, gap, progress };
  }, [records, currentUser, allUsers]);


  // --- 3. WeCom Reminder Logic ---
  const handleCopyReminder = (userName: string) => {
    const text = `【代发储备提醒】@${userName} 您有项目长期未更新，请及时登录系统维护进度。`;
    navigator.clipboard.writeText(text).then(() => {
      alert(`已复制提醒内容到剪贴板，请发送给 ${userName}：\n\n${text}`);
    });
  };

  // Find users who haven't updated recently (Mock logic: Staff who haven't updated in 7 days or just random for demo)
  const staleUsers = useMemo(() => {
      // In a real app, check last update time of their records
      // Here, just filter staff in the current user's scope
      let relevantStaff: User[] = [];
      if (currentUser.role === Role.BRANCH_PRESIDENT || currentUser.role === Role.ADMIN) {
          relevantStaff = allUsers.filter(u => u.role === Role.STAFF);
      } else if (currentUser.role === Role.DEPARTMENT_MANAGER) {
          relevantStaff = allUsers.filter(u => u.role === Role.STAFF && u.department === currentUser.department);
      } else {
          // VP
           relevantStaff = allUsers.filter(u => u.role === Role.STAFF && u.line === currentUser.line);
      }
      // Return first 3 for demo
      return relevantStaff.slice(0, 3);
  }, [allUsers, currentUser]);


  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Calendar size={64} className="text-blue-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">本月已落地 (人)</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-3xl font-bold text-slate-900">{metrics.monthLandedCount}</h3>
          </div>
          <div className="text-xs text-slate-500"><span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">预计还可落地: {metrics.monthProjectedCount}</span></div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><Award size={64} className="text-purple-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">今年累计已代发 (人)</p>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{metrics.yearLandedCount}</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full transition-all duration-1000" style={{width: `${Math.min(100, metrics.progress)}%`}}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><Target size={64} className="text-red-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">年度指标缺口</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-red-600">{metrics.gap.toLocaleString()}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">目标: {metrics.target.toLocaleString()}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 h-full">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
            <div>
              <p className="text-sm text-slate-500">当前总储备池</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {records.reduce((acc, r) => acc + r.estimatedPayroll, 0).toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Breakdown Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 space-y-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-slate-400"/>
                储备结构分析 (Drill-down)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {breakdownCharts.map((chart, idx) => (
                    <div key={idx} className="h-64 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                        <p className="text-xs text-center font-medium text-slate-500 mb-2">{chart.title}</p>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chart.data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chart.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ))}
            </div>
        </div>

        {/* Monitoring / WeCom Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500"/>
            督导催办 (WeCom)
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-xs font-bold text-orange-800 mb-2 uppercase">建议催办名单</p>
              <p className="text-xs text-orange-600 mb-3">以下人员超过7天未更新进度，点击按钮复制催办话术发送至企业微信。</p>
              
              <div className="space-y-2">
                 {staleUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-orange-100">
                        <div>
                            <span className="font-medium text-sm text-slate-700">{u.name}</span>
                            <span className="text-xs text-slate-400 ml-1">({u.department})</span>
                        </div>
                        <button 
                            onClick={() => handleCopyReminder(u.name)}
                            className="text-xs bg-orange-100 text-orange-700 px-2 py-1.5 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
                        >
                            <Copy size={12}/> 复制提醒
                        </button>
                    </div>
                 ))}
                 {staleUsers.length === 0 && <p className="text-xs text-slate-400 text-center">暂无待催办人员</p>}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
               <p className="text-xs font-bold text-blue-600 mb-2">本月即将落地 (7天内)</p>
               <ul className="space-y-2">
                 {records
                   .filter(r => r.status === RecordStatus.FOLLOWING)
                   .sort((a,b) => new Date(a.landingDate).getTime() - new Date(b.landingDate).getTime())
                   .slice(0, 3)
                   .map(r => (
                     <li key={r.id} className="text-xs flex justify-between items-center text-blue-900 border-b border-blue-100 last:border-0 pb-1 last:pb-0">
                       <div className="flex flex-col">
                           <span className="font-medium truncate max-w-[120px]">{r.companyName}</span>
                           <span className="text-[10px] text-blue-400">{r.updatedByName}</span>
                       </div>
                       <span className="font-mono bg-white px-1 rounded">{new Date(r.landingDate).toLocaleDateString().slice(5)}</span>
                     </li>
                   ))
                 }
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
