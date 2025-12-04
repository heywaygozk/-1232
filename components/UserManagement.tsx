
import React, { useState, useEffect } from 'react';
import { User, Role, LineType, DEPARTMENTS } from '../types';
import { mockStore } from '../services/mockStore';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    setUsers(mockStore.getUsers());
  }, []);

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData(user);
  };

  const handleCreate = () => {
    const newUser = {
      id: crypto.randomUUID(),
      employeeId: '',
      name: '',
      password: '123',
      role: Role.STAFF,
      title: '业务人员',
      department: DEPARTMENTS[LineType.COMPANY][0],
      line: LineType.COMPANY,
      yearlyTarget: 0
    };
    setEditingId(newUser.id);
    setFormData(newUser);
  };

  const handleSave = () => {
    if (!formData.name || !formData.employeeId) {
      alert("请填写姓名和工号");
      return;
    }
    const userToSave = formData as User;
    mockStore.saveUser(userToSave);
    setUsers(mockStore.getUsers());
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该用户吗？')) {
      mockStore.deleteUser(id);
      setUsers(mockStore.getUsers());
    }
  };

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper to get available departments based on selected line
  const availableDepartments = formData.line ? DEPARTMENTS[formData.line] : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">用户与权限管理</h2>
          <p className="text-sm text-slate-500">管理系统用户、角色、部门及考核指标</p>
        </div>
        <button 
          onClick={handleCreate}
          disabled={!!editingId}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={16} />
          新增用户
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50">
            <tr>
              <th className="px-6 py-3">工号</th>
              <th className="px-6 py-3">姓名</th>
              <th className="px-6 py-3">密码</th>
              <th className="px-6 py-3">岗位名称</th>
              <th className="px-6 py-3">角色权限</th>
              <th className="px-6 py-3">条线/部门</th>
              <th className="px-6 py-3">年度指标</th>
              <th className="px-6 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {editingId && !users.find(u => u.id === editingId) && (
              <UserRow 
                user={formData as User} 
                isEditing={true} 
                formData={formData} 
                onChange={handleChange} 
                onSave={handleSave} 
                onCancel={() => setEditingId(null)} 
              />
            )}
            {users.map(user => (
              <UserRow 
                key={user.id} 
                user={user} 
                isEditing={editingId === user.id}
                formData={formData}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                onEdit={() => handleEdit(user)}
                onDelete={() => handleDelete(user.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserRow: React.FC<{
  user: User;
  isEditing: boolean;
  formData: Partial<User>;
  onChange: (field: keyof User, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ user, isEditing, formData, onChange, onSave, onCancel, onEdit, onDelete }) => {
  
  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-4">
          <input className="w-24 p-1 border rounded" value={formData.employeeId} onChange={e => onChange('employeeId', e.target.value)} placeholder="工号" />
        </td>
        <td className="px-6 py-4">
          <input className="w-24 p-1 border rounded" value={formData.name} onChange={e => onChange('name', e.target.value)} placeholder="姓名" />
        </td>
        <td className="px-6 py-4">
          <input className="w-20 p-1 border rounded" value={formData.password} onChange={e => onChange('password', e.target.value)} />
        </td>
        <td className="px-6 py-4">
          <input className="w-32 p-1 border rounded" value={formData.title} onChange={e => onChange('title', e.target.value)} placeholder="e.g. 客户经理" />
        </td>
        <td className="px-6 py-4">
          <select className="p-1 border rounded" value={formData.role} onChange={e => onChange('role', e.target.value)}>
            {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </td>
        <td className="px-6 py-4 space-y-1">
          <select className="w-full p-1 border rounded block" value={formData.line} onChange={e => onChange('line', e.target.value)}>
            {Object.values(LineType).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {formData.line && DEPARTMENTS[formData.line as LineType] && (
            <select className="w-full p-1 border rounded block" value={formData.department} onChange={e => onChange('department', e.target.value)}>
              {DEPARTMENTS[formData.line as LineType].map(d => <option key={d} value={d}>{d}</option>)}
              {/* Fallback for admin departments like '科技部' */}
              {!DEPARTMENTS[formData.line as LineType].includes(formData.department!) && <option value={formData.department}>{formData.department}</option>}
            </select>
          )}
        </td>
        <td className="px-6 py-4">
          <input className="w-20 p-1 border rounded" type="number" value={formData.yearlyTarget} onChange={e => onChange('yearlyTarget', parseInt(e.target.value))} />
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2">
            <button onClick={onSave} className="text-green-600 hover:text-green-800"><Save size={16}/></button>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700"><X size={16}/></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white border-b hover:bg-slate-50">
      <td className="px-6 py-4 font-medium text-slate-900">{user.employeeId}</td>
      <td className="px-6 py-4">{user.name}</td>
      <td className="px-6 py-4 text-slate-400">******</td>
      <td className="px-6 py-4">{user.title}</td>
      <td className="px-6 py-4 text-xs">
        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">{user.role}</span>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs text-slate-500">{user.line}</div>
        <div>{user.department}</div>
      </td>
      <td className="px-6 py-4">{user.yearlyTarget}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
          {user.role !== Role.ADMIN && (
            <button onClick={onDelete} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
          )}
        </div>
      </td>
    </tr>
  );
};
