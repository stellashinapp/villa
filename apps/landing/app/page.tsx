/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import FaqList from '@/components/FaqList';

const FAQ_ITEMS = [
  {
    q: '무료체험은 어떻게 시작하나요?',
    a: '앱 다운로드 후 회원가입만 하시면 자동으로 30일 무료체험이 시작됩니다. 카드 등록은 무료체험이 끝나기 전까지 하지 않아도 됩니다.',
  },
  {
    q: '카드 등록 안 하면 어떻게 되나요?',
    a: '30일 무료체험 종료 시점까지 카드를 등록하지 않으면 본사 콘솔과 관리자 앱 일부 기능이 일시 정지됩니다. 카드만 등록하시면 즉시 재개되며, 등록 후에도 30일 이내 해지하면 요금은 청구되지 않습니다.',
  },
  {
    q: '입주민도 요금을 내나요?',
    a: '입주민은 빌라톡 앱을 무료로 사용합니다. 구독료는 관리자(빌라 소유주)만 매월 지불합니다.\n입주민이 앱에서 관리비를 카드로 결제하실 때만 토스페이먼츠 표준 결제 수수료가 결제 금액에서 자동 차감됩니다 (관리자 부담 0).',
  },
  {
    q: '빌라가 여러 개인데 어떻게 하나요?',
    a: '한 계정으로 여러 빌라를 통합 관리할 수 있습니다. 빌라 수에 따라 자동 볼륨 할인이 적용됩니다 — 3개 이상 5%, 5개 이상 10%, 10개 이상 15%.\n각 빌라별로 플랜(소형/중형/대형)을 다르게 선택 가능합니다.',
  },
  {
    q: '관리비는 어떻게 정산되나요?',
    a: '매월 자동으로 청구서가 발행되고 입주민에게 푸시·SMS 알림이 발송됩니다. 입주민은 앱 내에서 카드 또는 계좌이체로 즉시 납부 가능합니다.\n미납 세대는 자동으로 추적되어 관리자 대시보드의 "미납 현황" 에 표시됩니다.',
  },
  {
    q: '구독 해지하면 데이터는 어떻게 되나요?',
    a: '해지 후 30일 동안 데이터가 보관되며, 이 기간 내에 재가입하시면 모든 데이터(빌라·입주민·청구·납부 이력)가 그대로 복원됩니다.\n30일 경과 후에는 개인정보보호법에 따라 영구 삭제됩니다 (단, 결제·세금 관련 기록은 전자상거래법상 5년 보관 의무 적용).',
  },
  {
    q: '입주민이 앱을 못 깔거나 안 쓰면 어떻게 하나요?',
    a: '관리자는 입주민 동의 없이도 빌라톡으로 청구서 발행과 공지 관리가 가능합니다.\n미설치 입주민에게는 SMS·카카오 알림으로 청구서 링크를 전달하실 수 있고, 무통장 입금 또는 계좌이체 납부도 가능합니다.\n앱 사용은 입주민에게 권장 사항일 뿐 필수가 아닙니다.',
  },
  {
    q: '관리비 항목을 어떻게 입력하나요?',
    a: '관리자 앱의 "청구서 작성" 메뉴에서 항목과 금액을 입력하면 자동으로 세대별 분담액이 계산됩니다.\n일반관리비·청소비·승강기·수도·전기 등 항목별로 자유롭게 추가하거나, 평수에 따른 차등 청구도 가능합니다.\n전월 청구서를 그대로 복제하는 기능도 제공합니다.',
  },
  {
    q: '데이터가 안전한가요?',
    a: '모든 통신은 HTTPS/TLS 로 암호화되며, 데이터는 Supabase (글로벌 SOC2 인증) 의 한국·미국 리전 서버에 저장됩니다.\n카드 정보는 토스페이먼츠가 직접 처리하며 빌라톡 서버에는 카드사명과 마지막 4자리만 저장됩니다.\n본사 콘솔 접근은 접근 로그(IP·계정·일시)로 1년 이상 추적·감사됩니다.',
  },
  {
    q: '본인인증은 어떻게 진행되나요?',
    a: '다날(Danal) BARO 본인확인 시스템을 통해 통신3사 PASS 앱·SMS·신용카드 등으로 본인 확인합니다.\n가입 시 1회만 진행하면 되며, 이름·생년월일·휴대폰번호가 검증되어 실명 사용이 보장됩니다.',
  },
  {
    q: '결제 카드를 변경할 수 있나요?',
    a: '관리자 앱의 "설정 → 결제 수단" 에서 언제든 카드를 변경할 수 있습니다.\n변경 즉시 다음 결제일부터 새 카드로 청구되며, 현재 진행 중인 결제 주기에는 영향을 주지 않습니다.',
  },
  {
    q: '환불 정책은 어떻게 되나요?',
    a: '30일 무료체험 기간 내 해지 시 요금이 일절 청구되지 않습니다.\n유료 결제 후에는 사용한 일수에 비례한 부분 환불을 제공합니다 (월 단위 청구).\n환불 신청은 villatolk@andnew.kr 로 메일 주시면 영업일 기준 3일 이내 처리됩니다.',
  },
  {
    q: '문의 어디로 하나요?',
    a: '운영 시간 (평일 10시~18시) 내 villatolk@andnew.kr 로 메일 주시면 영업일 기준 1일 이내 답변드립니다.\n긴급한 장애·결제 문의는 메일 제목에 [긴급] 표시 부탁드립니다.',
  },
];

function CheckIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const imgImage1 = '/figma/image1.png';
const imgRectangle10 = '/figma/rectangle10.png';
const imgGroup12461 = '/figma/group12461.png';
const imgFrame2131 = '/figma/frame2131.png';
const imgFrame1021 = '/figma/frame1021.png';
const imgFrame1022 = '/figma/frame1022.png';
const imgRectangle2620 = '/figma/rect2620.png';
const imgRectangle2621 = '/figma/rect2621.png';
const imgRectangle2622 = '/figma/rect2622.png';
const imgRectangle2623 = '/figma/rect2623.png';
const img011 = '/figma/feat01.png';
const img12 = '/figma/feat02.png';
const img13 = '/figma/feat03.png';
const img14 = '/figma/feat04.png';
const img15 = '/figma/feat05.png';
const img16 = '/figma/feat06.png';
const imgImage2 = '/figma/image2.png';
const imgVillaTalk1 = '/figma/villatalk1.png';
const imgGroup1245 = '/figma/group1245.png';
const imgCheck02 = '/figma/check02.png';
const imgCheck3 = '/figma/check3.png';
const imgLine1 = '/figma/line1.png';
const imgCheck4 = '/figma/check4.png';
const imgLine2 = '/figma/line2.png';
const imgCheck5 = '/figma/check5.png';
const imgIcon = '/figma/icon.png';
const imgLine3 = '/figma/line3.png';

export default function HomePage() {
  return (
    <>
      {/* Header — fixed 고정 (zoom 바깥, viewport 기준) */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0f2242] shadow-[0_2px_12px_rgba(15,34,66,0.18)]">
        <div className="h-[68px] flex items-center justify-between max-w-[1920px] mx-auto px-6 lg:px-[244px]">
          <Link
            href="/"
            className="text-[24px] lg:text-[28px] font-black tracking-tight text-white hover:text-[#3d54ff] transition-colors"
          >
            Villatolk
          </Link>
          <nav className="flex items-center gap-[20px] lg:gap-[48px]">
            <a href="#features" className="text-[14px] lg:text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors">
              기능
            </a>
            <a href="#pricing" className="text-[14px] lg:text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors">
              요금
            </a>
            <a href="#faq" className="text-[14px] lg:text-[16px] font-semibold text-white hover:text-[#3d54ff] transition-colors">
              FAQ
            </a>
            <Link
              href="/download"
              className="ml-[4px] lg:ml-[8px] px-[14px] lg:px-[20px] py-[8px] lg:py-[10px] bg-[#1f63e9] text-[14px] lg:text-[16px] font-bold text-white rounded-[10px] hover:bg-[#3d54ff] transition-colors whitespace-nowrap"
            >
              앱 다운로드
            </Link>
          </nav>
        </div>
      </header>

    <div className="bg-white relative w-full overflow-x-clip pt-[68px]">
      <div className="figma-page relative w-[1920px] mx-auto flex flex-col items-center">

        {/* Hero */}
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
          <div className="[grid-area:1/1] h-[876px] ml-0 mt-0 relative w-[1920px]">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <div className="absolute bg-[#f3f7ff] inset-0" />
              <img alt="" className="absolute max-w-none object-cover size-full" src={imgRectangle10} />
            </div>
          </div>
          <div className="[grid-area:1/1] content-stretch flex flex-col gap-[76px] h-[590.28px] items-start ml-[244px] mt-[128.73px] relative w-[810px]">
            <div className="content-stretch flex flex-col gap-[33px] items-start not-italic relative shrink-0 w-full">
              <div className="font-bold leading-[0] min-w-full relative shrink-0 text-[#0f2242] text-[65px] tracking-[-1.3px] w-[min-content] whitespace-pre-wrap">
                <p className="leading-[81px] mb-0 text-white">{`빌라 관리, `}</p>
                <p className="mb-0">
                  <span className="leading-[81px] text-[#1f63e9]">아직도 수기로</span>
                  <span className="leading-[81px] text-[#3d54ff]">{` `}</span>
                </p>
                <p className="leading-[81px] text-white">하세요?</p>
              </div>
              <p className="font-medium leading-[42px] relative shrink-0 text-[#c4cee3] text-[25px] tracking-[-0.25px] w-[496px]">
                관리비 분쟁, 미납, 공지 전달, 민원, 주차 문제까지.
                <br aria-hidden="true" />
                관리자와 입주민을 하나로 연결하는 빌라 전용 관리 플랫폼입니다.
              </p>
            </div>
            <div className="content-stretch flex gap-[27px] items-center relative shrink-0">
              <Link
                href="/download"
                className="bg-[#1f63e9] content-stretch flex h-[86px] items-center justify-center p-[10px] relative rounded-[15px] shrink-0 w-[295px] hover:bg-[#3d54ff] transition-colors"
              >
                <p className="font-semibold leading-[25px] not-italic relative shrink-0 text-[20px] text-center text-white whitespace-nowrap">
                  무료로 시작하기
                </p>
              </Link>
              <a
                href="#pricing"
                className="bg-[rgba(255,255,255,0.2)] border border-[rgba(235,235,235,0.5)] border-solid content-stretch flex h-[86px] items-center justify-center p-[10px] relative rounded-[15px] shrink-0 w-[295px] hover:bg-[rgba(255,255,255,0.35)] transition-colors"
              >
                <p className="font-semibold leading-[25px] not-italic relative shrink-0 text-[20px] text-center text-white whitespace-nowrap">
                  요금제 보기
                </p>
              </a>
            </div>
          </div>
          {/* 폰 목업 2개 — CSS 로 직접 그림 (이미지 파일 없이 반응형, 깨진 figma 콜라주 대체) */}
          <div className="[grid-area:1/1] flex gap-[24px] items-end ml-[1020px] mt-[100px] relative shrink-0 z-10">
            {/* 폰 1: 시작 화면 (Villa Talk 스플래시) */}
            <div className="w-[300px] h-[610px] rounded-[44px] bg-gradient-to-b from-[#dbe6ff] via-[#e9eeff] to-[#d8e2ff] shadow-[0_30px_60px_rgba(15,34,66,0.25)] border-[10px] border-[#1a1d26] overflow-hidden relative">
              {/* notch */}
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[24px] bg-[#1a1d26] rounded-b-[14px] z-10" />
              <div className="flex flex-col h-full pt-[50px] pb-[28px] px-[24px]">
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* 빌딩 일러스트 placeholder (CSS) */}
                  <div className="relative w-[140px] h-[90px] mb-[16px]">
                    <div className="absolute left-[10px] bottom-0 w-[42px] h-[60px] bg-[#9bb2e5] rounded-t-[6px]" />
                    <div className="absolute left-[52px] bottom-0 w-[36px] h-[80px] bg-[#b7c6ed] rounded-t-[6px]" />
                    <div className="absolute left-[88px] bottom-0 w-[42px] h-[55px] bg-[#9bb2e5] rounded-t-[6px]" />
                    <div className="absolute top-[-12px] right-0 w-[28px] h-[24px] rounded-[10px] bg-[#1f63e9]" />
                    <div className="absolute top-[6px] right-[8px] w-[8px] h-[8px] rounded-full bg-white" />
                  </div>
                  <div className="text-[28px] font-black tracking-tight leading-none mb-[2px]">
                    <span className="text-[#1a1d26]">Villa</span>{' '}
                    <span className="text-[#1f63e9]">Talk</span>
                  </div>
                  <p className="mt-[14px] text-[12px] text-[#5b6d8f] text-center leading-[18px]">관리자와 입주민 모두를 위한</p>
                  <p className="text-[13px] font-bold text-[#1a1d26] text-center">스마트 공동 관리 서비스</p>
                </div>
                <div className="flex flex-col gap-[8px]">
                  <button className="w-full h-[42px] rounded-[10px] bg-[#1f63e9] text-white text-[13px] font-bold">관리자로 시작</button>
                  <button className="w-full h-[42px] rounded-[10px] bg-[#1a1d26] text-white text-[13px] font-bold">입주민으로 시작</button>
                </div>
              </div>
            </div>

            {/* 폰 2: 대시보드 */}
            <div className="w-[300px] h-[610px] rounded-[44px] bg-white shadow-[0_30px_60px_rgba(15,34,66,0.25)] border-[10px] border-[#1a1d26] overflow-hidden relative">
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[24px] bg-[#1a1d26] rounded-b-[14px] z-10" />
              <div className="flex flex-col h-full pt-[44px] px-[14px] gap-[10px] overflow-hidden">
                {/* 청색 총액 카드 */}
                <div className="rounded-[16px] bg-gradient-to-br from-[#3756d4] to-[#1f63e9] text-white px-[16px] py-[18px] text-center">
                  <div className="text-[11px] opacity-90 mb-[4px]">2026년 3월 총 관리비</div>
                  <div className="text-[28px] font-black tracking-tight">
                    877,000<span className="text-[14px] font-bold ml-[2px]">원</span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-[4px]">세대당 109,625원 · 8세대</div>
                  <div className="flex justify-center gap-[6px] mt-[8px]">
                    <span className="px-[10px] py-[3px] bg-[#22c55e] rounded-full text-[10px] font-bold">납부완료</span>
                    <span className="px-[10px] py-[3px] bg-[#f87171] rounded-full text-[10px] font-bold">미납</span>
                  </div>
                  <div className="mt-[8px] h-[6px] rounded-full bg-white/25 overflow-hidden">
                    <div className="h-full w-1/2 bg-white" />
                  </div>
                  <div className="flex justify-between text-[10px] mt-[4px] opacity-90">
                    <span>✓ 납부 4세대</span>
                    <span>⚠ 미납 4세대</span>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#1a1d26] mt-[2px]">이번달 관리 현황</div>
                {/* 미납 카드 */}
                <div className="rounded-[12px] border border-[#ebebeb] px-[12px] py-[10px]">
                  <div className="flex items-baseline justify-between mb-[6px]">
                    <div>
                      <div className="text-[20px] font-black text-[#ef4444] leading-none">4</div>
                      <div className="text-[10px] text-[#5b6d8f] mt-[2px]">완납률 50%</div>
                    </div>
                    <div className="text-[14px] font-black text-[#1a1d26]">409,625원</div>
                  </div>
                  <button className="w-full h-[28px] rounded-[8px] bg-[#f87171] text-white text-[10px] font-bold">미납세대 독촉 보내기</button>
                </div>
                {/* 민원 카드 */}
                <div className="rounded-[12px] border border-[#ebebeb] px-[12px] py-[10px]">
                  <div className="flex items-baseline justify-between mb-[6px]">
                    <div>
                      <div className="text-[20px] font-black text-[#1a1d26] leading-none">1</div>
                      <div className="text-[10px] text-[#5b6d8f] mt-[2px]">민원 메세지 대기 중</div>
                    </div>
                    <span className="text-[9px] px-[8px] py-[2px] rounded-full bg-[#dbe6ff] text-[#1f63e9] font-bold">대기</span>
                  </div>
                  <button className="w-full h-[28px] rounded-[8px] bg-[#1f63e9] text-white text-[10px] font-bold">바로 확인</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain points */}
        <div className="content-stretch flex flex-col gap-[90px] h-[768px] items-center pt-[125px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">
              빌라 관리, 왜 항상 문제일까?
            </p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] w-full">
              관리 체계가 없기 때문에 같은 문제가 반복됩니다.
            </p>
          </div>
          <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
            {/* Card 1 */}
            <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[10px] h-[283px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
              <div className="bg-[#1e3b73] content-stretch flex h-[56px] items-center justify-center p-[10px] relative rounded-[50px] shrink-0 w-[55px]">
                <div className="h-[32px] relative shrink-0 w-[41px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[160.64%] left-[-16.12%] max-w-none top-[-29.83%] w-[127.69%]" src={imgRectangle2620} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                <p className="font-semibold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">
                  관리비 불신
                </p>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[264px]">
                  수기 계산, 미납 관리, 회계 투명성 부족으로 분쟁이 발생합니다.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[10px] h-[283px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
              <div className="bg-[#1e3b73] content-stretch flex h-[56px] items-center justify-center p-[10px] relative rounded-[50px] shrink-0 w-[55px]">
                <div className="h-[30px] relative shrink-0 w-[41px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[160.64%] left-[-8.2%] max-w-none top-[-29.83%] w-[118.98%]" src={imgRectangle2621} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[240px]">
                  공지 전달 한계
                </p>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[249px]">
                  종이 게시판과 단체톡만으로는 입주민 전달률이 낮습니다.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[10px] h-[283px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
              <div className="bg-[#1e3b73] content-stretch flex h-[56px] items-center justify-center p-[10px] relative rounded-[50px] shrink-0 w-[55px]">
                <div className="h-[30px] relative shrink-0 w-[41px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[160.64%] left-[-8.2%] max-w-none top-[-29.83%] w-[118.98%]" src={imgRectangle2622} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[240px]">
                  시설 관리 방치
                </p>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[249px]">
                  수선 요청 시스템이 없어 문제 발견과 처리 이력이 남지 않습니다.
                </p>
              </div>
            </div>
            {/* Card 4 */}
            <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[10px] h-[283px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
              <div className="bg-[#1e3b73] content-stretch flex h-[56px] items-center justify-center p-[10px] relative rounded-[50px] shrink-0 w-[55px]">
                <div className="h-[30px] relative shrink-0 w-[41px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[160.64%] left-[-8.2%] max-w-none top-[-29.83%] w-[118.98%]" src={imgRectangle2623} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[240px]">
                  주차 분쟁
                </p>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[249px]">
                  차량 등록과 주차 규칙 관리 체계가 없어 갈등이 반복됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin / Resident split */}
        <div className="bg-[#fafafb] content-stretch flex flex-col gap-[90px] h-[1087px] items-center pt-[125px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">
              관리자와 입주민을 하나의 플랫폼으로
            </p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] w-full">
              빌라 운영에 필요한 기능만 모아 관리 부담을 줄입니다.
            </p>
          </div>
          <div className="content-stretch flex gap-[50px] items-start relative shrink-0">
            {/* 관리자 기능 */}
            <div className="bg-white content-stretch flex items-center relative shrink-0 w-[618px]">
              <div className="bg-[#1f63e9] border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[17px] h-[581px] items-start min-w-px pb-[27px] pl-[49px] pr-[29px] pt-[37px] relative rounded-[15px]">
                <p className="font-semibold leading-[50px] min-w-full not-italic relative shrink-0 text-[25px] text-white tracking-[-0.375px] w-[min-content]">
                  관리자 기능
                </p>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[526px]">
                  {[
                    '빌라 등록 및 세대별 입주민 관리',
                    '관리비 자동 계산 및 고지',
                    '미납 세대 추적 및 납부 요청',
                    '공지사항 발송 및 확인 관리',
                    '민원 · 주차 · 구독 관리',
                  ].map((label) => (
                    <div key={label} className="bg-[rgba(241,246,255,0.3)] content-stretch flex gap-[10px] h-[68px] items-center pl-[24px] relative rounded-[15px] shrink-0 w-[526px]">
                      <div className="relative shrink-0 size-[32px] flex items-center justify-center">
                        <CheckIcon color="#ffffff" size={26} />
                      </div>
                      <div className="font-semibold h-[32px] leading-[0] not-italic relative shrink-0 text-[22px] text-white tracking-[-0.44px] w-[277px]">
                        <p className="leading-[32px] mb-0">{label}</p>
                        <p className="leading-[32px]">​</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* 입주민 기능 */}
            <div className="content-stretch flex items-center relative shrink-0 w-[618px]">
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[17px] h-[581px] items-start min-w-px pb-[27px] pl-[49px] pr-[29px] pt-[37px] relative rounded-[15px]">
                <p className="font-semibold leading-[50px] min-w-full not-italic relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">
                  입주민 기능
                </p>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[524px]">
                  {[
                    '간편 로그인 및 우리 빌라 입장',
                    '관리비 조회 및 납부 확인',
                    '공지사항 실시간 확인',
                    '민원 신고 및 처리 상태 확인',
                    '차량 등록 및 입주민 커뮤니티',
                  ].map((label) => (
                    <div key={label} className="bg-[#f1f6ff] content-stretch flex gap-[10px] h-[68px] items-center pl-[24px] relative rounded-[15px] shrink-0 w-[524px]">
                      <div className="relative shrink-0 size-[32px] flex items-center justify-center">
                        <CheckIcon color="#1f63e9" size={26} />
                      </div>
                      <p className="font-semibold h-[32px] leading-[32px] not-italic relative shrink-0 text-[#242d3d] text-[22px] tracking-[-0.44px] w-[277px]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Features */}
        <div id="features" className="bg-[#f8fbff] content-stretch flex flex-col gap-[112px] h-[1543px] items-center pt-[125px] relative shrink-0 w-full scroll-mt-[120px]">
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">
              관리에 필요한 것, 다 들어있어요.
            </p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] w-full">
              관리자 앱과 입주민 앱이 따로, 기능은 자동으로 동기화됩니다.
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[50px] items-start relative shrink-0">
            {/* Row 1 */}
            <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[102px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                  <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-full">관리비 자동화</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-full">매월 항목 입력 한 번이면 전 세대 청구·발송·납부 확인까지 자동화했습니다.</p>
                </div>
                <div className="relative shrink-0 size-[221px]">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={img011} />
                </div>
              </div>
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[82px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                  <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-full">공지 / 민원</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-full">공지 발송하면 입주민 폰으로 즉시 알림. 민원도 카카오톡처럼 1:1 대화로 가능합니다.</p>
                </div>
                <div className="h-[221px] relative shrink-0 w-[251px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[116.36%] left-[-41.55%] max-w-none top-[-8.08%] w-[153.68%]" src={img12} />
                  </div>
                </div>
              </div>
            </div>
            {/* Row 2 */}
            <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[88px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[288px]">
                  <p className="font-semibold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">주차 관리</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[300px]">입주민 차량 · 방문 차량 등록 · 만료 알림으로 주차 갈등 끝!</p>
                </div>
                <div className="h-[221px] relative shrink-0 w-[228px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-full left-[-24.23%] max-w-none top-0 w-[145.39%]" src={img13} />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[88px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                  <p className="font-semibold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">커뮤니티</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[287px]">같은 빌라 이웃과 소통 가능한 별도 커뮤니티 기능으로 재활용 안내, 모임, 분실물까지 빠르게 정보가 공유 가능합니다.</p>
                </div>
                <div className="h-[221px] relative shrink-0 w-[228px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[116.74%] left-[-32.21%] max-w-none top-[-8.35%] w-[169.74%]" src={img14} />
                  </div>
                </div>
              </div>
            </div>
            {/* Row 3 */}
            <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[88px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                  <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-full">간편 결제</p>
                  <div className="font-normal h-[108px] leading-[0] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-full">
                    <p className="leading-[32px] mb-0">토스페이먼츠 연동. 카드 · 계좌이체로 입주민이 직접 간편하게 납부가 가능합니다.</p>
                    <p className="leading-[32px]">​</p>
                  </div>
                </div>
                <div className="h-[221px] relative shrink-0 w-[230px]">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[104.75%] left-[-24.02%] max-w-none top-[-1.95%] w-[150.98%]" src={img15} />
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] gap-[102px] h-[283px] items-start min-w-px pb-[27px] pl-[35px] pr-[29px] pt-[35px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[282px]">
                  <p className="font-semibold leading-[50px] relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-full">실시간 알림</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-full">공지, 청구, 납부, 답변 모든 이벤트가 푸시 알림으로 알람이 가서 사소한 것도 놓치지 않습니다.</p>
                </div>
                <div className="h-[221px] relative shrink-0 w-[230px]">
                  <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={img16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Steps */}
        <div className="content-stretch flex flex-col gap-[90px] h-[771px] items-center pt-[137px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col items-center relative shrink-0 w-[796px]">
            <p className="font-bold leading-[55px] not-italic relative shrink-0 text-[#0f2242] text-[45px] text-center tracking-[-0.9px] w-full">
              3단계로 쉽게 시작하세요.
            </p>
          </div>
          <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
            {[
              { num: '01', title: '앱 다운로드 & 회원가입', desc: '관리자 정보 입력 후 첫 빌라를 등록하세요. 30일 무료체험 자동 시작!' },
              { num: '02', title: '입주민 등록', desc: '세대별로 이름 · 전화번호 입력하고 입주민은 본인 폰에서 같은 정보로 로그인합니다.' },
              { num: '03', title: '관리비 발행', desc: '항목 입력 → 발행 한 번 누르면 전 세대에 알림 + 결제 가능 상태로 바로 세팅 가능합니다.' },
            ].map((s) => (
              <div key={s.num} className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[45px] h-[305px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
                <div className="bg-[#1f63e9] content-stretch flex h-[62px] items-center justify-center p-[10px] relative rounded-[20px] shrink-0 w-[61px]">
                  <p className="font-semibold leading-[20px] not-italic relative shrink-0 text-[30px] text-center text-white whitespace-nowrap">{s.num}</p>
                </div>
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-[397px]">
                  <p className="font-semibold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">{s.title}</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[372px]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="content-stretch flex flex-col gap-[90px] items-center pt-[117px] pb-[120px] relative shrink-0 w-full scroll-mt-[120px]" style={{ backgroundImage: 'linear-gradient(151.3395801934072deg, rgb(255, 255, 255) 28.884%, rgb(240, 244, 255) 83.59%)' }}>
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">
              세대 수만큼만 내세요.
            </p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] tracking-[-0.25px] w-full">
              첫 1개월 무료 · 약정 없음 · 언제든 플랜 변경
            </p>
          </div>
          {/* Plan cards */}
          <div className="content-stretch flex gap-[30px] items-center relative shrink-0 w-[1438px]">
            {/* 소형 */}
            <div className="bg-white border border-[#1f63e9] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[38px] h-[707px] items-start min-w-px pb-[27px] pl-[40px] pr-[29px] pt-[40px] relative rounded-[25px]">
              <div className="content-stretch flex flex-col gap-[17px] items-start relative shrink-0 w-[391px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-full">
                  <p className="font-bold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[35px] tracking-[-0.525px] w-[min-content]">소형</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[20px] tracking-[-0.4px] w-[372px]">8세대 이하</p>
                </div>
                <div className="h-0 relative shrink-0 w-[391px]">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine1} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 w-[397px]">
                <div className="content-stretch flex items-end relative shrink-0 w-[344px]">
                  <p className="font-bold leading-[50px] relative shrink-0 text-[#0f2242] text-[55px] tracking-[-0.825px] w-[197px]">30,000</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[18px] tracking-[-0.36px] w-[64px]">원 / 월</p>
                </div>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[18px] tracking-[-0.36px] w-[197px]">VAT 별도</p>
              </div>
              <Link href="/download" className="bg-[#3d54ff] content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full hover:bg-[#1f63e9] transition-colors">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[20px] text-center text-white tracking-[-0.3px]">무료체험 시작</p>
              </Link>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['관리비 청구 · 발송', '입주민 공지 / 알림', '민원 1:1 응대', '주차 관리', '커뮤니티 게시판', '카드 / 계좌 결제'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px] flex items-center justify-center">
                      <CheckIcon color="#1f63e9" size={20} />
                    </div>
                    <p className="font-medium h-[32px] leading-[32px] not-italic relative shrink-0 text-[#0f2242] text-[20px] tracking-[-0.4px] w-[277px]">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 인기 (highlighted) */}
            <div className="bg-[#3d54ff] content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[38px] h-[707px] items-start min-w-px pb-[27px] pl-[40px] pr-[29px] pt-[40px] relative rounded-[25px]">
              <div className="content-stretch flex flex-col gap-[17px] items-start relative shrink-0 w-[391px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-full">
                  <p className="font-bold leading-[50px] min-w-full relative shrink-0 text-[35px] text-white tracking-[-0.525px] w-[min-content]">중형</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#b9cbf4] text-[20px] tracking-[-0.4px] w-[372px]">9~15세대</p>
                </div>
                <div className="h-0 relative shrink-0 w-[391px]">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine2} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 w-[397px]">
                <div className="content-stretch flex items-end relative shrink-0 w-[344px]">
                  <p className="font-bold leading-[50px] relative shrink-0 text-[55px] text-white tracking-[-0.825px] w-[197px]">50,000</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#b9cbf4] text-[18px] tracking-[-0.36px] w-[64px]">원 / 월</p>
                </div>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#b9cbf4] text-[18px] tracking-[-0.36px] w-[197px]">VAT 별도</p>
              </div>
              <Link href="/download" className="bg-white content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full hover:bg-[#f1f6ff] transition-colors">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[#1f63e9] text-[20px] text-center tracking-[-0.3px]">무료체험 시작</p>
              </Link>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['소형 플랜 모든 기능', '자동 청구서 발행', '수납 현황 대시보드', '문자 알림 (예정)', '입주민 회원관리', '우선 고객지원'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px] flex items-center justify-center">
                      <CheckIcon color="#ffffff" size={20} />
                    </div>
                    <p className="font-medium h-[32px] leading-[32px] not-italic relative shrink-0 text-[20px] text-white tracking-[-0.4px] w-[277px]">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 대형 */}
            <div className="bg-white border border-[#1f63e9] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[38px] h-[707px] items-start min-w-px pb-[27px] pl-[40px] pr-[29px] pt-[40px] relative rounded-[25px]">
              <div className="content-stretch flex flex-col gap-[17px] items-start relative shrink-0 w-[391px]">
                <div className="content-stretch flex flex-col gap-[3px] items-start not-italic relative shrink-0 w-full">
                  <p className="font-bold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[35px] tracking-[-0.525px] w-[min-content]">대형</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[20px] tracking-[-0.4px] w-[372px]">16~30세대</p>
                </div>
                <div className="h-0 relative shrink-0 w-[391px]">
                  <div className="absolute inset-[-1px_0_0_0]">
                    <img alt="" className="block max-w-none size-full" src={imgLine1} />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 w-[397px]">
                <div className="content-stretch flex items-end relative shrink-0 w-[344px]">
                  <p className="font-bold leading-[50px] relative shrink-0 text-[#0f2242] text-[55px] tracking-[-0.825px] w-[197px]">70,000</p>
                  <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[18px] tracking-[-0.36px] w-[64px]">원 / 월</p>
                </div>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#7c7e83] text-[18px] tracking-[-0.36px] w-[197px]">VAT 별도</p>
              </div>
              <Link href="/download" className="bg-[#3d54ff] content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full hover:bg-[#1f63e9] transition-colors">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[20px] text-center text-white tracking-[-0.3px]">무료체험 시작</p>
              </Link>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['중형 플랜 모든 기능', '다중 빌라 통합관리', '월별 정산 리포트', 'CSV 데이터 내보내기', '전담 매니저 (예정)', 'API 액세스 (예정)'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px] flex items-center justify-center">
                      <CheckIcon color="#1f63e9" size={20} />
                    </div>
                    <p className="font-medium h-[32px] leading-[32px] not-italic relative shrink-0 text-[#0f2242] text-[20px] tracking-[-0.4px] w-[277px]">{feat}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Discount tiers + notes */}
          <div className="content-stretch flex flex-col gap-[50px] items-start relative shrink-0">
            <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-col gap-[36px] h-[318px] items-start not-italic pl-[40px] pr-[29px] py-[27px] relative rounded-[15px] shrink-0 w-[1438px]">
              <div className="content-stretch flex flex-col gap-[3px] h-[85px] items-start relative shrink-0 w-[596px]">
                <p className="font-semibold leading-[50px] min-w-full relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] w-[min-content]">다수 빌라 운영자 할인 혜택</p>
                <p className="font-normal leading-[32px] relative shrink-0 text-[#5b6d8f] text-[22px] tracking-[-0.44px] w-[524px]">2개 이상 빌라를 등록하면 자동으로 할인이 적용됩니다.</p>
              </div>
              <div className="content-stretch flex font-medium gap-[36px] items-start leading-[0] relative shrink-0 text-center">
                <div className="bg-[#f1f6ff] content-stretch flex flex-col gap-[10px] h-[124px] items-center justify-center relative rounded-[15px] shrink-0 w-[417px]">
                  <p className="h-[32px] relative shrink-0 text-[#242d3d] text-[20px] tracking-[-0.4px] w-[277px]">
                    <span className="leading-[32px]">{`관리 빌라 `}</span>
                    <span className="font-bold leading-[32px]">3개 이상</span>
                  </p>
                  <p className="h-[32px] relative shrink-0 text-[#1f63e9] text-[0px] w-[277px]">
                    <span className="font-bold leading-[32px] text-[45px]">-5</span>
                    <span className="font-bold leading-[32px] text-[20px]">% 할인</span>
                  </p>
                </div>
                <div className="bg-[#f1f6ff] content-stretch flex flex-col gap-[10px] h-[124px] items-center justify-center relative rounded-[15px] shrink-0 w-[417px]">
                  <p className="h-[32px] relative shrink-0 text-[#242d3d] text-[20px] tracking-[-0.4px] w-[277px]">
                    <span className="leading-[32px]">관리 빌라 5</span>
                    <span className="font-bold leading-[32px]">개 이상</span>
                  </p>
                  <p className="h-[32px] relative shrink-0 text-[#1f63e9] text-[0px] w-[277px]">
                    <span className="font-bold leading-[32px] text-[45px]">-10</span>
                    <span className="font-bold leading-[32px] text-[20px]">% 할인</span>
                  </p>
                </div>
                <div className="bg-[#f1f6ff] content-stretch flex flex-col gap-[10px] h-[124px] items-center justify-center relative rounded-[15px] shrink-0 w-[417px]">
                  <p className="h-[32px] relative shrink-0 text-[#242d3d] text-[20px] tracking-[-0.4px] w-[277px]">
                    <span className="leading-[32px]">관리 빌라 10</span>
                    <span className="font-bold leading-[32px]">개 이상</span>
                  </p>
                  <p className="h-[32px] relative shrink-0 text-[#1f63e9] text-[0px] w-[277px]">
                    <span className="font-bold leading-[32px] text-[45px]">-15</span>
                    <span className="font-bold leading-[32px] text-[20px]">% 할인</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#e3e8f4] border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-col h-[305px] items-start pl-[40px] pr-[29px] py-[27px] relative rounded-[15px] shrink-0 w-[1438px]">
              <div className="content-stretch flex flex-col gap-[3px] h-[243px] items-start not-italic relative shrink-0 text-[#4d5f82] w-[596px]">
                <p className="font-semibold leading-[50px] relative shrink-0 text-[25px] tracking-[-0.375px] w-full">안내사항</p>
                <ul className="block font-normal leading-[0] list-disc relative shrink-0 text-[20px] tracking-[-0.2px] w-full">
                  <li className="mb-0 ms-[30px]">
                    <span className="leading-[37px]">모든 플랜은 첫 1개월 완전 무료입니다 (카드 등록 시점 기준).</span>
                  </li>
                  <li className="mb-0 ms-[30px]">
                    <span className="leading-[37px]">요금은 매월 등록된 카드로 자동 결제됩니다.</span>
                  </li>
                  <li className="mb-0 ms-[30px]">
                    <span className="leading-[37px]">구독 해지 시 다음 결제일부터 청구가 중단됩니다.</span>
                  </li>
                  <li className="mb-0 ms-[30px]">
                    <span className="leading-[37px]">입주민 결제 수수료는 별도 (토스페이먼츠 표준 요율).</span>
                  </li>
                  <li className="ms-[30px]">
                    <span className="leading-[37px]">
                      기업 도입 · 맞춤 견적은{' '}
                      <a href="mailto:villatolk@andnew.kr" className="text-[#1f63e9] hover:underline">villatolk@andnew.kr</a>
                      로 문의해 주세요.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ — 동적 높이 (h-fix 제거: 12 항목 + 펼침 시 오버플로우 방지) */}
        <div id="faq" className="bg-[#f0f4ff] content-stretch flex flex-col gap-[60px] items-center pt-[107px] pb-[120px] relative shrink-0 w-full scroll-mt-[120px]">
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">자주 묻는 질문</p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] tracking-[-0.25px] w-full">
              필요한 답이 없으면{' '}
              <a href="mailto:villatolk@andnew.kr" className="text-[#1f63e9] hover:underline">villatolk@andnew.kr</a>
              로 문의해 주세요.
            </p>
          </div>
          <FaqList items={FAQ_ITEMS} initialOpen={0} />
        </div>

        {/* Footer — 영문 로고 + 서비스 nav + 법적고지 + 사업자정보 */}
        <footer className="w-[1920px] bg-[#0f2242] flex flex-col items-center pt-[60px] pb-[40px] shrink-0">
          <Link
            href="/"
            className="text-[36px] font-black tracking-tight text-white hover:text-[#3d54ff] transition-colors mb-[24px]"
          >
            Villatolk
          </Link>

          {/* 서비스 nav */}
          <div className="flex items-center gap-[32px] mb-[18px]">
            <a href="#features" className="text-[15px] font-semibold text-white/80 hover:text-white transition-colors">기능</a>
            <a href="#pricing" className="text-[15px] font-semibold text-white/80 hover:text-white transition-colors">요금</a>
            <a href="#faq" className="text-[15px] font-semibold text-white/80 hover:text-white transition-colors">FAQ</a>
            <Link href="/download" className="text-[15px] font-semibold text-white/80 hover:text-white transition-colors">앱 다운로드</Link>
          </div>

          {/* 법적 고지 — 별도 라인으로 분리 (의무 표시) */}
          <div className="flex items-center gap-[24px] mb-[24px]">
            <Link
              href="/legal/terms"
              className="text-[14px] font-bold text-white/90 underline underline-offset-[6px] decoration-white/30 hover:decoration-white hover:text-white transition-colors"
            >
              이용약관
            </Link>
            <span className="text-white/30 text-[13px]">|</span>
            <Link
              href="/legal/privacy"
              className="text-[14px] font-bold text-white/90 underline underline-offset-[6px] decoration-white/30 hover:decoration-white hover:text-white transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>

          {/* 사업자 정보 */}
          <div className="text-center text-white/50 text-[13px] leading-[22px]">
            <p>앤뉴 (ANDNEW) · 대표: 신경아 · 사업자등록번호: 296-86-02637</p>
            <p>서울특별시 송파구 송파대로 111 · <a href="mailto:villatolk@andnew.kr" className="text-white/70 hover:text-white">villatolk@andnew.kr</a></p>
            <p className="mt-[12px] text-white/40">© 2026 ANDNEW. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}
