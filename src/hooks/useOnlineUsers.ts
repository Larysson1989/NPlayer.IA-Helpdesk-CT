import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OnlineUser {
  user_id:   string;
  user_name: string;
  user_role: string;
  online_at: string;
}

export type PresenceStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'timeout';

const CHANNEL_NAME = 'room:online-users';

export function useOnlineUsers(
  currentUser?: { id: string; name: string; role: string } | null,
): { users: OnlineUser[]; count: number; presenceStatus: PresenceStatus } {
  const [users, setUsers]                   = useState<OnlineUser[]>([]);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('idle');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Não abre canal sem user_id válido
    if (!currentUser?.id) {
      setPresenceStatus('idle');
      return;
    }

    // Limpa canal anterior
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    setPresenceStatus('connecting');

    const payload: OnlineUser = {
      user_id:   currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      online_at: new Date().toISOString(),
    };

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        presence: { key: currentUser.id },
      },
    });

    channelRef.current = channel;

    // .on() SEMPRE antes de .subscribe()
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineUser>();
      const flat: OnlineUser[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences) flat.push(p as OnlineUser);
      }
      // Deduplica por user_id — mantém mais recente
      const seen = new Map<string, OnlineUser>();
      for (const u of flat) {
        if (!seen.has(u.user_id) || u.online_at > seen.get(u.user_id)!.online_at) {
          seen.set(u.user_id, u);
        }
      }
      setUsers([...seen.values()]);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setPresenceStatus('connected');
        await channel.track(payload);

        // Heartbeat a cada 25s para manter presença viva
        heartbeatRef.current = setInterval(async () => {
          try {
            await channel.track({ ...payload, online_at: new Date().toISOString() });
          } catch {
            // silencia — o próximo heartbeat vai tentar de novo
          }
        }, 25_000);

      } else if (status === 'CHANNEL_ERROR') {
        setPresenceStatus('error');
      } else if (status === 'TIMED_OUT') {
        setPresenceStatus('timeout');
      }
    });

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      channel.untrack().finally(() => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      });
    };
  }, [currentUser?.id]); // só recria quando o user_id muda (login/logout)

  return { users, count: users.length, presenceStatus };
}
