
import React from 'react';
import { User, Role } from '../types';
import { LogOut, LayoutDashboard, Database, PlusCircle, PieChart, Users } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: '工作台 / Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'records', label: '储备列表 / Records', icon: <Database size={20} /> },
    { id: 'input', label: '智能录入 / Smart Input', icon: <PlusCircle size={20} /> },
  ];

  // Admin User Management
  if (user.role === Role.ADMIN) {
      navItems.push({ id: 'users', label: '用户管理 / Admin', icon: <Users size={20} /> });
  }

  // Stats for EVERYONE now, as requested
  navItems.push({ id: 'stats', label: '统计报表 / Reports', icon: <PieChart size={20} /> });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight text-blue-400">象山支行</h1>
          <p className="text-xs text-slate-400 mt-1">代发储备智能追踪系统</p>
        </div>
        
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                user.role === Role.BRANCH_PRESIDENT ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-[10px] text-slate-400 bg-slate-800 rounded px-1 py-0.5 inline-block mt-0.5 border border-slate-600">
                  {user.title || user.role}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                currentTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
