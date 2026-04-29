# 빌라톡(ANDNEW) 배포 가이드

사장님 혼자 실서비스 올리는 순서. 실제 순서대로 따라하면 됩니다.

---

## 0. 사전 준비

| 필요한 계정 | 비용 | 용도 |
|---|---|---|
| **Supabase** | 무료 (Pro $25/월 권장) | DB, 인증, 파일, Functions |
| **Expo EAS** | 무료 (Production Plan $99/월 권장) | 모바일 앱 빌드 |
| **Google Play 개발자** | $25 (1회) | 안드로이드 등록 |
| **Apple Developer** | $99/년 | iOS 등록 |
| **토스페이먼츠** | 가입 후 계약 | 결제 |
| **Vercel** | 무료 | 관리자 웹 호스팅 |
| **도메인** (선택) | 연 1~2만원 | andnew.kr 등 |

---

## 1. Supabase 배포

### 1-1. 마이그레이션 실행
```bash
# Supabase CLI 로그인
npx supabase login

# 프로젝트 링크 (기존 프로젝트 사용)
npx supabase link --project-ref OLD_PROJECT_REDACTED

# 마이그레이션 푸시 (001~007 전부)
npx supabase db push
```

### 1-2. Extension 활성화
Supabase Dashboard → Database → Extensions에서 아래 활성화:
- `pg_cron`
- `pg_net`

### 1-3. DB 설정값 등록 (SQL Editor)
```sql
ALTER DATABASE postgres SET "app.settings.supabase_url"
  TO 'https://OLD_PROJECT_REDACTED.supabase.co';
ALTER DATABASE postgres SET "app.settings.service_role_key"
  TO 'sb_secret_REDACTED';
```

### 1-4. Edge Functions 배포
```bash
npx supabase functions deploy confirm-payment
npx supabase functions deploy issue-billing-key
npx supabase functions deploy billing-cron
npx supabase functions deploy payment-webhook
npx supabase functions deploy add-villa-with-billing
npx supabase functions deploy push-notify
```

### 1-5. Secrets 등록 (토스 실키 확보 후)
```bash
npx supabase secrets set TOSS_CLIENT_KEY=live_ck_실제키
npx supabase secrets set TOSS_SECRET_KEY=live_sk_실제키
npx supabase secrets set TOSS_BILLING_CLIENT_KEY=live_ck_빌링키
npx supabase secrets set TOSS_BILLING_SECRET_KEY=live_sk_빌링키
npx supabase secrets set TOSS_WEBHOOK_SECRET=실제_웹훅시크릿
```

### 1-6. 토스 웹훅 등록
토스페이먼츠 관리자 → 개발자센터 → 웹훅 등록
```
https://OLD_PROJECT_REDACTED.supabase.co/functions/v1/payment-webhook
```

---

## 2. 관리자 웹 배포 (Vercel)

```bash
cd apps/admin-web
npx vercel
# 첫 배포 시 질문 답변:
#   Set up and deploy? Y
#   Link to existing project? N
#   Project name? villatolk-admin
#   Directory? ./
#   Override settings? N
```

환경변수 (Vercel 대시보드에서 추가):
```
SUPABASE_URL=https://OLD_PROJECT_REDACTED.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
NEXT_PUBLIC_TOSS_BILLING_CLIENT_KEY=live_ck_...
```

---

## 3. 모바일 앱 빌드 (EAS)

### 3-1. EAS 로그인
```bash
cd apps/mobile
npx eas-cli login
npx eas-cli build:configure
```

### 3-2. 환경변수 설정
`eas.json`에 프로덕션 env 추가 (빌드 프로필별):
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://OLD_PROJECT_REDACTED.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sb_publishable_...",
        "EXPO_PUBLIC_TOSS_CLIENT_KEY": "live_ck_...",
        "EXPO_PUBLIC_TOSS_BILLING_CLIENT_KEY": "live_ck_..."
      }
    }
  }
}
```

### 3-3. 빌드
```bash
# Android
npx eas-cli build --platform android --profile production

# iOS (macOS 환경 또는 EAS 클라우드 빌드)
npx eas-cli build --platform ios --profile production
```

### 3-4. 스토어 제출
```bash
npx eas-cli submit --platform android
npx eas-cli submit --platform ios
```

**앱 심사 기간**: Google 1~3일, Apple 1~7일

---

## 4. 도메인 연결 (선택)

| 용도 | 도메인 | 연결 대상 |
|---|---|---|
| 관리자 웹 | admin.andnew.kr | Vercel |
| 마케팅 홈 | www.andnew.kr | 별도 웹사이트 |
| 딥링크 | andnew.kr (잘 쓰는 앱링크) | Expo 앱 스킴 |

---

## 5. 테스트 체크리스트

### Supabase
- [ ] 마이그레이션 7개 다 적용됨
- [ ] Extensions 활성화됨 (pg_cron, pg_net)
- [ ] Edge Functions 6개 배포됨
- [ ] Secrets 등록됨
- [ ] Storage 버킷 5개 생성됨

### 기능 테스트
- [ ] 회원가입 (관리자 모바일) → 30일 무료체험 구독 자동 생성
- [ ] 빌라 추가 → units 자동 생성 + subscription_item 추가
- [ ] 입주민 등록 → 로그인 가능
- [ ] 공지 발행 → 입주민 폰에 푸시 (관리자 앱에서 공지 작성)
- [ ] 관리비 청구서 발행 → 입주민 폰에 푸시
- [ ] 입주민이 토스로 관리비 결제 → 결제 성공 DB 기록
- [ ] 관리자 카드 등록 (설정 > 결제수단) → 빌링키 발급
- [ ] 매월 결제일 → billing-cron 자동 실행 (수동 테스트 가능)
- [ ] 관리자 웹 → villas/residents/payments/subscriptions 실데이터 표시

---

## 6. 모니터링

| 대상 | 확인 경로 |
|---|---|
| Edge Function 로그 | Supabase Dashboard → Functions → Logs |
| DB 쿼리 | Dashboard → SQL Editor |
| Cron 실행 기록 | `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;` |
| 결제 내역 | 관리자 웹 /payments |
| 푸시 실패 | `SELECT * FROM net._http_response ORDER BY created DESC;` |

---

## 7. 아직 안 된 것 (Phase 2)

| 기능 | 상태 | 노트 |
|---|---|---|
| 모바일 로컬 store → Supabase 마이그 | ❌ 로컬 상태 유지 중 | 헬퍼는 준비됨 (messages.ts, storage.ts) |
| Inbox 실시간 채팅 UI | 🟡 헬퍼 준비, UI 연결 필요 | [messages.ts](apps/mobile/lib/messages.ts) 사용 |
| 이미지 업로드 UI 연결 | 🟡 헬퍼 준비 | [storage.ts](apps/mobile/lib/storage.ts) 사용 |
| 통계 대시보드 | ❌ | 관리자 홈에 차트 추가 필요 |
| 주차 방문차 알림 (30분 전) | ❌ | cron 추가 필요 |
| 민원 카테고리 분류 | 🟡 필드는 있음 | UI 확장 필요 |
| 다국어 (한/영) | ❌ | i18n 설정 필요 |

---

## 응급 대응

**결제 실패 폭주**: `SELECT * FROM subscriptions WHERE status = 'past_due';`로 대상 확인 → 수동 재시도
**푸시 미전송**: push-notify Function 로그 확인 → fcm_token 형식 검증
**Cron 안 돔**: `SELECT * FROM cron.job;`로 스케줄 존재 확인 → `app.settings.*` 값 확인
