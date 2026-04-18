import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * useRealtimeSync (Online Edition)
 * 
 * Subscribes to Supabase Postgres Changes and triggers a global refresh
 * when data relevant to the current pharmacy changes.
 */
export const useRealtimeSync = (callback?: () => void) => {
  const { pharmacyId } = useAuth();

  useEffect(() => {
    if (!pharmacyId) return;

    console.log(`[Realtime] Subscribing to changes for Pharmacy: ${pharmacyId}`);

    // Subscribe to drugs, sales, and notifications
    const channel = supabase.channel('pharmacy-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drugs',
          filter: `pharmacy_id=eq.${pharmacyId}`
        },
        (payload) => {
          console.log('[Realtime] Drug change detected:', payload);
          if (callback) callback();
          // Dispatch a global event as a fallback
          window.dispatchEvent(new CustomEvent('database-change', { detail: { table: 'drugs' } }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `pharmacy_id=eq.${pharmacyId}`
        },
        (payload) => {
          console.log('[Realtime] Sale change detected:', payload);
          if (callback) callback();
          window.dispatchEvent(new CustomEvent('database-change', { detail: { table: 'sales' } }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `pharmacy_id=eq.${pharmacyId}`
        },
        (payload) => {
          console.log('[Realtime] Notification change detected:', payload);
          if (callback) callback();
          window.dispatchEvent(new CustomEvent('database-change', { detail: { table: 'notifications' } }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pharmacyId, callback]);

  return null;
};
