'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminTopBar from '@/components/AdminTopBar';

type Notice = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
};

export default function AdminVillaNoticesPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('notices')
      .select('id, title, body, is_pinned, created_at')
      .eq('villa_id', villaId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setNotices((data ?? []) as Notice[]);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { alert('제목과 내용을 입력하세요'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('notices').insert({
      villa_id: villaId,
      title: title.trim(),
      body: body.trim(),
      is_pinned: isPinned,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setTitle(''); setBody(''); setIsPinned(false); setShowForm(false);
    await load();
  }

  async function togglePin(n: Notice) {
    await supabase.from('notices').update({ is_pinned: !n.is_pinned }).eq('id', n.id);
    await load();
  }

  async function remove(n: Notice) {
    if (!confirm(`'${n.title}' 공지를 삭제할까요?`)) return;
    await supabase.from('notices').delete().eq('id', n.id);
    await load();
  }

  return (
    <>
      <AdminTopBar
        title="공지사항"
        subtitle={`총 ${notices.length}건`}
        right={
          <button onClick={() => setShowForm(!showForm)} className="bg-[#2B2BEE] text-white text-[14px] font-bold px-3.5 py-2.5 rounded-xl hover:bg-[#1C1CC9] transition">
            {showForm ? '취소' : '＋ 작성'}
          </button>
        }
      />
      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">

      {showForm && (
        <form onSubmit={submit} className="mb-4 bg-white border border-[#E8EBF0] rounded-xl p-4 shadow-sm space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" maxLength={50}
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE]" required />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용" rows={5} maxLength={2000}
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#2B2BEE] resize-none" required />
          <label className="flex items-center gap-2 text-[15px] text-[#0F2242]">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4" />
            상단 고정
          </label>
          <button type="submit" disabled={submitting} className="w-full bg-[#2B2BEE] text-white py-2.5 rounded-xl text-[16px] font-bold disabled:opacity-50">
            {submitting ? '등록 중…' : '공지 등록'}
          </button>
        </form>
      )}

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-10">불러오는 중…</p>
        : notices.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[17px] font-bold text-[#0F2242]">등록된 공지가 없습니다</p>
            <p className="text-[15px] text-[#9CA3AF] mt-1">+ 공지 작성으로 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notices.map(n => (
              <div key={n.id} className={`bg-white rounded-xl p-4 border shadow-sm ${n.is_pinned ? 'border-[#2B2BEE] border-[1.5px]' : 'border-[#E8EBF0]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {n.is_pinned && <span className="bg-[rgba(43,43,238,0.12)] text-[#2B2BEE] text-[12px] font-extrabold px-2 py-0.5 rounded">고정</span>}
                  <span className="text-[14px] text-[#9CA3AF]">{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                  <button onClick={() => togglePin(n)} className="ml-auto text-[14px] text-[#2B2BEE] font-bold hover:underline">
                    {n.is_pinned ? '고정 해제' : '고정'}
                  </button>
                  <button onClick={() => remove(n)} className="text-[14px] text-[#FF3B30] font-bold hover:underline">삭제</button>
                </div>
                <h3 className="text-[17px] font-extrabold text-[#0F2242] mb-1.5">{n.title}</h3>
                <p className="text-[15px] text-[#6B7280] leading-[20px] whitespace-pre-wrap">{n.body}</p>
              </div>
            ))}
          </div>
        )
      }
      </div>
    </>
  );
}
