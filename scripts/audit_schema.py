"""
production DB 스키마 vs 코드 참조 전수 감사
- 배포된 코드가 참조하는 컬럼/테이블/RPC 가 production 에 실제 존재하는지 확인
- 하나라도 없으면 런타임 오류 → 출시 전 반드시 0건이어야 함
"""
import os, json, urllib.request, urllib.error, sys, io
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)

TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]
REF = "tdgieeupxxalwxikdxji"

def q(sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "supabase-cli/1.0"},
        method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

# 코드가 의존하는 핵심 컬럼 (table -> [columns])
REQUIRED_COLUMNS = {
    "villas": ["expose_admin_contact", "special_notes", "account_bank_code",
               "account_bank", "account_number", "account_holder", "image_url",
               "units_per_floor", "total_units", "status"],
    "units": ["ho_number", "villa_id", "floor"],
    "residents": ["status", "applied_at", "approved_at", "approved_by",
                  "reject_reason", "move_in_date", "move_out_date", "is_owner", "phone"],
    "bill_months": ["billing_mode", "per_unit_amounts", "status", "label",
                    "due_date", "year_month"],
    "bill_items": ["name", "amount", "bill_month_id"],
    "payments": ["bill_month_id", "unit_id", "is_paid", "paid_at", "method", "amount",
                 "pg_provider", "pg_payment_key", "pg_order_id", "pg_status", "auto_paid"],
    "resident_billing_keys": ["resident_id", "unit_id", "villa_id", "provider",
                              "billing_key", "customer_key", "card_company", "card_last4",
                              "card_expiry", "auto_pay_enabled", "status"],
    "notices": ["title", "body", "is_pinned", "villa_id"],
    "messages": ["text", "category", "is_read", "resident_id", "villa_id", "unit_id"],
    "message_replies": ["message_id", "text", "author_type", "author_name"],
    "posts": ["title", "body", "image_url", "likes", "resident_id", "villa_id", "unit_id"],
    "comments": ["post_id", "resident_id", "unit_id", "text"],
    "parking": ["villa_id", "unit_id", "plate_number", "vehicle_type", "memo", "expires_at"],
    "resident_invitations": ["villa_id", "unit_id", "name", "phone", "token", "is_owner", "invited_by"],
    "admins": ["auth_id", "name", "phone", "email", "role"],
}

REQUIRED_FUNCTIONS = ["get_villa_admin_contact", "record_admin_login", "current_admin_id"]

REQUIRED_CONSTRAINTS = [
    ("residents", "residents_status_check"),  # 027: pending/pending_moveout 등 허용
]

missing = []

# 1) 컬럼 존재 확인
all_cols = q("""
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema='public'
""")
have = {}
for row in all_cols:
    have.setdefault(row["table_name"], set()).add(row["column_name"])

print("=" * 60)
print("1. 테이블·컬럼 감사")
print("=" * 60)
for table, cols in REQUIRED_COLUMNS.items():
    if table not in have:
        missing.append(f"테이블 누락: {table}")
        print(f"  [MISSING TABLE] {table}")
        continue
    miss = [c for c in cols if c not in have[table]]
    if miss:
        for c in miss:
            missing.append(f"컬럼 누락: {table}.{c}")
        print(f"  [FAIL] {table}: 누락 {miss}")
    else:
        print(f"  [OK] {table} ({len(cols)} cols)")

# 2) 함수
print("\n" + "=" * 60)
print("2. RPC/함수 감사")
print("=" * 60)
fns = q("SELECT proname FROM pg_proc WHERE pronamespace='public'::regnamespace")
fnnames = {f["proname"] for f in fns}
for fn in REQUIRED_FUNCTIONS:
    if fn in fnnames:
        print(f"  [OK] {fn}()")
    else:
        missing.append(f"함수 누락: {fn}()")
        print(f"  [FAIL] {fn}() 없음")

# 3) 제약
print("\n" + "=" * 60)
print("3. 제약(constraint) 감사")
print("=" * 60)
cons = q("SELECT conname FROM pg_constraint")
connames = {c["conname"] for c in cons}
for table, cn in REQUIRED_CONSTRAINTS:
    if cn in connames:
        print(f"  [OK] {cn}")
    else:
        missing.append(f"제약 누락: {cn}")
        print(f"  [FAIL] {cn} 없음")

# 4) residents status 값 검증 (027 enum 확장)
print("\n" + "=" * 60)
print("4. residents.status 허용값 (027)")
print("=" * 60)
chk = q("""
  SELECT pg_get_constraintdef(oid) AS def
  FROM pg_constraint WHERE conname='residents_status_check'
""")
if chk:
    d = chk[0]["def"]
    need = ["pending", "active", "pending_moveout", "moved_out", "rejected"]
    ok = all(s in d for s in need)
    print(f"  {'[OK]' if ok else '[FAIL]'} {d}")
    if not ok:
        missing.append("residents_status_check 가 5개 상태를 모두 허용하지 않음")

print("\n" + "=" * 60)
if not missing:
    print("결과: 누락 0건 — 코드가 참조하는 모든 스키마가 production 에 존재")
else:
    print(f"결과: 누락 {len(missing)}건 — 런타임 오류 위험!")
    for m in missing:
        print(f"  ✗ {m}")
    sys.exit(1)
