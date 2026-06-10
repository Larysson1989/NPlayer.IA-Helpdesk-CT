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
 * REGRA FUNDAMENTAL do Presence:
 *   Todos os clientes DEVEM se inscrever no MESMO nome de canal para se verem.
 *   O canal usa o nome FIXO 'room:online-users' — nunca dinâmico.
 *
 * ORDEM obrigatória: .on() → .subscribe() → channel.track()
 *
 * Cleanup no desmonte garante que o usuário suma da lista dos outros
 * quando navegar para fora ou fechar a aba.
 */

const CHANNEL_NAME = 'room:online-users';

export function useOnlineUsers(
  currentUser?: { id: string; name: string; role: string } | null,
): { users: OnlineUser[]; count: number } {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Remove canal anterior se existir (StrictMode / re-render)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Cria canal com nome FIXO compartilhado — todos os usuários entram aqui
    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        presence: {
          // A key identifica ESTE cliente dentro do canal compartilhado
          key: currentUser?.id ?? `anon-${Math.random().toString(36).slice(2)}`,
        },
      },
    });

    channelRef.current = channel;

    // ✅ .on() SEMPRE antes de .subscribe()
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<OnlineUser>();
      const flat: OnlineUser[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences) {
          flat.push(p as OnlineUser);
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
      // untrack avisa os outros que este usuário saiu antes de remover o canal
      channel.untrack().finally(() => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      });
    };
  // Recria apenas quando o user_id muda (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  return { users, count: users.length };
}
