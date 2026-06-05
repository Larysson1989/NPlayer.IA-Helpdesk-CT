import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, LogOut, Mail, Phone, MapPin, Calendar,
  Hash, Briefcase, Building2, CalendarCheck, ShieldCheck,
  UserCog, Edit2, KeyRound, Download, UserX, TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { UserAvatar } from '../components/UserAvatar';
import type { User, UserRole } from '../App';

interface UserProfilePageProps {
  profileUser: User;
  adminName:   string;
  adminRole:   UserRole;
  onBack:      () => void;
  onLogout:    () => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  captador:      { label: 'Captador',      color: 'text-blue-700',    bg: 'bg-blue-50',    icon: <UserCog size={16} /> },
  supervisor:    { label: 'Supervisor',    color: 'text-purple-700',  bg: 'bg-purple-50',  icon: <ShieldCheck size={16} /> },
  administrador: { label: 'Administrador', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <ShieldCheck size={16} /> },
};

const CARGO_BY_ROLE: Record<UserRole, string> = {
  captador:      'Captador Pleno',
  supervisor:    'Supervisor de Equipe',
  administrador: 'Administrador do Sistema',
};

const DEPT_BY_ROLE: Record<UserRole, string> = {
  captador:      'Captação de Recursos',
  supervisor:    'Gestão de Equipes',
  administrador: 'Tecnologia da Informação',
};

function InfoField({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
        {icon}{label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ActionBtn({
  icon, label, variant = 'default', onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger' | 'primary';
  onClick?: () => void;
}) {
  const cls = {
    default: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    danger:  'bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300',
  }[variant];
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${cls}`}>
      {icon}{label}
    </button>
  );
}

export function UserProfilePage({
  profileUser, adminName, adminRole, onBack, onLogout,
}: UserProfilePageProps) {
  const role    = profileUser.role ?? 'captador';
  const roleCfg = ROLE_CONFIG[role];

  const handleBase = profileUser.name.split(' ')[0].toLowerCase();
  const handle     = `@${handleBase}_${role}`;

  const perf = {
    captacoes: 124, captacoesDelta: '+12%',
    conversao: 68,  conversaoDelta: '+5%',
    auditorias: 12,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">N</div>
          <span className="text-lg font-bold text-blue-600 tracking-tight hidden sm:block">
            NPlayer.<span className="text-yellow-400">IA</span>
          </span>
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 hidden sm:block">
            {adminRole === 'administrador' ? 'Administrador' : 'Supervisor'}
          </span>
          <span className="text-slate-200 hidden sm:block">/</span>
          <span className="text-xs font-semibold text-slate-500 hidden sm:block">Perfil do Usuário</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">Voltar</span>
          </button>
          <button onClick={onLogout} title="Sair"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-screen-xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">

          {/* COLUNA ESQUERDA */}
          <div className="flex flex-col gap-4">

            {/* Card identidade */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-3">
              <div className="relative">
                <UserAvatar
                  name={profileUser.name}
                  avatarUrl={profileUser.avatar_url ?? profileUser.avatar ?? null}
                  size="xl"
                  className="border-4 border-white shadow-md"
                />
                <span className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-blue-700 transition-colors">
                  <Edit2 size={13} />
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 leading-snug">{profileUser.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{handle}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                profileUser.active
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-red-500 bg-red-50 border-red-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  profileUser.active ? 'bg-emerald-500' : 'bg-red-400'
                }`} />
                {profileUser.active ? 'Ativo' : 'Inativo'}
              </span>
            </motion.div>

            {/* Card nível de acesso */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`${roleCfg.bg} rounded-3xl p-4 flex items-center justify-between border border-slate-100`}>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nível de Acesso</p>
                <p className={`text-base font-black uppercase tracking-wider mt-0.5 ${roleCfg.color}`}>{roleCfg.label}</p>
              </div>
              <span className={roleCfg.color}>{roleCfg.icon}</span>
            </motion.div>

            {/* Ações */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="flex flex-col gap-2">
              <ActionBtn variant="primary" icon={<Edit2 size={15} />}    label="Editar Dados" />
              <ActionBtn icon={<KeyRound size={15} />}                   label="Resetar Senha" />
              <ActionBtn icon={<Download size={15} />}                   label="Exportar Histórico" />
              <ActionBtn variant="danger"  icon={<UserX size={15} />}    label="Desativar Conta" />
            </motion.div>
          </div>

          {/* COLUNA DIREITA */}
          <div className="flex flex-col gap-4">

            {/* Informações Básicas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <Mail size={13} /> Informações Básicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="E-mail Institucional" icon={<Mail size={11} />}
                  value={<a href={`mailto:${profileUser.email}`} className="text-blue-600 hover:underline">{profileUser.email}</a>} />
                <InfoField label="Celular" icon={<Phone size={11} />}
                  value={profileUser.telefone ?? <span className="text-slate-300 italic font-normal">Não informado</span>} />
                <InfoField label="Data de Nascimento" icon={<Calendar size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
                <InfoField label="Localização" icon={<MapPin size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
              </div>
            </motion.div>

            {/* Dados Profissionais */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                <Briefcase size={13} /> Dados Profissionais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Matrícula" icon={<Hash size={11} />}
                  value={
                    profileUser.matricula
                      ? <span className="font-black text-slate-900">#{profileUser.matricula}</span>
                      : <span className="text-slate-300 italic font-normal">-</span>
                  } />
                <InfoField label="Cargo"        icon={<Briefcase size={11} />}     value={CARGO_BY_ROLE[role]} />
                <InfoField label="Departamento" icon={<Building2 size={11} />}     value={DEPT_BY_ROLE[role]} />
                <InfoField label="Data de Início" icon={<CalendarCheck size={11} />}
                  value={<span className="text-slate-300 italic font-normal">Não informado</span>} />
              </div>
            </motion.div>

            {/* Desempenho Recente */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-slate-900 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <TrendingUp size={13} /> Desempenho Recente
                </h3>
                <span className="text-[10px] text-slate-500 font-semibold">Últimos 30 dias</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Captações</p>
                  <p className="text-3xl font-black tabular-nums">{perf.captacoes}</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp size={11} /> {perf.captacoesDelta}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Conversão</p>
                  <p className="text-3xl font-black tabular-nums">{perf.conversao}%</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp size={11} /> {perf.conversaoDelta}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 font-semibold mb-1">Auditorias</p>
                  <p className="text-3xl font-black tabular-nums">{perf.auditorias}</p>
                  <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Meta ok
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
