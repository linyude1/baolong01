
export enum PatientStatus {
  WAITING = '待检查',
  COMPLETED = '已完成',
  IN_PROGRESS = '进行中',
  APPOINTMENT = '预约',
  TREATING = '就诊中'
}

export enum TreatmentType {
  INITIAL = '初诊',
  FOLLOW_UP = '复诊'
}

export interface TreatmentRecord {
  id: string;
  date: string;
  time: string;
  toothPos: string;
  desc: string;
  imageUrl?: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  cardNumber?: string;
  age?: string;
  gender?: '男' | '女';
  visitDate?: string;
  avatar?: string;
  status: PatientStatus;
  treatmentType: TreatmentType;
  time: string;
  desc: string;
  toothPos?: string;
  imageUrl?: string;
  records?: TreatmentRecord[];
  roomNumber?: string;
}

export interface DeletedPatient {
  id: string;
  name: string;
  phone: string;
  deletedAt: string;
  data: Patient;
}

export interface Appointment {
  id: string;
  patientId?: string; // 关联已有患者
  patientName: string;
  phone: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // 分钟
  status: 'booked' | 'break';
  note?: string;
}

export type Quadrant = 'UR' | 'UL' | 'LR' | 'LL';

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  expiryDate: string;
  stock: number;
  unit: string;
  minStock: number;
  category: '麻醉' | '填充' | '消毒' | '耗材' | '其他';
  status: 'normal' | 'expired' | 'warning';
}

export interface DeletedMedicine {
  id: string;
  name: string;
  brand: string;
  deletedAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  isCustom: boolean;
  addedDate: string;
  isBought: boolean;
}
