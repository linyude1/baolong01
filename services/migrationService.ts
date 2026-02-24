
import { supabase } from '../lib/supabase';
import { patientService } from './patientService';
import { appointmentService } from './appointmentService';
import { medicineService } from './medicineService';

export const migrationService = {
    hasLocalData: () => {
        return !!(
            localStorage.getItem('dental_patients') ||
            localStorage.getItem('dental_appointments') ||
            localStorage.getItem('dental_medicines')
        );
    },

    migrateAll: async () => {
        const patients = JSON.parse(localStorage.getItem('dental_patients') || '[]');
        const appointments = JSON.parse(localStorage.getItem('dental_appointments') || '[]');
        const medicines = JSON.parse(localStorage.getItem('dental_medicines') || '[]');
        const medicineHistory = JSON.parse(localStorage.getItem('dental_medicine_history') || '[]');
        const shoppingList = JSON.parse(localStorage.getItem('dental_shopping') || '[]');

        console.log('Starting migration...', { patients: patients.length, appointments: appointments.length });

        // Migrate Patients
        for (const p of patients) {
            await patientService.addPatient(p);
        }

        // Migrate Appointments
        for (const a of appointments) {
            await appointmentService.addAppointment(a);
        }

        // Migrate Medicines
        for (const m of medicines) {
            await medicineService.addMedicine(m);
        }

        // Clear local storage (optional, but safer to keep for now and rename)
        localStorage.setItem('dental_patients_backup', JSON.stringify(patients));
        localStorage.setItem('dental_appointments_backup', JSON.stringify(appointments));
        localStorage.removeItem('dental_patients');
        localStorage.removeItem('dental_appointments');
        localStorage.removeItem('dental_medicines');

        return true;
    }
};
