import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Medicine, DeletedMedicine, ShoppingItem } from '../types';

function rowToMedicine(row: any): Medicine {
    return {
        id: row.id,
        name: row.name,
        brand: row.brand,
        expiryDate: row.expiry_date,
        stock: row.stock,
        unit: row.unit,
        minStock: row.min_stock,
        category: row.category,
        status: row.status,
    };
}

function medicineToRow(m: Medicine) {
    return {
        id: m.id,
        name: m.name,
        brand: m.brand,
        expiry_date: m.expiryDate,
        stock: m.stock,
        unit: m.unit,
        min_stock: m.minStock,
        category: m.category,
        status: m.status,
    };
}

function rowToShoppingItem(row: any): ShoppingItem {
    return {
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        isCustom: row.is_custom,
        addedDate: row.added_date,
        isBought: row.is_bought,
    };
}

function shoppingItemToRow(item: ShoppingItem) {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        is_custom: item.isCustom,
        added_date: item.addedDate,
        is_bought: item.isBought,
    };
}

export const medicineService = {
    async fetchMedicines(): Promise<Medicine[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (error) { console.error('[Medicine] fetch error:', error); return []; }
        return (data || []).map(rowToMedicine);
    },

    async fetchDeletedMedicines(): Promise<DeletedMedicine[]> {
        if (!isSupabaseConfigured()) return [];

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .eq('is_deleted', true)
            .gte('deleted_at', sevenDaysAgo.toISOString())
            .order('deleted_at', { ascending: false });

        if (error) { console.error('[Medicine] fetch deleted error:', error); return []; }
        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            brand: row.brand,
            deletedAt: row.deleted_at,
        }));
    },

    async addMedicine(med: Medicine): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase.from('medicines').insert(medicineToRow(med));
        if (error) { console.error('[Medicine] insert error:', error); return false; }
        return true;
    },

    async deleteMedicine(id: string): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('medicines')
            .update({ is_deleted: true, deleted_at: new Date().toISOString() })
            .eq('id', id);
        if (error) { console.error('[Medicine] soft delete error:', error); return false; }
        return true;
    },

    async fetchShoppingItems(): Promise<ShoppingItem[]> {
        if (!isSupabaseConfigured()) return [];

        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) { console.error('[Shopping] fetch error:', error); return []; }
        return (data || []).map(rowToShoppingItem);
    },

    async addShoppingItem(item: ShoppingItem): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase.from('shopping_items').insert(shoppingItemToRow(item));
        if (error) { console.error('[Shopping] insert error:', error); return false; }
        return true;
    },

    async toggleShoppingItem(id: string, currentValue: boolean): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;

        const { error } = await supabase
            .from('shopping_items')
            .update({ is_bought: !currentValue })
            .eq('id', id);
        if (error) { console.error('[Shopping] toggle error:', error); return false; }
        return true;
    },
};
