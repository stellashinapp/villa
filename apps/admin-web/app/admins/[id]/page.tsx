'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

const ADMINS: Record<string, {
  name: string; email: string; phone: string; status: string;
  joinedAt: string; totalVillas: number; totalUnits: number;
  villas: { name: string; address: string; units: number; plan: string; price: number; payRate: number }[];
  subscription: { items: { label: string; qty: number; unitPrice: number }[]; volumeDiscount: number; total: number };
}> = {
  'adm-001': {
    name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', status: '활성',
    joinedAt: '2025-08-12', totalVillas: 3, totalUnits: 87,
    villas: [
      { name: '선릉 파크빌', address: '서울 강남구 선릉로 123', units: 32, plan: '중형', price: 50000, payRate: 94 },
      { name: '역삼 그린빌', address: '서울 강남구 역삼동 456', units: 28, plan: '소형', price: 30000, payRate: 88 },
      { name: '삼성 리버뷰', address: '서울 강남구 삼성동 789', units: 27, plan: '대형', price: 70000, payRate: 96 },
    ],
    subscription: {
      items: [
        { label: '중형 플랜 x1', qty: 1, unitPrice: 50000 },
        { label: '소형 플랜 x1', qty: 1, unitPrice: 30000 },
        { label: '대형 플랜 x1', qty: 1, unitPrice: 70000 },
      ],
      volumeDiscount: 0,
      total: 150000,
    },
  },
  'adm-002': {
    name: '박영희', email: 'park@example.com', phone: '010-2345-6789', status: '활성',
    joinedAt: '2025-09-03', totalVillas: 7, totalUnits: 210,
    villas: [
      { name: '강남 힐스테이트', address: '서울 강남구 논현동 11', units: 40, plan: '대형', price: 70000, payRate: 92 },
      { name: '서초 브라운빌', address: '서울 서초구 방배동 22', units: 25, plan: '소형', price: 30000, payRate: 85 },
      { name: '잠실 레이크빌', address: '서울 송파구 잠실동 33', units: 35, plan: '중형', price: 50000, payRate: 97 },
      { name: '송파 파크뷰', address: '서울 송파구 가락동 44', units: 30, plan: '중형', price: 50000, payRate: 91 },
      { name: '강동 리버사이드', address: '서울 강동구 천호동 55', units: 20, plan: '소형', price: 30000, payRate: 78 },
      { name: '마포 하늘빌', address: '서울 마포구 상수동 66', units: 32, plan: '중형', price: 50000, payRate: 93 },
      { name: '용산 센트럴', address: '서울 용산구 한남동 77', units: 28, plan: '대형', price: 70000, payRate: 89 },
    ],
    subscription: {
      items: [
        { label: '대형 플랜 x2', qty: 2, unitPrice: 70000 },
        { label: '중형 플랜 x3', qty: 3, unitPrice: 50000 },
        { label: '소형 플랜 x2', qty: 2, unitPrice: 30000 },
      ],
      volumeDiscount: 20,
      total: 280000,
    },
  },
};

const STATUS_STYLE: Record<string, string> = {
  '활성': 'bg-okL text-ok',
  '미정산': 'bg-warnL text-warn',
  '결제실패': 'bg-errL text-err',
};

export default function AdminDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const admin = ADMINS[id];

  if (!admin) {
    return (
      <div>
        <Link href="/admins" className="text-pri text-sm hover:underline">← 관리자 목록</Link>
        <div className="mt-10 text-center text-t3">관리자를 찾을 수 없습니다 (ID: {id})</div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-t3 mb-5">
        <Link href="/admins" className="hover:text-t1 transition-colors">관리자 목록</Link>
        <span>/</span>
        <span className="text-t1 font-semibold">{admin.name}</span>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-[10px] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">{admin.name}</h2>
            <p className="text-sm text-t3 mb-3">{admin.email}</p>
            <div className="flex gap-6 text-sm">
              <div><span className="text-t3">연락처</span> <span className="text-t1 ml-1">{admin.phone}</span></div>
              <div><span className="text-t3">가입일</span> <span className="text-t1 ml-1">{admin.joinedAt}</span></div>
              <div><span className="text-t3">빌라</span> <span className="text-pri font-bold ml-1">{admin.totalVillas}개</span></div>
              <div><span className="text-t3">세대</span> <span className="text-[#4DA6FF] font-bold ml-1">{admin.totalUnits}세대</span></div>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_STYLE[admin.status] ?? 'bg-surface text-t3'}`}>
            {admin.status}
          </span>
        </div>
      </div>

      {/* Villa List */}
      <div className="bg-card border border-border rounded-[10px] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-bold">관리 빌라 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-t3 text-xs">
                <th className="text-left px-5 py-3 font-medium">빌라명</th>
                <th className="text-left px-5 py-3 font-medium">주소</th>
                <th className="text-right px-5 py-3 font-medium">세대수</th>
                <th className="text-left px-5 py-3 font-medium">플랜</th>
                <th className="text-right px-5 py-3 font-medium">가격</th>
                <th className="text-right px-5 py-3 font-medium">납부율</th>
              </tr>
            </thead>
            <tbody>
              {admin.villas.map((v, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-priL transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-t1">{v.name}</td>
                  <td className="px-5 py-3.5 text-t2">{v.address}</td>
                  <td className="px-5 py-3.5 text-right text-t2">{v.units}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-priL text-priT">{v.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">{v.price.toLocaleString()}원</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={v.payRate >= 90 ? 'text-ok' : v.payRate >= 80 ? 'text-warn' : 'text-err'}>
                      {v.payRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail */}
      <div className="bg-card border border-border rounded-[10px] p-6">
        <h3 className="text-sm font-bold mb-4">구독 상세</h3>
        <div className="space-y-2 mb-4">
          {admin.subscription.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-t2">{item.label}</span>
              <span>{(item.qty * item.unitPrice).toLocaleString()}원</span>
            </div>
          ))}
        </div>
        {admin.subscription.volumeDiscount > 0 && (
          <div className="flex justify-between text-sm text-ok border-t border-border pt-3 mb-3">
            <span>볼륨 할인 ({admin.subscription.volumeDiscount}%)</span>
            <span>-{((admin.subscription.items.reduce((s, i) => s + i.qty * i.unitPrice, 0) - admin.subscription.total)).toLocaleString()}원</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-border pt-3">
          <span>월 합계</span>
          <span className="text-pri">{admin.subscription.total.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  );
}
