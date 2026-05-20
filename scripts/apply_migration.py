"""
마이그레이션을 production Supabase 에 적용 (Management API)
사용: python scripts/apply_migration.py supabase/migrations/0XX_xxx.sql [...]
- 인자 없으면 029 이상(최근) 전부 적용 시도
- 모든 마이그레이션은 idempotent (IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS) 전제
"""
import os, sys, json, glob, urllib.request, urllib.error, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN")
REF = os.environ.get("SUPABASE_PROJECT_REF", "tdgieeupxxalwxikdxji")
if not TOKEN:
    sys.exit("SUPABASE_ACCESS_TOKEN 환경변수가 필요합니다")

def apply(path):
    sql = open(path, encoding="utf-8").read()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "supabase-cli/1.0"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            print(f"[OK] {os.path.basename(path)} -> {r.status}")
            return True
    except urllib.error.HTTPError as e:
        print(f"[FAIL] {os.path.basename(path)} -> HTTP {e.code}: {e.read().decode()[:300]}")
        return False

targets = sys.argv[1:]
if not targets:
    # 인자 없으면 최근(028 이상) — 초기 스키마(001)는 재실행 시 충돌하므로 제외
    targets = sorted(glob.glob("supabase/migrations/0[2-9][89]_*.sql"))
    print(f"인자 없음 → 최근 마이그레이션 {len(targets)}개 적용")

ok = all(apply(t) for t in targets)
sys.exit(0 if ok else 1)
