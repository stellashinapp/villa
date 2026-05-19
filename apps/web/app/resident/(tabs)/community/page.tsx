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
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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
    })();
  }, [villaId]);

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22px] font-black text-[#0F2242]">커뮤니티</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName}</p>
        </div>
        <button
          className="bg-[#4263E8] text-white text-[13px] font-bold px-3.5 py-2 rounded-lg shadow-sm"
          onClick={() => alert('글쓰기 기능 준비중 (모바일 앱에서 사용 가능)')}
        >
          ＋ 글쓰기
        </button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
          <p className="text-[13px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center mt-20">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">아직 글이 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">첫 글을 남겨보세요</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] text-[#6B7280] font-semibold">
                  {post.residents?.name ?? '익명'}
                  {post.residents?.units?.ho_number && (
                    <span className="text-[#9CA3AF]"> · {post.residents.units.ho_number}</span>
                  )}
                </span>
                <span className="text-[12px] text-[#9CA3AF] ml-auto">
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <h3 className="text-[15px] font-extrabold text-[#0F2242] mb-1.5">{post.title}</h3>
              <p className="text-[13px] text-[#6B7280] leading-[20px] line-clamp-3 whitespace-pre-wrap">{post.body}</p>
              {post.image_url && (
                <img src={post.image_url} alt="" className="mt-3 rounded-lg max-h-64 object-cover w-full" />
              )}
              <div className="flex gap-3 mt-3 text-[12px] text-[#9CA3AF]">
                <span>❤️ {post.likes ?? 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
