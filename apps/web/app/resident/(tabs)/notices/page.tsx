'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Notice = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
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
        .from('notices')
        .select('id, title, body, is_pinned, created_at')
        .eq('villa_id', villaId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setNotices((data ?? []) as Notice[]);
      }
      setLoading(false);
    })();
  }, [villaId]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? notices.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    : notices;

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <h1 className="text-[22px] font-black text-[#0F2242]">공지</h1>
      <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName}</p>

      {notices.length > 0 && (
        <div className="mt-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="공지 제목/내용 검색"
            className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3.5 py-2.5 text-sm text-[#0F2242] outline-none focus:border-[#4263E8]"
          />
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <p className="text-center text-sm text-[#E74C3C] mt-20">오류: {error}</p>
      ) : notices.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">공지사항이 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">새로운 공지가 등록되면 여기에 표시됩니다</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#0F2242]">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {filtered.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-xl p-4 border shadow-sm ${
                notice.is_pinned ? 'border-[#FF6B35] border-[1.5px]' : 'border-[#E8EBF0]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {notice.is_pinned && (
                  <span className="bg-[rgba(255,107,53,0.12)] text-[#FF6B35] text-[10px] font-extrabold px-2 py-0.5 rounded">
                    📌 고정
                  </span>
                )}
                <span className="text-[12px] text-[#9CA3AF]">
                  {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <h3 className="text-[15px] font-extrabold text-[#0F2242] mb-2">{notice.title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-[20px] whitespace-pre-wrap">{notice.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
