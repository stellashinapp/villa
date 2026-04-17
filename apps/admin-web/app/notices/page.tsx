'use client';

import { useState } from 'react';

interface Notice {
  id: number;
  date: string;
  title: string;
  target: string;
  status: '발송완료' | '발송중' | '예약';
}

const INITIAL_NOTICES: Notice[] = [
  { id: 1, date: '2026-04-15', title: '4월 정기 업데이트 안내', target: '전체', status: '발송완료' },
  { id: 2, date: '2026-04-10', title: '결제 시스템 점검 안내 (4/12 02:00~06:00)', target: '전체', status: '발송완료' },
  { id: 3, date: '2026-04-01', title: '봄맞이 관리비 절약 가이드', target: '활성만', status: '발송완료' },
  { id: 4, date: '2026-03-20', title: '신규 기능 출시: 세대별 알림 설정', target: '전체', status: '발송완료' },
];

const STATUS_STYLE: Record<string, string> = {
  '발송완료': 'bg-okL text-ok',
  '발송중': 'bg-warnL text-warn',
  '예약': 'bg-priL text-priT',
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('전체');
  const [sending, setSending] = useState(false);

  function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    // Simulate send
    setTimeout(() => {
      setNotices((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          title: title.trim(),
          target,
          status: '발송완료',
        },
        ...prev,
      ]);
      setTitle('');
      setBody('');
      setSending(false);
    }, 800);
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">공지 발송</h2>

      {/* Form */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <h3 className="text-sm font-bold mb-4">새 공지 작성</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-t3 font-medium mb-1.5">제목</label>
            <input
              placeholder="공지 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-t1 outline-none focus:border-pri"
            />
          </div>
          <div>
            <label className="block text-xs text-t3 font-medium mb-1.5">내용</label>
            <textarea
              placeholder="공지 내용을 입력하세요"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-sm text-t1 outline-none focus:border-pri resize-none"
            />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-xs text-t3 font-medium mb-1.5">대상</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-t1 outline-none focus:border-pri"
              >
                <option value="전체">전체</option>
                <option value="활성만">활성만</option>
              </select>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="px-5 py-2.5 bg-pri text-white text-sm font-semibold rounded-lg hover:bg-pri/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? '발송중...' : '발송'}
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">발송 이력</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">일자</th>
                <th className="text-left px-5 py-3 font-medium">제목</th>
                <th className="text-left px-5 py-3 font-medium">대상</th>
                <th className="text-left px-5 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id} className="border-b border-border last:border-0 hover:bg-white/[.03] transition-colors">
                  <td className="px-5 py-3.5 text-t2">{n.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-t1">{n.title}</td>
                  <td className="px-5 py-3.5 text-t2">{n.target}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[n.status]}`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
