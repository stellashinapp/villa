import { supabase } from './supabase';

/**
 * 빌라의 관리비 월 목록 조회
 */
export async function getBillMonths(villaId: string) {
  const { data, error } = await supabase
    .from('bill_months')
    .select('*, bill_items(*)')
    .eq('villa_id', villaId)
    .order('year_month', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 새 월 관리비 생성
 */
export async function createBillMonth(villaId: string, yearMonth: string, label: string, dueDate?: string) {
  const { data, error } = await supabase
    .from('bill_months')
    .insert({
      villa_id: villaId,
      year_month: yearMonth,
      label,
      due_date: dueDate,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 관리비 항목 추가
 */
export async function addBillItem(billMonthId: string, name: string, amount: number) {
  const { data, error } = await supabase
    .from('bill_items')
    .insert({ bill_month_id: billMonthId, name, amount })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 관리비 항목 삭제
 */
export async function deleteBillItem(itemId: string) {
  const { error } = await supabase.from('bill_items').delete().eq('id', itemId);
  if (error) throw new Error(error.message);
}

/**
 * 관리비 발행 (draft → published)
 */
export async function publishBillMonth(billMonthId: string) {
  const { error } = await supabase
    .from('bill_months')
    .update({ status: 'published', notification_sent_at: new Date().toISOString() })
    .eq('id', billMonthId);

  if (error) throw new Error(error.message);
}

/**
 * 세대별 납부 현황 조회
 */
export async function getPayments(billMonthId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, units(ho_number, residents(name, phone))')
    .eq('bill_month_id', billMonthId);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * 납부 확인 처리 (관리자가 수동으로)
 */
export async function confirmPayment(paymentId: string) {
  const { error } = await supabase
    .from('payments')
    .update({
      is_paid: true,
      paid_at: new Date().toISOString(),
      confirmed_by: 'admin',
      method: 'bank_transfer',
    })
    .eq('id', paymentId);

  if (error) throw new Error(error.message);
}

/**
 * 관리비 발행 시 모든 세대에 납부 레코드 생성
 */
export async function createPaymentsForAllUnits(billMonthId: string, villaId: string, perUnitAmount: number) {
  // 해당 빌라의 모든 세대 조회
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id')
    .eq('villa_id', villaId);

  if (unitsError) throw new Error(unitsError.message);
  if (!units?.length) return;

  const payments = units.map(unit => ({
    bill_month_id: billMonthId,
    unit_id: unit.id,
    amount: perUnitAmount,
    is_paid: false,
  }));

  const { error } = await supabase.from('payments').insert(payments);
  if (error) throw new Error(error.message);
}
