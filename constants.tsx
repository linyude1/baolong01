
import { Patient, PatientStatus, TreatmentType, Appointment, Medicine, ShoppingItem } from './types';

/**
 * 将牙位 ID 格式化为纯中文显示
 */
export const formatToothPos = (posStr: string | undefined): string => {
  if (!posStr) return '未记录';
  const specialCases = ['全口', '全口洁治', '全口检查'];
  if (specialCases.includes(posStr)) return posStr;

  const quadrantMap: Record<string, string> = {
    'UR': '右上',
    'UL': '左上',
    'LR': '右下',
    'LL': '左下'
  };

  return posStr.split(',').map(part => {
    const trimmed = part.trim();
    if (!trimmed.includes('-')) return trimmed;
    
    const [q, t] = trimmed.split('-');
    const qName = quadrantMap[q] || q;
    const isChild = /[A-E]/.test(t || '');
    return `${qName}-${t}${isChild ? ' (乳)' : ''}`;
  }).join(', ');
};

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: '张伟',
    phone: '138-0000-1234',
    cardNumber: '1',
    status: PatientStatus.WAITING,
    treatmentType: TreatmentType.FOLLOW_UP,
    time: '09:30 AM',
    visitDate: new Date().toISOString().split('T')[0],
    desc: '根管治疗 (16号牙)',
    toothPos: 'UR-6, UR-7',
    avatar: 'https://picsum.photos/seed/p1/200/200',
    records: [
      {
        id: 'r1',
        date: new Date().toISOString().split('T')[0],
        time: '09:30 AM',
        toothPos: 'UR-6, UR-7',
        desc: '根管治疗 (16号牙): 首次开髓，封失活剂。'
      }
    ]
  },
  {
    id: '2',
    name: '李娜',
    phone: '139-1111-5678',
    cardNumber: '3',
    status: PatientStatus.COMPLETED,
    treatmentType: TreatmentType.FOLLOW_UP,
    time: '10:45 AM',
    visitDate: new Date().toISOString().split('T')[0],
    desc: '常规洁牙 (全口)',
    toothPos: '全口洁治',
    avatar: 'https://picsum.photos/seed/p2/200/200',
    records: [
      {
        id: 'r2',
        date: new Date().toISOString().split('T')[0],
        time: '10:45 AM',
        toothPos: '全口洁治',
        desc: '超声波洗牙，喷砂抛光。'
      }
    ]
  }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Fix: Added missing 'date' and 'duration' properties to satisfy the Appointment interface
  { id: '1', patientName: '张伟', phone: '138 0013 8000', type: '种植咨询', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 60, status: 'booked' },
  // Fix: Added missing 'date'/'duration' and changed invalid status 'free' to 'break' to match the allowed literal types
  { id: '2', patientName: '诊间维护', phone: '-', type: '消毒休息', date: new Date().toISOString().split('T')[0], time: '10:00', duration: 60, status: 'break' },
];

export const MOCK_MEDICINES: Medicine[] = [
  { id: 'm1', name: '阿替卡因肾上腺素注射液', brand: '必兰', expiryDate: '2026-02-15', stock: 12, unit: '支', minStock: 20, category: '麻醉', status: 'warning' },
  { id: 'm2', name: '3M纳米复合树脂', brand: '3M Z350', expiryDate: '2025-12-20', stock: 5, unit: '盒', minStock: 2, category: '填充', status: 'expired' },
  { id: 'm3', name: '氢氧化钙糊剂', brand: '梅塔', expiryDate: '2026-08-10', stock: 8, unit: '支', minStock: 5, category: '填充', status: 'normal' },
  { id: 'm4', name: '一次性口腔器械包', brand: '恒健', expiryDate: '2027-01-01', stock: 150, unit: '套', minStock: 50, category: '耗材', status: 'normal' },
];

export const MOCK_SHOPPING_LIST: ShoppingItem[] = [
  { id: 's1', name: '阿替卡因肾上腺素注射液', quantity: '20支', isCustom: false, addedDate: '2026-01-28', isBought: false },
  { id: 's2', name: '高速涡轮手机芯', quantity: '2个', isCustom: true, addedDate: '2026-01-27', isBought: false },
];

export const TEETH_ADULT = ['8', '7', '6', '5', '4', '3', '2', '1'];
export const TEETH_CHILD = ['E', 'D', 'C', 'B', 'A'];

export const COMMON_TREATMENTS = [
  '根管治疗',
  '常规洁牙',
  '智齿拔除',
  '补牙修复',
  '牙周治疗',
  '种植二期',
  '正畸加力',
  '全口检查'
];
