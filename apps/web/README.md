# @villatolk/web — PWA (사용자용)

빌라톡 사용자(관리자·입주민)용 PWA. Next.js 16 + Supabase + PWA manifest.

## Dev

```bash
npm run dev:pwa   # port 3300
```

## Production

GitHub Actions `deploy-pwa.yml` 가 `main` push 마다 자동 배포 → Vercel `villatolk-pwa` 프로젝트.

## 라우트

- `/` — 역할 선택
- `/admin/login`, `/admin`, `/admin/applications` — 관리자
- `/resident/login`, `/resident/signup`, `/resident/bills`, `/resident/moveout` — 입주민
