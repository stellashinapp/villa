'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Notice = {
  id: string; title: string; body: string;
  is_pinned: boolean; created_at: string;
};

export default function ResidentNoticesPage() {
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { villaId: string; villaName: string };
    setVillaId(s.villaId);
    setVillaName(s.villaName);
  }, []);

  useEffect(() => {
    if (!villaId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices').select('id, title, body, is_pinned, created_at')
        .eq('villa_id', villaId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setNotices((data ?? []) as Notice[]);
      setLoading(false);
    })();
  }, [villaId]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? notices.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    : notices;

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <header className="bg-white px-5 pt-3 pb-3 sticky top-0 z-30 border-b border-[#F0F2F5]">
        <p className="text-[10px] font-bold text-[#9CA3AF] tracking-widest">{villaName}</p>
        <h1 className="text-[18px] font-extrabold text-[#0F2242] mt-0.5">공지사항</h1>
      </header>

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {notices.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#F0F2F5] px-4 py-3 mb-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#9CA3AF]">🔍</span>
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="공지 제목·내용 검색"
                className="flex-1 bg-transparent text-[15px] text-[#0F2242] outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>
        )}

        {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-20">불러오는 중…</p>
          : error ? <p className="text-center text-[14px] text-[#FF3B30] mt-20">오류: {error}</p>
          : notices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#F0F2F5] text-center mt-2">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-[15px] font-bold text-[#0F2242]">공지사항이 없습니다</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">새 공지가 등록되면 알려드립니다</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center mt-20">
              <p className="text-[15px] font-bold text-[#0F2242]">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(n => (
                <div key={n.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border ${n.is_pinned ? 'border-[#FF6B35]/40' : 'border-[#F0F2F5]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {n.is_pinned && (
                        <span className="bg-[#FFF0E6] text-[#FF6B35] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          📌 고정
                        </span>
                      )}
                      <span className="text-[12px] text-[#9CA3AF]">
                        {new Date(n.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-[16px] font-extrabold text-[#0F2242] mb-1.5">{n.title}</h3>
                  <p className="text-[14px] text-[#6B7280] leading-[22px] whitespace-pre-wrap">{n.body}</p>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
