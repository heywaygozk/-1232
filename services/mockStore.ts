
import { User, PayrollRecord, Role, LineType, RecordStatus, RecordHistory, CloudConfig } from '../types';

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
  // ... (Staff users omitted for brevity, logic remains the same as they are loaded from local storage if init is called)
];

// Initial Data Seed (Only used if empty)
const MOCK_RECORDS_SEED: PayrollRecord[] = [
  {
    id: 'r1',
    companyName: '象山海鲜加工厂',
    totalEmployees: 200,
    estimatedNewPayroll: 180,
    estimatedLandingDate: new Date().toISOString(),
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
  // ... more seed data
];

const USERS_KEY = 'app_users_v3';
const RECORDS_KEY = 'app_records_v3';
const CURRENT_USER_KEY = 'app_current_user_v3';
const CLOUD_CONFIG_KEY = 'app_cloud_config_v1';

export const mockStore = {
  init: () => {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(MOCK_USERS));
    }
    if (!localStorage.getItem(RECORDS_KEY)) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(MOCK_RECORDS_SEED));
    }
  },

  // --- Cloud Configuration ---
  getCloudConfig: (): CloudConfig | null => {
    const stored = localStorage.getItem(CLOUD_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  saveCloudConfig: (config: CloudConfig) => {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  },

  // --- Synchronization Logic ---
  
  // Merges cloud data with local data, preferring the most recently updated record
  mergeRecords: (local: PayrollRecord[], cloud: PayrollRecord[]): PayrollRecord[] => {
    const map = new Map<string, PayrollRecord>();
    
    // Add all local records
    local.forEach(r => map.set(r.id, r));

    // Merge cloud records
    cloud.forEach(r => {
      const existing = map.get(r.id);
      if (!existing) {
        map.set(r.id, r);
      } else {
        // Conflict resolution: Last updated wins
        const localTime = new Date(existing.updatedAt).getTime();
        const cloudTime = new Date(r.updatedAt).getTime();
        if (cloudTime > localTime) {
          map.set(r.id, r);
        }
      }
    });

    return Array.from(map.values());
  },

  // Merges users list
  mergeUsers: (local: User[], cloud: User[]): User[] => {
    const map = new Map<string, User>();
    local.forEach(u => map.set(u.id, u));
    cloud.forEach(u => map.set(u.id, u)); // Simple overwrite for users for now
    return Array.from(map.values());
  },

  syncWithCloud: async (): Promise<{ success: boolean; message: string }> => {
    const config = mockStore.getCloudConfig();
    if (!config || !config.enabled || !config.apiKey || !config.binId) {
      return { success: false, message: '云端同步未配置' };
    }

    try {
      // 1. Fetch from Cloud (JSONBin)
      const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`);
      }

      const result = await response.json();
      const cloudData = result.record; // JSONBin wraps content in 'record'

      const cloudRecords: PayrollRecord[] = cloudData.records || [];
      const cloudUsers: User[] = cloudData.users || [];

      // 2. Load Local
      const localRecords = mockStore.getAllRecordsUnfiltered();
      const localUsers = mockStore.getUsers();

      // 3. Merge
      const mergedRecords = mockStore.mergeRecords(localRecords, cloudRecords);
      const mergedUsers = mockStore.mergeUsers(localUsers, cloudUsers);

      // 4. Save Merged to Local
      localStorage.setItem(RECORDS_KEY, JSON.stringify(mergedRecords));
      localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));

      // 5. Push Merged back to Cloud (to ensure cloud is up to date with our local changes)
      // Note: This is a simple strategy. For high concurrency, we need atomic ops or locking.
      // But for this use case, "read-merge-write" is sufficient.
      const payload = {
        records: mergedRecords,
        users: mergedUsers,
        lastSync: new Date().toISOString()
      };

      const pushResponse = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': config.apiKey,
        },
        body: JSON.stringify(payload)
      });

      if (!pushResponse.ok) {
        throw new Error(`Push failed: ${pushResponse.statusText}`);
      }

      return { success: true, message: `同步成功! (Records: ${mergedRecords.length})` };

    } catch (error: any) {
      console.error("Cloud Sync Error:", error);
      return { success: false, message: `同步失败: ${error.message}` };
    }
  },

  // Helper to trigger sync in background without blocking UI
  triggerBackgroundSync: () => {
    mockStore.syncWithCloud().then(res => {
      if (!res.success) console.warn("Background sync failed:", res.message);
      else console.log("Background sync success");
    });
  },

  // --- Existing Methods (Updated to trigger sync) ---

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
    mockStore.triggerBackgroundSync();
  },
  
  deleteUser: (userId: string) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const filtered = users.filter((u: User) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    mockStore.triggerBackgroundSync();
  },
  
  batchAddUsers: (newUsers: User[]) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updatedUsers = [...users, ...newUsers];
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    mockStore.triggerBackgroundSync();
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

  getRecords: (user: User): PayrollRecord[] => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    
    switch (user.role) {
      case Role.ADMIN:
      case Role.BRANCH_PRESIDENT:
        return allRecords;
      case Role.VP_CORPORATE:
        return allRecords.filter(r => r.line === LineType.COMPANY);
      case Role.VP_RETAIL:
        return allRecords.filter(r => r.line === LineType.RETAIL);
      case Role.VP_PERSONAL:
        return allRecords.filter(r => r.line === LineType.PERSONAL);
      case Role.DEPARTMENT_MANAGER:
        return allRecords.filter(r => r.department === user.department);
      case Role.STAFF:
        return allRecords.filter(r => r.updatedByUserId === user.id);
      default:
        return [];
    }
  },
  
  getAllRecordsUnfiltered: (): PayrollRecord[] => {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  },

  addRecord: (record: PayrollRecord) => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    if (!record.history) {
        record.history = [{
          date: new Date().toISOString(),
          updatedByName: record.updatedByName,
          changeSummary: '创建记录'
        }];
    }
    allRecords.push(record);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
    mockStore.triggerBackgroundSync();
  },

  deleteRecord: (recordId: string) => {
    const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
    const filtered = allRecords.filter(r => r.id !== recordId);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
    mockStore.triggerBackgroundSync();
  },

  batchAddRecords: (records: PayrollRecord[]) => {
      const allRecords: PayrollRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
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
      mockStore.triggerBackgroundSync();
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
        updatedByUserId: user.id,
        updatedByName: user.name,
        history: [historyEntry, ...(oldRecord.history || [])]
      };

      allRecords[index] = updatedRecord;
      localStorage.setItem(RECORDS_KEY, JSON.stringify(allRecords));
      mockStore.triggerBackgroundSync();
    }
  }
};
