
import { User, PayrollRecord, Role, LineType, RecordStatus, RecordHistory } from '../types';

// Seed Users with specific hierarchy
const MOCK_USERS: User[] = [
  // 1. Admin
  { id: 'u0', employeeId: 'admin001', name: '系统管理员', password: '123', role: Role.ADMIN, title: '管理员', department: '科技部', line: LineType.COMPANY, yearlyTarget: 0 },
  
  // 2. Branch President
  { id: 'u1', employeeId: 'A001', name: '张行长', password: '123', role: Role.BRANCH_PRESIDENT, title: '支行行长', department: '行长室', line: LineType.COMPANY, yearlyTarget: 10000 },
  
  // 3. VPs
  { id: 'u2', employeeId: 'B001', name: '李行长', password: '123', role: Role.VP_CORPORATE, title: '公司分管行长', department: '行长室', line: LineType.COMPANY, yearlyTarget: 5000 },
  { id: 'u3', employeeId: 'B002', name: '王行长', password: '123', role: Role.VP_RETAIL, title: '零售分管行长', department: '行长室', line: LineType.RETAIL, yearlyTarget: 3000 },
  { id: 'u4', employeeId: 'B003', name: '赵行长', password: '123', role: Role.VP_PERSONAL, title: '个人分管行长', department: '行长室', line: LineType.PERSONAL, yearlyTarget: 2000 },
  
  // 4. Managers & Staff (Subset for demo)
  
  // --- Corporate Line ---
  { id: 'm_c1', employeeId: 'C101', name: '陈经理', password: '123', role: Role.DEPARTMENT_MANAGER, title: '公司业务一部经理', department: '公司业务一部', line: LineType.COMPANY, yearlyTarget: 2000 },
  { id: 's_c1', employeeId: 'C102', name: '小刘', password: '123', role: Role.STAFF, title: '公司客户经理', department: '公司业务一部', line: LineType.COMPANY, yearlyTarget: 1000 },
  { id: 's_c2', employeeId: 'C103', name: '小吴', password: '123', role: Role.STAFF, title: '公司客户经理', department: '公司业务一部', line: LineType.COMPANY, yearlyTarget: 1000 },

  { id: 'm_c2', employeeId: 'C201', name: '周经理', password: '123', role: Role.DEPARTMENT_MANAGER, title: '公司业务二部经理', department: '公司业务二部', line: LineType.COMPANY, yearlyTarget: 1500 },
  { id: 's_c3', employeeId: 'C202', name: '小郑', password: '123', role: Role.STAFF, title: '公司客户经理', department: '公司业务二部', line: LineType.COMPANY, yearlyTarget: 1500 },

  // --- Retail Line ---
  { id: 'm_r1', employeeId: 'R101', name: '吴经理', password: '123', role: Role.DEPARTMENT_MANAGER, title: '零售业务一部经理', department: '零售业务一部', line: LineType.RETAIL, yearlyTarget: 1500 },
  { id: 's_r1', employeeId: 'R102', name: '小杨', password: '123', role: Role.STAFF, title: '零售客户经理', department: '零售业务一部', line: LineType.RETAIL, yearlyTarget: 800 },

  // --- Personal Line (Branches + Private) ---
  { id: 'm_p1', employeeId: 'P101', name: '孙经理', password: '123', role: Role.DEPARTMENT_MANAGER, title: '营业部经理', department: '营业部', line: LineType.PERSONAL, yearlyTarget: 1000 },
  { id: 's_p1', employeeId: 'P102', name: '小钱', password: '123', role: Role.STAFF, title: '理财经理', department: '营业部', line: LineType.PERSONAL, yearlyTarget: 1000 },

  { id: 'm_p2', employeeId: 'P201', name: '李行长', password: '123', role: Role.DEPARTMENT_MANAGER, title: '石浦支行行长', department: '石浦支行', line: LineType.PERSONAL, yearlyTarget: 800 },
  { id: 's_p2', employeeId: 'P202', name: '小周', password: '123', role: Role.STAFF, title: '理财经理', department: '石浦支行', line: LineType.PERSONAL, yearlyTarget: 800 },

  { id: 'm_p3', employeeId: 'P301', name: '钱经理', password: '123', role: Role.DEPARTMENT_MANAGER, title: '私银部经理', department: '私银部', line: LineType.PERSONAL, yearlyTarget: 500 },
  { id: 's_p3', employeeId: 'P302', name: '小赵', password: '123', role: Role.STAFF, title: '私银经理', department: '私银部', line: LineType.PERSONAL, yearlyTarget: 500 },
];

// Seed Records
const MOCK_RECORDS: PayrollRecord[] = [
  {
    id: 'r1',
    companyName: '象山海鲜加工厂',
    totalEmployees: 200,
    estimatedNewPayroll: 180,
    estimatedLandingDate: new Date().toISOString(), // Landed this month
    cardsIssued: 150,
    cardSchedule: '2023-11-20',
    lastVisitDate: new Date().toISOString(), 
    probability: 100,
    progressNotes: '已完成大部分开卡，剩余人员下周补录。',
    updatedAt: new Date().toISOString(),
    updatedByUserId: 's_r1',
    updatedByName: '小杨',
    department: '零售业务一部',
    line: LineType.RETAIL,
    status: RecordStatus.COMPLETED,
    history: [{ date: '2023-10-01', updatedByName: '小杨', changeSummary: '创建记录' }]
  },
  {
    id: 'r2',
    companyName: '宁波东部科技园',
    totalEmployees: 500,
    estimatedNewPayroll: 450,
    estimatedLandingDate: '2024-06-01', // Future
    cardsIssued: 0,
    cardSchedule: '2023-11-25',
    lastVisitDate: '2023-10-20',
    probability: 60,
    progressNotes: '高层已对接，等待协议签署。',
    updatedAt: '2023-10-20T10:00:00Z',
    updatedByUserId: 's_c1',
    updatedByName: '小刘',
    department: '公司业务一部',
    line: LineType.COMPANY,
    status: RecordStatus.FOLLOWING,
    history: []
  },
  {
    id: 'r3',
    companyName: '豪车俱乐部',
    totalEmployees: 50,
    estimatedNewPayroll: 50,
    estimatedLandingDate: '2023-10-10', // Past date, not completed (Overdue example)
    cardsIssued: 10,
    cardSchedule: '2023-12-05',
    lastVisitDate: '2023-11-01',
    probability: 30,
    progressNotes: '私银客户转介，重点跟进高管。',
    updatedAt: '2023-11-01T14:30:00Z',
    updatedByUserId: 's_p3',
    updatedByName: '小赵',
    department: '私银部',
    line: LineType.PERSONAL,
    status: RecordStatus.FOLLOWING,
    history: []
  },
  {
    id: 'r4',
    companyName: '象山渔业总公司',
    totalEmployees: 1000,
    estimatedNewPayroll: 900,
    estimatedLandingDate: new Date().toISOString(), // Landed this month
    cardsIssued: 200,
    cardSchedule: '2023-11-25',
    lastVisitDate: '2023-11-10',
    probability: 90,
    progressNotes: '首批款项已发，二批卡下周开。',
    updatedAt: new Date().toISOString(),
    updatedByUserId: 's_c1',
    updatedByName: '小刘',
    department: '公司业务一部',
    line: LineType.COMPANY,
    status: RecordStatus.COMPLETED,
    history: []
  },
  {
    id: 'r5',
    companyName: '陈旧企业示例',
    totalEmployees: 300,
    estimatedNewPayroll: 100,
    estimatedLandingDate: '2024-12-01',
    cardsIssued: 0,
    cardSchedule: '',
    lastVisitDate: '2023-01-01', // Very old visit date
    probability: 20,
    progressNotes: '很久没去了',
    updatedAt: '2023-01-01T00:00:00Z',
    updatedByUserId: 's_c1',
    updatedByName: '小刘',
    department: '公司业务一部',
    line: LineType.COMPANY,
    status: RecordStatus.FOLLOWING,
    history: []
  }
];

const USERS_KEY = 'app_users_v3';
const RECORDS_KEY = 'app_records_v3';
const CURRENT_USER_KEY = 'app_current_user_v3';

export const mockStore = {
  init: () => {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(RECORDS_KEY)) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(MOCK_RECORDS));
    }
  },

  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  },
  
  saveUser: (user: User) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const index = users.findIndex((u: User) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  
  deleteUser: (userId: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const filtered = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  },
  
  batchAddUsers: (newUsers: User[]) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updatedUsers = [...users, ...newUsers];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  login: (employeeId: string, password: string): User | undefined => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.employeeId === employeeId && (u.password === password || u.password === undefined));
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Granular Permission Logic
  getRecords: (user: User): PayrollRecord[] => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    
    switch (user.role) {
      case Role.ADMIN:
      case Role.BRANCH_PRESIDENT:
        // Admin and Branch President see everything
        return allRecords;
      
      case Role.VP_CORPORATE:
        return allRecords.filter(r => r.line === LineType.COMPANY);
      
      case Role.VP_RETAIL:
        return allRecords.filter(r => r.line === LineType.RETAIL);

      case Role.VP_PERSONAL:
        // Personal VP sees the entire PERSONAL line (Wealth + Private + Branches)
        return allRecords.filter(r => r.line === LineType.PERSONAL);

      case Role.DEPARTMENT_MANAGER:
        // Dept Manager sees records in their department
        return allRecords.filter(r => r.department === user.department);

      case Role.STAFF:
        // Staff sees only their own records
        return allRecords.filter(r => r.updatedByUserId === user.id);
        
      default:
        return [];
    }
  },
  
  // Helper for duplicate checks
  getAllRecordsUnfiltered: (): PayrollRecord[] => {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  },

  addRecord: (record: PayrollRecord) => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    // Init history if not present
    if (!record.history) {
        record.history = [{
          date: new Date().toISOString(),
          updatedByName: record.updatedByName,
          changeSummary: '创建记录'
        }];
    }
    allRecords.push(record);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
  },

  deleteRecord: (recordId: string) => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    const filtered = allRecords.filter(r => r.id !== recordId);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  },

  // Bulk Import
  batchAddRecords: (records: PayrollRecord[]) => {
      const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
      // Add initial history for batch items
      const preparedRecords = records.map(r => ({
          ...r,
          history: [{
              date: new Date().toISOString(),
              updatedByName: r.updatedByName,
              changeSummary: '批量导入'
          }]
      }));
      const newAllRecords = [...allRecords, ...preparedRecords];
      localStorage.setItem(RECORDS_KEY, JSON.stringify(newAllRecords));
  },

  updateRecordWithHistory: (newRecordData: PayrollRecord, user: User) => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    const index = allRecords.findIndex(r => r.id === newRecordData.id);
    
    if (index !== -1) {
      const oldRecord = allRecords[index];
      const changes: string[] = [];

      if (oldRecord.estimatedNewPayroll !== newRecordData.estimatedNewPayroll) {
        changes.push(`预计新增代发: ${oldRecord.estimatedNewPayroll} -> ${newRecordData.estimatedNewPayroll}`);
      }
      if (oldRecord.cardsIssued !== newRecordData.cardsIssued) {
        changes.push(`已开卡: ${oldRecord.cardsIssued} -> ${newRecordData.cardsIssued}`);
      }
      if (oldRecord.estimatedLandingDate !== newRecordData.estimatedLandingDate) {
        changes.push(`预计落地时间变更`);
      }
      if (oldRecord.probability !== newRecordData.probability) {
        changes.push(`落地概率: ${oldRecord.probability}% -> ${newRecordData.probability}%`);
      }
      if (oldRecord.progressNotes !== newRecordData.progressNotes) {
        changes.push(`更新备注`);
      }
      if (oldRecord.status !== newRecordData.status) {
        changes.push(`状态: ${oldRecord.status} -> ${newRecordData.status}`);
      }
      if (oldRecord.totalEmployees !== newRecordData.totalEmployees) {
        changes.push(`企业人数: ${oldRecord.totalEmployees} -> ${newRecordData.totalEmployees}`);
      }

      const historyEntry: RecordHistory = {
        date: new Date().toISOString(),
        updatedByName: user.name,
        changeSummary: changes.length > 0 ? changes.join('; ') : '手动更新'
      };

      const updatedRecord = {
        ...newRecordData,
        updatedAt: new Date().toISOString(),
        updatedByUserId: user.id, // Usually track last editor
        updatedByName: user.name,
        history: [historyEntry, ...(oldRecord.history || [])]
      };

      allRecords[index] = updatedRecord;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
    }
  }
};
