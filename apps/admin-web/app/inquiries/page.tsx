'use client';

import { useState } from 'react';

interface Reply {
  author: string;
  date: string;
  body: string;
}

interface Inquiry {
  id: number;
  admin: string;
  status: '대기중' | '해결됨';
  date: string;
  subject: string;
  body: string;
  replies: Reply[];
}

const INITIAL_INQUIRIES: Inquiry[] = [
  {
    id: 1,
    admin: '김철수',
    status: '대기중',
    date: '2026-04-16',
    subject: '세대 추가 방법 문의',
    body: '기존 빌라에 새로운 세대를 추가하려고 하는데, 앱에서 어떻게 하면 되나요? 관리자 앱에서 세대 추가 버튼이 안 보입니다.',
    replies: [
      { author: 'ANDNEW 운영팀', date: '2026-04-16', body: '안녕하세요 김철수님, 빌라 상세 페이지 > 세대 관리 탭에서 추가 가능합니다. 혹시 안 보이시면 앱을 업데이트 해주세요.' },
    ],
  },
  {
    id: 2,
    admin: '박영희',
    status: '대기중',
    date: '2026-04-15',
    subject: '결제 수단 변경 요청',
    body: '카드 만료로 인해 결제 수단을 변경하고 싶습니다. 어디서 변경할 수 있을까요?',
    replies: [],
  },
  {
    id: 3,
    admin: '이민호',
    status: '해결됨',
    date: '2026-04-10',
    subject: '구독 플랜 변경 문의',
    body: '현재 소형 플랜인데 인기 플랜으로 변경하고 싶습니다. 중도 변경 시 요금은 어떻게 되나요?',
    replies: [
      { author: 'ANDNEW 운영팀', date: '2026-04-10', body: '플랜 변경은 다음 결제일부터 적용되며, 차액은 일할 계산됩니다.' },
      { author: '이민호', date: '2026-04-11', body: '감사합니다, 변경 완료했습니다!' },
    ],
  },
  {
    id: 4,
    admin: '정수진',
    status: '해결됨',
    date: '2026-04-05',
    subject: '입주민 알림 발송 오류',
    body: '입주민에게 공지 알림을 보냈는데, 일부 세대에 전달되지 않았습니다.',
    replies: [
      { author: 'ANDNEW 운영팀', date: '2026-04-05', body: '확인 결과, 앱 미설치 입주민에게는 푸시가 발송되지 않습니다. SMS 병행 발송을 권장드립니다.' },
    ],
  },
  {
    id: 5,
    admin: '최동욱',
    status: '대기중',
    date: '2026-04-14',
    subject: '관리비 내역서 PDF 출력',
    body: '관리비 내역서를 PDF로 출력하는 기능이 있나요? 입주민에게 서면 제공이 필요합니다.',
    replies: [],
  },
];

const STATUS_STYLE: Record<string, string> = {
  '대기중': 'bg-warnL text-warn',
  '해결됨': 'bg-okL text-ok',
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  const pending = inquiries.filter((i) => i.status === '대기중').length;
  const resolved = inquiries.filter((i) => i.status === '해결됨').length;

  function handleReply(id: number) {
    const text = replyTexts[id]?.trim();
    if (!text) return;
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === id
          ? { ...inq, replies: [...inq.replies, { author: 'ANDNEW 운영팀', date: new Date().toISOString().slice(0, 10), body: text }] }
          : inq
      )
    );
    setReplyTexts((prev) => ({ ...prev, [id]: '' }));
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">관리자 문의</h2>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '미해결', value: `${pending}건`, color: 'text-warn' },
          { label: '해결됨', value: `${resolved}건`, color: 'text-ok' },
          { label: '총 문의', value: `${inquiries.length}건`, color: 'text-pri' },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-[10px] p-5">
            <div className="text-xs text-t3 font-medium mb-2">{k.label}</div>
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Inquiry Cards */}
      <div className="space-y-4">
        {inquiries.map((inq) => (
          <div key={inq.id} className="bg-card border border-border rounded-[10px] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-t1">{inq.admin}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[inq.status]}`}>
                  {inq.status}
                </span>
              </div>
              <span className="text-xs text-t3">{inq.date}</span>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <h4 className="text-sm font-bold text-t1 mb-2">{inq.subject}</h4>
              <p className="text-sm text-t2 leading-relaxed">{inq.body}</p>
            </div>

            {/* Replies */}
            {inq.replies.length > 0 && (
              <div className="mx-5 mb-4 border-t border-border pt-3 space-y-3">
                {inq.replies.map((r, i) => (
                  <div key={i} className={`rounded-lg p-3 text-sm ${
                    r.author === 'ANDNEW 운영팀' ? 'bg-priL border border-pri/20' : 'bg-surface border border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-t1">{r.author}</span>
                      <span className="text-xs text-t3">{r.date}</span>
                    </div>
                    <p className="text-t2 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input (only for open inquiries) */}
            {inq.status === '대기중' && (
              <div className="px-5 pb-4 flex gap-2">
                <input
                  placeholder="답변을 입력하세요..."
                  value={replyTexts[inq.id] ?? ''}
                  onChange={(e) => setReplyTexts((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(inq.id)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-t1 outline-none focus:border-pri"
                />
                <button
                  onClick={() => handleReply(inq.id)}
                  className="px-4 py-2 bg-pri text-white text-sm font-semibold rounded-lg hover:bg-pri/80 transition-colors"
                >
                  답변
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
