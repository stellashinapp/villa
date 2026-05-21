'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminTopBar from '@/components/AdminTopBar';
import Icon from '@/components/Icon';

type Reply = {
  id: string;
  text: string;
  author_type: string;
  author_name: string | null;
  created_at: string;
};

type Message = {
  id: string;
  villa_id: string;
  unit_id: string | null;
  resident_id: string | null;
  text: string;
  image_url: string | null;
  category: string | null;
  is_read: boolean;
  created_at: string;
  villas: { name: string } | null;
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

export default function AdminInboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    // 현재 admin 가 소유한 villa 들의 메시지
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle();
    if (!adminRow) return;

    const { data: villas } = await supabase
      .from('villas')
      .select('id')
      .eq('admin_id', (adminRow as { id: string }).id)
      .eq('status', 'active');
    const villaIds = ((villas ?? []) as { id: string }[]).map(v => v.id);
    if (villaIds.length === 0) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, villa_id, unit_id, resident_id, text, image_url, category, is_read, created_at,
        villas(name),
        residents(name, units(ho_number)),
        message_replies(id, text, author_type, author_name, created_at)
      `)
      .in('villa_id', villaIds)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as unknown as Message[]);
    }
    setLoading(false);
  }

  async function submitReply(messageId: string) {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: adminRow } = await supabase
      .from('admins')
      .select('name, email')
      .eq('auth_id', user.id)
      .maybeSingle();
    const authorName = (adminRow as { name?: string; email?: string })?.name ?? (adminRow as { email?: string })?.email ?? '관리자';

    const { error } = await supabase.from('message_replies').insert({
      message_id: messageId,
      text: replyText.trim(),
      author_type: 'admin',
      author_name: authorName,
    });
    setSubmitting(false);
    if (error) {
      alert('답변 등록 실패: ' + error.message);
      return;
    }
    setReplyText('');
    setReplyingTo(null);
    // is_read 표시
    await supabase.from('messages').update({ is_read: true }).eq('id', messageId);
    await load();
  }

  return (
    <>
      <AdminTopBar
        title="메시지"
        subtitle={`입주민 신고/민원 — 총 ${messages.length}건, 미답변 ${messages.filter(m => m.message_replies.filter(r => r.author_type === 'admin').length === 0).length}건`}
      />
      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[17px] font-bold text-[#FF3B30] mb-1">오류</p>
          <p className="text-[15px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-[#F0F2F5] text-center mt-4">
          <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="message" size={26} color="#2B2BEE" filled /></div>
          <p className="text-[17px] font-bold text-[#0F2242] mb-1">받은 메시지가 없습니다</p>
          <p className="text-[15px] text-[#9CA3AF]">입주민 신고가 오면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {messages.map(m => {
            const cat = CAT_LABEL[m.category ?? 'other'] ?? CAT_LABEL.other;
            const adminReplies = m.message_replies.filter(r => r.author_type === 'admin');
            const replied = adminReplies.length > 0;
            return (
              <div key={m.id} className="bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[14px] font-bold">
                    {cat.emoji} {cat.label}
                  </span>
                  <span
                    className={`text-[13px] font-bold px-2 py-0.5 rounded ${
                      replied
                        ? 'bg-[#E9E9FD] text-[#2B2BEE]'
                        : 'bg-[#FEE8E7] text-[#FF3B30]'
                    }`}
                  >
                    {replied ? '답변완료' : '미답변'}
                  </span>
                  <span className="text-[13px] text-[#6B7280] font-semibold">
                    {m.villas?.name ?? '-'}
                    {m.residents?.name && ` · ${m.residents.name}`}
                    {m.residents?.units?.ho_number && ` (${m.residents.units.ho_number})`}
                  </span>
                  <span className="text-[13px] text-[#9CA3AF] ml-auto">
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-[15px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{m.text}</p>
                {m.image_url && <img src={m.image_url} alt="첨부 사진" className="mt-2.5 rounded-xl max-h-64 object-cover w-full border border-[#E8EBF0]" />}

                {adminReplies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E8EBF0] space-y-2">
                    {adminReplies.map(r => (
                      <div key={r.id} className="bg-[#F5F6FA] rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-bold text-[#2B2BEE]">
                            관리자 {r.author_name && `· ${r.author_name}`}
                          </span>
                          <span className="text-[13px] text-[#9CA3AF] ml-auto">
                            {new Date(r.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-[15px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === m.id ? (
                  <div className="mt-3 pt-3 border-t border-[#E8EBF0]">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="답변 내용을 입력하세요"
                      rows={3}
                      className="w-full bg-white border border-[#E8EBF0] rounded-xl px-3 py-2 text-sm text-[#0F2242] outline-none focus:border-[#2B2BEE] resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => submitReply(m.id)}
                        disabled={submitting}
                        className="flex-1 bg-[#2B2BEE] text-white py-2 rounded-xl text-[15px] font-bold disabled:opacity-50"
                      >
                        {submitting ? '등록 중…' : '답변 등록'}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 bg-[#F5F6FA] text-[#6B7280] py-2 rounded-xl text-[15px] font-bold"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyingTo(m.id); setReplyText(''); }}
                    className="mt-3 text-[14px] font-bold text-[#2B2BEE] hover:underline"
                  >
                    {replied ? '추가 답변' : '답변하기'} →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}
