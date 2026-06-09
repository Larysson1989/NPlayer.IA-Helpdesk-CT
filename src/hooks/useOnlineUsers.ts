import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OnlineUser {
  user_id:   string;
  user_name: string;
  user_role: string;
  online_at: string;
}

/**
 * Hook que retorna a lista de usuários online agora via Supabase Realtime Presence.
 * Cada cliente faz track() ao montar e untrack() ao desmontar.
 */
export function useOnlineUsers(
  currentUser?: { id: string; name: string; role: string } | null,
): { users: OnlineUser[]; count: number } {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Cria canal de presença
    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUser?.id ?? 'anonymous' } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>();
        const flat: OnlineUser[] = [];
        for (const key of Object.keys(state)) {
          for (const presence of state[key]) {
            flat.push(presence);
          }
        }
        // Remove duplicatas pelo user_id (mantém o mais recente)
        const seen = new Map<string, OnlineUser>();
        for (const u of flat) {
          if (!seen.has(u.user_id) || u.online_at > seen.get(u.user_id)!.online_at) {
            seen.set(u.user_id, u);
          }
        }
        setUsers([...seen.values()]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          await channel.track({
            user_id:   currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            online_at: new Date().toISOString(),
          } satisfies OnlineUser);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  return { users, count: users.length };
}
