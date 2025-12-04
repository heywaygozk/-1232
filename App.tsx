
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SmartInput } from './components/SmartInput';
import { RecordList } from './components/RecordList';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagement } from './components/UserManagement';
import { mockStore } from './services/mockStore';
import { User, PayrollRecord, Role } from './types';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    mockStore.init();
    const currentUser = mockStore.getCurrentUser();
    const usersList = mockStore.getUsers();
    setAllUsers(usersList);
    
    if (currentUser) {
      setUser(currentUser);
      refreshData(currentUser);
    }
    setLoading(false);
  }, []);

  const refreshData = (currentUser: User) => {
    const data = mockStore.getRecords(currentUser);
    setRecords(data);
    setAllUsers(mockStore.getUsers()); // Refresh users in case admin updated them
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      // We use employeeId for login now, but keeping mockStore.login simple
      const u = mockStore.login(loginId, loginPwd);
      if (u) {
          setUser(u);
          refreshData(u);
          setCurrentTab('dashboard');
          setLoginId('');
          setLoginPwd('');
      } else {
          setLoginError('工号或密码错误 (默认密码: 123)');
      }
  };

  const handleLogout = () => {
    mockStore.logout();
    setUser(null);
  };

  const handleSaveRecord = () => {
    if (user) refreshData(user);
    setCurrentTab('records'); 
  };

  // Login Screen
  if (!user) {
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-100">Loading...</div>;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-100 rounded-full text-blue-600">
               <ShieldCheck size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">象山支行</h1>
          <p className="text-center text-slate-500 mb-8">代发储备智能追踪系统</p>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">工号 (Employee ID)</label>
                  <input 
                    type="text" 
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="请输入工号 (e.g., A001)"
                    required
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">密码 (Password)</label>
                  <input 
                    type="password" 
                    value={loginPwd}
                    onChange={e => setLoginPwd(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="请输入密码"
                    required
                  />
              </div>
              
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}

              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  登录
              </button>
          </form>

          <div className="mt-6 border-t pt-4">
              <p className="text-xs text-center text-slate-400 mb-2">测试账号提示 (密码均为 123):</p>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200" onClick={() => setLoginId('admin001')}>管理员: admin001</span>
                  <span className="bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200" onClick={() => setLoginId('A001')}>张行长: A001</span>
                  <span className="bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200" onClick={() => setLoginId('C101')}>陈经理: C101</span>
                  <span className="bg-slate-100 px-2 py-1 rounded cursor-pointer hover:bg-slate-200" onClick={() => setLoginId('C102')}>小刘: C102</span>
              </div>
          </div>
        </div>
      </div>
    );
  }

  const isManagement = 
    user.role === Role.ADMIN || 
    user.role === Role.BRANCH_PRESIDENT ||
    user.role === Role.VP_CORPORATE ||
    user.role === Role.VP_RETAIL ||
    user.role === Role.VP_PERSONAL ||
    user.role === Role.DEPARTMENT_MANAGER;

  return (
    <Layout user={user} onLogout={handleLogout} currentTab={currentTab} onTabChange={setCurrentTab}>
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {currentTab === 'dashboard' && '工作台 / Dashboard'}
            {currentTab === 'records' && '储备明细 / Records'}
            {currentTab === 'input' && '智能录入 / Smart Input'}
            {currentTab === 'stats' && '全行统计 / Global Stats'}
            {currentTab === 'users' && '用户管理 / Admin'}
          </h2>
          <p className="text-slate-500 text-sm">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {currentTab === 'dashboard' && (
        <AdminDashboard records={records} allUsers={allUsers} currentUser={user} />
      )}
      
      {currentTab === 'records' && <RecordList records={records} />}
      
      {currentTab === 'input' && <SmartInput user={user} onSave={handleSaveRecord} />}
      
      {currentTab === 'stats' && isManagement && (
         <AdminDashboard records={records} allUsers={allUsers} currentUser={user} />
      )}

      {currentTab === 'users' && user.role === Role.ADMIN && (
          <UserManagement />
      )}

    </Layout>
  );
}
