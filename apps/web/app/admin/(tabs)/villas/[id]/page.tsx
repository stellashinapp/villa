'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Icon, { type IconName } from '@/components/Icon';

type Villa = {
  id: string;
  name: string;
  address: string;
  total_units: number;
  units_per_floor: number | null;
  account_bank: string | null;
  account_number: string | null;
  account_holder: string | null;
  status: string;
};

type Stats = {
  units: number;
  residents: number;
  bill_months: number;
  notices: number;
  messages_unread: number;
};

export default function AdminVillaDetailPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [villa, setVilla] = useState<Villa | null>(null);
  const [stats, setStats] = useState<Stats>({ units: 0, residents: 0, bill_months: 0, notices: 0, messages_unread: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      const [
        { data: v, error: vErr },
        { count: unitCount },
        { count: residentCount },
        { count: billCount },
        { count: noticeCount },
        { count: msgUnread },
      ] = await Promise.all([
        supabase.from('villas').select('id, name, address, total_units, units_per_floor, account_bank, account_number, account_holder, status').eq('id', villaId).maybeSingle(),
        supabase.from('units').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
        supabase.from('residents').select('id, units!inner(villa_id)', { count: 'exact', head: true }).eq('units.villa_id', villaId).eq('status', 'active'),
        supabase.from('bill_months').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
        supabase.from('notices').select('*', { count: 'exact', head: true }).eq('villa_id', villaId),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('villa_id', villaId).eq('is_read', false),
      ]);

      if (vErr) setError(vErr.message);
      setVilla(v as Villa | null);
      setStats({
        units: unitCount ?? 0,
        residents: residentCount ?? 0,
        bill_months: billCount ?? 0,
        notices: noticeCount ?? 0,
        messages_unread: msgUnread ?? 0,
      });
      setLoading(false);
    })();
  }, [villaId]);

  if (loading) return <div className="px-5 pt-6 text-center text-sm text-[#9CA3AF]">불러오는 중…</div>;
  if (error) return <div className="px-5 pt-6 text-center text-sm text-[#E74C3C]">오류: {error}</div>;
  if (!villa) return <div className="px-5 pt-6 text-center text-sm text-[#9CA3AF]">빌라를 찾을 수 없습니다</div>;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <Link href="/admin/villas" className="text-[12px] text-[#6B7280] hover:text-[#0F2242]">← 빌라 목록</Link>

      <div className="mt-3 mb-6">
        <h1 className="text-[22px] font-black text-[#0F2242]">{villa.name}</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">{villa.address}</p>
      </div>

      {/* 요약 통계 4개 */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="총 호실" value={villa.total_units} accent="#0F2242" />
        <StatCard label="활성 입주민" value={stats.residents} accent="#4263E8" />
        <StatCard label="관리비 회차" value={stats.bill_months} accent="#2ECC71" />
        <StatCard label="미읽음 메시지" value={stats.messages_unread} accent={stats.messages_unread > 0 ? '#E74C3C' : '#9CA3AF'} />
      </div>

      {/* 입금 계좌 */}
      {(villa.account_bank || villa.account_number) && (
        <>
          <h2 className="text-[13px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">관리비 입금 계좌</h2>
          <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
            <p className="text-[14px] font-bold text-[#0F2242]">
              {villa.account_bank} {villa.account_number}
            </p>
            {villa.account_holder && (
              <p className="text-[12px] text-[#6B7280] mt-1">예금주: {villa.account_holder}</p>
            )}
          </div>
        </>
      )}

      {/* 서브 메뉴 */}
      <h2 className="text-[13px] font-bold text-[#6B7280] mt-6 mb-2.5 tracking-wider">관리 메뉴</h2>
      <div className="space-y-2">
        <SubMenu href={`/admin/villas/${villa.id}/bills`} icon="bills" label="관리비" hint={`${stats.bill_months}회차 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/notices`} icon="notice" label="공지사항" hint={`${stats.notices}건 등록`} />
        <SubMenu href={`/admin/villas/${villa.id}/residents`} icon="residents" label="입주민" hint={`활성 ${stats.residents}명`} />
        <SubMenu href={`/admin/villas/${villa.id}/parking`} icon="parking" label="주차" hint="등록 차량 관리" />
        <SubMenu href={`/admin/villas/${villa.id}/messages`} icon="message" label="메시지" hint={`미읽음 ${stats.messages_unread}건`} />
      </div>

      <p className="text-[11px] text-[#9CA3AF] text-center mt-8">
        각 메뉴별 상세 화면은 다음 업데이트에서 PWA 도 완성됩니다.<br />
        지금 즉시 사용은 모바일 앱에서 가능합니다.
      </p>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
      <p className="text-[24px] font-extrabold" style={{ color: accent }}>{value}</p>
      <p className="text-[11px] text-[#6B7280] mt-1">{label}</p>
    </div>
  );
}

function SubMenu({ href, icon, label, hint }: { href: string; icon: IconName; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="flex items-center bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm active:scale-[0.99] transition"
    >
      <span className="mr-3 flex-shrink-0 w-9 h-9 rounded-xl bg-[#EEF1FB] flex items-center justify-center">
        <Icon name={icon} size={20} color="#4263E8" filled />
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-extrabold text-[#0F2242]">{label}</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">{hint}</p>
      </div>
      <span className="text-xl text-[#9CA3AF]">›</span>
    </Link>
  );
}
