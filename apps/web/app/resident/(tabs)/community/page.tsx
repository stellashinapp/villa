'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ResidentPageHeader from '@/components/ResidentPageHeader';
import Icon from '@/components/Icon';

type Comment = {
  id: string; text: string; created_at: string;
  residents: { name: string; units: { ho_number: string } | null } | null;
};

type Post = {
  id: string; title: string; body: string;
  image_url: string | null; likes: number | null; created_at: string;
  residents: { name: string; units: { ho_number: string } | null } | null;
  comments: Comment[];
};

type Session = { id: string; villaId: string; villaName: string; ho: string; name: string };

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const NEW_DAYS = 3;
function isNew(iso: string) {
  return Date.now() - new Date(iso).getTime() < NEW_DAYS * 86400 * 1000;
}

export default function ResidentCommunityPage() {
  const [s, setS] = useState<Session | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('villatolk:resident');
    if (!raw) return;
    const sess = JSON.parse(raw) as Session;
    setS(sess);
    supabase.from('units').select('id').eq('villa_id', sess.villaId).eq('ho_number', sess.ho).maybeSingle()
      .then(({ data }) => { if (data) setUnitId((data as { id: string }).id); });
  }, []);

  useEffect(() => { if (s) load(s.villaId); }, [s]);

  async function load(villaId: string) {
    const { data } = await supabase.from('posts')
      .select('id, title, body, image_url, likes, created_at, residents(name, units(ho_number)), comments(id, text, created_at, residents(name, units(ho_number)))')
      .eq('villa_id', villaId).order('created_at', { ascending: false });
    setPosts((data ?? []) as unknown as Post[]);
    setLoading(false);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 가능하도록 초기화
    if (!file || !s) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { alert('JPG/PNG/WEBP 이미지만 첨부할 수 있습니다'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('5MB 이하 이미지만 첨부할 수 있습니다'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${s.villaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('community-images').upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error) { setUploading(false); alert('사진 업로드 실패: ' + error.message); return; }
    const { data } = supabase.storage.from('community-images').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { alert('제목과 내용을 입력하세요'); return; }
    if (!s) return;
    setSubmitting(true);
    const { error } = await supabase.from('posts').insert({
      villa_id: s.villaId, unit_id: unitId, resident_id: s.id,
      title: title.trim(), body: body.trim(), image_url: imageUrl, likes: 0,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setTitle(''); setBody(''); setImageUrl(null);
    if (s) await load(s.villaId);
  }

  async function submitComment(postId: string) {
    if (!replyText.trim() || !s) return;
    const { error } = await supabase.from('comments').insert({
      post_id: postId, resident_id: s.id, text: replyText.trim(),
    });
    if (error) { alert('등록 실패: ' + error.message); return; }
    setReplyText(''); setReplyOpen(null);
    if (s) await load(s.villaId);
  }

  if (!s) return null;

  return (
    <>
      <ResidentPageHeader villaName={s.villaName} title="커뮤니티" ho={s.ho} name={s.name} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        <h2 className="text-[15px] font-extrabold text-[#0F2242] mb-3">새 글 쓰기</h2>
        <form onSubmit={submitPost} className="bg-[#E9E9FD] rounded-xl p-4 space-y-3 mb-6">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" maxLength={50}
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition" required />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용을 입력하세요" rows={4} maxLength={1000}
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition resize-none" required />
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickImage} />
          {imageUrl ? (
            <div className="relative w-full aspect-[4/3] max-h-48 rounded-xl overflow-hidden border border-[#E8EBF0]">
              <Image src={imageUrl} alt="첨부 사진" fill className="object-cover" sizes="(max-width:640px) 100vw, 640px" />
              <button type="button" onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 bg-black/55 text-white text-[12px] font-bold w-7 h-7 rounded-full z-10">×</button>
            </div>
          ) : (
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-white border border-[#E8EBF0] text-[#2B2BEE] text-[13px] font-bold px-3 py-2 rounded-xl disabled:opacity-50">
              <Icon name="camera" size={15} color="#2B2BEE" /> {uploading ? '업로드 중…' : '사진 첨부'}
            </button>
          )}
          <button type="submit" disabled={submitting || uploading}
            className="w-full bg-[#2B2BEE] text-white py-3.5 rounded-xl text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition">
            {submitting ? '등록 중…' : '글 등록'}
          </button>
        </form>

        {loading ? null
          : posts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-[#F0F2F5] text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="community" size={26} color="#2B2BEE" filled /></div>
              <p className="text-[15px] font-bold text-[#0F2242]">아직 글이 없습니다</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">첫 글을 남겨보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const ho = post.residents?.units?.ho_number ?? '';
                const author = post.residents?.name ?? '익명';
                const comments = post.comments ?? [];
                return (
                  <article key={post.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#F0F2F5]">
                    <div className="flex items-center gap-2 mb-2">
                      {isNew(post.created_at) && (
                        <span className="bg-[#2B2BEE] text-white text-[10px] font-extrabold px-2 py-0.5 rounded">NEW</span>
                      )}
                      <p className="text-[13px] font-bold text-[#0F2242]">{ho} {author}</p>
                      <p className="text-[12px] text-[#9CA3AF] ml-auto">{fmtDate(post.created_at)}</p>
                    </div>
                    <h3 className="text-[16px] font-extrabold text-[#0F2242] mb-1.5">{post.title}</h3>
                    <p className="text-[14px] text-[#6B7280] leading-relaxed whitespace-pre-wrap">{post.body}</p>
                    {post.image_url && (
                      <div className="mt-3 relative w-full aspect-[4/3] max-h-64 rounded-xl overflow-hidden">
                        <Image src={post.image_url} alt="" fill className="object-cover" sizes="(max-width:640px) 100vw, 640px" />
                      </div>
                    )}

                    <div className="flex gap-4 mt-3 pt-3 border-t border-[#F0F2F5] text-[12px] text-[#FF3B30]">
                      <span>❤️ {post.likes ?? 0}</span>
                      <button onClick={() => setReplyOpen(replyOpen === post.id ? null : post.id)} className="text-[#FF3B30]">
                        ❤️ 댓글 {comments.length}개
                      </button>
                    </div>

                    {comments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {comments.map(c => (
                          <div key={c.id} className="text-[13px]">
                            <span className="font-bold text-[#0F2242]">
                              {c.residents?.units?.ho_number ?? ''} {c.residents?.name ?? '익명'}
                            </span>
                            <span className="text-[#9CA3AF] ml-2 text-[12px]">{fmtDate(c.created_at)}</span>
                            <p className="text-[#6B7280] mt-0.5">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyOpen === post.id && (
                      <div className="mt-3 flex gap-2">
                        <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="답글 입력" maxLength={200}
                          className="flex-1 bg-white border border-[#E8EBF0] rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-[#2B2BEE]" />
                        <button onClick={() => submitComment(post.id)}
                          className="bg-[#2B2BEE] text-white text-[13px] font-bold px-4 rounded-xl">
                          등록
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        }
      </div>
    </>
  );
}
