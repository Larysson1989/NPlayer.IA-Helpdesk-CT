import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, MapPin, Hash, Briefcase,
  Building2, Camera, Trash2, Loader2, CheckCircle2,
  AlertCircle, Save, Search, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

interface ProfileData {
  avatar: string;
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

type CepStatus = 'idle' | 'loading' | 'ok' | 'error';

// ─── Masks ────────────────────────────────────────────────────────────────────

function maskCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}-${d.slice(5)}`;
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{text}</span>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

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
  suffix, hint, error, required,
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
        {required && <span className="text-primary/70 text-xs leading-none">*</span>}
      </label>

      <div
        className={[
          'relative flex items-center rounded-[18px] border-2 transition-all duration-200',
          error
            ? 'border-red-300 bg-red-50/60'
            : focused
              ? 'border-primary/20 bg-white shadow-sm shadow-primary/10'
              : readOnly || disabled
                ? 'border-transparent bg-slate-100/60'
                : 'border-transparent bg-slate-50 hover:bg-slate-100/60',
        ].join(' ')}
      >
        <span className={`absolute left-4 transition-colors duration-200 shrink-0 ${focused ? 'text-primary' : 'text-slate-300'}`}>
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
          className={[
            'w-full bg-transparent py-3.5 pl-11 text-sm font-semibold text-primary',
            'placeholder:text-slate-300 placeholder:font-normal focus:outline-none',
            suffix ? 'pr-14' : 'pr-4',
            readOnly ? 'cursor-default select-none' : '',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />

        {suffix && (
          <div className="absolute right-3 flex items-center shrink-0">
            {suffix}
          </div>
        )}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-[11px] text-red-500 font-semibold ml-1"
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="text-[10px] text-slate-400 font-medium ml-1">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────

interface AvatarUploadProps {
  value: string;
  name: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}

function AvatarUpload({ value, name, onChange, onRemove }: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem deve ter no máximo 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative group cursor-pointer transition-transform duration-300 ${dragging ? 'scale-105' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file?.type.startsWith('image/')) handleFile(file);
        }}
      >
        {/* Avatar */}
        <div className={[
          'w-28 h-28 rounded-[32px] overflow-hidden border-4 border-white shadow-xl shadow-primary/10',
          'flex items-center justify-center bg-slate-100',
          'group-hover:scale-[1.03] transition-transform duration-300',
          dragging ? 'ring-4 ring-primary/30' : '',
        ].join(' ')}>
          {value ? (
            <img src={value} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              {initials
                ? <span className="text-white font-bold text-3xl tracking-tight font-headline">{initials}</span>
                : <User size={36} className="text-white/70" />
              }
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-[32px] bg-primary/0 group-hover:bg-primary/25 transition-colors duration-300 flex items-center justify-center">
          <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Camera badge */}
        <div className="absolute -bottom-1.5 -right-1.5 p-2.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 border-2 border-white group-hover:scale-110 transition-transform duration-200">
          <Camera size={14} />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <AnimatePresence>
        {value && (
          <motion.button
            key="remove"
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50"
          >
            <Trash2 size={11} /> Remover foto
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-slate-400 font-medium text-center">
        Clique ou arraste • PNG, JPG até 2MB
      </p>
    </div>
  );
}

// ─── CEP Status Icon (standalone, não dentro do render) ───────────────────────

interface CepIconProps {
  status: CepStatus;
  cepValue: string;
  onSearch: () => void;
}

function CepIcon({ status, cepValue, onSearch }: CepIconProps) {
  if (status === 'loading') {
    return <Loader2 size={16} className="animate-spin text-primary/60" />;
  }
  if (status === 'ok') {
    return <CheckCircle2 size={16} className="text-green-500" />;
  }
  if (status === 'error') {
    return <AlertCircle size={16} className="text-red-400" />;
  }
  if (cepValue.replace(/\D/g, '').length === 8) {
    return (
      <button
        type="button"
        onClick={onSearch}
        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/70 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
      >
        <Search size={13} /> Buscar
      </button>
    );
  }
  return null;
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 sm:p-8"
    >
      {children}
    </motion.div>
  );
}

// ─── Default data ─────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserProfile({ initialData = {}, onSave }: UserProfileProps) {
  const [data, setData] = useState<ProfileData>({ ...DEFAULT_DATA, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileData, string>>>({});
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── Setter helper ─────────────────────────────────────────────────────────
  const set = useCallback((field: keyof ProfileData) => (value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  // ── CEP lookup ────────────────────────────────────────────────────────────
  const lookupCep = useCallback(async (cepValue: string) => {
    const raw = cepValue.replace(/\D/g, '');
    if (raw.length !== 8) return;

    setCepStatus('loading');
    setErrors(prev => ({ ...prev, cep: undefined }));

    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const json: ViaCepResponse = await res.json();

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
    }
  }, []);

  const handleCepChange = useCallback((v: string) => {
    const masked = maskCep(v);
    setData(prev => ({ ...prev, cep: masked, logradouro: '', bairro: '', cidade: '', uf: '' }));
    setErrors(prev => ({ ...prev, cep: undefined }));
    setCepStatus('idle');
    if (masked.replace(/\D/g, '').length === 8) {
      lookupCep(masked);
    }
  }, [lookupCep]);

  const clearAddress = useCallback(() => {
    setData(prev => ({ ...prev, cep: '', logradouro: '', bairro: '', cidade: '', uf: '' }));
    setCepStatus('idle');
    setErrors(prev => ({ ...prev, cep: undefined }));
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): Partial<Record<keyof ProfileData, string>> => {
    const errs: Partial<Record<keyof ProfileData, string>> = {};
    if (!data.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!data.email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'E-mail inválido';
    if (data.cep && data.cep.replace(/\D/g, '').length !== 8) errs.cep = 'CEP inválido';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    await new Promise<void>(r => setTimeout(r, 900)); // substitua pela chamada real à API
    onSave?.(data);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasAddress = !!(data.logradouro || data.bairro || data.cidade);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 py-8 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-2xl mx-auto space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[22px] font-headline font-bold text-primary tracking-tight leading-tight">
              Meu Perfil
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Mantenha seus dados sempre atualizados
            </p>
          </div>

          {/* Save — desktop */}
          <motion.button
            type="submit"
            disabled={saving || saved}
            whileTap={{ scale: 0.96 }}
            className={[
              'hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl',
              'font-bold text-sm shadow-lg transition-all duration-300',
              saved
                ? 'bg-green-500 text-white shadow-green-200'
                : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5',
              'disabled:opacity-70 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Salvando...
                </motion.span>
              ) : saved ? (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 size={15} /> Salvo!
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Save size={15} /> Salvar perfil
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* ── Foto ─────────────────────────────────── */}
        <Card delay={0}>
          <SectionLabel icon={<Camera size={14} />} text="Foto de Perfil" />
          <AvatarUpload
            value={data.avatar}
            name={data.nome || 'Usuário'}
            onChange={set('avatar')}
            onRemove={() => setData(prev => ({ ...prev, avatar: '' }))}
          />
        </Card>

        {/* ── Dados Pessoais ────────────────────────── */}
        <Card delay={0.06}>
          <SectionLabel icon={<User size={14} />} text="Dados Pessoais" />
          <div className="space-y-4">
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
          </div>
        </Card>

        {/* ── Endereço ──────────────────────────────── */}
        <Card delay={0.12}>
          <SectionLabel icon={<MapPin size={14} />} text="Endereço" />
          <div className="space-y-4">

            <div className="max-w-[200px]">
              <Field
                label="CEP"
                icon={<MapPin size={16} />}
                value={data.cep}
                onChange={handleCepChange}
                placeholder="00.000-000"
                error={errors.cep}
                hint={cepStatus === 'idle' && !errors.cep ? 'Preenchimento automático' : undefined}
                suffix={
                  <CepIcon
                    status={cepStatus}
                    cepValue={data.cep}
                    onSearch={() => lookupCep(data.cep)}
                  />
                }
              />
            </div>

            {/* Address result */}
            <AnimatePresence>
              {hasAddress && (
                <motion.div
                  key="address-preview"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-3 bg-primary/[0.04] border border-primary/10 rounded-[20px] p-4"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {data.logradouro && (
                      <p className="text-sm font-bold text-primary truncate">{data.logradouro}</p>
                    )}
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {[data.bairro, data.cidade, data.uf].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAddress}
                    className="p-1.5 rounded-xl hover:bg-primary/10 text-slate-300 hover:text-primary transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* ── Dados Institucionais ──────────────────── */}
        <Card delay={0.18}>
          <SectionLabel icon={<Briefcase size={14} />} text="Dados Institucionais" />
          <div className="space-y-4">
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
          </div>
        </Card>

        {/* Save — mobile */}
        <div className="sm:hidden pb-6">
          <motion.button
            type="submit"
            disabled={saving || saved}
            whileTap={{ scale: 0.97 }}
            className={[
              'w-full flex items-center justify-center gap-2',
              'py-4 rounded-2xl font-bold text-sm shadow-xl transition-all',
              saved ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-primary/20',
              'disabled:opacity-70',
            ].join(' ')}
          >
            {saving
              ? <><Loader2 size={17} className="animate-spin" /> Salvando...</>
              : saved
                ? <><CheckCircle2 size={17} /> Salvo com sucesso!</>
                : <><Save size={17} /> Salvar perfil</>
            }
          </motion.button>
        </div>

      </form>
    </div>
  );
}

export default UserProfile;
