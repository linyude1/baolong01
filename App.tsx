
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Appointments } from './pages/Appointments';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { AddCase } from './pages/AddCase';
import { Profile } from './pages/Profile';
import { MedicineInventory } from './pages/MedicineInventory';
import { Login } from './pages/Login';
import { MOCK_PATIENTS, MOCK_MEDICINES, MOCK_SHOPPING_LIST, MOCK_APPOINTMENTS } from './constants';
import { Patient, Medicine, DeletedMedicine, ShoppingItem, DeletedPatient, Appointment } from './types';
import { isSupabaseConfigured } from './lib/supabase';
import { authService } from './services/authService';
import { patientService } from './services/patientService';
import { appointmentService } from './services/appointmentService';
import { medicineService } from './services/medicineService';

// --- Contexts 定义 ---
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface PatientContextType {
  patients: Patient[];
  deletedPatients: DeletedPatient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  restorePatient: (id: string) => void;
}
const PatientContext = createContext<PatientContextType | undefined>(undefined);
export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatients must be used within a PatientProvider');
  return context;
};

interface AppointmentContextType {
  appointments: Appointment[];
  addAppointment: (apt: Appointment) => void;
  cancelAppointment: (id: string) => void;
}
const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);
export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) throw new Error('useAppointments must be used within an AppointmentProvider');
  return context;
};

interface MedicineContextType {
  medicines: Medicine[];
  deletionHistory: DeletedMedicine[];
  shoppingItems: ShoppingItem[];
  addMedicine: (medicine: Medicine) => void;
  deleteMedicine: (id: string) => void;
  setMedicines: (medicines: Medicine[]) => void;
  addShoppingItem: (item: ShoppingItem) => void;
  toggleShoppingItem: (id: string) => void;
}
const MedicineContext = createContext<MedicineContextType | undefined>(undefined);
export const useMedicines = () => {
  const context = useContext(MedicineContext);
  if (!context) throw new Error('useMedicines must be used within a MedicineProvider');
  return context;
};

type Language = 'zh' | 'en';
const translations = {
  zh: { home: '首页', appointments: '预约', cases: '病例', profile: '我的', settings: '设置', language: '语言设置', logout: '退出登录', version: '版本号', clinicName: '宝龙口腔', drName: '王医生', role: '主治医师' },
  en: { home: 'Home', appointments: 'Schedule', cases: 'Cases', profile: 'Profile', settings: 'Settings', language: 'Language', logout: 'Log Out', version: 'Version', clinicName: 'DentalPro Clinic', drName: 'Dr. Wang', role: 'Chief Dentist' }
};
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['zh']) => string;
}
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated && location.pathname !== '/login') return <Navigate to="/login" replace />;
  const hideTabs = ['/add-case', '/medicine', '/login'].includes(location.pathname) || location.pathname.startsWith('/cases/');
  return (
    <Layout showTabBar={!hideTabs && isAuthenticated}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />
        <Route path="/add-case" element={<AddCase />} />
        <Route path="/medicine" element={<MedicineInventory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const useSupabase = isSupabaseConfigured();

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('dental_auth') === 'true');

  // --- Patients ---
  const [patients, setPatients] = useState<Patient[]>(() => {
    if (useSupabase) return []; // 将通过 useEffect 加载
    const saved = localStorage.getItem('dental_patients');
    return saved ? JSON.parse(saved) : MOCK_PATIENTS;
  });
  const [deletedPatients, setDeletedPatients] = useState<DeletedPatient[]>(() => {
    if (useSupabase) return [];
    const saved = localStorage.getItem('dental_patient_history');
    const items = saved ? JSON.parse(saved) : [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return items.filter((i: any) => new Date(i.deletedAt) > sevenDaysAgo);
  });

  // --- Appointments ---
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (useSupabase) return [];
    const saved = localStorage.getItem('dental_appointments');
    return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
  });

  // --- Medicines ---
  const [medicines, setMedicinesState] = useState<Medicine[]>(() => {
    if (useSupabase) return [];
    const saved = localStorage.getItem('dental_medicines');
    return saved ? JSON.parse(saved) : MOCK_MEDICINES;
  });
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => {
    if (useSupabase) return [];
    const saved = localStorage.getItem('dental_shopping');
    return saved ? JSON.parse(saved) : MOCK_SHOPPING_LIST;
  });
  const [deletionHistory, setDeletionHistory] = useState<DeletedMedicine[]>(() => {
    if (useSupabase) return [];
    const saved = localStorage.getItem('dental_medicine_history');
    const items = saved ? JSON.parse(saved) : [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return items.filter((i: any) => new Date(i.deletedAt) > sevenDaysAgo);
  });

  const [language, setLanguage] = useState<Language>('zh');

  // ==========================================
  // Supabase 数据加载
  // ==========================================
  const loadAllData = useCallback(async () => {
    if (!useSupabase) return;
    try {
      const [pts, dpts, apts, meds, dmeds, items] = await Promise.all([
        patientService.fetchPatients(),
        patientService.fetchDeletedPatients(),
        appointmentService.fetchAppointments(),
        medicineService.fetchMedicines(),
        medicineService.fetchDeletedMedicines(),
        medicineService.fetchShoppingItems(),
      ]);
      setPatients(pts);
      setDeletedPatients(dpts);
      setAppointments(apts);
      setMedicinesState(meds);
      setDeletionHistory(dmeds);
      setShoppingItems(items);
    } catch (err) {
      console.error('[App] 从 Supabase 加载数据失败:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && useSupabase) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // ==========================================
  // localStorage 持久化 (仅在非 Supabase 模式)
  // ==========================================
  useEffect(() => localStorage.setItem('dental_auth', isAuthenticated.toString()), [isAuthenticated]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_patient_history', JSON.stringify(deletedPatients)); }, [deletedPatients]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_medicines', JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_shopping', JSON.stringify(shoppingItems)); }, [shoppingItems]);
  useEffect(() => { if (!useSupabase) localStorage.setItem('dental_medicine_history', JSON.stringify(deletionHistory)); }, [deletionHistory]);

  // ==========================================
  // Auth Context
  // ==========================================
  const authValue = useMemo(() => ({
    isAuthenticated,
    login: async (u: string, p: string) => {
      const success = await authService.login(u, p);
      if (success) setIsAuthenticated(true);
      return success;
    },
    logout: () => setIsAuthenticated(false)
  }), [isAuthenticated]);

  // ==========================================
  // Patient Context
  // ==========================================
  const patientValue = useMemo(() => ({
    patients, deletedPatients,
    addPatient: (np: Patient) => {
      setPatients(prev => [np, ...prev]);
      if (useSupabase) patientService.addPatient(np);
    },
    updatePatient: (up: Patient) => {
      setPatients(prev => prev.map(p => p.id === up.id ? up : p));
      if (useSupabase) patientService.updatePatient(up);
    },
    deletePatient: (id: string) => {
      const p = patients.find(i => i.id === id);
      if (p) {
        setPatients(prev => prev.filter(i => i.id !== id));
        setDeletedPatients(prev => [{ id: p.id, name: p.name, phone: p.phone, deletedAt: new Date().toISOString(), data: JSON.parse(JSON.stringify(p)) }, ...prev]);
        if (useSupabase) patientService.deletePatient(id);
      }
    },
    restorePatient: (id: string) => {
      const p = deletedPatients.find(i => i.id === id);
      if (p) {
        setDeletedPatients(prev => prev.filter(i => i.id !== id));
        setPatients(prev => [p.data, ...prev]);
        if (useSupabase) patientService.restorePatient(id);
      }
    }
  }), [patients, deletedPatients]);

  // ==========================================
  // Appointment Context
  // ==========================================
  const appointmentValue = useMemo(() => ({
    appointments,
    addAppointment: (apt: Appointment) => {
      setAppointments(prev => [...prev, apt]);
      if (useSupabase) appointmentService.addAppointment(apt);
    },
    cancelAppointment: (id: string) => {
      setAppointments(prev => prev.filter(a => a.id !== id));
      if (useSupabase) appointmentService.cancelAppointment(id);
    }
  }), [appointments]);

  // ==========================================
  // Medicine Context
  // ==========================================
  const medicineValue = useMemo(() => ({
    medicines, deletionHistory, shoppingItems,
    addMedicine: (m: Medicine) => {
      setMedicinesState(prev => [m, ...prev]);
      if (useSupabase) medicineService.addMedicine(m);
    },
    deleteMedicine: (id: string) => {
      const m = medicines.find(i => i.id === id);
      if (m) {
        setMedicinesState(prev => prev.filter(i => i.id !== id));
        setDeletionHistory(prev => [{ id: m.id, name: m.name, brand: m.brand, deletedAt: new Date().toISOString() }, ...prev]);
        if (useSupabase) medicineService.deleteMedicine(id);
      }
    },
    setMedicines: setMedicinesState,
    addShoppingItem: (i: ShoppingItem) => {
      setShoppingItems(prev => [i, ...prev]);
      if (useSupabase) medicineService.addShoppingItem(i);
    },
    toggleShoppingItem: (id: string) => {
      const item = shoppingItems.find(i => i.id === id);
      setShoppingItems(prev => prev.map(i => i.id === id ? { ...i, isBought: !i.isBought } : i));
      if (useSupabase && item) medicineService.toggleShoppingItem(id, item.isBought);
    }
  }), [medicines, deletionHistory, shoppingItems]);

  const langValue = useMemo(() => ({
    language, setLanguage, t: (key: keyof typeof translations['zh']) => translations[language][key] || key
  }), [language]);

  return (
    <AuthContext.Provider value={authValue}>
      <LanguageContext.Provider value={langValue}>
        <PatientContext.Provider value={patientValue}>
          <AppointmentContext.Provider value={appointmentValue}>
            <MedicineContext.Provider value={medicineValue}>
              <Router>
                <AppContent />
              </Router>
            </MedicineContext.Provider>
          </AppointmentContext.Provider>
        </PatientContext.Provider>
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
