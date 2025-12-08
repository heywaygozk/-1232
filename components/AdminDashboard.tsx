
import React, { useMemo, useState } from 'react';
import { PayrollRecord, User, RecordStatus, Role, LineType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, Target, Award, Briefcase, Clock, ChevronDown, ChevronUp, Flag, Calculator } from 'lucide-react';

interface AdminDashboardProps {
  records: PayrollRecord[];
  allUsers: User[];
  currentUser: User;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ records, allUsers, currentUser }) => {
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllStale, setShowAllStale] = useState(false);
  const [staleSortBy, setStaleSortBy] = useState<'employees' | 'days'>('days');

  // --- Aggregation Logic (The Drill-down) ---
  const breakdownCharts = useMemo(() => {
    const charts = [];
    const groupBy = (key: keyof PayrollRecord | 'updatedByName') => {
      const map = new Map<string, number>();
      records.forEach(r => {
        const val = r.estimatedNewPayroll;
        const groupKey = key === 'updatedByName' ? r.updatedByName : String(r[key]);
        map.set(groupKey, (map.get(groupKey) || 0) + val);
      });
      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    // Requirement: Admin, Branch President, VPs should NOT see the Company Share chart.
    const isUpperManagement = [
        Role.ADMIN, 
        Role.BRANCH_PRESIDENT, 
        Role.VP_CORPORATE, 
        Role.VP_RETAIL, 
        Role.VP_PERSONAL
    ].includes(currentUser.role);

    // Only show Company breakdown if NOT upper management (i.e., Staff or Dept Managers)
    if (!isUpperManagement) {
        charts.push({ title: '各企业储备占比', data: groupBy('companyName') });
    }

    // Everyone except Staff sees Personnel breakdown
    if (currentUser.role !== Role.STAFF) {
      charts.push({ title: '各人员储备占比', data: groupBy('updatedByName') });
    }

    // Upper management sees Dept breakdown
    if (isUpperManagement || currentUser.role === Role.DEPARTMENT_MANAGER) {
       charts.push({ title: '各部门/网点储备占比', data: groupBy('department') });
    }

    // Only President and Admin see Line breakdown
    if (currentUser.role === Role.BRANCH_PRESIDENT || currentUser.role === Role.ADMIN) {
       charts.push({ title: '各条线储备占比', data: groupBy('line') });
    }

    // Reverse so higher level aggregation (Line/Dept) comes first visually
    return charts.reverse();

  }, [records, currentUser.role]);

  // --- KPI Metrics ---
  const metrics = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate Week Range (Mon - Sun)
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    // Distance to previous Monday. If Sun (0), dist is 6. If Mon (1), dist is 0.
    const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMon);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    let monthPendingCount = 0;
    let weekUpcomingCount = 0;
    let overdueCount = 0;
    let overduePayroll = 0;
    let overdueList: PayrollRecord[] = [];
    let yearLandedCount = 0;
    let weightedMonthLanding = 0;

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let staleList: { record: PayrollRecord, days: number }[] = [];

    records.forEach(r => {
      const landingDate = new Date(r.estimatedLandingDate);
      // Normalize landing date for comparison (start of day)
      const landingDateStart = new Date(landingDate);
      landingDateStart.setHours(0,0,0,0);

      const lastVisit = new Date(r.lastVisitDate);
      lastVisit.setHours(0,0,0,0);
      
      const isThisMonth = landingDate.getMonth() === currentMonth && landingDate.getFullYear() === currentYear;
      const isThisYear = landingDate.getFullYear() === currentYear;

      // 1. Month Pending: Status FOLLOWING + Landing Date in Current Month
      if (r.status === RecordStatus.FOLLOWING && isThisMonth) {
        monthPendingCount += r.estimatedNewPayroll;
        // Weighted logic
        weightedMonthLanding += Math.round(r.estimatedNewPayroll * (r.probability / 100));
      }

      // 2. Week Upcoming: Status FOLLOWING + Landing Date within Mon-Sun window
      if (r.status === RecordStatus.FOLLOWING && landingDateStart >= monday && landingDateStart <= sunday) {
        weekUpcomingCount += r.estimatedNewPayroll;
      }

      // 3. Overdue: Status FOLLOWING + Landing Date < Today
      if (r.status === RecordStatus.FOLLOWING && landingDateStart < now) {
        overdueCount++;
        overduePayroll += r.estimatedNewPayroll;
        overdueList.push(r);
      }

      // 4. Yearly Landed
      if (r.status === RecordStatus.COMPLETED && isThisYear) {
          yearLandedCount += r.estimatedNewPayroll;
      }

      // 5. Stale (> 30 Days)
      if (lastVisit < thirtyDaysAgo && r.status === RecordStatus.FOLLOWING) {
          const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          staleList.push({ record: r, days: diffDays });
      }
    });

    // Calculate Target
    let yearlyTarget = 0;
    if (currentUser.role === Role.STAFF) {
        yearlyTarget = currentUser.yearlyTarget;
    } else if (currentUser.role === Role.DEPARTMENT_MANAGER) {
        yearlyTarget = allUsers.filter(u => u.department === currentUser.department).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_CORPORATE) {
        yearlyTarget = allUsers.filter(u => u.line === LineType.COMPANY).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_RETAIL) {
        yearlyTarget = allUsers.filter(u => u.line === LineType.RETAIL).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else if (currentUser.role === Role.VP_PERSONAL) {
        yearlyTarget = allUsers.filter(u => u.line === LineType.PERSONAL).reduce((acc, u) => acc + u.yearlyTarget, 0);
    } else {
        yearlyTarget = allUsers.reduce((acc, u) => acc + u.yearlyTarget, 0);
    }

    const completionRate = yearlyTarget > 0 ? (yearLandedCount / yearlyTarget) * 100 : 0;

    return { 
      monthPendingCount, 
      weekUpcomingCount, 
      overdueCount, 
      overduePayroll,
      overdueList: overdueList.sort((a,b) => new Date(a.estimatedLandingDate).getTime() - new Date(b.estimatedLandingDate).getTime()),
      yearlyTarget,
      yearLandedCount,
      completionRate,
      staleList,
      weightedMonthLanding
    };
  }, [records, currentUser, allUsers]);

  const sortedStaleList = useMemo(() => {
      const list = [...metrics.staleList];
      if (staleSortBy === 'employees') {
          list.sort((a, b) => b.record.totalEmployees - a.record.totalEmployees);
      } else {
          list.sort((a, b) => b.days - a.days);
      }
      return list;
  }, [metrics.staleList, staleSortBy]);


  return (
    <div className="space-y-6">
      
      {/* Yearly KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg text-white flex justify-between items-center">
             <div>
                 <p className="text-blue-100 text-sm mb-1 flex items-center gap-1"><Flag size={16}/> 年度任务指标</p>
                 <h2 className="text-3xl font-bold">{metrics.yearlyTarget.toLocaleString()} <span className="text-base font-normal opacity-80">人</span></h2>
             </div>
             <div className="text-right">
                 <p className="text-blue-100 text-sm mb-1">年度完成率</p>
                 <h2 className="text-3xl font-bold">{metrics.completionRate.toFixed(1)}%</h2>
             </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
             <div>
                 <p className="text-slate-500 text-sm mb-1">年度已落地代发</p>
                 <h2 className="text-3xl font-bold text-slate-800">{metrics.yearLandedCount.toLocaleString()}</h2>
             </div>
             <div className="h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                <Award className="text-yellow-500" size={32} />
             </div>
         </div>
      </div>

      {/* KPI Cards (Monthly/Weekly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Calendar size={64} className="text-blue-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">本月待落地 (人)</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-3xl font-bold text-slate-900">{metrics.monthPendingCount}</h3>
          </div>
          <p className="text-xs text-slate-400">本月内预计落地且跟进中</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><Calculator size={64} className="text-indigo-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">本月加权预计落地</p>
          <h3 className="text-3xl font-bold text-indigo-600 mb-2">{metrics.weightedMonthLanding}</h3>
          <p className="text-xs text-slate-400">∑(预计代发 × 落地概率)</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><Clock size={64} className="text-green-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">本周即将落地 (人)</p>
          <h3 className="text-3xl font-bold text-slate-900 mb-2">{metrics.weekUpcomingCount}</h3>
          <p className="text-xs text-slate-400">周一至周日计划落地人数</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10"><AlertTriangle size={64} className="text-red-600" /></div>
          <p className="text-sm font-medium text-slate-500 mb-1">逾期未落地 (企业数)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-red-600">{metrics.overdueCount}</h3>
            <span className="text-sm text-red-400">({metrics.overduePayroll}人)</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">预计时间小于今日且未完成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Breakdown Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 space-y-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-slate-400"/>
                储备结构分析 (Drill-down)
            </h3>

            {breakdownCharts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {breakdownCharts.map((chart, idx) => (
                        <div key={idx} className="h-72 border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex flex-col">
                            <p className="text-xs text-center font-medium text-slate-500 mb-2">{chart.title}</p>
                            <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chart.data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={65}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({name, percent}) => {
                                            const shortName = name.length > 5 ? name.substring(0, 4) + '..' : name;
                                            return `${shortName} ${(percent * 100).toFixed(0)}%`;
                                        }}
                                        labelLine={true}
                                    >
                                        {chart.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                    无需展示下钻图表 (已是最高层级)
                </div>
            )}
        </div>

        {/* Right Column: Overdue & Stale */}
        <div className="space-y-6 lg:col-span-1">
            
            {/* Overdue Module */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[400px]">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={18}/>
                    逾期未落地 ({metrics.overdueCount})
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {metrics.overdueList.slice(0, showAllOverdue ? undefined : 3).map(r => (
                    <div key={r.id} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800 text-sm truncate w-32" title={r.companyName}>{r.companyName}</span>
                            <span className="text-xs bg-red-200 text-red-800 px-1.5 rounded">{r.estimatedNewPayroll}人</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>预计: {new Date(r.estimatedLandingDate).toLocaleDateString()}</span>
                            <span>{r.updatedByName}</span>
                        </div>
                    </div>
                    ))}
                    {metrics.overdueList.length > 3 && (
                        <button 
                            onClick={() => setShowAllOverdue(!showAllOverdue)}
                            className="w-full text-center text-xs text-blue-500 hover:text-blue-700 py-1"
                        >
                            {showAllOverdue ? '收起' : `查看更多 (${metrics.overdueList.length - 3})`}
                        </button>
                    )}
                    {metrics.overdueList.length === 0 && <p className="text-xs text-slate-400 text-center py-4">无逾期项目</p>}
                </div>
            </div>

            {/* Stale Module (>30 Days) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2 text-amber-600">
                        <Clock size={18}/>
                        超30天未走访 ({sortedStaleList.length})
                    </h3>
                    <div className="flex text-xs bg-slate-100 rounded p-0.5">
                        <button 
                          className={`px-2 py-0.5 rounded ${staleSortBy === 'days' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                          onClick={() => setStaleSortBy('days')}
                        >天数</button>
                         <button 
                          className={`px-2 py-0.5 rounded ${staleSortBy === 'employees' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                          onClick={() => setStaleSortBy('employees')}
                        >规模</button>
                    </div>
                </div>

                 <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {sortedStaleList.slice(0, showAllStale ? undefined : 5).map(({record, days}) => (
                    <div key={record.id} className="p-3 border border-amber-100 bg-amber-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-800 text-sm truncate w-32" title={record.companyName}>{record.companyName}</span>
                            <span className="text-xs bg-amber-200 text-amber-800 px-1.5 rounded font-bold">{days}天</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                            <span>规模: {record.totalEmployees}人</span>
                            <span>上次: {new Date(record.lastVisitDate).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex justify-between">
                            <span>{record.updatedByName}</span>
                            <span>预计新增: {record.estimatedNewPayroll}</span>
                        </div>
                    </div>
                    ))}
                     {sortedStaleList.length === 0 && <p className="text-xs text-slate-400 text-center py-4">无长期未走访项目</p>}
                    {sortedStaleList.length > 5 && (
                        <button 
                            onClick={() => setShowAllStale(!showAllStale)}
                            className="w-full text-center text-xs text-blue-500 hover:text-blue-700 py-1"
                        >
                            {showAllStale ? '收起' : `查看更多 (${sortedStaleList.length - 5})`}
                        </button>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
