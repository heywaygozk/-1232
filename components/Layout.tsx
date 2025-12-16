
import React from 'react';
import { User, Role } from '../types';
import { LogOut, LayoutDashboard, Database, PlusCircle, PieChart, Users, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: '工作台', fullLabel: '工作台 / Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'records', label: '列表', fullLabel: '储备列表 / Records', icon: <Database size={20} /> },
    { id: 'input', label: '录入', fullLabel: '智能录入 / Smart Input', icon: <PlusCircle size={20} /> },
  ];

  // Admin User Management
  if (user.role === Role.ADMIN) {
      navItems.push({ id: 'users', label: '用户', fullLabel: '用户管理 / Admin', icon: <Users size={20} /> });
  }

  // Stats for EVERYONE now, as requested
  navItems.push({ id: 'stats', label: '报表', fullLabel: '统计报表 / Reports', icon: <PieChart size={20} /> });

  // System Settings (Cloud Sync) - Available to everyone so they can config their device
  navItems.push({ id: 'settings', label: '设置', fullLabel: '系统设置 / Settings', icon: <Settings size={20} /> });

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* Desktop Sidebar - Hidden on Mobile */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shadow-lg">
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
              {item.fullLabel}
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative w-full">
        {/* Mobile Header (Top Bar) */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
            <div>
               <h1 className="font-bold text-lg">象山支行</h1>
               <p className="text-xs text-slate-400">{user.name} - {user.title}</p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white">
                <LogOut size={18} />
            </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Visible only on Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 px-2 pb-safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             // Simplify logic: show top 4 items, or group if too many?
             // For simplicity, we just render them. Flex justify-around handles spacing.
             const isActive = currentTab === item.id;
             return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                <div className={`${isActive ? 'bg-blue-50 rounded-full p-1' : ''}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
             );
          })}
        </div>
      </nav>
    </div>
  );
};
