import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OnlineUser {
  user_id:   string;
  user_name: string;
  user_role: string;
  online_at: string;
}

/**
 * Hook que retorna a lista de usuários online via Supabase Realtime Presence.
 *
 * FIX: usa nome de canal único por instância para evitar o erro
 * "cannot add presence callbacks after subscribe()" causado pelo React
 * StrictMode (dupla execução de useEffect) ou re-renders que reutilizariam
 * um canal já inscrito com o nome fixo 'online-users'.
 */
export function useOnlineUsers(
  currentUser?: { id: string; name: string; role: string } | null,
): { users: OnlineUser[]; count: number } {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // ID estável por montagem do hook — garante nome único mesmo no StrictMode
  const instanceId = useRef(`online-users-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    // Cleanup de canal anterior (StrictMode / re-render rápido)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Cria canal com nome único — nunca reutiliza canal já inscrito
    const channel = supabase.channel(instanceId.current, {
      config: { presence: { key: currentUser?.id ?? 'anonymous' } },
    });

    channelRef.current = channel;

    // ✅ .on() SEMPRE antes de .subscribe()
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineUser>();
      const flat: OnlineUser[] = [];
      for (const key of Object.keys(state)) {
        for (const presence of state[key]) {
          flat.push(presence);
        }
      }
      // Remove duplicatas — mantém entrada mais recente por user_id
      const seen = new Map<string, OnlineUser>();
      for (const u of flat) {
        if (!seen.has(u.user_id) || u.online_at > seen.get(u.user_id)!.online_at) {
          seen.set(u.user_id, u);
        }
      }
      setUsers([...seen.values()]);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentUser?.id) {
        await channel.track({
          user_id:   currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          online_at: new Date().toISOString(),
        } satisfies OnlineUser);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // Recria o canal apenas quando o user_id muda (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return { users, count: users.length };
}
