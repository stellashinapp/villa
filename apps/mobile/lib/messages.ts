import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Message = {
  id: string;
  villa_id: string;
  unit_id: string | null;
  resident_id: string | null;
  text: string;
  image_url: string | null;
  is_read: boolean;
  category: string;
  created_at: string;
};

export type MessageReply = {
  id: string;
  message_id: string;
  text: string;
  author_type: 'admin' | 'resident' | 'system';
  author_name: string | null;
  created_at: string;
};

export async function listMessages(villaId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, message_replies(*)')
    .eq('villa_id', villaId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listMessagesForResident(residentId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, message_replies(*)')
    .eq('resident_id', residentId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendMessage(params: {
  villaId: string;
  unitId?: string | null;
  residentId?: string | null;
  text: string;
  imageUrl?: string | null;
  category?: string;
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      villa_id: params.villaId,
      unit_id: params.unitId ?? null,
      resident_id: params.residentId ?? null,
      text: params.text,
      image_url: params.imageUrl ?? null,
      category: params.category ?? 'general',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Message;
}

export async function replyMessage(params: {
  messageId: string;
  text: string;
  authorType: 'admin' | 'resident' | 'system';
  authorName?: string;
}) {
  const { data, error } = await supabase
    .from('message_replies')
    .insert({
      message_id: params.messageId,
      text: params.text,
      author_type: params.authorType,
      author_name: params.authorName ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MessageReply;
}

export async function markRead(messageId: string) {
  await supabase.from('messages').update({ is_read: true }).eq('id', messageId);
}

export function subscribeToVillaMessages(
  villaId: string,
  onMessage: (msg: Message) => void,
  onReply?: (reply: MessageReply) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`villa-messages-${villaId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `villa_id=eq.${villaId}` },
      (payload) => onMessage(payload.new as Message),
    );

  if (onReply) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message_replies' },
      (payload) => onReply(payload.new as MessageReply),
    );
  }

  channel.subscribe();
  return channel;
}

export function subscribeToResidentReplies(
  residentId: string,
  onReply: (reply: MessageReply) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`resident-replies-${residentId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message_replies' },
      (payload) => onReply(payload.new as MessageReply),
    )
    .subscribe();
  return channel;
}

export async function unsubscribe(channel: RealtimeChannel) {
  await supabase.removeChannel(channel);
}
