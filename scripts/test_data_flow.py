"""
Villatolk 데이터 흐름 종단 테스트
- admin1 (관리자) ↔ 김테스트1 (입주민) 간 데이터 주고받기를 DB 레벨에서 검증
- 본사 관점은 service_role 키가 필요해 별도 (admin-web UI 로 확인)
"""
import json
import urllib.request
import urllib.error
import urllib.parse
import sys
import io
from datetime import datetime, timezone

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", line_buffering=True)

SUPABASE_URL = "https://tdgieeupxxalwxikdxji.supabase.co"
ANON = "sb_publishable_1Ey6yq_QITDQ76SzEwljPQ_x37wLGly"
ADMIN_EMAIL = "admin1@villatolk.test"
ADMIN_PASSWORD = "test1234!"
RESIDENT_NAME = "김테스트1"
RESIDENT_PHONE = "01099991111"

PASS_COUNT = 0
FAIL_COUNT = 0


def _req(method: str, path: str, *, headers: dict | None = None, body: dict | None = None):
    # 한글 등 non-ascii 가 path 에 있을 경우 quote
    if "/" in path:
        scheme_split = path.split("?", 1)
        encoded = urllib.parse.quote(scheme_split[0], safe="/")
        url = SUPABASE_URL + encoded
        if len(scheme_split) == 2:
            url += "?" + urllib.parse.quote(scheme_split[1], safe="=&,()*.!@%-_")
    else:
        url = f"{SUPABASE_URL}{path}"
    h = {"apikey": ANON, "Content-Type": "application/json"}
    if headers:
        h.update(headers)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def check(label: str, ok: bool, detail: str = ""):
    global PASS_COUNT, FAIL_COUNT
    if ok:
        PASS_COUNT += 1
        print(f"  [OK] {label}" + (f" — {detail}" if detail else ""))
    else:
        FAIL_COUNT += 1
        print(f"  [FAIL] {label}" + (f" — {detail}" if detail else ""))


def section(name: str):
    print(f"\n{'=' * 60}\n{name}\n{'=' * 60}")


def main():
    # ───────────────────────────────────────────────
    # STEP 1: admin1 로그인 (auth JWT 획득)
    # ───────────────────────────────────────────────
    section("STEP 1. admin1 로그인 + 빌라/입주민 컨텍스트 확인")
    status, login = _req("POST", "/auth/v1/token?grant_type=password",
                         body={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if status != 200:
        print(f"  [FATAL] admin 로그인 실패: {login}")
        sys.exit(1)
    admin_jwt = login["access_token"]
    admin_uid = login["user"]["id"]
    print(f"  admin user.id = {admin_uid}")
    auth_h = {"Authorization": f"Bearer {admin_jwt}"}

    # admin 레코드 (admins 테이블) — auth_id 로 매칭
    status, admins = _req("GET", f"/rest/v1/admins?select=id,email,name,role&auth_id=eq.{admin_uid}",
                          headers=auth_h)
    if status != 200 or not admins:
        print(f"  [FATAL] admins 조회 실패: {status} {admins}")
        sys.exit(1)
    admin = admins[0]
    admin_id = admin["id"]
    print(f"  admins row: name={admin.get('name')}, role={admin.get('role')}, id={admin_id}")

    # 이 admin 이 관리하는 villa
    status, villas = _req("GET", f"/rest/v1/villas?select=id,name,total_units&admin_id=eq.{admin_id}",
                          headers=auth_h)
    if not villas:
        print(f"  [FATAL] admin {admin_id} 관할 빌라 없음")
        sys.exit(1)
    villa = villas[0]
    villa_id = villa["id"]
    print(f"  villa: {villa['name']} (id={villa_id}, total_units={villa['total_units']})")

    # 입주민 (김테스트1) — residents 는 villa_id 가 없을 수도 있어 units 조인으로
    status, residents = _req(
        "GET",
        f"/rest/v1/residents?select=id,name,phone,unit_id,units!inner(ho_number,villa_id)&units.villa_id=eq.{villa_id}&name=eq.{RESIDENT_NAME}",
        headers=auth_h)
    if not residents:
        print(f"  [FATAL] 입주민 {RESIDENT_NAME} 없음 — 시드 확인 필요")
        sys.exit(1)
    resident = residents[0]
    resident_id = resident["id"]
    unit_id = resident["unit_id"]
    ho_number = resident["units"]["ho_number"]
    print(f"  resident: {resident['name']} ({ho_number}, id={resident_id})")

    # 입주민 별도 로그인 검증 (resident-login Edge Function)
    status, rlogin = _req("POST", "/functions/v1/resident-login",
                          body={"name": RESIDENT_NAME, "phone": RESIDENT_PHONE})
    check("입주민 resident-login Edge Function 성공",
          status == 200 and rlogin and rlogin.get("resident", {}).get("id") == resident_id,
          f"status={status}")

    # ───────────────────────────────────────────────
    # STEP 2: 관리자 → 입주민 (공지)
    # ───────────────────────────────────────────────
    section("STEP 2. 관리자 → 입주민 — 공지 작성·조회")
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    notice_title = f"[테스트] 데이터흐름 점검 공지 {ts}"
    notice_body = "이 공지는 자동 테스트로 작성되었습니다."

    status, ins = _req("POST", "/rest/v1/notices",
                       headers={**auth_h, "Prefer": "return=representation"},
                       body={"villa_id": villa_id, "title": notice_title, "body": notice_body, "is_pinned": False})
    notice_id = ins[0]["id"] if status in (200, 201) and ins else None
    check("관리자가 공지 INSERT 성공", notice_id is not None, f"status={status} {ins if not notice_id else ''}")

    # 입주민(anon) 으로 조회
    status, view = _req("GET",
                        f"/rest/v1/notices?select=id,title,body&id=eq.{notice_id}&villa_id=eq.{villa_id}")
    check("입주민(anon)이 같은 공지 조회 가능", status == 200 and len(view) == 1 and view[0]["title"] == notice_title,
          f"보임 {len(view) if isinstance(view, list) else '?'}건")

    # ───────────────────────────────────────────────
    # STEP 3: 관리자 → 입주민 (관리비) + 입주민 → 관리자 (납부)
    # ───────────────────────────────────────────────
    section("STEP 3. 관리자 → 입주민 — 관리비 청구 + 입주민 → 관리자 — 납부")
    ym_test = "2099-01"  # 충돌 회피
    # 기존 동일 ym 정리
    _req("DELETE", f"/rest/v1/bill_months?villa_id=eq.{villa_id}&year_month=eq.{ym_test}", headers=auth_h)

    status, bm_ins = _req("POST", "/rest/v1/bill_months",
                          headers={**auth_h, "Prefer": "return=representation"},
                          body={"villa_id": villa_id, "year_month": ym_test, "label": "테스트 관리비",
                                "status": "published", "billing_mode": "equal"})
    bm_id = bm_ins[0]["id"] if status in (200, 201) and bm_ins else None
    check("관리자가 bill_months INSERT", bm_id is not None, f"status={status}")

    if bm_id:
        status, bi = _req("POST", "/rest/v1/bill_items",
                          headers={**auth_h, "Prefer": "return=representation"},
                          body=[
                              {"bill_month_id": bm_id, "name": "공용전기", "amount": 80000},
                              {"bill_month_id": bm_id, "name": "수도요금", "amount": 120000},
                          ])
        check("관리자가 bill_items 2건 INSERT", status in (200, 201) and len(bi) == 2)

        # 입주민(anon) 으로 청구서 조회
        status, bm_view = _req("GET",
                               f"/rest/v1/bill_months?select=id,year_month,bill_items(name,amount)&id=eq.{bm_id}")
        check("입주민(anon)이 관리비 + 항목 조회",
              status == 200 and len(bm_view) == 1 and len(bm_view[0]["bill_items"]) == 2)

        # 입주민이 납부 (anon 으로 payments INSERT — RLS 통과 여부)
        status, pay = _req("POST", "/rest/v1/payments",
                           headers={"Prefer": "return=representation"},
                           body={"bill_month_id": bm_id, "unit_id": unit_id, "amount": 25000,
                                 "is_paid": True, "paid_at": datetime.now(timezone.utc).isoformat(),
                                 "method": "bank_transfer"})
        pay_id = pay[0]["id"] if status in (200, 201) and isinstance(pay, list) and pay else None
        check("입주민(anon)이 payments INSERT (납부)", pay_id is not None, f"status={status} {pay if not pay_id else ''}")

        if pay_id:
            # 관리자가 납부 확인
            status, padm = _req("GET",
                                f"/rest/v1/payments?select=id,is_paid,method,amount&id=eq.{pay_id}",
                                headers=auth_h)
            check("관리자가 납부 기록 조회",
                  status == 200 and len(padm) == 1 and padm[0]["is_paid"] is True)
            # 정리
            _req("DELETE", f"/rest/v1/payments?id=eq.{pay_id}", headers=auth_h)

        # 청구 정리
        _req("DELETE", f"/rest/v1/bill_months?id=eq.{bm_id}", headers=auth_h)

    # ───────────────────────────────────────────────
    # STEP 4: 입주민 → 관리자 (민원) + 관리자 → 입주민 (답변)
    # ───────────────────────────────────────────────
    section("STEP 4. 입주민 → 관리자 — 민원 작성 + 관리자 → 입주민 — 답변")
    msg_text = f"[테스트] 자동 점검 민원 {ts}"
    status, m_ins = _req("POST", "/rest/v1/messages",
                         headers={"Prefer": "return=representation"},
                         body={"resident_id": resident_id, "villa_id": villa_id, "unit_id": unit_id,
                               "text": msg_text, "category": "other", "is_read": False})
    msg_id = m_ins[0]["id"] if status in (200, 201) and isinstance(m_ins, list) and m_ins else None
    check("입주민(anon)이 messages INSERT (민원)", msg_id is not None, f"status={status} {m_ins if not msg_id else ''}")

    if msg_id:
        # 관리자 조회
        status, m_adm = _req("GET",
                             f"/rest/v1/messages?select=id,text,resident_id&id=eq.{msg_id}",
                             headers=auth_h)
        check("관리자가 같은 민원 조회",
              status == 200 and len(m_adm) == 1 and m_adm[0]["text"] == msg_text)

        # 관리자 답변
        reply_text = "테스트 답변입니다."
        status, r_ins = _req("POST", "/rest/v1/message_replies",
                             headers={**auth_h, "Prefer": "return=representation"},
                             body={"message_id": msg_id, "text": reply_text,
                                   "author_type": "admin", "author_name": "테스트 관리자"})
        reply_id = r_ins[0]["id"] if status in (200, 201) and r_ins else None
        check("관리자가 message_replies INSERT (답변)", reply_id is not None,
              f"status={status} {r_ins if not reply_id else ''}")

        # 입주민이 답변 확인 (anon 으로)
        status, r_view = _req("GET",
                              f"/rest/v1/message_replies?select=id,text,author_type&message_id=eq.{msg_id}")
        check("입주민(anon)이 답변 조회",
              status == 200 and len(r_view) >= 1 and any(r["text"] == reply_text for r in r_view))

        # 정리
        _req("DELETE", f"/rest/v1/messages?id=eq.{msg_id}", headers=auth_h)

    # ───────────────────────────────────────────────
    # STEP 5: 입주민 → 빌라 전체 (주차 등록)
    # ───────────────────────────────────────────────
    section("STEP 5. 입주민 → 빌라 전체 — 주차 등록·조회")
    plate = f"99테{ts[-4:]}"
    status, p_ins = _req("POST", "/rest/v1/parking",
                         headers={"Prefer": "return=representation"},
                         body={"villa_id": villa_id, "unit_id": unit_id,
                               "plate_number": plate, "vehicle_type": "resident"})
    park_id = p_ins[0]["id"] if status in (200, 201) and isinstance(p_ins, list) and p_ins else None
    check("입주민(anon)이 주차 차량 INSERT", park_id is not None,
          f"status={status} {p_ins if not park_id else ''}")

    if park_id:
        # 다른 입주민(anon) 도 같은 빌라 차량을 볼 수 있나
        status, p_view = _req("GET",
                              f"/rest/v1/parking?select=id,plate_number,units!inner(villa_id)&units.villa_id=eq.{villa_id}")
        check("같은 빌라 차량 anon 조회 가능",
              status == 200 and any(p["plate_number"] == plate for p in (p_view or [])))

        # 관리자 조회
        status, p_adm = _req("GET",
                             f"/rest/v1/parking?select=id,plate_number&id=eq.{park_id}",
                             headers=auth_h)
        check("관리자가 같은 차량 조회",
              status == 200 and len(p_adm) == 1)

        _req("DELETE", f"/rest/v1/parking?id=eq.{park_id}", headers=auth_h)

    # ───────────────────────────────────────────────
    # STEP 6: 입주민 → 입주민 (커뮤니티 글·댓글)
    # ───────────────────────────────────────────────
    section("STEP 6. 입주민 → 입주민 — 커뮤니티 글·댓글")
    post_title = f"[테스트] 자동 점검 글 {ts}"
    status, post_ins = _req("POST", "/rest/v1/posts",
                            headers={"Prefer": "return=representation"},
                            body={"villa_id": villa_id, "unit_id": unit_id, "resident_id": resident_id,
                                  "title": post_title, "body": "테스트 본문", "likes": 0})
    post_id = post_ins[0]["id"] if status in (200, 201) and isinstance(post_ins, list) and post_ins else None
    check("입주민(anon)이 posts INSERT", post_id is not None, f"status={status} {post_ins if not post_id else ''}")

    if post_id:
        # 다른 입주민(anon) 으로 조회
        status, posts_view = _req("GET",
                                  f"/rest/v1/posts?select=id,title&id=eq.{post_id}")
        check("입주민(anon)이 같은 글 조회",
              status == 200 and len(posts_view) == 1 and posts_view[0]["title"] == post_title)

        # 댓글
        status, c_ins = _req("POST", "/rest/v1/comments",
                             headers={"Prefer": "return=representation"},
                             body={"post_id": post_id, "resident_id": resident_id, "unit_id": unit_id,
                                   "text": "테스트 댓글"})
        comment_id = c_ins[0]["id"] if status in (200, 201) and isinstance(c_ins, list) and c_ins else None
        check("입주민(anon)이 comments INSERT", comment_id is not None,
              f"status={status} {c_ins if not comment_id else ''}")

        if comment_id:
            status, c_view = _req("GET",
                                  f"/rest/v1/comments?select=id,text&post_id=eq.{post_id}")
            check("같은 게시글의 댓글 anon 조회",
                  status == 200 and any(c["text"] == "테스트 댓글" for c in (c_view or [])))

        # 정리
        _req("DELETE", f"/rest/v1/posts?id=eq.{post_id}", headers=auth_h)

    # ───────────────────────────────────────────────
    # STEP 7: 정리 — 공지 삭제
    # ───────────────────────────────────────────────
    section("STEP 7. 테스트 데이터 정리")
    if notice_id:
        status, _ = _req("DELETE", f"/rest/v1/notices?id=eq.{notice_id}", headers=auth_h)
        check("관리자가 테스트 공지 삭제", status in (200, 204))

    # ───────────────────────────────────────────────
    # 결과 요약
    # ───────────────────────────────────────────────
    section(f"결과: 성공 {PASS_COUNT} / 실패 {FAIL_COUNT}")
    if FAIL_COUNT == 0:
        print("  모든 데이터 흐름 정상")
    else:
        print(f"  {FAIL_COUNT} 건 실패 — 위 [FAIL] 로그 확인 필요")
        sys.exit(2)


if __name__ == "__main__":
    main()
