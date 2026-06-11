import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi } from 'lucide-react';
import type { OnlineUser } from '../hooks/useOnlineUsers';
import { UserAvatar } from './UserAvatar';

const ROLE_DOT: Record<string, string> = {
  captador:      'bg-blue-500',
  supervisor:    'bg-purple-500',
  administrador: 'bg-emerald-500',
};

const ROLE_LABEL: Record<string, string> = {
  captador:      'Captador',
  supervisor:    'Supervisor',
  administrador: 'Admin',
};

interface Props {
  onlineUsers: OnlineUser[];
  onlineCount: number;
  expanded?: boolean;
}

export function OnlineUsersWidget({ onlineUsers, onlineCount, expanded = true }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <p className="text-xs font-black uppercase tracking-wider text-slate-600">
            Online agora
          </p>
        </div>
        <span className="text-xs font-black tabular-nums px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
          {onlineCount} {onlineCount === 1 ? 'usuário' : 'usuários'}
        </span>
      </div>

      {/* Lista */}
      {expanded && (
        <div className="divide-y divide-slate-50">
          <AnimatePresence initial={false}>
            {onlineUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wifi size={14} /> Nenhum usuário online
                </p>
              </div>
            ) : (
              onlineUsers.map((u) => (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="relative">
                    <UserAvatar name={u.user_name} size="sm" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        ROLE_DOT[u.user_role] ?? 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{u.user_name}</p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {ROLE_LABEL[u.user_role] ?? u.user_role}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ao vivo
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Badge compacto para o header do dashboard */
export function OnlineUsersBadge({ onlineUsers, onlineCount }: { onlineUsers: OnlineUser[]; onlineCount: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-[11px] font-black text-emerald-700 tabular-nums">
        {onlineCount} online
      </span>
    </div>
  );
}
