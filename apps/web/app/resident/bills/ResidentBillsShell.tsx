'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Resident = {
  id: string;
  name: string;
  phone: string;
  ho: string;
  villaName: string;
  villaAddress: string;
};

type BillMonth = {
  id: string;
  year_month: string;
  label: string | null;
  status: string;
  billing_mode: string | null;
  per_unit_amounts: Record<string, number> | null;
  bill_items: { name: string; amount: number }[];
};

type Villa = {
  name: string;
  account_bank: string | null;
  account_number: string | null;
  bill_months: BillMonth[];
};

export default function ResidentBillsShell() {
  const router = useRouter();
  const [resident, setResident] = useState<Resident | null>(null);
  const [villa, setVilla] = useState<Villa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = sessionStorage.getItem('villatolk:resident');
    const d = sessionStorage.getItem('villatolk:resident-data');
    if (!r || !d) { router.replace('/resident/login'); return; }
    setResident(JSON.parse(r));
    const data = JSON.parse(d) as { villa: Villa };
    setVilla(data.villa);
    setLoading(false);
  }, [router]);

  function logout() {
    sessionStorage.removeItem('villatolk:resident');
    sessionStorage.removeItem('villatolk:resident-data');
    router.replace('/');
  }

  if (loading || !resident) return <div className="min-h-screen flex items-center justify-center text-t3">불러오는 중…</div>;

  const myAmount = (bm: BillMonth) => {
    if (bm.per_unit_amounts && bm.per_unit_amounts[resident.ho]) return bm.per_unit_amounts[resident.ho];
    return (bm.bill_items ?? []).reduce((s, it) => s + (it.amount ?? 0), 0);
  };

  const bills = villa?.bill_months ?? [];
  bills.sort((a, b) => b.year_month.localeCompare(a.year_month));

  return (
    <div className="max-w-md mx-auto pb-24">
      <header className="bg-navy text-white px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/40 tracking-widest font-bold">VILLATOLK</p>
            <h1 className="text-lg font-extrabold mt-1">{resident.villaName}</h1>
            <p className="text-xs text-white/60 mt-0.5">{resident.ho}호 · {resident.name}</p>
          </div>
          <button onClick={logout} className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/20">
            로그아웃
          </button>
        </div>
      </header>

      <div className="px-5 pt-5">
        <h2 className="text-xs font-bold text-t3 tracking-widest mb-3">관리비 청구 ({bills.length})</h2>

        {bills.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-t3">
            아직 발행된 청구서가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map(bm => {
              const amt = myAmount(bm);
              return (
                <div key={bm.id} className="bg-white border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-t3">{bm.year_month}</div>
                      <div className="text-base font-bold mt-0.5">{bm.label ?? `${bm.year_month} 관리비`}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${bm.status === 'closed' ? 'bg-okL text-ok' : 'bg-priL text-priT'}`}>
                      {bm.status === 'closed' ? '마감' : '발행'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-pri mb-3">{amt.toLocaleString()}원</div>
                  {(bm.bill_items ?? []).length > 0 && (
                    <ul className="space-y-1 text-sm border-t border-border pt-3">
                      {bm.bill_items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span className="text-t2">{it.name}</span>
                          <span className="font-medium">{it.amount.toLocaleString()}원</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {villa?.account_bank && villa?.account_number && (
          <div className="bg-priL/40 border border-pri/15 rounded-2xl px-4 py-3 mt-5 text-xs text-priT">
            💳 입금 계좌: <span className="font-bold">{villa.account_bank} {villa.account_number}</span>
          </div>
        )}
      </div>
    </div>
  );
}
