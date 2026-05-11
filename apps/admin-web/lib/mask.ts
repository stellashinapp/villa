/**
 * PII 마스킹 유틸 — admin-web 본사 콘솔에서 슈퍼관리자 외에는 마스킹된 데이터 노출.
 * 개인정보보호법 안전성 확보조치 (제29조) 의 "접근 통제" 일환.
 */

/** 010-1234-5678 → 010-****-5678 (뒤 4자리만 노출) */
export function maskPhone(p: string | null | undefined): string {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return p;
}

/** 신경아 → 신*아, 김민수 → 김*수, 박철수영 → 박**영 (2자: 신* / 1자: 신 그대로) */
export function maskName(n: string | null | undefined): string {
  if (!n) return '';
  if (n.length <= 1) return n;
  if (n.length === 2) return `${n[0]}*`;
  return `${n[0]}${'*'.repeat(n.length - 2)}${n[n.length - 1]}`;
}

/** admin@villatolk.test → a***n@villatolk.test (도메인은 노출) */
export function maskEmail(e: string | null | undefined): string {
  if (!e) return '';
  const at = e.indexOf('@');
  if (at < 0) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at);
  if (local.length <= 2) return `${local[0]}*${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}${domain}`;
}
