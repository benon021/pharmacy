/**
 * useRealtimeSync (Local Edition)
 * 
 * In the local version, we don't need Supabase websocket channels.
 * Data updates are instant because they happen in the same IndexedDB context.
 */
export const useRealtimeSync = () => {
  // No-op for local database
  return;
};
