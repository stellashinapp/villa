// FCM 푸시 알림 발송
// DB trigger → 이 함수 호출 → Firebase Cloud Messaging
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  try {
    const { scenario, targets, title, body, data } = await req.json();

    // TODO: Firebase Admin SDK로 FCM HTTP v1 API 호출
    // TODO: 8개 시나리오별 처리:
    //   - bill_published: 빌라 입주민 전체
    //   - payment_reminder: 미납 입주민 (due_date - 3일)
    //   - new_notice: 빌라 입주민 전체
    //   - message_reply: 신고한 입주민
    //   - new_message: 관리자
    //   - payment_success: 관리자
    //   - payment_failed: 관리자
    //   - visitor_parking_expiry: 등록한 입주민 (expires_at - 30분)

    return new Response(JSON.stringify({ sent: targets?.length || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
