/**
 * NICE 본인인증 (체크플러스) 암호화/복호화 유틸리티
 *
 * ⚠️ 현재 구현은 placeholder 입니다. NICE 키 발급 후 다음 작업 필요:
 *
 * 1. https://www.niceid.co.kr 가입 → "본인확인 서비스" 신청
 * 2. SP_ID (사이트 코드) + SITE_PASSWORD 발급 받기
 * 3. NICE 가맹점 매뉴얼에 첨부된 Node.js 샘플 다운로드
 *    (보통 module 형태 — SEED-CBC + RSA 라이브러리 포함)
 * 4. 받은 패키지를 `apps/admin-web/lib/nice-sdk/` 에 위치
 * 5. 아래 encryptCheckplus / decryptCheckplus 의 TODO 부분에 SDK 호출로 교체
 * 6. .env.local 에 NICE_SP_ID, NICE_SP_SECRET 설정
 *
 * Reference (NICE 표준 요청 plain 데이터):
 *   8:REQ_SEQ + sReqSeq.length() + sReqSeq      // 요청고유번호
 *   3:SITECODE + sSiteCode                       // 사이트 코드
 *   9:AUTH_TYPE + sAuthType                      // 인증수단 ('M'=모바일통합)
 *   7:RTN_URL + sReturnUrl.length() + sReturnUrl // 성공 리턴 URL
 *   8:ERR_URL + sErrorUrl.length() + sErrorUrl   // 실패 리턴 URL
 *   ...
 */

import crypto from 'crypto';

export type NiceAuthRequest = {
  /** 요청 고유번호 (이 값으로 응답을 매칭) */
  requestId: string;
  /** 인증 완료 시 NICE 가 호출할 URL */
  successUrl: string;
  /** 인증 실패 시 NICE 가 호출할 URL */
  failUrl: string;
  /** 인증 수단. 'M' = 모바일 통합(추천), 'X' = PASS만, 'C' = 카드, 'F' = 공동인증서 */
  authType?: 'M' | 'X' | 'C' | 'F';
};

export type NiceAuthResult = {
  requestId: string;
  name: string;
  /** 휴대폰번호 (- 없는 11자리) */
  phone: string;
  /** 생년월일 YYYYMMDD */
  birthDate: string;
  /** 'M' / 'F' */
  gender: 'M' | 'F' | '';
  /** 중복가입확인정보 (계정 단위 식별자) */
  di: string;
  /** 연계정보 (사이트 간 식별자) */
  ci: string;
  /** 내국인/외국인 ('0'/'1') */
  nationalInfo?: string;
};

/**
 * 요청 데이터를 NICE 표준 평문 → 암호화 형태로 변환.
 *
 * TODO: NICE 에서 받은 Node SDK 의 encrypt 함수를 호출하도록 교체.
 *
 * 현재는 placeholder — Base64 인코딩만. **운영 사용 금지**.
 */
export function encryptCheckplus(req: NiceAuthRequest): { encData: string; niceUrl: string } {
  const SP_ID = process.env.NICE_SP_ID;
  const SP_SECRET = process.env.NICE_SP_SECRET;

  if (!SP_ID || !SP_SECRET) {
    throw new Error(
      'NICE_SP_ID / NICE_SP_SECRET 미설정. ' +
        '.env.local 에 설정 후 admin-web 재시작 필요.',
    );
  }

  const reqDate = new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, '')
    .slice(0, 14); // YYYYMMDDHHmmss

  // NICE 표준 평문 포맷
  const plain = [
    `8:REQ_SEQ${req.requestId.length}:${req.requestId}`,
    `3:SITECODE${SP_ID.length}:${SP_ID}`,
    `9:SITEPWD${SP_SECRET.length}:${SP_SECRET}`,
    `9:AUTH_TYPE${(req.authType ?? 'M').length}:${req.authType ?? 'M'}`,
    `7:RTN_URL${req.successUrl.length}:${req.successUrl}`,
    `7:ERR_URL${req.failUrl.length}:${req.failUrl}`,
    `8:REQ_DATE${reqDate.length}:${reqDate}`,
  ].join('');

  // TODO: 실제 NICE SEED-CBC 암호화로 교체
  // const encData = niceSdk.encrypt(plain, SP_ID, SP_SECRET);
  const encData = Buffer.from(plain, 'utf8').toString('base64'); // PLACEHOLDER

  return {
    encData,
    niceUrl: 'https://nice.checkplus.co.kr/CheckPlusSafeModel/checkplus.cb',
  };
}

/**
 * NICE 콜백에서 받은 EncodeData → 원본 사용자 정보로 복호화.
 *
 * TODO: NICE Node SDK 의 decrypt 함수로 교체.
 *
 * 현재는 placeholder — Base64 디코드만. **운영 사용 금지**.
 */
export function decryptCheckplus(encodeData: string): NiceAuthResult {
  const SP_SECRET = process.env.NICE_SP_SECRET;
  if (!SP_SECRET) throw new Error('NICE_SP_SECRET 미설정');

  // TODO: 실제 NICE SEED-CBC 복호화로 교체
  // const plain = niceSdk.decrypt(encodeData, SP_ID, SP_SECRET);
  const plain = Buffer.from(encodeData, 'base64').toString('utf8'); // PLACEHOLDER

  // 평문 형식: 키:길이:값 의 반복. 필드별 파싱
  const fields = parseNicePlain(plain);

  return {
    requestId: fields.REQ_SEQ ?? '',
    name: fields.NAME ?? '',
    phone: (fields.MOBILE_NO ?? '').replace(/\D/g, ''),
    birthDate: fields.BIRTHDATE ?? '',
    gender: (fields.GENDER ?? '') as 'M' | 'F' | '',
    di: fields.DI ?? '',
    ci: fields.CI ?? '',
    nationalInfo: fields.NATIONALINFO,
  };
}

function parseNicePlain(plain: string): Record<string, string> {
  // 표준 포맷: <keyLen>:<key><valLen>:<value> 반복
  const result: Record<string, string> = {};
  let i = 0;
  while (i < plain.length) {
    const lenColonA = plain.indexOf(':', i);
    if (lenColonA < 0) break;
    const keyLen = parseInt(plain.slice(i, lenColonA), 10);
    if (Number.isNaN(keyLen)) break;
    const key = plain.slice(lenColonA + 1, lenColonA + 1 + keyLen);
    i = lenColonA + 1 + keyLen;

    const lenColonB = plain.indexOf(':', i);
    if (lenColonB < 0) break;
    const valLen = parseInt(plain.slice(i, lenColonB), 10);
    if (Number.isNaN(valLen)) break;
    const val = plain.slice(lenColonB + 1, lenColonB + 1 + valLen);
    i = lenColonB + 1 + valLen;

    result[key] = val;
  }
  return result;
}

/**
 * 12자리 영숫자 요청 ID 생성 (NICE 권장).
 */
export function generateRequestId(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}
