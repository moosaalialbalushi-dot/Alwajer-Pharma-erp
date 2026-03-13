import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createMockClient = () => ({
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: (data: any) => {
      console.log('Mock insert to', table, data);
      return Promise.resolve({ data, error: null });
    },
    update: (data: any) => ({
      eq: () => {
        console.log('Mock update to', table, data);
        return Promise.resolve({ data, error: null });
      },
    }),
    delete: () => ({
      eq: () => {
        console.log('Mock delete from', table);
        return Promise.resolve({ data: null, error: null });
      },
    }),
  }),
});

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();
