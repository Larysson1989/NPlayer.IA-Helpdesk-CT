-- ============================================================
-- TRIGGERS DE GESTÃO DE USUÁRIOS — NPlayer.IA Helpdesk CT
-- Execute no: Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. TRIGGER: Ao criar usuário em auth.users
--    → popula profiles + user_permissions automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role      TEXT;
  v_name      TEXT;
  v_matricula TEXT;
BEGIN
  -- Extrai metadados enviados pelo script/admin no createUser()
  v_role      := COALESCE(NEW.raw_user_meta_data->>'role',      'captador');
  v_name      := COALESCE(NEW.raw_user_meta_data->>'name',      NEW.email);
  v_matricula := COALESCE(NEW.raw_user_meta_data->>'matricula', '');

  -- Inserir em profiles
  INSERT INTO public.profiles (id, email, name, role, matricula, active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_role,
    v_matricula,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    name       = EXCLUDED.name,
    role       = EXCLUDED.role,
    matricula  = EXCLUDED.matricula,
    active     = true,
    updated_at = NOW();

  -- Inserir em user_permissions com base no role
  INSERT INTO public.user_permissions (
    id, email, name, matricula, role, active,
    can_admin, can_transcribe, can_audit,
    can_reports, can_releases, can_auto_monitoria,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_matricula,
    v_role,
    true,
    -- can_admin: só administrador
    (v_role = 'administrador'),
    -- can_transcribe: supervisor e administrador
    (v_role IN ('supervisor', 'administrador')),
    -- can_audit: supervisor e administrador
    (v_role IN ('supervisor', 'administrador')),
    -- can_reports: supervisor e administrador
    (v_role IN ('supervisor', 'administrador')),
    -- can_releases: só administrador
    (v_role = 'administrador'),
    -- can_auto_monitoria: supervisor e administrador
    (v_role IN ('supervisor', 'administrador')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email              = EXCLUDED.email,
    name               = EXCLUDED.name,
    matricula          = EXCLUDED.matricula,
    role               = EXCLUDED.role,
    active             = true,
    can_admin          = EXCLUDED.can_admin,
    can_transcribe     = EXCLUDED.can_transcribe,
    can_audit          = EXCLUDED.can_audit,
    can_reports        = EXCLUDED.can_reports,
    can_releases       = EXCLUDED.can_releases,
    can_auto_monitoria = EXCLUDED.can_auto_monitoria,
    updated_at         = NOW();

  RETURN NEW;
END;
$$;

-- Vincular função ao evento de INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. TRIGGER: Ao atualizar email em auth.users
--    → sincroniza profiles + user_permissions
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sincroniza email se mudou
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles         SET email = NEW.email, updated_at = NOW() WHERE id = NEW.id;
    UPDATE public.user_permissions SET email = NEW.email, updated_at = NOW() WHERE id = NEW.id;
  END IF;

  -- Sincroniza metadados (nome, role, matrícula) se mudaram
  IF OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
    UPDATE public.profiles SET
      name       = COALESCE(NEW.raw_user_meta_data->>'name',      OLD.raw_user_meta_data->>'name'),
      role       = COALESCE(NEW.raw_user_meta_data->>'role',      OLD.raw_user_meta_data->>'role'),
      matricula  = COALESCE(NEW.raw_user_meta_data->>'matricula', OLD.raw_user_meta_data->>'matricula'),
      updated_at = NOW()
    WHERE id = NEW.id;

    UPDATE public.user_permissions SET
      name       = COALESCE(NEW.raw_user_meta_data->>'name',      OLD.raw_user_meta_data->>'name'),
      role       = COALESCE(NEW.raw_user_meta_data->>'role',      OLD.raw_user_meta_data->>'role'),
      matricula  = COALESCE(NEW.raw_user_meta_data->>'matricula', OLD.raw_user_meta_data->>'matricula'),
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_updated();


-- ============================================================
-- 3. FUNÇÃO: Ativar usuário (chamada pelo Supervisor/Admin)
-- ============================================================

CREATE OR REPLACE FUNCTION public.activate_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles         SET active = true,  updated_at = NOW() WHERE id = p_user_id;
  UPDATE public.user_permissions SET active = true,  updated_at = NOW() WHERE id = p_user_id;
END;
$$;


-- ============================================================
-- 4. FUNÇÃO: Inativar usuário (mantém dados, só desativa)
-- ============================================================

CREATE OR REPLACE FUNCTION public.deactivate_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles         SET active = false, updated_at = NOW() WHERE id = p_user_id;
  UPDATE public.user_permissions SET active = false, updated_at = NOW() WHERE id = p_user_id;
  -- Revoga todas as sessões ativas do usuário
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;


-- ============================================================
-- 5. FUNÇÃO: Bloquear usuário (ban permanente até admin liberar)
-- ============================================================

CREATE OR REPLACE FUNCTION public.ban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET banned_until = '2099-12-31 23:59:59+00'
  WHERE id = p_user_id;

  UPDATE public.profiles         SET active = false, updated_at = NOW() WHERE id = p_user_id;
  UPDATE public.user_permissions SET active = false, updated_at = NOW() WHERE id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
END;
$$;


-- ============================================================
-- 6. FUNÇÃO: Desbloquear usuário
-- ============================================================

CREATE OR REPLACE FUNCTION public.unban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET banned_until = NULL
  WHERE id = p_user_id;

  UPDATE public.profiles         SET active = true, updated_at = NOW() WHERE id = p_user_id;
  UPDATE public.user_permissions SET active = true, updated_at = NOW() WHERE id = p_user_id;
END;
$$;


-- ============================================================
-- 7. VIEW: Painel de usuários para Supervisor/Admin
--    Retorna tudo num único SELECT sem JOIN manual
-- ============================================================

CREATE OR REPLACE VIEW public.v_users_panel AS
SELECT
  p.id,
  p.email,
  p.name,
  p.role,
  p.matricula,
  p.active,
  p.created_at,
  p.updated_at,
  up.can_admin,
  up.can_transcribe,
  up.can_audit,
  up.can_reports,
  up.can_releases,
  up.can_auto_monitoria,
  au.last_sign_in_at,
  au.banned_until,
  CASE
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN 'bloqueado'
    WHEN p.active = false THEN 'inativo'
    ELSE 'ativo'
  END AS status
FROM public.profiles p
LEFT JOIN public.user_permissions up ON up.id = p.id
LEFT JOIN auth.users au              ON au.id  = p.id
ORDER BY p.role, p.name;
