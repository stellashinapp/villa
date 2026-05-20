'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ResidentPageHeader from '@/components/ResidentPageHeader';
import Icon from '@/components/Icon';

type Notice = {
  id: string; title: string; body: string;
  is_pinned: boolean; created_at: string;
};

type Session = { villaId: string; villaName: string; ho: string; name: string };

const NEW_DAYS = 7;

function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < NEW_DAYS * 86400 * 1000;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export default function ResidentNoticesPage() {
  const [s, setS] = useState<Session | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    setS(JSON.parse(raw) as Session);
  }, []);

  useEffect(() => {
    if (!s) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices').select('id, title, body, is_pinned, created_at')
        .eq('villa_id', s.villaId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setNotices((data ?? []) as Notice[]);
      setLoading(false);
    })();
  }, [s]);

  if (!s) return <div className="min-h-screen flex items-center justify-center text-[14px] text-[#9CA3AF]">불러오는 중…</div>;

  return (
    <>
      <ResidentPageHeader villaName={s.villaName} title="공지" ho={s.ho} name={s.name} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-20">불러오는 중…</p>
          : error ? <p className="text-center text-[14px] text-[#FF3B30] mt-20">오류: {error}</p>
          : notices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#F0F2F5] text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F1ECFE] flex items-center justify-center mx-auto mb-2"><Icon name="notice" size={26} color="#6C2FF2" filled /></div>
              <p className="text-[15px] font-bold text-[#0F2242]">공지사항이 없습니다</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">새 공지가 등록되면 알려드립니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map(n => (
                <article key={n.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#F0F2F5]">
                  <div className="flex items-center gap-2 mb-2">
                    {n.is_pinned && (
                      <span className="bg-[#F1ECFE] text-[#6C2FF2] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        고정
                      </span>
                    )}
                    {isNew(n.created_at) && (
                      <span className="bg-[#6C2FF2] text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                        NEW
                      </span>
                    )}
                    <h3 className="text-[15px] font-extrabold text-[#0F2242]">{n.title}</h3>
                  </div>
                  <p className="text-[14px] text-[#6B7280] leading-relaxed whitespace-pre-wrap">{n.body}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-3">{fmtDate(n.created_at)}</p>
                </article>
              ))}
            </div>
          )
        }
      </div>
    </>
  );
}
