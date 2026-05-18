'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Report = {
  id: string;
  category: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
};

const CATEGORIES = [
  { value: 'noise', label: '소음', emoji: '🔊' },
  { value: 'leak', label: '누수', emoji: '💧' },
  { value: 'elevator', label: '엘리베이터', emoji: '🛗' },
  { value: 'pest', label: '해충', emoji: '🪳' },
  { value: 'security', label: '보안', emoji: '🚨' },
  { value: 'other', label: '기타', emoji: '📝' },
];

export default function ResidentReportPage() {
  const [residentId, setResidentId] = useState<string | null>(null);
  const [villaId, setVillaId] = useState<string | null>(null);
  const [villaName, setVillaName] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('noise');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

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
    loadReports();
  }, [residentId]);

  async function loadReports() {
    if (!residentId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('id, category, title, body, status, created_at, admin_reply')
      .eq('resident_id', residentId)
      .order('created_at', { ascending: false });
    if (error) {
      setReports([]);
      if (!error.message.toLowerCase().includes('not exist')) setError(error.message);
    } else {
      setReports((data ?? []) as Report[]);
    }
    setLoading(false);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('제목과 내용을 모두 입력해 주세요');
      return;
    }
    if (!residentId || !villaId) return;
    setSubmitting(true);
    const { error } = await supabase.from('complaints').insert({
      resident_id: residentId,
      villa_id: villaId,
      category,
      title: title.trim(),
      body: body.trim(),
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      alert('등록 실패: ' + error.message);
      return;
    }
    setTitle('');
    setBody('');
    setCategory('noise');
    setShowForm(false);
    await loadReports();
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
        <form onSubmit={submitReport} className="mt-4 bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
          <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">카테고리</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`py-2 rounded-lg text-[12px] font-bold border ${
                  category === c.value
                    ? 'bg-[#4263E8] text-white border-[#4263E8]'
                    : 'bg-white text-[#6B7280] border-[#E8EBF0]'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 위층 늦은밤 소음 민원"
            maxLength={50}
            className="w-full bg-white border border-[#E8EBF0] rounded-lg px-3.5 py-2.5 text-sm text-[#0F2242] outline-none focus:border-[#4263E8] mb-3"
          />
          <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">상세 내용</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="언제, 어디서, 무슨 일이 있었는지 적어주세요"
            rows={4}
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
      ) : reports.length === 0 && !showForm ? (
        <div className="text-center mt-20">
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-[15px] font-bold text-[#0F2242] mb-1">신고 내역이 없습니다</p>
          <p className="text-[13px] text-[#9CA3AF]">불편 사항이 있으면 위 버튼으로 신고해주세요</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {reports.map(r => {
            const cat = CATEGORIES.find(c => c.value === r.category) ?? CATEGORIES[5];
            const statusColor =
              r.status === 'resolved' ? 'bg-[rgba(46,204,113,0.12)] text-[#2ECC71]' :
              r.status === 'in_progress' ? 'bg-[rgba(243,156,18,0.12)] text-[#F39C12]' :
              'bg-[#F5F6FA] text-[#6B7280]';
            const statusKo =
              r.status === 'resolved' ? '처리완료' :
              r.status === 'in_progress' ? '처리중' :
              '접수';
            return (
              <div key={r.id} className="bg-white rounded-xl p-4 border border-[#E8EBF0] shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-bold">
                    {cat.emoji} {cat.label}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
                    {statusKo}
                  </span>
                  <span className="text-[12px] text-[#9CA3AF] ml-auto">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <h3 className="text-[15px] font-extrabold text-[#0F2242] mb-1.5">{r.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-[20px] whitespace-pre-wrap">{r.body}</p>
                {r.admin_reply && (
                  <div className="mt-3 pt-3 border-t border-[#E8EBF0]">
                    <p className="text-[11px] font-bold text-[#4263E8] mb-1">관리자 답변</p>
                    <p className="text-[13px] text-[#0F2242] leading-[20px] whitespace-pre-wrap">{r.admin_reply}</p>
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
