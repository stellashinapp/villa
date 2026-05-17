# @villatolk/web — PWA (사용자용)

빌라톡 사용자(관리자·입주민)용 PWA. Next.js 16 + Supabase + PWA manifest.

## Dev

```bash
npm run dev:pwa   # port 3300
```

## Production

KakaoCloud VM (`govmonitor` 호스트, kr-central-2-a, 공인 IP `210.109.15.149`) 에
PM2 로 운영. GitHub Actions `deploy-pwa.yml` 가 `main` push 마다 다음을 수행:

1. ubuntu-latest 러너에서 `npm ci` + `npm run build:pwa`
2. Next.js standalone 결과를 `.tar.gz` 패키징 (≈50MB)
3. VM `/home/ubuntu/villatolk-pwa/current/` 로 SCP 전송 (이전 버전은 `prev/` 로 백업)
4. PM2 `villatolk-pwa` 프로세스 재시작 (포트 3300)
5. 헬스체크 — `curl http://127.0.0.1:3300` 200 확인

배포 실패 시 자동 롤백은 없음. 빠른 복구는 VM 에서:

```bash
mv /home/ubuntu/villatolk-pwa/{current,broken}
mv /home/ubuntu/villatolk-pwa/{prev,current}
cd /home/ubuntu/villatolk-pwa/current/apps/web
pm2 restart villatolk-pwa
```

## Nginx vhost (수동 셋업, 1회)

`/etc/nginx/sites-available/villatolk.app` — 80/443 → 127.0.0.1:3300 프록시.
Let's Encrypt 인증서는 `certbot --nginx -d villatolk.app -d www.villatolk.app` 으로 발급
(DNS 가 VM IP 를 가리킨 이후 실행).

## 라우트

- `/` — 역할 선택
- `/admin/login`, `/admin`, `/admin/applications` — 관리자
- `/resident/login`, `/resident/signup`, `/resident/bills`, `/resident/moveout` — 입주민

## VM 리소스 공유 주의

같은 VM 에 dduktak-portal / marketflow-engine / marketflow-web 이 PM2 로 운영 중.
빌라톡 PWA 도입 시 RAM 사용량 합계가 4GiB 한계에 근접할 수 있음 (현재 약 2.4GiB 사용).
트래픽 증가 시 인스턴스 타입 업그레이드 (`t1i.medium` → `t1i.large`) 또는 별도 VM 분리 검토.
