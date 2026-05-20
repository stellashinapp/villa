'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Reply = { id: string; text: string; author_type: string; author_name: string | null; created_at: string };
type Message = {
  id: string;
  text: string;
  category: string | null;
  is_read: boolean;
  created_at: string;
  residents: { name: string; units: { ho_number: string } | null } | null;
  message_replies: Reply[];
};

const CAT_LABEL: Record<string, { label: string; emoji: string }> = {
  noise: { label: '소음', emoji: '🔊' },
  leak: { label: '누수', emoji: '💧' },
  elevator: { label: '엘리베이터', emoji: '🛗' },
  pest: { label: '해충', emoji: '🪳' },
  security: { label: '보안', emoji: '🚨' },
  maintenance: { label: '시설', emoji: '🛠' },
  other: { label: '기타', emoji: '📝' },
};

export default function AdminVillaMessagesPage() {
  const params = useParams<{ id: string }>();
  const villaId = params.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => { load(); }, [villaId]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select(`id, text, category, is_read, created_at,
        residents(name, units(ho_number)),
        message_replies(id, text, author_type, author_name, created_at)`)
      .eq('villa_id', villaId)
      .order('created_at', { ascending: false });
    setMessages((data ?? []) as unknown as Message[]);
    setLoading(false);
  }

  async function submitReply(msgId: string) {
    if (!replyText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminRow } = await supabase.from('admins').select('name, email').eq('auth_id', user?.id).maybeSingle();
    const a = adminRow as { name?: string; email?: string } | null;
    const authorName = a?.name || a?.email || '관리자';

    const { error } = await supabase.from('message_replies').insert({
      message_id: msgId,
      text: replyText.trim(),
      author_type: 'admin',
      author_name: authorName,
    });
    if (error) { alert('답변 실패: ' + error.message); return; }
    await supabase.from('messages').update({ is_read: true }).eq('id', msgId);
    setReplyText(''); setReplyingTo(null);
    await load();
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="mt-3 mb-5">
        <h1 className="text-[24px] font-black text-[#0F2242]">메시지</h1>
        <p className="text-[15px] text-[#6B7280] mt-0.5">
          총 {messages.length}건 / 미답변 {messages.filter(m => !m.message_replies.some(r => r.author_type === 'admin')).length}건
        </p>
      </div>

      {loading ? <p className="text-center text-sm text-[#9CA3AF] mt-10">불러오는 중…</p>
        : messages.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-[17px] font-bold text-[#0F2242]">받은 메시지가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map(m => {
              const cat = CAT_LABEL[m.category ?? 'other'] ?? CAT_LABEL.other;
              const adminReplies = m.message_replies.filter(r => r.author_type === 'admin');
              const replied = adminReplies.length > 0;
              return (
                <div key={m.id} className="bg-white border border-[#E8EBF0] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[14px] font-bold">{cat.emoji} {cat.label}</span>
                    <span className={`text-[13px] font-bold px-2 py-0.5 rounded ${replied ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]' : 'bg-[rgba(231,76,60,0.12)] text-[#FF3B30]'}`}>
                      {replied ? '답변완료' : '미답변'}
                    </span>
                    <span className="text-[13px] text-[#6B7280] font-semibold">
                      {m.residents?.name ?? '-'} {m.residents?.units?.ho_number && `(${m.residents.units.ho_number})`}
                    </span>
                    <span className="text-[13px] text-[#9CA3AF] ml-auto">{new Date(m.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-[15px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{m.text}</p>

                  {adminReplies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E8EBF0] space-y-2">
                      {adminReplies.map(r => (
                        <div key={r.id} className="bg-[#F5F6FA] rounded-2xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-bold text-[#2B2BEE]">관리자{r.author_name && ` · ${r.author_name}`}</span>
                            <span className="text-[13px] text-[#9CA3AF] ml-auto">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          <p className="text-[15px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === m.id ? (
                    <div className="mt-3 pt-3 border-t border-[#E8EBF0]">
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="답변 내용" rows={3}
                        className="w-full bg-white border border-[#E8EBF0] rounded-2xl px-3 py-2 text-sm outline-none focus:border-[#2B2BEE] resize-none" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => submitReply(m.id)} className="flex-1 bg-[#2B2BEE] text-white py-2 rounded-2xl text-[15px] font-bold">답변 등록</button>
                        <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-3 bg-[#F5F6FA] text-[#6B7280] py-2 rounded-2xl text-[15px] font-bold">취소</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingTo(m.id); setReplyText(''); }} className="mt-3 text-[14px] font-bold text-[#2B2BEE] hover:underline">
                      {replied ? '추가 답변' : '답변하기'} →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
