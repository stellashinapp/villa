'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

const CATEGORIES = [
  { value: 'noise', label: '소음', emoji: '🔊' },
  { value: 'leak', label: '누수', emoji: '💧' },
  { value: 'elevator', label: '엘리베이터', emoji: '🛗' },
  { value: 'pest', label: '해충', emoji: '🪳' },
  { value: 'security', label: '보안', emoji: '🚨' },
  { value: 'maintenance', label: '시설', emoji: '🛠' },
  { value: 'other', label: '기타', emoji: '📝' },
];

function catMeta(value: string | null) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

export default function ResidentReportPage() {
  const [residentId, setResidentId] = useState<string | null>(null);
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('noise');
  const [text, setText] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('villatolk:resident');
    if (!raw) return;
    const s = JSON.parse(raw) as { id: string; villaId: string; villaName: string };
    setResidentId(s.id);
    setVillaId(s.villaId);
    setVillaName(s.villaName);
  }, []);

  useEffect(() => {
    if (!residentId) return;
    loadMessages();
  }, [residentId]);

  async function loadMessages() {
    if (!residentId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, unit_id, resident_id, text, image_url, category, is_read, created_at, message_replies(id, text, author_type, author_name, created_at)')
      .eq('resident_id', residentId)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as unknown as Message[]);
    }
    setLoading(false);
  }

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      alert('내용을 입력해 주세요');
      return;
    }
    if (!residentId || !villaId) return;
    setSubmitting(true);
    const { error } = await supabase.from('messages').insert({
      resident_id: residentId,
      villa_id: villaId,
      text: text.trim(),
      category,
      is_read: false,
    });
    setSubmitting(false);
    if (error) {
      alert('등록 실패: ' + error.message);
      return;
    }
    setText('');
    setCategory('noise');
    setShowForm(false);
    await loadMessages();
  }

  return (
    <div className="px-5 pt-6 pb-8 max-w-screen-sm mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22px] font-black text-[#0F2242]">신고/민원</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">{villaName}</p>
        </div>
        <button
          className="bg-[#4263E8] text-white text-[13px] font-bold px-3.5 py-2 rounded-lg shadow-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '취소' : '＋ 신고'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submitMessage} className="mt-4 bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
          <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">카테고리</label>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`py-2 rounded-lg text-[11px] font-bold border ${
                  category === c.value
                    ? 'bg-[#4263E8] text-white border-[#4263E8]'
                    : 'bg-white text-[#6B7280] border-[#E8EBF0]'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">내용</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="언제, 어디서, 무슨 일이 있었는지 적어주세요"
            rows={5}
            maxLength={500}
            className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3.5 py-2.5 text-sm text-[#0F2242] outline-none focus:border-[#4263E8] mb-3 resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#4263E8] text-white py-3 rounded-lg text-[14px] font-bold disabled:opacity-50"
          >
            {submitting ? '등록 중…' : '신고 등록'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center text-sm text-[#9CA3AF] mt-20">불러오는 중…</p>
      ) : error ? (
        <div className="text-center mt-20">
          <p className="text-[15px] font-bold text-[#E74C3C] mb-1">오류</p>
          <p className="text-[13px] text-[#9CA3AF]">{error}</p>
        </div>
      ) : messages.length === 0 && !showForm ? (
        <div className="text-center mt-20">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">신고 내역이 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">불편 사항이 있으면 위 버튼으로 신고해주세요</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {messages.map(m => {
            const cat = catMeta(m.category);
            const replies = m.message_replies ?? [];
            const adminReplied = replies.some(r => r.author_type === 'admin');
            return (
              <div key={m.id} className="bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold">
                    {cat.emoji} {cat.label}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      adminReplied
                        ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]'
                        : 'bg-[#F5F6FA] text-[#6B7280]'
                    }`}
                  >
                    {adminReplied ? '답변완료' : '접수'}
                  </span>
                  <span className="text-[12px] text-[#9CA3AF] ml-auto">
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p className="text-[13px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{m.text}</p>
                {replies.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E8EBF0] space-y-2">
                    {replies.map(r => (
                      <div key={r.id} className="bg-[#F5F6FA] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#4263E8]">
                            {r.author_type === 'admin' ? '관리자' : '시스템'}
                            {r.author_name && ` · ${r.author_name}`}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF] ml-auto">
                            {new Date(r.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
