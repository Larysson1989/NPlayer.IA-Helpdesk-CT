import React from 'react';
import type { PresenceStatus } from '../hooks/useOnlineUsers';
import type { OnlineUser } from '../hooks/useOnlineUsers';

interface Props {
  status: PresenceStatus;
  users: OnlineUser[];
}

const STATUS_CONFIG: Record<PresenceStatus, { color: string; label: string }> = {
  idle:       { color: 'bg-slate-300',  label: 'Inativo' },
  connecting: { color: 'bg-yellow-400', label: 'Conectando...' },
  connected:  { color: 'bg-emerald-500', label: 'Conectado ✓' },
  error:      { color: 'bg-red-500',     label: 'ERRO de conexão' },
  timeout:    { color: 'bg-orange-500',  label: 'Timeout — sem resposta' },
};

const STATUS_FALLBACK = { color: 'bg-slate-300', label: 'Desconhecido' };

export function PresenceDebugBadge({ status, users }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_FALLBACK;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 shadow-xl rounded-2xl p-3 text-xs font-mono w-64">
      <p className="font-black text-slate-600 mb-2 text-[11px] uppercase tracking-wider">🔧 Debug Presence</p>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.color} animate-pulse`} />
        <span className="font-bold text-slate-700">{cfg.label}</span>
      </div>
      <p className="text-slate-500 mb-1">Canal: <span className="text-blue-600">room:online-users</span></p>
      <p className="text-slate-500 mb-2">Usuários detectados: <span className="font-black text-slate-800">{users.length}</span></p>
      {users.length > 0 && (
        <div className="border-t border-slate-100 pt-2 flex flex-col gap-1">
          {users.map(u => (
            <p key={u.user_id} className="text-slate-500 truncate">
              • <span className="text-slate-700 font-semibold">{u.user_name}</span>
              <span className="text-slate-400"> ({u.user_role})</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}