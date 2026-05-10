/* eslint-disable @next/next/no-img-element */

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
    <div className="bg-white relative w-full overflow-x-hidden">
      <div className="figma-page relative w-[1920px] mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
          <div className="[grid-area:1/1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative">
            <div className="[grid-area:1/1] h-[68px] ml-0 mt-0 relative w-[1920px]">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
            </div>
            <div className="bg-white [grid-area:1/1] h-[46px] ml-[390px] mt-[8px] relative w-[130px]" />
          </div>
          <div className="[grid-area:1/1] h-[21px] ml-[381px] mt-[24px] relative w-[131px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVillaTalk1} />
          </div>
        </div>

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
              <div className="bg-[#1f63e9] content-stretch flex h-[86px] items-center justify-center p-[10px] relative rounded-[15px] shrink-0 w-[295px]">
                <p className="font-semibold leading-[25px] not-italic relative shrink-0 text-[20px] text-center text-white whitespace-nowrap">
                  무료로 시작하기
                </p>
              </div>
              <div className="bg-[rgba(255,255,255,0.2)] border border-[rgba(235,235,235,0.5)] border-solid content-stretch flex h-[86px] items-center justify-center p-[10px] relative rounded-[15px] shrink-0 w-[295px]">
                <p className="font-semibold leading-[25px] not-italic relative shrink-0 text-[20px] text-center text-white whitespace-nowrap">
                  요금제 보기
                </p>
              </div>
            </div>
          </div>
          <div className="[grid-area:1/1] h-[679px] ml-[1371px] mt-[197px] relative w-[360px]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img alt="" className="absolute h-[115.46%] left-[-0.01%] max-w-none top-0 w-[100.03%]" src={imgGroup12461} />
            </div>
          </div>
          <div className="[grid-area:1/1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-[1130px] mt-[116px] place-items-start relative">
            <div className="[grid-area:1/1] h-[701px] ml-0 mt-0 relative rounded-[64px] w-[321.257px]" style={{ backgroundImage: 'linear-gradient(90deg, rgb(244, 246, 255) 0%, rgb(244, 246, 255) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)' }} />
            <div className="[grid-area:1/1] h-[219.07px] ml-[5.77px] mt-[23.89px] relative w-[310.611px]">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgFrame2131} />
            </div>
            <div className="[grid-area:1/1] h-[350.835px] ml-[8.24px] mt-[244.65px] relative w-[308.145px]">
              <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgFrame1021} />
            </div>
            <div className="[grid-area:1/1] h-[84.021px] ml-[8.24px] mt-[597.21px] relative w-[304.783px]">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <img alt="" className="absolute h-[258.46%] left-[-0.02%] max-w-none top-[0.49%] w-[100.05%]" src={imgFrame1022} />
              </div>
            </div>
            <div className="[grid-area:1/1] h-[701px] ml-0 mt-0 relative w-[321.258px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1245} />
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
                      <div className="relative shrink-0 size-[32px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck02} />
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
                      <div className="relative shrink-0 size-[32px]">
                        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck3} />
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
        <div className="bg-[#f8fbff] content-stretch flex flex-col gap-[112px] h-[1543px] items-center pt-[125px] relative shrink-0 w-full">
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
        <div className="content-stretch flex flex-col gap-[90px] h-[1948px] items-center pt-[117px] relative shrink-0 w-full" style={{ backgroundImage: 'linear-gradient(151.3395801934072deg, rgb(255, 255, 255) 28.884%, rgb(240, 244, 255) 83.59%)' }}>
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
              <div className="bg-[#3d54ff] content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[20px] text-center text-white tracking-[-0.3px]">무료체험 시작</p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['관리비 청구 · 발송', '입주민 공지 / 알림', '민원 1:1 응대', '주차 관리', '커뮤니티 게시판', '카드 / 계좌 결제'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck4} />
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
              <div className="bg-white content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[#1f63e9] text-[20px] text-center tracking-[-0.3px]">무료체험 시작</p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['소형 플랜 모든 기능', '자동 청구서 발행', '수납 현황 대시보드', '문자 알림 (예정)', '입주민 회원관리', '우선 고객지원'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck5} />
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
              <div className="bg-[#3d54ff] content-stretch flex h-[61px] items-center justify-center relative rounded-[15px] shrink-0 w-full">
                <p className="flex-[1_0_0] font-semibold leading-[50px] min-w-px not-italic relative text-[20px] text-center text-white tracking-[-0.3px]">무료체험 시작</p>
              </div>
              <div className="content-stretch flex flex-col gap-[7px] items-start relative shrink-0">
                {['중형 플랜 모든 기능', '다중 빌라 통합관리', '월별 정산 리포트', 'CSV 데이터 내보내기', '전담 매니저 (예정)', 'API 액세스 (예정)'].map((feat) => (
                  <div key={feat} className="content-stretch flex gap-[10px] h-[35px] items-center relative rounded-[15px] shrink-0 w-[391px]">
                    <div className="relative shrink-0 size-[24px]">
                      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCheck4} />
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
                    <span className="leading-[37px]">기업 도입 · 맞춤 견적은 villatolk@andnew.kr로 문의해 주세요.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#f0f4ff] content-stretch flex flex-col gap-[90px] h-[2046px] items-center pt-[107px] relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[24px] items-center not-italic relative shrink-0 text-center w-[796px]">
            <p className="font-bold leading-[55px] relative shrink-0 text-[#0f2242] text-[45px] tracking-[-0.9px] w-full">자주 묻는 질문</p>
            <p className="font-medium leading-[50px] relative shrink-0 text-[#5b6d8f] text-[25px] tracking-[-0.25px] w-full">필요한 답이 없으면 villatolk@andnew.kr로 문의해 주세요.</p>
          </div>
          <div className="content-stretch flex flex-col gap-[25px] items-start relative shrink-0">
            {/* Q1 expanded */}
            <div className="content-stretch flex items-center relative shrink-0 w-[1116px]">
              <div className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-[1_0_0] flex-col gap-[45px] h-[273px] items-start min-w-px px-[29px] py-[27px] relative rounded-[15px]">
                <div className="content-stretch flex flex-col gap-[25px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[720px] items-center relative shrink-0">
                    <p className="font-semibold leading-[50px] not-italic relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] whitespace-nowrap">무료체험은 어떻게 시작하나요?</p>
                    <div className="relative shrink-0 size-[24px]">
                      <div className="absolute inset-1/4">
                        <div className="absolute inset-[-8.33%]">
                          <img alt="" className="block max-w-none size-full" src={imgIcon} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-0 relative shrink-0 w-[1058px]">
                    <div className="absolute inset-[-1px_0_0_0]">
                      <img alt="" className="block max-w-none size-full" src={imgLine3} />
                    </div>
                  </div>
                </div>
                <p className="font-normal leading-[32px] not-italic relative shrink-0 text-[#0f2242] text-[22px] tracking-[-0.44px] w-[951px]">
                  앱 다운로드 후 회원가입만 하시면 자동으로 30일 무료체험이 시작됩니다. 카드 등록은 무료체험이 끝나기 전까지 하지 않아도 됩니다.
                </p>
              </div>
            </div>
            {/* Q2-Q10 collapsed */}
            {[
              '카드 등록 안 하면 어떻게 되나요?',
              '입주민도 요금을 내나요?',
              '빌라가 여러 개인데 어떻게 하나요?',
              '관리비는 어떻게 정산되나요?',
              '구독 해지하면 데이터는 어떻게 되나요?',
              '입주민이 앱을 못 깔거나 안 쓰면 어떻게 하나요?',
              '관리비 항목을 어떻게 입력하나요?',
              '데이터가 안전한가요?',
              '문의 어디로 하나요?',
            ].map((q) => (
              <div key={q} className="bg-white border border-[#ebebeb] border-solid content-stretch drop-shadow-[0px_0px_11px_rgba(168,196,255,0.22)] flex flex-col h-[112px] items-start justify-center px-[29px] py-[10px] relative rounded-[15px] shrink-0 w-[1116px]">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <p className="font-semibold leading-[50px] not-italic relative shrink-0 text-[#0f2242] text-[25px] tracking-[-0.375px] whitespace-nowrap">{q}</p>
                    <div className="flex items-center justify-center relative shrink-0 size-[33.941px]">
                      <div className="-rotate-45 flex-none">
                        <div className="relative size-[24px]">
                          <div className="absolute inset-1/4">
                            <div className="absolute inset-[-8.33%]">
                              <img alt="" className="block max-w-none size-full" src={imgIcon} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
          <div className="[grid-area:1/1] h-[340px] ml-0 mt-0 relative w-[2015px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="bg-[#f9fafb] [grid-area:1/1] h-[72px] ml-[414.5px] mt-[23px] relative w-[128px]" />
          <div className="[grid-area:1/1] h-[21px] ml-[419.5px] mt-[53px] relative w-[131px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVillaTalk1} />
          </div>
        </div>
      </div>
    </div>
  );
}
