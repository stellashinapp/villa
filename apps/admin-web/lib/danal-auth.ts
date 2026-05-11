/**
 * 다날 본인확인 (BARO 인증) 서버 사이드 유틸리티
 *
 * ⚠️ 현재 구현은 placeholder 입니다. 다날 키 발급 후 다음 작업 필요:
 *
 * 1. https://www.danal.co.kr 가입 → "본인확인 서비스(통합) 신청"
 * 2. CPID (사이트 코드) + CPPWD (사이트 키) 발급 받기
 * 3. 다날 가맹점 매뉴얼에 첨부된 통합매뉴얼·샘플 다운로드
 *    (인증 ready API + confirm API + TX_SEQ 관리)
 * 4. .env.local 에 DANAL_CPID, DANAL_CPPWD, DANAL_API_BASE 설정
 *    (운영: https://uas.teledit.com / 개발: https://uasdev.teledit.com 같은 별도 호스트 사용 가능)
 * 5. 아래 startDanalAuth / confirmDanalAuth 의 TODO 부분에 실제 API 호출 코드로 교체
 *
 * 다날 BARO 표준 흐름:
 *  (1) 모바일 → admin-web /api/danal/start
 *  (2) admin-web → 다날 ready API: { CPID, CPPWD, TARGETURL, CPTITLE, ... }
 *      → 다날 응답: { TID, ... }
 *  (3) admin-web → 모바일: { tid, authUrl, txSeq }
 *  (4) 모바일 WebView → 다날 인증 페이지 (authUrl + tid)
 *  (5) 사용자 PASS/SMS 인증 완료 → 다날 → admin-web /api/danal/callback (POST, TID)
 *  (6) admin-web → 다날 confirm API: { TID }
 *      → 다날 응답: { NAME, GENDER, BIRTHDAY, MOBILE, CI, DI, ... }
 *  (7) admin-web → 모바일 (WebView postMessage) 결과 전달
 */

import crypto from 'crypto';

export type DanalAuthRequest = {
  /** TX_SEQ — 가맹점이 발급하는 거래 고유번호. 응답 매칭에 사용 */
  txSeq: string;
  /** 인증 완료 후 다날이 호출할 URL */
  targetUrl: string;
  /** 사용자에게 표시될 가맹점명 */
  cpTitle?: string;
};

export type DanalAuthResult = {
  txSeq: string;
  /** 다날 거래번호 (이후 결과 조회 매칭 키) */
  tid: string;
  name: string;
  /** 휴대폰번호 (- 없는 11자리) */
  phone: string;
  /** 생년월일 YYYYMMDD */
  birthDate: string;
  /** 'M' / 'F' */
  gender: 'M' | 'F' | '';
  /** 중복가입확인정보 — 가맹점 단위 식별자 */
  di: string;
  /** 연계정보 — 사이트 간 식별자 */
  ci: string;
  /** 통신사 ('SKT' / 'KT' / 'LGU' / 'SKM' / 'KTM' / 'LGM') */
  carrier?: string;
  /** 내국인 'L' / 외국인 'F' */
  foreignerYn?: string;
};

const DANAL_API_BASE = process.env.DANAL_API_BASE ?? 'https://uas.teledit.com';
const DANAL_READY_PATH = '/uas/Web/Identify/Ready.php';
const DANAL_CONFIRM_PATH = '/uas/Web/Identify/Confirm.php';
const DANAL_AUTH_PAGE_PATH = '/uas/Web/Identify/Modal.php';

function assertKeys() {
  const CPID = process.env.DANAL_CPID;
  const CPPWD = process.env.DANAL_CPPWD;
  if (!CPID || !CPPWD) {
    throw new Error(
      'DANAL_CPID / DANAL_CPPWD 미설정. ' +
        '.env.local 에 설정 후 admin-web 재시작 필요.',
    );
  }
  return { CPID, CPPWD };
}

/**
 * 다날 본인확인 시작 — TID 발급 + 인증 페이지 URL 생성.
 *
 * TODO: placeholder 응답이 아닌 실제 다날 ready API 호출로 교체.
 */
export async function startDanalAuth(
  req: DanalAuthRequest,
): Promise<{ tid: string; authUrl: string }> {
  const { CPID, CPPWD } = assertKeys();

  // TODO: 실제 다날 ready API 호출
  //
  // const body = new URLSearchParams({
  //   CPID,
  //   CPPWD,
  //   ORDERID: req.txSeq,
  //   TARGETURL: req.targetUrl,
  //   CPTITLE: req.cpTitle ?? '빌라톡',
  //   AUTHTYPE: '36', // 통합 본인확인(휴대폰)
  // });
  // const res = await fetch(`${DANAL_API_BASE}${DANAL_READY_PATH}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //   body: body.toString(),
  // });
  // const text = await res.text(); // EUC-KR/UTF-8 dependent — 키 발급 후 인코딩 확인
  // const parsed = parseDanalKeyValue(text);
  // if (parsed.RETURNCODE !== '0000') {
  //   throw new Error(`다날 ready 실패: ${parsed.RETURNMSG ?? parsed.RETURNCODE}`);
  // }
  // const tid = parsed.TID;

  // PLACEHOLDER — 키 미발급 상태에서도 흐름 자체는 동작하도록 가짜 TID 반환
  const tid = `DUMMY_${req.txSeq}_${Date.now()}`;
  console.warn('[danal] using placeholder TID — 실제 다날 키 발급 후 ready API 호출로 교체 필요');

  const authUrl = `${DANAL_API_BASE}${DANAL_AUTH_PAGE_PATH}?TID=${encodeURIComponent(tid)}`;
  return { tid, authUrl };
}

/**
 * 다날 콜백 받은 후 TID 로 실제 인증 결과 조회 + 복호화.
 *
 * TODO: 실제 다날 confirm API 호출로 교체.
 */
export async function confirmDanalAuth(tid: string, txSeq: string): Promise<DanalAuthResult> {
  const { CPID, CPPWD } = assertKeys();

  // TODO: 실제 다날 confirm API 호출
  //
  // const body = new URLSearchParams({
  //   CPID,
  //   CPPWD,
  //   TID: tid,
  //   ORDERID: txSeq,
  // });
  // const res = await fetch(`${DANAL_API_BASE}${DANAL_CONFIRM_PATH}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //   body: body.toString(),
  // });
  // const text = await res.text();
  // const parsed = parseDanalKeyValue(text);
  // if (parsed.RETURNCODE !== '0000') {
  //   throw new Error(`다날 confirm 실패: ${parsed.RETURNMSG ?? parsed.RETURNCODE}`);
  // }

  // PLACEHOLDER — 실 키 발급 전 빈 결과
  console.warn('[danal] using placeholder confirm — 실제 다날 키 발급 후 confirm API 호출로 교체 필요');
  const parsed: Record<string, string> = {};

  return {
    txSeq,
    tid,
    name: parsed.USERNAME ?? '',
    phone: (parsed.USERPHONE ?? '').replace(/\D/g, ''),
    birthDate: parsed.BIRTHDATE ?? '',
    gender: (parsed.GENDER ?? '') as 'M' | 'F' | '',
    di: parsed.DI ?? '',
    ci: parsed.CI ?? '',
    carrier: parsed.CARRIER,
    foreignerYn: parsed.FOREIGNER,
  };
}

/**
 * 다날 응답 평문(key=value\nkey=value\n...) 파서.
 * 실제 키 발급 후 다날 응답 포맷에 맞춰 검증/수정 필요.
 */
export function parseDanalKeyValue(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    result[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return result;
}

/**
 * 가맹점 거래 고유번호(ORDERID/TX_SEQ) 생성 — 30자 영숫자.
 */
export function generateTxSeq(): string {
  const ts = Date.now().toString();
  const rand = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${ts}${rand}`.slice(0, 30);
}
