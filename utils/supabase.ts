
import { Booking, Member, Room } from '../types';

// 使用用戶提供的 Supabase 憑證
const SUPABASE_URL = 'https://qucnjzsrsxymhmapkaaf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1Y25qenNyc3h5bWhtYXBrYWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTg1NTUsImV4cCI6MjA4MjI3NDU1NX0.AUt-eKHihCRKlRTYvQJog7fmhExSf5HkdXjr9iv4KBg';

// 從 window 獲取 supabase 物件 (由 index.html 引入)
const createClient = (window as any).supabase?.createClient;
export const supabase = createClient ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const syncBookings = async (bookings: Booking[]) => {
  if (!supabase) return;
  const payloads = bookings.map(b => ({
    id: b.id,
    date: b.date,
    data: b,
    updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from('larp_bookings').upsert(payloads);
  if (error) console.error('Supabase Sync Bookings Error:', error);
};

export const syncMembers = async (members: Member[]) => {
  if (!supabase) return;
  const payloads = members.map(m => ({
    id: m.id,
    username: m.username,
    data: m,
    updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from('larp_members').upsert(payloads);
  if (error) console.error('Supabase Sync Members Error:', error);
};

export const syncSettings = async (settings: any) => {
  if (!supabase) return;
  const { error } = await supabase.from('larp_settings').upsert({
    id: 'global_config',
    data: settings,
    updated_at: new Date().toISOString()
  });
  if (error) console.error('Supabase Sync Settings Error:', error);
};

export const fetchAllLarpData = async () => {
  if (!supabase) return null;
  
  try {
    const [bRes, mRes, sRes] = await Promise.all([
      supabase.from('larp_bookings').select('data'),
      supabase.from('larp_members').select('data'),
      supabase.from('larp_settings').select('data').eq('id', 'global_config').single()
    ]);

    return {
      bookings: bRes.data?.map((d: any) => d.data) || [],
      members: mRes.data?.map((d: any) => d.data) || [],
      settings: sRes.data?.data || null
    };
  } catch (err) {
    console.error('Fetch Cloud Data Failed:', err);
    return null;
  }
};

export const deleteBookingFromCloud = async (id: string) => {
    if (!supabase) return;
    await supabase.from('larp_bookings').delete().eq('id', id);
};

export const deleteMemberFromCloud = async (id: string) => {
    if (!supabase) return;
    await supabase.from('larp_members').delete().eq('id', id);
};
