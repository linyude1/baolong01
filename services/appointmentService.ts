import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Appointment } from '../types';

function rowToAppointment(row: any): Appointment {
    return {
        id: row.id,
        patientId: row.patient_id || undefined,
        patientName: row.patient_name,
        phone: row.phone,
        type: row.type,
        date: row.date,
        time: row.time,
        duration: row.duration,
        status: row.status,
        note: row.note || undefined,
    };
}

function appointmentToRow(apt: Appointment) {
    return {
        id: apt.id,
        patient_id: apt.patientId || null,
        patient_name: apt.patientName,
        phone: apt.phone,
        type: apt.type,
        date: apt.date,
        time: apt.time,
        duration: apt.duration,
        status: apt.status,
        note: apt.note || null,
    };
}

export const appointmentService = {
    async fetchAppointments(): Promise<Appointment[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) { console.error('[Appointment] fetch error:', error); return []; }
        return (data || []).map(rowToAppointment);
    },

    async addAppointment(apt: Appointment): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase.from('appointments').insert(appointmentToRow(apt));
        if (error) { console.error('[Appointment] insert error:', error); return false; }
        return true;
    },

    async cancelAppointment(id: string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) { console.error('[Appointment] delete error:', error); return false; }
        return true;
    },
};
