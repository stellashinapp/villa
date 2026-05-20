'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ResidentPageHeader from '@/components/ResidentPageHeader';
import Icon from '@/components/Icon';

type MessageReply = {
  id: string;
  text: string;
  author_type: string;
  author_name: string | null;
  created_at: string;
};

type Message = {
  id: string;
  unit_id: string | null;
  resident_id: string | null;
  text: string;
  image_url: string | null;
  category: string | null;
  is_read: boolean;
  created_at: string;
  message_replies: MessageReply[];
};

type Session = { id: string; villaId: string; villaName: string; ho: string; name: string };

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ResidentReportPage() {
  const [s, setS] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    setS(JSON.parse(raw) as Session);
  }, []);

  useEffect(() => { if (s) loadMessages(s.id); }, [s]);

  async function loadMessages(rid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, unit_id, resident_id, text, image_url, category, is_read, created_at, message_replies(id, text, author_type, author_name, created_at)')
      .eq('resident_id', rid)
      .order('created_at', { ascending: false });
    if (error) { setError(error.message); setMessages([]); }
    else setMessages((data ?? []) as unknown as Message[]);
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { alert('내용을 입력해 주세요'); return; }
    if (!s) return;
    setSubmitting(true);
    const { error } = await supabase.from('messages').insert({
      resident_id: s.id, villa_id: s.villaId, text: text.trim(), category: 'other', is_read: false,
    });
    setSubmitting(false);
    if (error) { alert('등록 실패: ' + error.message); return; }
    setText('');
    if (s) await loadMessages(s.id);
  }

  if (!s) return <div className="min-h-screen flex items-center justify-center text-[14px] text-[#9CA3AF]">불러오는 중…</div>;

  return (
    <>
      <ResidentPageHeader villaName={s.villaName} title="민원" ho={s.ho} name={s.name} />

      <div className="px-5 pt-4 pb-8 max-w-screen-sm mx-auto">
        <h2 className="text-[15px] font-extrabold text-[#0F2242] mb-3">관리자에게 신고/건의</h2>
        <form onSubmit={submit} className="bg-[#E9E9FD] rounded-xl p-4 space-y-3 mb-6">
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="내용을 입력하세요" rows={4} maxLength={500}
            className="w-full bg-white border border-[#E8EBF0] rounded-xl px-4 py-3 text-[15px] text-[#0F2242] outline-none focus:border-[#2B2BEE] focus:ring-2 focus:ring-[#2B2BEE]/15 transition resize-none" required />
          <button type="button" disabled
            className="inline-flex items-center gap-1.5 bg-white border border-[#E8EBF0] text-[#9CA3AF] text-[13px] font-bold px-3 py-2 rounded-xl">
            <Icon name="camera" size={15} color="#9CA3AF" /> 사진 첨부
          </button>
          <button type="submit" disabled={submitting}
            className="w-full bg-[#2B2BEE] text-white py-3.5 rounded-xl text-[15px] font-bold hover:bg-[#1C1CC9] disabled:opacity-50 transition">
            {submitting ? '전송 중…' : '보내기'}
          </button>
        </form>

        <h2 className="text-[15px] font-extrabold text-[#0F2242] mb-3">대화 내역</h2>

        {loading ? <p className="text-center text-[14px] text-[#9CA3AF] mt-10">불러오는 중…</p>
          : error ? <p className="text-center text-[14px] text-[#FF3B30] mt-10">오류: {error}</p>
          : messages.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-[#F0F2F5] text-center">
              <div className="w-12 h-12 rounded-xl bg-[#E9E9FD] flex items-center justify-center mx-auto mb-2"><Icon name="mailOpen" size={26} color="#2B2BEE" filled /></div>
              <p className="text-[15px] font-bold text-[#0F2242]">신고·건의 내역이 없습니다</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1">불편 사항이 있으면 위에서 보내주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(m => {
                const replies = m.message_replies ?? [];
                const replied = replies.some(r => r.author_type === 'admin');
                return (
                  <div key={m.id} className="bg-white rounded-xl p-4 border border-[#F0F2F5] shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[14px] font-bold text-[#0F2242]">{fmtDate(m.created_at)} 보냄</span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ml-auto ${
                        replied ? 'bg-[#E8F8EC] text-[#2ECC71]' : 'bg-[#F5F6FA] text-[#6B7280]'
                      }`}>
                        {replied ? '답변완료' : '전달됨'}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#0F2242] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    {replies.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {replies.map(r => (
                          <div key={r.id} className="bg-[#F5F6FA] rounded-xl px-3 py-2.5 flex items-start gap-1.5">
                            <span className="text-[#2B2BEE] text-[14px] mt-0.5">↳</span>
                            <p className="text-[13px] text-[#0F2242] leading-relaxed whitespace-pre-wrap flex-1">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </>
  );
}
