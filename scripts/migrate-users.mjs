// ============================================================
// SCRIPT DE MIGRAÇÃO — NPlayer.IA Helpdesk CT
// Cria todos os usuários no Supabase Auth (Admin API)
// preservando emails e senhas originais do auth.ts
//
// USO:
//   1. npm install @supabase/supabase-js
//   2. Preencha SUPABASE_URL e SERVICE_ROLE_KEY abaixo
//   3. node scripts/migrate-users.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ⚠️  PREENCHA ANTES DE RODAR — NÃO COMMITAR COM OS VALORES REAIS
const SUPABASE_URL     = 'https://uinfkxxfmowkjixcduuy.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbmZreHhmbW93a2ppeGNkdXV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA3NzQ2NywiZXhwIjoyMDk0NjUzNDY3fQ.EA7pcTgXPw8VipvqWQhQXpVfp8BlVxR2nUOpNMypDe4';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ============================================================
// TODOS OS USUÁRIOS — extraídos do src/lib/auth.ts
// ============================================================
const USERS = [
  // Administrador
  { email: 'admin@lary.ia.br',                     password: 'admin',       name: 'Administrador',                               role: 'administrador', matricula: '' },
  // Supervisores
  { email: 'eduardo.bueno@hpp.org.br',             password: '21424@2026',  name: 'Eduardo Vinicius Bueno',                      role: 'supervisor',    matricula: '21424' },
  { email: 'renata.andrade@hpp.org.br',            password: '15258@2026',  name: 'Renata Fortunato de Andrade',                 role: 'supervisor',    matricula: '15258' },
  { email: 'marlete.zanetti@hpp.org.br',           password: '18150@2026',  name: 'Marlete do Nascimento Zanetti',               role: 'supervisor',    matricula: '18150' },
  { email: 'joao.kinol@hpp.org.br',                password: '19242@2026',  name: 'João Éder Kinol',                             role: 'supervisor',    matricula: '19242' },
  { email: 'luciano.santos@hpp.org.br',            password: '20467@2026',  name: 'Luciano José dos Santos',                     role: 'supervisor',    matricula: '20467' },
  { email: 'camila.rosario@hpp.org.br',            password: '22028@2026',  name: 'Camila Dayane Olexciw do Rosário',            role: 'supervisor',    matricula: '22028' },
  // Captadores
  { email: 'alessandra.silva@cthpp.org.br',        password: '18538@2026',  name: 'Alessandra Batista da Silva',                 role: 'captador',      matricula: '18538' },
  { email: 'alessandra.oliveira@cthpp.org.br',     password: '19456@2026',  name: 'Alessandra Veiga Oliveira',                   role: 'captador',      matricula: '19456' },
  { email: 'aline.santos@cthpp.org.br',            password: '18355@2026',  name: 'Aline Regina dos Santos',                     role: 'captador',      matricula: '18355' },
  { email: 'amanda.lima@cthpp.org.br',             password: '21640@2026',  name: 'Amanda Cristina de Lima',                     role: 'captador',      matricula: '21640' },
  { email: 'ariane.melo@cthpp.org.br',             password: '18719@2026',  name: 'Ariane Lara de Melo',                         role: 'captador',      matricula: '18719' },
  { email: 'elisangela.melo@cthpp.org.br',         password: '18969@2026',  name: 'Elisângela Ferreira de Melo',                 role: 'captador',      matricula: '18969' },
  { email: 'ilda.cruz@cthpp.org.br',               password: '16139@2026',  name: 'Ilda da Cruz Noronha',                        role: 'captador',      matricula: '16139' },
  { email: 'joelma.carvalho@cthpp.org.br',         password: '21987@2026',  name: 'Joelma Maia Carvalho',                        role: 'captador',      matricula: '21987' },
  { email: 'karina.lima@cthpp.org.br',             password: '21991@2026',  name: 'Karina Soares Siqueira Lima',                 role: 'captador',      matricula: '21991' },
  { email: 'marcela.santos@cthpp.org.br',          password: '20418@2026',  name: 'Marcela Andressa Santos',                     role: 'captador',      matricula: '20418' },
  { email: 'meri.santos@cthpp.org.br',             password: '18335@2026',  name: 'Meri Suelen de Oliveira Santos',              role: 'captador',      matricula: '18335' },
  { email: 'ana.souza@cthpp.org.br',               password: '21372@2026',  name: 'Ana Carla Pereira de Souza',                  role: 'captador',      matricula: '21372' },
  { email: 'heloise.rodrigues@cthpp.org.br',       password: '21983@2026',  name: 'Heloise Regina da Silva Rodrigues',           role: 'captador',      matricula: '21983' },
  { email: 'julia.lima@cthpp.org.br',              password: '21989@2026',  name: 'Julia Letícia de Lima',                       role: 'captador',      matricula: '21989' },
  { email: 'maise.evangelista@cthpp.org.br',       password: '21969@2026',  name: 'Maíse Furtado de Brito Santana Evangelista',  role: 'captador',      matricula: '21969' },
  { email: 'nathally.neres@cthpp.org.br',          password: '21635@2026',  name: 'Nathally Stefanne De Souza Neres',            role: 'captador',      matricula: '21635' },
  { email: 'paola.gomes@cthpp.org.br',             password: '21375@2026',  name: 'Paola Alexia Domingues Gomes',                role: 'captador',      matricula: '21375' },
  { email: 'stephany.melo@cthpp.org.br',           password: '21377@2026',  name: 'Stephany Gabriele de Souza Melo',             role: 'captador',      matricula: '21377' },
  { email: 'adenilda.santos@cthpp.org.br',         password: '20892@2026',  name: 'Adenilda da Silva dos Santos',                role: 'captador',      matricula: '20892' },
  { email: 'santos.aline@cthpp.org.br',            password: '21971@2026',  name: 'Aline Teodoro dos Santos',                    role: 'captador',      matricula: '21971' },
  { email: 'jessica.santos@cthpp.org.br',          password: '21985@2026',  name: 'Jéssica Monteiro dos Santos',                 role: 'captador',      matricula: '21985' },
  { email: 'magali.pimentel@cthpp.org.br',         password: '16840@2026',  name: 'Magali de Fatima dos Santos Pimentel',        role: 'captador',      matricula: '16840' },
  { email: 'marcia.cardoso@cthpp.org.br',          password: '16496@2026',  name: 'Marcia de Fatima Ferreira Cardoso',           role: 'captador',      matricula: '16496' },
  { email: 'maria.silva@cthpp.org.br',             password: '18906@2026',  name: 'Maria Anedina Bonifacio da Silva',            role: 'captador',      matricula: '18906' },
  { email: 'maria.godoy@cthpp.org.br',             password: '21650@2026',  name: 'Maria Cristina Medino de Oliveira Godoy',     role: 'captador',      matricula: '21650' },
  { email: 'stefanie.casturino@cthpp.org.br',      password: '21652@2026',  name: 'Stefanie de Santana Casturino',               role: 'captador',      matricula: '21652' },
  { email: 'tassila.camargo@cthpp.org.br',         password: '21992@2026',  name: 'Tassila Georgia Cardoso Camargo',             role: 'captador',      matricula: '21992' },
];

function getPermissions(role) {
  if (role === 'administrador') {
    return { can_admin: true,  can_transcribe: true,  can_audit: true,  can_reports: true,  can_releases: true,  can_auto_monitoria: true };
  }
  if (role === 'supervisor') {
    return { can_admin: false, can_transcribe: true,  can_audit: true,  can_reports: true,  can_releases: false, can_auto_monitoria: true };
  }
  return   { can_admin: false, can_transcribe: false, can_audit: false, can_reports: false, can_releases: false, can_auto_monitoria: false };
}

async function migrate() {
  console.log(`\n🚀 Iniciando migração de ${USERS.length} usuários...\n`);
  const results = { ok: [], skip: [], error: [] };

  for (const u of USERS) {
    process.stdout.write(`  → ${u.email.padEnd(45)} `);

    const { data, error } = await supabase.auth.admin.createUser({
      email:         u.email,
      password:      u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role, matricula: u.matricula },
    });

    if (error) {
      if (error.message?.includes('already been registered')) {
        console.log('⚠️  já existe (pulando)');
        results.skip.push(u.email);
        continue;
      }
      console.log(`❌ ERRO: ${error.message}`);
      results.error.push({ email: u.email, msg: error.message });
      continue;
    }

    const userId = data.user.id;
    const perms  = getPermissions(u.role);

    await supabase.from('profiles').upsert(
      { id: userId, email: u.email, name: u.name, role: u.role, matricula: u.matricula, active: true },
      { onConflict: 'email' }
    );

    await supabase.from('user_permissions').upsert(
      { id: userId, email: u.email, name: u.name, matricula: u.matricula, role: u.role, active: true, ...perms },
      { onConflict: 'email' }
    );

    console.log('✅ criado');
    results.ok.push(u.email);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Criados com sucesso  : ${results.ok.length}`);
  console.log(`⚠️  Já existiam (pulados): ${results.skip.length}`);
  console.log(`❌ Erros               : ${results.error.length}`);
  if (results.error.length > 0) {
    results.error.forEach(e => console.log(`  • ${e.email}: ${e.msg}`));
  }
  console.log('═'.repeat(60) + '\n');
}

migrate().catch(console.error);
