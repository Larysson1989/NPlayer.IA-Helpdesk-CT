import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OnlineUser {
  user_id:   string;
  user_name: string;
  user_role: string;
  online_at: string;
}

export type PresenceStatus = 'connecting' | 'connected' | 'error' | 'timeout';

const CHANNEL_NAME = 'room:online-users';

export function useOnlineUsers(
  currentUser?: { id: string; name: string; role: string } | null,
): { users: OnlineUser[]; count: number; presenceStatus: PresenceStatus } {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>('connecting');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setPresenceStatus('connecting');

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        presence: {
          key: currentUser?.id ?? `anon-${Math.random().toString(36).slice(2)}`,
        },
      },
    });

    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineUser>();
      const flat: OnlineUser[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences) flat.push(p as OnlineUser);
      }
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
        if (currentUser?.id) {
          await channel.track({
            user_id:   currentUser.id,
            user_name: currentUser.name,
            user_role: currentUser.role,
            online_at: new Date().toISOString(),
          } satisfies OnlineUser);
        }
      } else if (status === 'CHANNEL_ERROR') {
        setPresenceStatus('error');
      } else if (status === 'TIMED_OUT') {
        setPresenceStatus('timeout');
      }
    });

    return () => {
      channel.untrack().finally(() => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return { users, count: users.length, presenceStatus };
}
