'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Post = {
  id: string; title: string; body: string;
  image_url: string | null; likes: number | null; created_at: string;
  residents: { name: string; units: { ho_number: string } | null } | null;
};

export default function ResidentCommunityPage() {
  const [residentId, setResidentId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [myHo, setMyHo] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { id: string; villaId: string; villaName: string; ho: string };
    setResidentId(s.id); setVillaId(s.villaId); setVillaName(s.villaName); setMyHo(s.ho);
    supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => { if (villaId) load(); }, [villaId]);

  async function load() {
    if (!villaId) return;
    setLoading(true);
    const { data } = await supabase.from('posts')
      .select('id, title, body, image_url, likes, created_at, residents(name, units(ho_number))')
      .eq('villa_id', villaId).order('created_at', { ascending: false });
    setPosts((data ?? []) as unknown as Post[]);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { alert('제목과 내용을 입력하세요'); return; }
    if (!residentId || !villaId) return;
    setSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      villa_id: villaId, unit_id: unitId, resident_id: residentId,
      title: title.trim(), body: body.trim(), likes: 0,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setTitle(''); setBody(''); setShowForm(false); await load();
  }

  return (
    <div className="bg-[#F5F6FA] min-h-screen">
      <header className="bg-white px-5 pt-3 pb-3 sticky top-0 z-30 border-b border-[#F0F2F5]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] tracking-widest">{villaName}</p>
            <h1 className="text-[18px] font-extrabold text-[#0F2242] mt-0.5">커뮤니티</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-[#3766EE] text-white text-[13px] font-bold px-4 py-2 rounded-full shadow-sm">
            {showForm ? '취소' : '＋ 글쓰기'}
          </button>
        </div>
      </header>

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        {showForm && (
          <form onSubmit={submit} className="bg-white border border-[#F0F2F5] rounded-2xl p-4 shadow-sm space-y-3 mb-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" maxLength={50}
              className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 text-[15px] text-[#0F2242] outline-none focus:bg-white focus:ring-2 focus:ring-[#3766EE]/30" required />
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용을 입력하세요" rows={5} maxLength={1000}
              className="w-full bg-[#F5F6FA] rounded-xl px-4 py-3 text-[15px] text-[#0F2242] outline-none focus:bg-white focus:ring-2 focus:ring-[#3766EE]/30 resize-none" required />
            <button type="submit" disabled={submitting}
              className="w-full bg-[#3766EE] text-white py-3 rounded-xl text-[15px] font-bold disabled:opacity-50">
              {submitting ? '등록 중…' : '글 등록'}
            </button>
          </form>
        )}

        {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-20">불러오는 중…</p>
          : posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-[#F0F2F5] text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-[15px] font-bold text-[#0F2242]">아직 글이 없습니다</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">＋ 글쓰기로 첫 글을 남겨보세요</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {posts.map(post => {
                const isMine = post.residents?.units?.ho_number === myHo;
                const initial = post.residents?.name?.[0] ?? '?';
                return (
                  <div key={post.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border ${isMine ? 'border-[#3766EE]/30' : 'border-[#F0F2F5]'}`}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#3766EE] font-bold text-[14px]">
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0F2242]">
                          {post.residents?.name ?? '익명'}
                          {post.residents?.units?.ho_number && (
                            <span className="text-[#9CA3AF] font-normal"> · {post.residents.units.ho_number}</span>
                          )}
                          {isMine && <span className="ml-1.5 text-[10px] font-bold bg-[#EEF2FF] text-[#3766EE] px-1.5 py-0.5 rounded">내 글</span>}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">{new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
                      </div>
                    </div>
                    <h3 className="text-[16px] font-extrabold text-[#0F2242] mb-1.5">{post.title}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-[22px] whitespace-pre-wrap">{post.body}</p>
                    {post.image_url && <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-64 object-cover w-full" />}
                    <div className="flex gap-3 mt-3 text-[12px] text-[#9CA3AF]">
                      <span>❤️ {post.likes ?? 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
