
export enum Role {
  ADMIN = 'ADMIN',                  // 系统管理员
  BRANCH_PRESIDENT = 'BRANCH_PRESIDENT', // 支行行长 (全权限)
  VP_CORPORATE = 'VP_CORPORATE',    // 公司分管行长
  VP_RETAIL = 'VP_RETAIL',          // 零售分管行长
  VP_PERSONAL = 'VP_PERSONAL',      // 个人分管行长 (财富+私银+各个网点)
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER', // 部门经理/网点负责人
  STAFF = 'STAFF',                  // 业务人员
}

export enum LineType {
  COMPANY = '公司',       // Corporate
  RETAIL = '零售',        // Retail
  PERSONAL = '个人',      // Personal/Individual (includes Wealth & Private)
}

// Specific Department Constants
export const DEPARTMENTS = {
  [LineType.COMPANY]: ['公司业务一部', '公司业务二部', '公司业务三部', '机构业务部'],
  [LineType.RETAIL]: ['零售业务一部', '零售业务二部', '科技金融部'],
  [LineType.PERSONAL]: ['营业部', '丹东支行', '丹西支行', '石浦支行', '西周支行', '私银部'],
};

export enum RecordStatus {
  FOLLOWING = '跟进中',
  COMPLETED = '已落地',
  FAILED = '无法落地', // Replaced PAUSED
}

export interface User {
  id: string;
  employeeId: string; // 工号
  name: string;
  password?: string; // For mock auth
  role: Role;
  title: string; // 具体岗位名称 e.g. "公司客户经理"
  department: string;
  line: LineType;
  yearlyTarget: number; // Annual target for payroll count
}

export interface RecordHistory {
  date: string;
  updatedByName: string;
  changeSummary: string;
}

export interface PayrollRecord {
  id: string;
  companyName: string;      // 1. 代发企业名称
  totalEmployees: number;   // 2. 企业总人数
  estimatedNewPayroll: number; // 3. 预计新增代发人数 (Renamed from estimatedPayroll)
  estimatedLandingDate: string; // 4. 预计落地时间 (Renamed from landingDate)
  cardsIssued: number;      // 5. 已开卡人数
  cardSchedule: string;     // 6. 近期开卡排期 (ISO Date String)
  lastVisitDate: string;    // 7. 最近一次走访时间 (ISO Date String)
  probability: number;      // 8. 落地概率 (0-100) - NEW
  progressNotes: string;    // 9. 营销进度备注
  updatedAt: string;        // 10. 数据更新时间
  updatedByUserId: string;  // 11. 储备人员 ID
  updatedByName: string;    // 11. 储备人员 Name
  department: string;       // 12. 所在部门
  line: LineType;           // 13. 所在条线
  status: RecordStatus;     // 14. 营销进度
  history: RecordHistory[]; // 15. 修改历史
}

// For Charting
export interface ChartDataPoint {
  name: string;
  value: number;
  secondaryValue?: number;
}
