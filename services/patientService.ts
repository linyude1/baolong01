import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Patient, DeletedPatient, TreatmentRecord } from '../types';

// DB row → 前端 Patient 对象
function rowToPatient(row: any, records: any[] = []): Patient {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        cardNumber: row.card_number || undefined,
        age: row.age || undefined,
        gender: row.gender || undefined,
        visitDate: row.visit_date || undefined,
        avatar: row.avatar || undefined,
        status: row.status,
        treatmentType: row.treatment_type,
        time: row.time || '',
        desc: row.description || '',
        toothPos: row.tooth_pos || undefined,
        imageUrl: row.image_url || undefined,
        roomNumber: row.room_number || undefined,
        records: records.map(r => ({
            id: r.id,
            date: r.date,
            time: r.time,
            toothPos: r.tooth_pos || '',
            desc: r.description || '',
            imageUrl: r.image_url || undefined,
        })),
    };
}

// 前端 Patient → DB 行 (不含 records)
function patientToRow(p: Patient) {
    return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        card_number: p.cardNumber || null,
        age: p.age || null,
        gender: p.gender || null,
        visit_date: p.visitDate || null,
        avatar: p.avatar || null,
        status: p.status,
        treatment_type: p.treatmentType,
        time: p.time,
        description: p.desc,
        tooth_pos: p.toothPos || null,
        image_url: p.imageUrl || null,
        room_number: p.roomNumber || null,
    };
}

function recordToRow(r: TreatmentRecord, patientId: string) {
    return {
        id: r.id,
        patient_id: patientId,
        date: r.date,
        time: r.time,
        tooth_pos: r.toothPos || null,
        description: r.desc,
        image_url: r.imageUrl || null,
    };
}

export const patientService = {
    async fetchPatients(): Promise<Patient[]> {
        if (!isSupabaseConfigured()) return [];

        const { data: patients, error } = await supabase
            .from('patients')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Patient] fetch error:', error); return []; }

        const ids = (patients || []).map((p: any) => p.id);
        let records: any[] = [];
        if (ids.length > 0) {
            const { data } = await supabase
                .from('treatment_records')
                .select('*')
                .in('patient_id', ids)
                .order('created_at', { ascending: false });
            records = data || [];
        }

        return (patients || []).map((p: any) =>
            rowToPatient(p, records.filter((r: any) => r.patient_id === p.id))
        );
    },

    async fetchDeletedPatients(): Promise<DeletedPatient[]> {
        if (!isSupabaseConfigured()) return [];

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('is_deleted', true)
            .gte('deleted_at', sevenDaysAgo.toISOString())
            .order('deleted_at', { ascending: false });

        if (error) { console.error('[Patient] fetch deleted error:', error); return []; }

        // 获取关联的 records
        const ids = (data || []).map((p: any) => p.id);
        let records: any[] = [];
        if (ids.length > 0) {
            const { data: recs } = await supabase
                .from('treatment_records')
                .select('*')
                .in('patient_id', ids)
                .order('created_at', { ascending: false });
            records = recs || [];
        }

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            deletedAt: p.deleted_at,
            data: rowToPatient(p, records.filter((r: any) => r.patient_id === p.id)),
        }));
    },

    async addPatient(patient: Patient): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const row = patientToRow(patient);
        const { error } = await supabase.from('patients').insert(row);
        if (error) { console.error('[Patient] insert error:', error); return false; }

        // 插入关联 records
        if (patient.records && patient.records.length > 0) {
            const recordRows = patient.records.map(r => recordToRow(r, patient.id));
            const { error: recError } = await supabase.from('treatment_records').insert(recordRows);
            if (recError) console.error('[Patient] insert records error:', recError);
        }
        return true;
    },

    async updatePatient(patient: Patient): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const row = patientToRow(patient);
        const { error } = await supabase
            .from('patients')
            .update({ ...row, updated_at: new Date().toISOString() })
            .eq('id', patient.id);
        if (error) { console.error('[Patient] update error:', error); return false; }

        // 同步 records: 先删除旧的，再全量插入
        if (patient.records) {
            await supabase.from('treatment_records').delete().eq('patient_id', patient.id);
            if (patient.records.length > 0) {
                const recordRows = patient.records.map(r => recordToRow(r, patient.id));
                const { error: recError } = await supabase.from('treatment_records').insert(recordRows);
                if (recError) console.error('[Patient] sync records error:', recError);
            }
        }
        return true;
    },

    async deletePatient(id: string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('patients')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) { console.error('[Patient] soft delete error:', error); return false; }
        return true;
    },

    async restorePatient(id: string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('patients')
            .update({ is_deleted: false, deleted_at: null })
            .eq('id', id);
        if (error) { console.error('[Patient] restore error:', error); return false; }
        return true;
    },
};
