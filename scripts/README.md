# Scripts de Migração — NPlayer.IA Helpdesk CT

## Ordem de execução

### PASSO 1 — Triggers e funções no Supabase

Execute no **Supabase Dashboard → SQL Editor**:

```
scripts/trigger_usuarios_supabase.sql
```

Cria automaticamente:
- Trigger `on_auth_user_created` → popula `profiles` + `user_permissions`
- Trigger `on_auth_user_updated` → sincroniza email/nome/role
- Funções: `activate_user`, `deactivate_user`, `ban_user`, `unban_user`
- View `v_users_panel` para o painel de gestão

### PASSO 2 — Migração dos usuários

```bash
# Instalar dependência
npm install @supabase/supabase-js

# Preencher as variáveis no topo do arquivo:
# SUPABASE_URL     → Supabase Dashboard → Settings → API → Project URL
# SERVICE_ROLE_KEY → Supabase Dashboard → Settings → API → service_role secret

# Rodar
node scripts/migrate-users.mjs
```

### PASSO 3 — Verificar

```bash
supabase db query "SELECT name, email, role, status FROM v_users_panel ORDER BY role, name;" --linked
```

## ⚠️ Segurança

- **Nunca commitar** `SUPABASE_URL` e `SERVICE_ROLE_KEY` com valores reais
- O arquivo `migrate-users.mjs` contém senhas — use `.gitignore` após a migração ou delete o arquivo
- A `service_role` bypassa todas as RLS policies — use apenas localmente
