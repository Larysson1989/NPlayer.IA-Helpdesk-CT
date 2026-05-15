import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, MapPin, Hash, Briefcase,
  Building2, Camera, Trash2, Loader2, CheckCircle2,
  AlertCircle, Save, Search, X
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Address {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
  erro?: boolean;
}

interface ProfileData {
  avatar?: string;
  nome: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  matricula: string;
  cargo: string;
  bloco: string;
}

interface UserProfileProps {
  initialData?: Partial<ProfileData>;
  onSave?: (data: ProfileData) => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// ─────────────────────────────────────────────
// Input Field Component
// ─────────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  suffix?: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}

function Field({
  label, icon, value, onChange,
  placeholder, type = 'text', disabled, readOnly,
  suffix, hint, error, required
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
        {required && <span className="text-primary text-xs leading-none">*</span>}
      </label>
      <div
        className={`
          relative flex items-center rounded-[18px] border-2 transition-all duration-200
          ${error
            ? 'border-red-300 bg-red-50'
            : focused
              ? 'border-primary/20 bg-white shadow-sm shadow-primary/5'
              : readOnly || disabled
                ? 'border-slate-100 bg-slate-50/60'
                : 'border-transparent bg-slate-50 hover:border-slate-100'
          }
        `}
      >
        <span className={`absolute left-4 transition-colors duration-200 ${focused ? 'text-primary' : 'text-slate-300'}`}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-semibold text-primary
            placeholder:text-slate-300 placeholder:font-normal focus:outline-none
            ${readOnly ? 'cursor-default' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center">
            {suffix}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-medium ml-1"
          >
            <AlertCircle size={11} /> {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-[10px] text-slate-400 font-medium ml-1">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────────
function AvatarUpload({
  value, name, onChange, onRemove
}: { value?: string; name: string; onChange: (v: string) => void; onRemove: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem deve ter no máximo 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative group cursor-pointer ${dragging ? 'scale-105' : ''} transition-transform duration-300`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith('image/')) handleFile(file);
        }}
        onClick={() => ref.current?.click()}
      >
        {/* Avatar circle */}
        <div className={`
          w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white shadow-xl
          flex items-center justify-center
          ${dragging ? 'ring-4 ring-primary/30' : ''}
          transition-all duration-300
        `}>
          {value ? (
            <img src={value} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-white font-bold text-3xl tracking-tight font-headline">
                {initials || <User size={36} />}
              </span>
            </div>
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 rounded-[32px] bg-primary/0 group-hover:bg-primary/20 transition-all duration-300 flex items-center justify-center">
          <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Camera badge */}
        <div className="absolute -bottom-1 -right-1 p-2.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 border-2 border-white group-hover:scale-110 transition-transform">
          <Camera size={14} />
        </div>
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
        >
          <Trash2 size={12} /> Remover foto
        </motion.button>
      )}

      <p className="text-[10px] text-slate-400 font-medium text-center">
        Clique ou arraste • PNG, JPG até 2MB
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const DEFAULT_DATA: ProfileData = {
  avatar: '',
  nome: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  matricula: '',
  cargo: '',
  bloco: '',
};

export function UserProfile({ initialData = {}, onSave }: UserProfileProps) {
  const [data, setData] = useState<ProfileData>({ ...DEFAULT_DATA, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── CEP lookup ──────────────────────────────
  const lookupCep = useCallback(async (cep: string) => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length !== 8) return;

    setCepLoading(true);
    setCepStatus('idle');
    setErrors(prev => ({ ...prev, cep: undefined }));

    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const json: Address = await res.json();

      if (json.erro) {
        setCepStatus('error');
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        setData(prev => ({ ...prev, logradouro: '', bairro: '', cidade: '', uf: '' }));
      } else {
        setCepStatus('ok');
        setData(prev => ({
          ...prev,
          logradouro: json.logradouro ?? '',
          bairro: json.bairro ?? '',
          cidade: json.localidade ?? '',
          uf: json.uf ?? '',
        }));
      }
    } catch {
      setCepStatus('error');
      setErrors(prev => ({ ...prev, cep: 'Erro ao consultar CEP. Tente novamente.' }));
    } finally {
      setCepLoading(false);
    }
  }, []);

  const set = (field: keyof ProfileData) => (value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // ── Validation ──────────────────────────────
  const validate = () => {
    const errs: Partial<Record<keyof ProfileData, string>> = {};
    if (!data.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!data.email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'E-mail inválido';
    if (data.cep && data.cep.replace(/\D/g, '').length !== 8) errs.cep = 'CEP inválido';
    return errs;
  };

  // ── Submit ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    onSave?.(data);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── CEP suffix icon ─────────────────────────
  const CepSuffix = () => {
    if (cepLoading) return <Loader2 size={16} className="animate-spin text-primary" />;
    if (cepStatus === 'ok') return <CheckCircle2 size={16} className="text-green-500" />;
    if (cepStatus === 'error') return <AlertCircle size={16} className="text-red-400" />;
    if (data.cep.replace(/\D/g, '').length === 8)
      return (
        <button
          type="button"
          onClick={() => lookupCep(data.cep)}
          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/70 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          <Search size={13} /> Buscar
        </button>
      );
    return null;
  };

  const hasAddress = data.logradouro || data.bairro || data.cidade;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 flex items-start justify-center py-8 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">

        {/* ── Page Title ────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">Meu Perfil</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Mantenha seus dados sempre atualizados</p>
          </div>
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg transition-all duration-300
              ${saved
                ? 'bg-green-500 text-white shadow-green-200'
                : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </motion.span>
              ) : saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> Salvo!
                </motion.span>
              ) : (
                <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Save size={16} /> Salvar
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Card: Foto ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8"
        >
          <SectionLabel icon={<Camera size={14} />} text="Foto de Perfil" />
          <div className="mt-6">
            <AvatarUpload
              value={data.avatar}
              name={data.nome || 'Usuário'}
              onChange={set('avatar')}
              onRemove={() => setData(prev => ({ ...prev, avatar: '' }))}
            />
          </div>
        </motion.div>

        {/* ── Card: Dados Pessoais ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 space-y-5"
        >
          <SectionLabel icon={<User size={14} />} text="Dados Pessoais" />

          <Field
            label="Nome Completo"
            icon={<User size={16} />}
            value={data.nome}
            onChange={set('nome')}
            placeholder="Ex: João da Silva"
            error={errors.nome}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="E-mail"
              icon={<Mail size={16} />}
              value={data.email}
              onChange={set('email')}
              placeholder="nome@hpp.org.br"
              type="email"
              error={errors.email}
              required
            />
            <Field
              label="Telefone"
              icon={<Phone size={16} />}
              value={data.telefone}
              onChange={v => set('telefone')(maskPhone(v))}
              placeholder="(41) 9 9999-9999"
              type="tel"
            />
          </div>
        </motion.div>

        {/* ── Card: Endereço ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 space-y-5"
        >
          <SectionLabel icon={<MapPin size={14} />} text="Endereço" />

          {/* CEP row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-1">
              <Field
                label="CEP"
                icon={<MapPin size={16} />}
                value={data.cep}
                onChange={v => {
                  const masked = maskCep(v);
                  set('cep')(masked);
                  setCepStatus('idle');
                  const raw = masked.replace(/\D/g, '');
                  if (raw.length === 8) lookupCep(masked);
                }}
                placeholder="00.000-000"
                error={errors.cep}
                suffix={<CepSuffix />}
              />
            </div>
          </div>

          {/* Address preview */}
          <AnimatePresence>
            {hasAddress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-primary/[0.04] rounded-[20px] p-4 border border-primary/10 flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-primary">
                      {data.logradouro}{data.logradouro && ','}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {[data.bairro, data.cidade, data.uf].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setData(prev => ({ ...prev, cep: '', logradouro: '', bairro: '', cidade: '', uf: '' }));
                      setCepStatus('idle');
                    }}
                    className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-primary/40 hover:text-primary transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Card: Dados Institucionais ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 space-y-5"
        >
          <SectionLabel icon={<Briefcase size={14} />} text="Dados Institucionais" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Matrícula"
              icon={<Hash size={16} />}
              value={data.matricula}
              onChange={set('matricula')}
              placeholder="000000"
            />
            <Field
              label="Cargo"
              icon={<Briefcase size={16} />}
              value={data.cargo}
              onChange={set('cargo')}
              placeholder="Ex: Enfermeiro(a)"
            />
          </div>

          <Field
            label="Bloco / Departamento"
            icon={<Building2 size={16} />}
            value={data.bloco}
            onChange={set('bloco')}
            placeholder="Ex: Bloco A – UTI Pediátrica"
          />
        </motion.div>

        {/* ── Mobile save button ────────────────── */}
        <div className="sm:hidden pb-6">
          <motion.button
            type="submit"
            disabled={saving}
            whileTap={{ scale: 0.97 }}
            className={`
              w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm shadow-xl transition-all
              ${saved ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-primary/20'}
              disabled:opacity-60
            `}
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> :
             saved   ? <><CheckCircle2 size={18} /> Salvo com sucesso!</> :
                       <><Save size={18} /> Salvar Perfil</>}
          </motion.button>
        </div>

      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section Label helper
// ─────────────────────────────────────────────
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{text}</span>
    </div>
  );
}

export default UserProfile;
