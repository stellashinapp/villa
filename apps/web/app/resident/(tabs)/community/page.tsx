'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  likes: number | null;
  created_at: string;
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
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { id: string; villaId: string; villaName: string; ho: string };
    setResidentId(s.id);
    setVillaId(s.villaId);
    setVillaName(s.villaName);
    setMyHo(s.ho);
    // unit_id 찾기
    supabase.from('units').select('id').eq('villa_id', s.villaId).eq('ho_number', s.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => {
    if (!villaId) return;
    load();
  }, [villaId]);

  async function load() {
    if (!villaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, body, image_url, likes, created_at, residents(name, units(ho_number))')
      .eq('villa_id', villaId)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setPosts([]);
    } else {
      setPosts((data ?? []) as unknown as Post[]);
    }
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { alert('제목과 내용을 입력하세요'); return; }
    if (!residentId || !villaId) return;
    setSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      villa_id: villaId,
      unit_id: unitId,
      resident_id: residentId,
      title: title.trim(),
      body: body.trim(),
      likes: 0,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setTitle(''); setBody(''); setShowForm(false);
    await load();
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22px] font-black text-[#0F2242]">커뮤니티</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName}</p>
        </div>
        <button
          className="bg-[#4263E8] text-white text-[13px] font-bold px-3.5 py-2 rounded-lg shadow-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '취소' : '＋ 글쓰기'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-4 bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">제목</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 음식 나눔합니다"
              maxLength={50}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8]"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">내용</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={5}
              maxLength={1000}
              className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#4263E8] resize-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#4263E8] text-white py-2.5 rounded-lg text-[14px] font-bold disabled:opacity-50"
          >
            {submitting ? '등록 중…' : '글 등록'}
          </button>
        </form>
      )}

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
        : error ? (
          <div className="text-center mt-20">
            <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
            <p className="text-[13px] text-[#9CA3AF]">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-[15px] font-bold text-[#0F2242] mb-1">아직 글이 없습니다</p>
            <p className="text-[13px] text-[#9CA3AF]">＋ 글쓰기로 첫 글을 남겨보세요</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {posts.map(post => {
              const isMine = post.residents?.units?.ho_number === myHo;
              return (
                <div key={post.id} className={`bg-white rounded-xl p-4 border shadow-sm ${isMine ? 'border-[#4263E8]/30' : 'border-[#E8EBF0]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] text-[#6B7280] font-semibold">
                      {post.residents?.name ?? '익명'}
                      {post.residents?.units?.ho_number && (
                        <span className="text-[#9CA3AF]"> · {post.residents.units.ho_number}</span>
                      )}
                    </span>
                    {isMine && <span className="text-[10px] font-bold bg-[rgba(66,99,232,0.12)] text-[#4263E8] px-1.5 py-0.5 rounded">내 글</span>}
                    <span className="text-[12px] text-[#9CA3AF] ml-auto">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-extrabold text-[#0F2242] mb-1.5">{post.title}</h3>
                  <p className="text-[13px] text-[#6B7280] leading-[20px] whitespace-pre-wrap">{post.body}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 rounded-lg max-h-64 object-cover w-full" />
                  )}
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
  );
}
