/**
 * 더미 관리자 계정에 Supabase Auth 사용자 + 비밀번호를 자동 세팅하고
 * admins 테이블의 auth_id 를 연결합니다.
 *
 * 실행: node seed-auth-users.mjs
 *
 * 모든 더미 계정의 통일 비밀번호: Villatolk1234!
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Villatolk1234!';

const ADMINS = [
  { email: 'super@andnew.kr',   role: 'super', name: 'ANDNEW운영자',   phone: '01000000000' },
  { email: 'admin@test.com',    role: 'admin', name: '테스트관리자',    phone: '01099990000' },
  { email: 'kim@villa.kr',      role: 'admin', name: '김철수',          phone: '01012340001' },
  { email: 'park@villa.kr',     role: 'admin', name: '박영희',          phone: '01012340002' },
  { email: 'lee@villa.kr',      role: 'admin', name: '이민호',          phone: '01012340003' },
];

async function step(label, fn) {
  process.stdout.write(`▶ ${label}... `);
  try {
    const result = await fn();
    console.log(`✅ ${result ?? ''}`);
    return result;
  } catch (e) {
    console.log(`❌`);
    console.error(`  ${e.message ?? e}`);
    throw e;
  }
}

async function findAuthUserByEmail(email) {
  // listUsers 는 페이지네이션이 필요하지만 더미 규모에서는 첫 페이지로 충분
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function ensureAuthUser({ email, name, phone }) {
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    // 비밀번호 재설정 + 이메일 확인 처리
    const { error } = await sb.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name, phone },
    });
    if (error) throw error;
    return { id: existing.id, created: false };
  }
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, phone },
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

async function linkAdminProfile({ email, role, name, phone, authId }) {
  // 기존 admins 행이 있으면 auth_id 만 업데이트, 없으면 insert
  const { data: existing, error: selErr } = await sb
    .from('admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await sb.from('admins').update({ auth_id: authId, name, phone, role }).eq('id', existing.id);
    if (error) throw error;
    return 'linked';
  }
  const { error } = await sb.from('admins').insert({ auth_id: authId, email, name, phone, role });
  if (error) throw error;
  return 'inserted';
}

(async () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  더미 관리자 Auth 계정 세팅');
  console.log(`  통일 비밀번호: ${PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const results = [];
  for (const a of ADMINS) {
    const { id: authId, created } = await step(`auth ${a.email}`, () => ensureAuthUser(a));
    const linkResult = await step(`link admins.${a.email}`, () =>
      linkAdminProfile({ ...a, authId })
    );
    results.push({ email: a.email, role: a.role, authId, action: created ? 'created' : 'updated', link: linkResult });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  완료. 로그인 정보');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const r of results) {
    console.log(`  ${r.email.padEnd(22)} / ${PASSWORD}   [${r.role}, ${r.action}]`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
